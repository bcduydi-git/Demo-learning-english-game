// Unit tests for the shared rules (run: npm test)
import test from 'node:test';
import assert from 'node:assert/strict';
import { createState, applyAction, tick, restoreState, checkCallAnswer, mastLane } from '../../shared/logic.js';
import { BAY, generatorSequence, CALL, SCENES } from '../../shared/content.js';
import { matchPhrase, normalize } from '../../shared/phrases.js';

function room() {
  const s = createState('TEST', () => 0.3);
  s.players.p1.connected = true;
  s.players.p2.connected = true;
  return s;
}
function finishScene(s) {
  let guard = 0;
  while (s.scene && guard++ < 50) {
    const { id, idx } = s.scene;
    applyAction(s, 'p1', { type: 'scene_next', id, idx });
    applyAction(s, 'p2', { type: 'scene_next', id, idx });
  }
}

test('phrases normalise and match', () => {
  assert.equal(normalize("  Let's   GO!! "), 'lets go');
  assert.equal(matchPhrase("let's go"), 'lets_go');
  assert.equal(matchPhrase('Say it again'), 'say_again');
  assert.equal(matchPhrase('banana'), null);
});

test('shared dialogue waits for both players', () => {
  const s = room();
  applyAction(s, 'p1', { type: 'start' });
  assert.equal(s.scene.id, 'intro');
  applyAction(s, 'p1', { type: 'scene_next', id: 'intro', idx: 0 });
  assert.equal(s.scene.idx, 0, 'must wait for p2');
  applyAction(s, 'p2', { type: 'scene_next', id: 'intro', idx: 0 });
  assert.equal(s.scene.idx, 1);
  // a disconnected partner does not block the story
  s.players.p2.connected = false;
  applyAction(s, 'p1', { type: 'scene_next', id: 'intro', idx: 1 });
  assert.equal(s.scene.idx, 2);
});

test('items are role-locked and unlock Pip', () => {
  const s = room();
  applyAction(s, 'p2', { type: 'pickup', item: 'tools' });
  assert.ok(!s.flags.has_tools);
  applyAction(s, 'p1', { type: 'pickup', item: 'tools' });
  applyAction(s, 'p2', { type: 'pickup', item: 'radio' });
  assert.equal(s.scene.id, 'pip_meet');
});

test('log needs both players within 1.5 s', () => {
  const s = room();
  s.flags.radio_done = true;
  applyAction(s, 'p1', { type: 'log_lift' }, 1000);
  applyAction(s, 'p2', { type: 'log_lift' }, 3000);
  assert.ok(!s.flags.log_done);
  applyAction(s, 'p1', { type: 'log_lift' }, 3800);
  assert.ok(s.flags.log_done);
});

test('generator: wrong input resets, right sequence powers on', () => {
  const s = room();
  const seq = generatorSequence(s.gen);
  applyAction(s, 'p1', { type: 'gen_input', k: 'button', v: 'red' });
  assert.equal(s.genFails, 1);
  for (const st of seq) applyAction(s, 'p1', { type: 'gen_input', ...st });
  assert.ok(s.flags.power);
});

test('generator ignores the radio player', () => {
  const s = room();
  const seq = generatorSequence(s.gen);
  for (const st of seq) applyAction(s, 'p2', { type: 'gen_input', ...st });
  assert.ok(!s.flags.power);
});

test('door accepts the full phrase with any punctuation', () => {
  const s = room();
  s.flags.power = true;
  const ev = applyAction(s, 'p2', { type: 'door_try', text: 'hold on help me' });
  assert.equal(ev[0].ok, false);
  assert.equal(ev[0].words.filter((w) => w.ok).length, 3);
  applyAction(s, 'p2', { type: 'door_try', text: 'HOLD ON, help is coming!!' });
  assert.ok(s.flags.door_open);
});

test('boss: phases, loss, retry, final strike', () => {
  const s = room();
  Object.assign(s.flags, { door_open: true, lens: true, power: true });
  applyAction(s, 'p1', { type: 'enter', on: true });
  applyAction(s, 'p2', { type: 'enter', on: true });
  assert.equal(s.stage, 'boss');
  finishScene(s);
  assert.equal(s.boss.status, 'rules');
  applyAction(s, 'p1', { type: 'boss_ready', diff: 'relaxed' });
  applyAction(s, 'p2', { type: 'boss_ready', diff: 'hard' });
  assert.equal(s.boss.status, 'fight');
  for (let i = 0; i < 5; i++) applyAction(s, 'p1', { type: 'boss_leak' });
  assert.equal(s.boss.status, 'lost');
  applyAction(s, 'p2', { type: 'boss_retry' });
  assert.equal(s.boss.status, 'rules');
  applyAction(s, 'p1', { type: 'boss_ready' });
  applyAction(s, 'p2', { type: 'boss_ready' });
  let n = 0;
  while (s.boss.status === 'fight' && n++ < 100) applyAction(s, n % 2 ? 'p1' : 'p2', { type: 'boss_hit', recall: true, text: 'watch out' });
  assert.equal(s.boss.status, 'final');
  assert.ok(n > 20 && n < 40, `hits needed: ${n}`);
  assert.ok(s.learn.p1.watch_out.r > 0, 'recall counted');
  // final timer runs out once -> lose 2 hearts, try again
  const r = tick(s, 0.1, s.boss.finalEndsAt + 1);
  assert.equal(r.ev[0].e, 'final_fail');
  applyAction(s, 'p1', { type: 'boss_final' });
  applyAction(s, 'p2', { type: 'boss_final' });
  assert.equal(s.boss.status, 'won');
  assert.equal(s.scene.id, 'boss_won');
});

