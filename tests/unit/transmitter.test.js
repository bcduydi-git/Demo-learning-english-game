import test from 'node:test';
import assert from 'node:assert/strict';
import { createState, applyAction, tick, restoreState } from '../../shared/logic.js';
import {
  newMachine, wireAnswer, valveAnswer, keypadColumn, keypadOrder, TX_LEVELS, TX_PENALTY_MS, VALVES, KEY_COLUMNS, shiftFor,
} from '../../shared/transmitter.js';

test('every random machine has exactly one answer per module', () => {
  for (const level of Object.keys(TX_LEVELS)) {
    for (let seed = 1; seed <= 400; seed++) {
      const m = newMachine(level, seed);
      const n = m.wires.colours.length;
      const [lo, hi] = TX_LEVELS[level].wires;
      assert.ok(n >= lo && n <= hi, `${level} wire count`);
      const w = wireAnswer(m.wires.colours, m.plate);
      assert.ok(w.index >= 0 && w.index < n, `${level}/${seed} wire index ${w.index}`);
      const v = valveAnswer(m.valves.pressure, m.plate, level);
      assert.ok(v.valve === null || (VALVES.includes(v.valve) && v.turns >= 1 && v.turns <= 6), `${level}/${seed} valve ${JSON.stringify(v)}`);
      assert.equal(m.keypad.words.length, TX_LEVELS[level].keys);
      assert.ok(keypadColumn(m.keypad.words) >= 0, `${level}/${seed} keypad column`);
    }
  }
});

test('same seed builds the same machine', () => {
  assert.deepEqual(newMachine('hard', 42), newMachine('hard', 42));
});

test('valve rules: shifts, weekend (hard) and the PWR exception', () => {
  const plate = (time, day = 'Monday', PWR = true) => ({ serial: 'AB-1234', time, day, lights: { PWR, AUX: false, SYNC: false } });
  assert.equal(shiftFor(plate('06:00'), 'normal').name, 'Morning shift');
  assert.equal(shiftFor(plate('13:59'), 'normal').name, 'Morning shift');
  assert.equal(shiftFor(plate('14:00'), 'normal').name, 'Afternoon shift');
  assert.equal(shiftFor(plate('23:10'), 'normal').name, 'Night shift');
  assert.equal(shiftFor(plate('10:00', 'Sunday'), 'hard').name, 'Night shift');
  assert.equal(shiftFor(plate('10:00', 'Sunday'), 'normal').name, 'Morning shift');
  assert.deepEqual(valveAnswer(55, plate('10:00'), 'normal'), { valve: null, turns: 0 }); // limit included
  assert.deepEqual(valveAnswer(56, plate('10:00'), 'normal'), { valve: 'RELEASE', turns: 1 });
  assert.deepEqual(valveAnswer(66, plate('10:00'), 'normal'), { valve: 'RELEASE', turns: 3 });
  assert.deepEqual(valveAnswer(66, plate('10:00', 'Monday', false), 'normal'), { valve: 'BYPASS', turns: 3 });
  assert.deepEqual(valveAnswer(66, plate('10:00', 'Monday', false), 'easy'), { valve: 'RELEASE', turns: 3 });
  assert.deepEqual(valveAnswer(31, plate('15:00'), 'normal'), { valve: 'INTAKE', turns: 4 });
});

test('keypad: order follows the one column that holds every word', () => {
  assert.deepEqual(keypadOrder(['BRAKE', 'WAIT', 'HOUR', 'SEA']), ['WAIT', 'SEA', 'HOUR', 'BRAKE']);
  assert.equal(keypadColumn(['SEE', 'SHIFT']), 1);
  assert.equal(keypadColumn(['SIGNAL', 'SHIFT']), -1, 'two columns hold both: not unique');
  const all = KEY_COLUMNS.flat();
  for (const w of new Set(all)) assert.ok(all.filter((x) => x === w).length <= 2);
});

function room(level = 'normal') {
  const s = createState('TXTX');
  s.players.p1.connected = true;
  s.players.p2.connected = true;
  applyAction(s, 'p1', { type: 'tx_open' });
  applyAction(s, 'p2', { type: 'tx_level', level });
  applyAction(s, 'p1', { type: 'tx_ready', seed: 7 });
  applyAction(s, 'p2', { type: 'tx_ready', seed: 7 });
  return s;
}

