// Chapter 2 flow: walk between the station's rooms, open the puzzle of the
// current step, play it, then the next step opens. Story scenes use the same
// shared dialogue system as chapter 1 (startScene is passed in to avoid a
// circular import).

import { newPuzzle, puzzleAction, puzzleTick } from './puzzle.js';
import { STEPS, ROLE_ROOM, LINKS } from './story.js';

export const stepOf = (c2) => STEPS.find((s) => s.id === c2.step) || STEPS[STEPS.length - 1];
export const isOpen = (c2, room) => stepOf(c2).open.includes(room);

export function newC2(level = 'normal') {
  return {
    step: 'coords',
    level,
    rooms: { p1: 'bridge', p2: 'bridge' },
    pz: newPuzzle('coords', null, level),
    open: false, // puzzle panel shown to both players
    seenIntro: {},
    results: {},
  };
}

// rooms next to each other on the map (you can only walk to a neighbour)
export function neighbours(room) {
  return LINKS.filter((l) => l.includes(room)).map((l) => (l[0] === room ? l[1] : l[0]));
}

export function c2Action(state, slot, a, startScene) {
  const c2 = state.c2;
  const ev = [];
  if (!c2) return ev;
  const step = stepOf(c2);
  const pz = c2.pz;
  const busy = pz && pz.status === 'run';
  switch (a.type) {
    case 'c2_move': {
      const to = a.room;
      if (busy || !isOpen(c2, to)) break;
      if (to !== c2.rooms[slot]) {
        c2.rooms[slot] = to;
        ev.push({ e: 'c2_moved', by: slot, room: to });
      }
      break;
    }
    case 'c2_open':
      if (!pz || c2.open || c2.rooms[slot] !== step.room) break;
      if (step.intro && !c2.seenIntro[step.id]) { c2.seenIntro[step.id] = true; startScene(state, step.intro); }
      c2.open = true;
      break;
    case 'c2_close':
      if (pz && pz.status !== 'run') c2.open = false;
      break;
    case 'c2_pz': {
      if (!pz || !c2.open) break;
      const out = puzzleAction(state, pz, slot, a);
      for (const e of out) {
        if (e.e === 'pz_start') {
          pz.startedAt = Date.now();
          for (const [role, s] of Object.entries(pz.roles)) c2.rooms[s] = ROLE_ROOM[pz.kind][role];
          c2.level = pz.level;
        }
        if (e.e === 'pz_done') {
          c2.results[pz.kind] = { level: pz.level, strikes: pz.strikes, attempts: pz.attempts, ms: Date.now() - (pz.startedAt || Date.now()) };
          startScene(state, step.done);
        }
      }
      ev.push(...out);
      break;
    }
    default: break;
  }
  return ev;
}

// called when a chapter 2 scene ends; returns true if it handled it
export function c2SceneEnd(state, id) {
  const c2 = state.c2;
  if (!c2) return false;
  const i = STEPS.findIndex((s) => s.done === id);
  if (i < 0) return id.startsWith('c2_');
  const next = STEPS[i + 1];
  c2.step = next.id;
  c2.open = false;
  c2.pz = next.id === 'end' ? null : newPuzzle(next.id, null, c2.level);
  if (next.id !== 'end') {
    // everyone walks to where the next puzzle starts (the story moves on)
    for (const s of ['p1', 'p2']) if (!next.open.includes(c2.rooms[s])) c2.rooms[s] = next.open[next.open.length - 1];
    if (id === 'c2_arrive') { c2.rooms.p1 = 'dock'; c2.rooms.p2 = 'dock'; }
  }
  return true;
}

// a room rebuilt from a save: a running puzzle goes back to its setup screen
export function restoreC2(saved) {
  if (!saved || typeof saved !== 'object') return null;
  const c2 = { ...newC2(), ...saved };
  if (c2.pz && c2.pz.status === 'run') c2.pz = newPuzzle(c2.pz.kind, c2.pz);
  return c2;
}

export function c2Tick(state, dt) {
  return state.c2 ? puzzleTick(state.c2.pz, dt) : { ev: [], changed: false };
}
