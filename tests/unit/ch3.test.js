import test from 'node:test';
import assert from 'node:assert/strict';
import { createState, applyAction, restoreState, tick } from '../../shared/logic.js';
import { rng } from '../../shared/transmitter.js';
import { PUZZLES } from '../../shared/ch2/puzzle.js';
import { earliest, SPRING } from '../../shared/ch3/tide.js';
import { answer as gearAnswer, TURNS } from '../../shared/ch3/gears.js';
import { signalFor, dutyOf } from '../../shared/ch3/beacon.js';

const LV = ['easy', 'normal', 'hard'];
function room() {
  const s = createState('CH3X');
  s.players.p1.connected = true;
  s.players.p2.connected = true;
  return s;
}
function skip(s) {
  for (let i = 0; i < 60 && s.scene; i++) {
    const { id, idx } = s.scene;
    applyAction(s, 'p1', { type: 'scene_next', id, idx });
    applyAction(s, 'p2', { type: 'scene_next', id, idx });
  }
}
const pz = (s, slot, a) => applyAction(s, slot, { type: 'c2_pz', ...a });
const who = (s, role) => s.c2.pz.roles[role];

function solve(s) {
  const p = s.c2.pz;
  const d = p.data;
  if (p.kind === 'tide') pz(s, who(s, 'chart'), { op: 'depart', time: d.answer });
  if (p.kind === 'diary') {
    d.order.forEach((id, slot) => { const st = d.strips.find((x) => x.id === id); pz(s, who(s, st.owner), { op: 'place', strip: id, slot }); });
    pz(s, 'p1', { op: 'check' });
  }
  if (p.kind === 'gears') { const a = gearAnswer(d); pz(s, who(s, 'crank'), { op: 'crank', turns: a.turns, dir: a.dir }); }
  if (p.kind === 'beacon') {
    while (d.cur < d.ships.length) {
      const sig = signalFor(d.ships[d.cur], p.level);
      const keeperSlot = ['p1', 'p2'].find((sl) => dutyOf(d, Object.keys(p.roles).find((r) => p.roles[r] === sl)) === 'keeper');
      pz(s, keeperSlot, { op: 'signal', colour: sig.colour, flashes: sig.flashes });
    }
    pz(s, 'p1', { op: 'light' });
    pz(s, 'p2', { op: 'light' });
  }
}

test('tide: one earliest departure; the table, the route card (and the notice) all matter', () => {
  for (const level of LV) {
    for (let k = 1; k <= 300; k++) {
      const d = PUZZLES.tide.create(level, rng(k));
      assert.equal(earliest(d), d.answer);
      assert.ok(d.answer >= d.route.leave && d.answer + d.route.cross <= d.route.arrive);
      if (level === 'hard') assert.notEqual(earliest({ ...d, notice: false }), d.answer, 'the spring tide notice changes the answer');
    }
  }
  assert.equal(SPRING, 0.3);
});

test('diary: only the owner moves a strip, check needs a full board, wrong order = strike with a count', () => {
  const d = PUZZLES.diary.create('normal', rng(5));
  assert.equal(d.strips.length, 8);
  assert.equal(d.strips.filter((x) => x.owner === 'left').length, 4);
  const mine = d.strips.find((x) => x.owner === 'left');
  assert.equal(PUZZLES.diary.act(d, 'right', { op: 'place', strip: mine.id, slot: 0 }), undefined);
  assert.equal(PUZZLES.diary.act(d, 'left', { op: 'check' }), undefined, 'board not full');
  // fill in reverse order
  [...d.order].reverse().forEach((id, slot) => { const st = d.strips.find((x) => x.id === id); PUZZLES.diary.act(d, st.owner, { op: 'place', strip: id, slot }); });
  const a = { op: 'check' };
  assert.equal(PUZZLES.diary.act(d, 'left', a), 'strike');
  assert.ok(d.lastRight < 8);
  const e = PUZZLES.diary.create('easy', rng(5));
  assert.equal(e.strips.length, 6);
});

test('gears: the answer is a crank setting the player can choose; the replaced gear matters', () => {
  for (const level of LV) {
    for (let k = 1; k <= 300; k++) {
      const d = PUZZLES.gears.create(level, rng(k));
      const a = gearAnswer(d);
      assert.ok(TURNS.includes(a.turns));
      if (level !== 'easy') {
        const blue = JSON.parse(JSON.stringify(d.gears));
        blue[d.replaced.gear][d.replaced.part] = d.replaced.old;
        assert.notEqual(gearAnswer({ gears: blue, target: d.target }).turns, a.turns);
      }
    }
  }
});