test('radio call checks key information only', () => {
  assert.ok(checkCallAnswer(0, 'Yes I can hear you'));
  assert.ok(checkCallAnswer(0, 'yeah'));
  assert.ok(!checkCallAnswer(0, 'maybe'));
  assert.ok(checkCallAnswer(1, "We're fine thanks"));
  assert.ok(checkCallAnswer(2, 'there are 2 of us'));
  assert.ok(checkCallAnswer(3, "we're at the light house"));
  assert.equal(CALL.length, 4);
});

// A simple pilot with human-like delays must be able to bring the boat home.
test('bay is passable for a careful pilot', () => {
  const s = room();
  s.stage = 'finale';
  s.call = { q: CALL.length, tries: 0 };
  s.boat = null;
  applyAction(s, 'p1', { type: 'start' });
  s.scene = null;
  // emulate end of boat_intro
  s.scene = { id: 'boat_intro', idx: SCENES.boat_intro.length - 1, ready: {} };
  applyAction(s, 'p1', { type: 'scene_next', id: 'boat_intro', idx: s.scene.idx });
  applyAction(s, 'p2', { type: 'scene_next', id: 'boat_intro', idx: s.scene.idx });
  assert.ok(s.boat);
  const say = (text) => applyAction(s, s.boat.commander, { type: 'boat_cmd', text });
  const safeLane = (row, lane) => {
    const next = BAY.rows[row + 1];
    if (!next || next[lane] !== 'R') return lane;
    for (const d of [1, -1, 2, -2, 3, -3]) {
      const l = lane + d;
      if (l < 0 || l >= BAY.lanes || next[l] === 'R') continue;
      const lo = Math.min(l, lane);
      const hi = Math.max(l, lane);
      let ok = true;
      for (let k = lo; k <= hi; k++) if (BAY.rows[row][k] === 'R') ok = false;
      if (ok) return l;
    }
    return lane;
  };
  let t = 0;
  let reaction = 0;
  while (!s.boat.done && t < 400) {
    const b = s.boat;
    t += 0.1;
    reaction -= 0.1;
    if (reaction <= 0) {
      const row = Math.floor(b.y);
      const lane = Math.round(b.lane);
      const want = safeLane(row, b.target);
      const nextRow = BAY.rows[row + 1] || '';
      if (want !== b.target) {
        if (b.moving) say('stop');
        say(want < b.target ? 'go left' : 'go right');
        reaction = 1.2;
      } else if (nextRow.includes('M') && b.y - row > 0.4) {
        // wait for the mast to pass, then go
        const m = mastLane(b.t);
        if (b.moving && m !== null) { say('stop'); reaction = 0.4; }
        else if (!b.moving && m === null && (b.t % 10) < 6) { say('keep going'); reaction = 3; }
      } else if (!b.moving && b.target === lane) {
        say('keep going');
        reaction = 1.0;
      }
    }
    tick(s, 0.1, 0);
  }
  assert.ok(s.boat.done, `boat stuck at y=${s.boat.y.toFixed(2)} lane=${s.boat.lane}`);
  assert.ok(s.boat.swapped);
  assert.ok(s.boat.bumps <= 3, `bumps ${s.boat.bumps}`);
  assert.equal(s.scene.id, 'ending');
});

test('restore from a save keeps progress and resets timed parts', () => {
  const s = room();
  Object.assign(s.flags, { started: true, lens: true, power: true });
  s.stage = 'boss';
  s.boss = { status: 'final', hp: 5, lamp: 1 };
  const r = restoreState(JSON.parse(JSON.stringify(s)), 'ABCD');
  assert.equal(r.room, 'ABCD');
  assert.ok(r.flags.lens && r.flags.power);
  assert.equal(r.boss.status, 'rules');
  assert.equal(r.players.p1.connected, false);
});

test('players pick Lắc or Tím; the two never match', async () => {
  const { setLook } = await import('../../shared/logic.js');
  const s = room();
  assert.equal(s.players.p1.look, 'lac');
  assert.equal(s.players.p2.look, 'tim');
  // creator (alone) picks Tím: the empty seat becomes Lắc
  s.players.p2.connected = false;
  setLook(s, 'p1', 'tim');
  assert.equal(s.players.p1.look, 'tim');
  assert.equal(s.players.p2.look, 'lac');
  // joiner asks for the character the creator already has: gets the other one
  s.players.p2.connected = true;
  setLook(s, 'p2', 'tim');
  assert.equal(s.players.p2.look, 'lac');
  assert.equal(s.players.p1.look, 'tim');
  // looks survive a restore from a save
  const r = restoreState(JSON.parse(JSON.stringify(s)), 'ROOM');
  assert.equal(r.players.p1.look, 'tim');
  assert.equal(r.players.p2.look, 'lac');
});
