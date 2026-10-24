import test from 'node:test';
import assert from 'node:assert/strict';
import { createState, applyAction, restoreState, tick } from '../../shared/logic.js';
import { levels } from '../../shared/ch2/flood.js';
import { viewOf } from '../../shared/ch2/antenna.js';
import { wireAnswer, valveAnswer, keypadOrder } from '../../shared/transmitter.js';
import { recallOf } from '../../shared/ch2/finale.js';

function room() {
  const s = createState('CH2X');
  s.players.p1.connected = true;
  s.players.p2.connected = true;
  return s;
}
// both players press "next" until no scene is open
function skip(s) {
  for (let i = 0; i < 50 && s.scene; i++) {
    const { id, idx } = s.scene;
    applyAction(s, 'p1', { type: 'scene_next', id, idx });
    applyAction(s, 'p2', { type: 'scene_next', id, idx });
  }
}
const pz = (s, slot, a) => applyAction(s, slot, { type: 'c2_pz', ...a });
const ready = (s) => { pz(s, 'p1', { op: 'ready' }); pz(s, 'p2', { op: 'ready', seed: 7 }); };
const who = (s, role) => s.c2.pz.roles[role];

function solveCurrent(s) {
  const p = s.c2.pz;
  const d = p.data;
  if (p.kind === 'coords') pz(s, who(s, 'nav'), { op: 'submit', value: d.pos });
  if (p.kind === 'flood') {
    for (const side of ['west', 'east']) for (let i = 0; i < 3; i++) for (let k = 0; k < d.solution[side][i]; k++) pz(s, who(s, side), { op: 'turn', valve: i, dir: 1 });
    assert.deepEqual(levels(d, 'west'), d.west.target);
    pz(s, who(s, 'west'), { op: 'hatch' });
    pz(s, who(s, 'east'), { op: 'hatch' });
  }
  if (p.kind === 'keycard') pz(s, who(s, 'lockers'), { op: 'open', locker: d.answer });
  if (p.kind === 'machine') {
    const T = who(s, 'tech');
    pz(s, T, { op: 'cut', index: wireAnswer(d.wires.colours, d.plate).index });
    const v = valveAnswer(d.valves.pressure, d.plate, p.level);
    pz(s, T, { op: 'valves', set: v.valve ? { [v.valve]: v.turns } : {} });
    for (const word of keypadOrder(d.keypad.words)) pz(s, T, { op: 'key', word });
  }
  if (p.kind === 'finale') {
    const A = who(s, 'a');
    const B = who(s, 'b');
    pz(s, A, { op: 'cut', index: wireAnswer(d.main.wires.colours, d.main.plate).index });
    const v = valveAnswer(d.backup.valves.pressure, d.backup.plate, p.level);
    pz(s, B, { op: 'valves', set: v.valve ? { [v.valve]: v.turns } : {} });
    pz(s, A, { op: 'recall', text: recallOf(d).answers[0] });
    for (const word of keypadOrder(d.backup.keypad.words)) pz(s, B, { op: 'key', word });
    pz(s, A, { op: 'send' });
    pz(s, B, { op: 'send' });
  }
  if (p.kind === 'antenna') {
    for (const rd of d.rounds) {
      const side = rd.controller;
      const view = (cells) => viewOf(cells, rd.n, side);
      const want = view(rd.target);
      for (const k of view([...rd.lit])) if (!want.includes(k)) { const [row, col] = k.split(',').map(Number); pz(s, who(s, side), { op: 'toggle', row, col }); }
      for (const k of want) if (!view(rd.lit).includes(k)) { const [row, col] = k.split(',').map(Number); pz(s, who(s, side), { op: 'toggle', row, col }); }
      pz(s, who(s, side), { op: 'align' });
    }
  }
}

test('chapter 2 from the waiting room to the end of the chapter', () => {
  const s = room();
  applyAction(s, 'p1', { type: 'ch2_start' });
  assert.equal(s.stage, 'ch2');
  assert.equal(s.scene.id, 'c2_intro');
  // nothing in the chapter can be done during a story scene
  applyAction(s, 'p1', { type: 'c2_open' });
  assert.equal(s.c2.open, false);
  skip(s);
  const order = [];
  for (const [kind, room, done] of [['coords', 'bridge', 'c2_arrive'], ['flood', 'hub', 'c2_flood_done'], ['keycard', 'office', 'c2_keycard_done'], ['antenna', 'dome', 'c2_antenna_done'], ['machine', 'transmitter', 'c2_machine_done'], ['finale', 'transmitter', 'c2_ending']]) {
    assert.equal(s.c2.step, kind);
    // you must be in the right room to open the puzzle
    if (s.c2.rooms.p1 !== room) {
      applyAction(s, 'p1', { type: 'c2_open' });
      assert.equal(s.c2.open, false, `${kind}: not from another room`);
      applyAction(s, 'p1', { type: 'c2_move', room });
    }
    applyAction(s, 'p1', { type: 'c2_open' });
    skip(s); // intro scene of the puzzle, if any
    assert.equal(s.c2.open, true);
    ready(s);
    assert.equal(s.c2.pz.status, 'run');
    // while it runs, players stand where their role is and cannot walk away
    applyAction(s, 'p2', { type: 'c2_move', room: 'dock' });
    assert.notEqual(s.c2.rooms.p2, 'dock');
    solveCurrent(s);
    assert.equal(s.c2.pz.status, 'done', `${kind} solved`);
    assert.equal(s.scene.id, done);
    skip(s);
    order.push(kind);
  }
  assert.deepEqual(order, ['coords', 'flood', 'keycard', 'antenna', 'machine', 'finale']);
  assert.equal(s.c2.step, 'end');
  assert.deepEqual(Object.keys(s.c2.results).sort(), ['antenna', 'coords', 'finale', 'flood', 'keycard', 'machine']);
});