test('beacon: code book rules, the swap after ship two, and lighting together', () => {
  assert.deepEqual(signalFor({ type: 'fishing', flag: 'white', distance: 3, visibility: 5 }, 'normal'), { colour: 'white', flashes: ['S', 'S'] });
  assert.deepEqual(signalFor({ type: 'passenger', flag: 'white', distance: 3, visibility: 1.5 }, 'normal'), { colour: 'green', flashes: ['L', 'L'] });
  assert.deepEqual(signalFor({ type: 'cargo', flag: 'white', distance: 0.5, visibility: 5 }, 'normal'), { colour: 'red', flashes: ['S', 'S', 'S'] });
  assert.deepEqual(signalFor({ type: 'cargo', flag: 'blue', distance: 0.5, visibility: 5 }, 'normal'), { colour: 'yellow', flashes: ['S', 'S', 'S'] });
  assert.deepEqual(signalFor({ type: 'passenger', flag: 'yellow', distance: 3, visibility: 1 }, 'hard'), { colour: 'green', flashes: ['S', 'S', 'S', 'S'] });
  assert.deepEqual(signalFor({ type: 'passenger', flag: 'white', distance: 0.5, visibility: 1 }, 'easy'), { colour: 'green', flashes: ['L'] });
  const d = PUZZLES.beacon.create('normal', rng(2));
  assert.equal(dutyOf(d, 'lookout'), 'lookout');
  d.cur = 2;
  assert.equal(dutyOf(d, 'lookout'), 'keeper', 'roles swap after the second ship');
});

test('chapter 3 from start to the end; chapter 2 progress is parked, not lost', () => {
  const s = room();
  applyAction(s, 'p1', { type: 'ch2_start' });
  skip(s);
  s.c2.results.coords = { level: 'normal', strikes: 0, attempts: 1, ms: 1 };
  applyAction(s, 'p1', { type: 'ch3_start' });
  assert.equal(s.c2.chapter, 3);
  assert.equal(s.scene.id, 'c3_intro');
  assert.ok(s.parked[2] && s.parked[2].results.coords, 'chapter 2 is kept');
  skip(s);
  const steps = [['tide', 'deck', 'c3_tide_done'], ['diary', 'stairs', 'c3_diary_done'], ['gears', 'gearroom', 'c3_gears_done'], ['beacon', 'lantern', 'c3_ending']];
  for (const [kind, rm, done] of steps) {
    assert.equal(s.c2.step, kind);
    if (s.c2.rooms.p1 !== rm) applyAction(s, 'p1', { type: 'c2_move', room: rm });
    applyAction(s, 'p1', { type: 'c2_open' });
    skip(s);
    pz(s, 'p1', { op: 'ready' });
    pz(s, 'p2', { op: 'ready', seed: 11 });
    assert.equal(s.c2.pz.status, 'run', kind);
    solve(s);
    assert.equal(s.c2.pz.status, 'done', `${kind} solved`);
    assert.equal(s.scene.id, done);
    skip(s);
  }
  assert.equal(s.c2.step, 'end');
  // the beacon clock runs on the server tick
  const back = restoreState(JSON.parse(JSON.stringify(s)), 'CH3X');
  assert.equal(back.c2.chapter, 3);
  assert.ok(back.parked[2]);
  // going back to chapter 2 restores it
  applyAction(s, 'p1', { type: 'ch2_start' });
  assert.equal(s.c2.chapter || 2, 2);
  assert.ok(s.c2.results.coords);
});

test('beacon: wrong signal = strike and lost time; clock runs out = failed', () => {
  const s = room();
  applyAction(s, 'p1', { type: 'ch3_start' });
  skip(s);
  s.c2.step = 'beacon';
  s.c2.pz = { ...s.c2.pz, kind: 'beacon', status: 'setup', ready: {}, roles: { lookout: 'p1', keeper: 'p2' } };
  s.c2.rooms.p1 = 'lantern';
  applyAction(s, 'p1', { type: 'c2_open' });
  skip(s);
  pz(s, 'p1', { op: 'ready' });
  pz(s, 'p2', { op: 'ready', seed: 3 });
  const d = s.c2.pz.data;
  const left = d.left;
  pz(s, 'p1', { op: 'signal', colour: 'white', flashes: [] });
  assert.equal(s.c2.pz.strikes, 0, 'the lookout cannot send a signal');
  pz(s, 'p2', { op: 'signal', colour: 'white', flashes: [] });
  assert.equal(s.c2.pz.strikes, 1);
  assert.equal(left - d.left, 15000);
  d.left = 200;
  tick(s, 0.5);
  assert.equal(s.c2.pz.status, 'failed');
});
