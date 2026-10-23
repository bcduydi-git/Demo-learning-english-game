import test from 'node:test';
import assert from 'node:assert/strict';
import { createState, applyAction, restoreState } from '../../shared/logic.js';
import { levels } from '../../shared/ch2/flood.js';
import { viewOf } from '../../shared/ch2/antenna.js';

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

test('chapter 2 from the waiting room to the end of part 2', () => {
  const s = room();
  applyAction(s, 'p1', { type: 'ch2_start' });
  assert.equal(s.stage, 'ch2');
  assert.equal(s.scene.id, 'c2_intro');
  // nothing in the chapter can be done during a story scene
  applyAction(s, 'p1', { type: 'c2_open' });
  assert.equal(s.c2.open, false);
  skip(s);
  const order = [];
  for (const [kind, room, done] of [['coords', 'bridge', 'c2_arrive'], ['flood', 'hub', 'c2_flood_done'], ['keycard', 'office', 'c2_keycard_done'], ['antenna', 'dome', 'c2_antenna_done']]) {
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
  assert.deepEqual(order, ['coords', 'flood', 'keycard', 'antenna']);
  assert.equal(s.c2.step, 'end');
  assert.deepEqual(Object.keys(s.c2.results).sort(), ['antenna', 'coords', 'flood', 'keycard']);
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
