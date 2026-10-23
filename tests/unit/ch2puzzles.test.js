import test from 'node:test';
import assert from 'node:assert/strict';
import { rng } from '../../shared/transmitter.js';
import { PUZZLES, newPuzzle, puzzleAction } from '../../shared/ch2/puzzle.js';
import { numberWords, PAIRS } from '../../shared/ch2/coords.js';
import { levels } from '../../shared/ch2/flood.js';
import { mirror, viewOf } from '../../shared/ch2/antenna.js';

const LV = ['easy', 'normal', 'hard'];
const players = { p1: { connected: true }, p2: { connected: true } };

function start(kind, level, seed = 3) {
  const st = { players };
  const pz = newPuzzle(kind, null, level);
  puzzleAction(st, pz, 'p1', { op: 'ready' });
  puzzleAction(st, pz, 'p2', { op: 'ready', seed });
  return { st, pz };
}
const roleSlot = (pz, role) => pz.roles[role];

test('numbers are written as words, and -teen/-ty pairs sound alike', () => {
  assert.equal(numberWords(52), 'fifty-two');
  assert.equal(numberWords(13), 'thirteen');
  assert.equal(numberWords(30), 'thirty');
  assert.equal(numberWords(118), 'one hundred and eighteen');
  for (const [a, b] of PAIRS) assert.ok(numberWords(a).endsWith('teen') && numberWords(b).endsWith('ty'), `${a}/${b}`);
});

test('coords: each key part is heard clearly by somebody; the chart has exactly one row per grid; typing the position solves it', () => {
  for (const level of LV) {
    for (let s = 1; s <= 200; s++) {
      const d = PUZZLES.coords.create(level, rng(s));
      for (const p of d.parts) assert.ok(p.hear.length >= 1, `${level} ${p.key} heard by someone`);
      const grids = d.chart.map((c) => c.grid);
      assert.equal(new Set(grids).size, grids.length);
      const truth = d.chart.filter((c) => c.latDeg === d.pos.latDeg && c.lonDeg === d.pos.lonDeg && d.pos.latMin >= c.latMin[0] && d.pos.latMin <= c.latMin[1] && d.pos.lonMin >= c.lonMin[0] && d.pos.lonMin <= c.lonMin[1]);
      assert.equal(truth.length, 1, `${level}/${s} exactly one chart row holds the station`);
      assert.ok(d.parts.find((p) => p.key === 'grid').en.includes(truth[0].grid));
    }
  }
  const { st, pz } = start('coords', 'normal');
  const nav = roleSlot(pz, 'nav');
  const radio = roleSlot(pz, 'radio');
  puzzleAction(st, pz, radio, { op: 'submit', value: pz.data.pos });
  assert.equal(pz.status, 'run', 'the radio operator cannot type the position');
  puzzleAction(st, pz, nav, { op: 'submit', value: { ...pz.data.pos, latMin: 99 } });
  assert.equal(pz.strikes, 1);
  puzzleAction(st, pz, nav, { op: 'submit', value: pz.data.pos });
  assert.equal(pz.status, 'done');
});

test('flood: hidden solution reaches both targets; valves change the other wing; hatches must open together', () => {
  for (const level of LV) {
    for (let s = 1; s <= 300; s++) {
      const d = PUZZLES.flood.create(level, rng(s));
      d.west.turns = [...d.solution.west];
      d.east.turns = [...d.solution.east];
      assert.deepEqual(levels(d, 'west'), d.west.target, `${level}/${s} west`);
      assert.deepEqual(levels(d, 'east'), d.east.target, `${level}/${s} east`);
    }
  }
  const { st, pz } = start('flood', 'normal', 11);
  const d = pz.data;
  const W = roleSlot(pz, 'west');
  const E = roleSlot(pz, 'east');
  const eastBefore = levels(d, 'east');
  const westBefore = levels(d, 'west');
  const v = d.solution.west.findIndex((t) => t > 0);
  puzzleAction(st, pz, W, { op: 'turn', valve: v, dir: 1 });
  assert.deepEqual(levels(d, 'west'), westBefore, 'west valves do not change west (normal level)');
  assert.notDeepEqual(levels(d, 'east'), eastBefore, 'west valves change the east wing');
  // wrong hatch = strike
  puzzleAction(st, pz, E, { op: 'hatch' });
  assert.equal(pz.strikes, 1);
  // play the solution
  d.west.turns = [0, 0, 0];
  for (let i = 0; i < 3; i++) for (let k = 0; k < d.solution.west[i]; k++) puzzleAction(st, pz, W, { op: 'turn', valve: i, dir: 1 });
  for (let i = 0; i < 3; i++) for (let k = 0; k < d.solution.east[i]; k++) puzzleAction(st, pz, E, { op: 'turn', valve: i, dir: 1 });
  puzzleAction(st, pz, W, { op: 'hatch' });
  assert.equal(pz.status, 'run', 'one hatch alone is not enough');
  puzzleAction(st, pz, E, { op: 'hatch' });
  assert.equal(pz.status, 'done');
});