test('closed rooms cannot be entered; a saved chapter 2 comes back at the setup screen', () => {
  const s = room();
  applyAction(s, 'p1', { type: 'ch2_start' });
  skip(s);
  applyAction(s, 'p1', { type: 'c2_move', room: 'dome' });
  assert.equal(s.c2.rooms.p1, 'bridge');
  applyAction(s, 'p1', { type: 'c2_open' });
  ready(s);
  const back = restoreState(JSON.parse(JSON.stringify(s)), 'CH2X');
  assert.equal(back.stage, 'ch2');
  assert.equal(back.c2.step, 'coords');
  assert.equal(back.c2.pz.status, 'setup');
});

test('timed puzzles fail when the clock runs out; strikes cost time', () => {
  const s = room();
  applyAction(s, 'p1', { type: 'ch2_start' });
  skip(s);
  // jump to the transmitter step
  s.c2.step = 'machine';
  s.c2.pz = { ...s.c2.pz, kind: 'machine', status: 'setup', ready: {}, roles: { tech: 'p1', reader: 'p2' } };
  s.c2.rooms.p1 = 'transmitter';
  applyAction(s, 'p1', { type: 'c2_open' });
  skip(s);
  ready(s);
  const d = s.c2.pz.data;
  const left = d.left;
  const right = wireAnswer(d.wires.colours, d.plate).index;
  pz(s, 'p1', { op: 'cut', index: right === 0 ? 1 : 0 });
  assert.equal(left - d.left, 15000);
  assert.equal(s.c2.pz.strikes, 1);
  d.left = 400;
  const { ev } = tick(s, 0.5);
  assert.equal(s.c2.pz.status, 'failed');
  assert.ok(ev.some((e) => e.e === 'pz_failed'));
});

test('finale: phases go in order, roles swap, both sides at once, then send together', () => {
  const s = room();
  applyAction(s, 'p1', { type: 'ch2_start' });
  skip(s);
  s.c2.step = 'finale';
  s.c2.pz = { ...s.c2.pz, kind: 'finale', status: 'setup', ready: {}, roles: { a: 'p1', b: 'p2' } };
  s.c2.rooms.p1 = 'transmitter';
  applyAction(s, 'p1', { type: 'c2_open' });
  skip(s);
  ready(s);
  const d = s.c2.pz.data;
  assert.equal(d.phase, 1);
  // B cannot touch the valves yet, A cannot do B's part
  const v = valveAnswer(d.backup.valves.pressure, d.backup.plate, 'normal');
  pz(s, 'p2', { op: 'valves', set: v.valve ? { [v.valve]: v.turns } : {} });
  assert.equal(d.solved.valves, false);
  pz(s, 'p1', { op: 'cut', index: wireAnswer(d.main.wires.colours, d.main.plate).index });
  assert.equal(d.phase, 2);
  pz(s, 'p2', { op: 'valves', set: v.valve ? { [v.valve]: v.turns } : {} });
  assert.equal(d.phase, 3);
  // a wrong phrase is a strike; the right one (any accepted form, any case) works
  pz(s, 'p1', { op: 'recall', text: 'hello world' });
  assert.equal(s.c2.pz.strikes, 1);
  pz(s, 'p1', { op: 'recall', text: recallOf(d).answers[0].toUpperCase() + '!' });
  assert.equal(d.solved.recall, true);
  assert.equal(d.phase, 3, 'still waiting for the keypad');
  for (const word of keypadOrder(d.backup.keypad.words)) pz(s, 'p2', { op: 'key', word });
  assert.equal(d.phase, 4);
  pz(s, 'p1', { op: 'send' });
  assert.equal(s.c2.pz.status, 'run');
  pz(s, 'p2', { op: 'send' });
  assert.equal(s.c2.pz.status, 'done');
});