test('a full round: only the technician acts, mistakes cost a strike and time, three modules win', () => {
  const s = room();
  const tx = s.tx;
  assert.equal(s.stage, 'tx');
  assert.equal(tx.status, 'run');
  const m = tx.machine;
  // the reader (p2) cannot touch the machine
  applyAction(s, 'p2', { type: 'tx_cut', index: 0 });
  assert.equal(m.wires.cut.length, 0);
  // a wrong wire
  const right = wireAnswer(m.wires.colours, m.plate).index;
  const wrong = right === 0 ? 1 : 0;
  const before = tx.left;
  const ev = applyAction(s, 'p1', { type: 'tx_cut', index: wrong });
  assert.equal(tx.strikes, 1);
  assert.equal(before - tx.left, TX_PENALTY_MS);
  assert.ok(ev.some((e) => e.e === 'tx_strike'));
  applyAction(s, 'p1', { type: 'tx_cut', index: right });
  assert.ok(m.solved.wires);
  // valves
  const v = valveAnswer(m.valves.pressure, m.plate, tx.level);
  const set = { INTAKE: 0, RELEASE: 0, BYPASS: 0 };
  if (v.valve) set[v.valve] = v.turns;
  applyAction(s, 'p1', { type: 'tx_valves', set });
  assert.ok(m.solved.valves);
  // keypad: a wrong first key resets, then the right order
  const order = keypadOrder(m.keypad.words);
  applyAction(s, 'p1', { type: 'tx_key', word: order[1] });
  assert.equal(tx.strikes, 2);
  assert.deepEqual(m.keypad.pressed, []);
  let last = [];
  for (const w of order) last = applyAction(s, 'p1', { type: 'tx_key', word: w });
  assert.ok(m.solved.keypad);
  assert.equal(tx.status, 'won');
  assert.ok(last.some((e) => e.e === 'tx_won'));
});

test('the round is lost when time runs out or after too many strikes', () => {
  const s = room();
  tick(s, 0.5);
  assert.equal(s.tx.status, 'run');
  s.tx.left = 300;
  const { ev } = tick(s, 0.5);
  assert.equal(s.tx.status, 'lost');
  assert.ok(ev.some((e) => e.e === 'tx_lost' && e.why === 'time'));

  const s2 = room('normal');
  const m = s2.tx.machine;
  const right = wireAnswer(m.wires.colours, m.plate).index;
  const wrongs = m.wires.colours.map((_, i) => i).filter((i) => i !== right);
  for (const i of wrongs.slice(0, 3)) applyAction(s2, 'p1', { type: 'tx_cut', index: i });
  if (s2.tx.status === 'run') for (let k = 0; k < 3 && s2.tx.status === 'run'; k++) applyAction(s2, 'p1', { type: 'tx_valves', set: { INTAKE: 6, RELEASE: 6, BYPASS: 6 } });
  assert.equal(s2.tx.status, 'lost');
  assert.equal(s2.tx.lostWhy, 'strikes');
  // play again: back to setup, same level and roles
  applyAction(s2, 'p2', { type: 'tx_again' });
  assert.equal(s2.tx.status, 'setup');
  assert.equal(s2.tx.attempts, 1);
});

test('roles can be swapped before a round, and leaving returns to where the room was', () => {
  const s = createState('BACK');
  applyAction(s, 'p1', { type: 'tx_open' });
  applyAction(s, 'p2', { type: 'tx_swap' });
  assert.equal(s.tx.tech, 'p2');
  applyAction(s, 'p1', { type: 'tx_exit' });
  assert.equal(s.stage, 'world');
  assert.equal(!!s.flags.started, false, 'opened from the waiting room: back to the waiting room');
  // opened after chapter 1 (credits)
  s.flags.started = true;
  s.stage = 'credits';
  applyAction(s, 'p1', { type: 'tx_open' });
  applyAction(s, 'p1', { type: 'tx_exit' });
  assert.equal(s.stage, 'credits');
  assert.equal(s.flags.started, true);
});

test('a room rebuilt from a save mid-round goes back to the setup screen', () => {
  const s = room();
  const back = restoreState(JSON.parse(JSON.stringify(s)), 'TXTX');
  assert.equal(back.stage, 'tx');
  assert.equal(back.tx.status, 'setup');
  assert.equal(back.tx.level, 'normal');
});