test('keycard: one answer, only the locker room can open lockers, wrong locker = strike', () => {
  for (const level of LV) {
    for (let s = 1; s <= 300; s++) {
      const d = PUZZLES.keycard.create(level, rng(s));
      assert.equal(d.lockers.filter((l) => !l.tag).length, 2, 'two lockers without a tag');
      assert.equal(d.lockers[d.answer].tag, null, 'the answer has no tag');
      const fac = d.emails.find((e) => e.from === 'Facilities');
      assert.ok(fac && /locker is the one/.test(fac.body));
    }
  }
  const { st, pz } = start('keycard', 'hard', 9);
  const d = pz.data;
  puzzleAction(st, pz, roleSlot(pz, 'office'), { op: 'open', locker: d.answer });
  assert.equal(pz.status, 'run');
  const wrong = d.answer === 0 ? 1 : 0;
  puzzleAction(st, pz, roleSlot(pz, 'lockers'), { op: 'open', locker: wrong });
  assert.equal(pz.strikes, 1);
  puzzleAction(st, pz, roleSlot(pz, 'lockers'), { op: 'open', locker: d.answer });
  assert.equal(pz.status, 'done');
});

test('antenna: north sees the panel mirrored; two dishes with sides swapped; hard switches also flip the light above', () => {
  assert.deepEqual(mirror(['0,0', '2,4'], 5), ['0,4', '2,0']);
  const { st, pz } = start('antenna', 'normal', 4);
  const d = pz.data;
  assert.equal(d.rounds[0].controller, 'south');
  assert.equal(d.rounds[1].controller, 'north');
  // solve round 1 from the south (clicks in south view = stored cells)
  const r0 = d.rounds[0];
  const S = roleSlot(pz, 'south');
  const N = roleSlot(pz, 'north');
  puzzleAction(st, pz, N, { op: 'toggle', row: 0, col: 0 });
  puzzleAction(st, pz, S, { op: 'align' });
  assert.equal(pz.strikes, 1);
  for (const k of [...r0.lit]) if (!r0.target.includes(k)) { const [row, col] = k.split(',').map(Number); puzzleAction(st, pz, S, { op: 'toggle', row, col }); }
  for (const k of r0.target) if (!r0.lit.includes(k)) { const [row, col] = k.split(',').map(Number); puzzleAction(st, pz, S, { op: 'toggle', row, col }); }
  puzzleAction(st, pz, S, { op: 'align' });
  assert.equal(d.cur, 1);
  // round 2 from the north: clicks are in the north (mirrored) view
  const r1 = d.rounds[1];
  const northView = (cells) => viewOf(cells, r1.n, 'north');
  for (const k of northView([...r1.lit])) if (!northView(r1.target).includes(k)) { const [row, col] = k.split(',').map(Number); puzzleAction(st, pz, N, { op: 'toggle', row, col }); }
  for (const k of northView(r1.target)) if (!northView(r1.lit).includes(k)) { const [row, col] = k.split(',').map(Number); puzzleAction(st, pz, N, { op: 'toggle', row, col }); }
  puzzleAction(st, pz, N, { op: 'align' });
  assert.equal(pz.status, 'done');

  const h = start('antenna', 'hard', 4);
  const hr = h.pz.data.rounds[0];
  const before = [...hr.lit];
  puzzleAction(h.st, h.pz, roleSlot(h.pz, 'south'), { op: 'toggle', row: 2, col: 1 });
  const changed = [...new Set([...before, ...hr.lit])].filter((k) => before.includes(k) !== hr.lit.includes(k)).sort();
  assert.deepEqual(changed, ['1,1', '2,1']);
});

test('too many strikes fail the puzzle; "again" builds a new one at the setup screen', () => {
  const { st, pz } = start('keycard', 'normal', 2);
  const wrongs = [0, 1, 2, 3, 4, 5, 6, 7].filter((i) => i !== pz.data.answer);
  for (const i of wrongs.slice(0, 3)) puzzleAction(st, pz, roleSlot(pz, 'lockers'), { op: 'open', locker: i });
  assert.equal(pz.status, 'failed');
  puzzleAction(st, pz, 'p1', { op: 'again' });
  assert.equal(pz.status, 'setup');
  assert.equal(pz.attempts, 1);
  puzzleAction(st, pz, 'p1', { op: 'swap' });
  assert.equal(pz.roles.office, 'p2');
});
