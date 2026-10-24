// Chapter flow for chapters 2 and 3 (state.c2 holds the chapter being
// played): walk between the rooms, open the puzzle of the current step,
// play it, then the next step opens. Story scenes use the same shared
// dialogue system as chapter 1 (startScene is passed in to avoid a
// circular import).

import { newPuzzle, puzzleAction, puzzleTick } from './puzzle.js';
import * as CH2 from './story.js';
import * as CH3 from '../ch3/story.js';

export const CHAPTERS = { 2: CH2, 3: CH3 };
export const ALL_ROLE_INFO = { ...CH2.ROLE_INFO, ...CH3.ROLE_INFO };
export const chapterOf = (c2) => CHAPTERS[(c2 && c2.chapter) || 2];
export const stepOf = (c2) => { const S = chapterOf(c2).STEPS; return S.find((s) => s.id === c2.step) || S[S.length - 1]; };
export const isOpen = (c2, room) => stepOf(c2).open.includes(room);

export function newC2(level = 'normal', chapter = 2) {
  const first = CHAPTERS[chapter].STEPS[0];
  return {
    chapter,
    step: first.id,
    level,
    rooms: { p1: first.room, p2: first.room },
    pz: newPuzzle(first.id, null, level),
    open: false, // puzzle panel shown to both players
    seenIntro: {},
    results: {},
  };
}

// Switch the room to another chapter; the one being left is parked so its
// progress comes back later. Returns true if the chapter was new.
export function enterChapter(state, chapter) {
  const cur = state.c2;
  if (cur && (cur.chapter || 2) === chapter) return false;
  state.parked = state.parked || {};
  if (cur) state.parked[cur.chapter || 2] = cur;
  const back = state.parked[chapter];
  delete state.parked[chapter];
  state.c2 = back || newC2(cur ? cur.level : 'normal', chapter);
  return !back;
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
          for (const [role, s] of Object.entries(pz.roles)) c2.rooms[s] = chapterOf(c2).ROLE_ROOM[pz.kind][role];
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

// called when a chapter 2/3 scene ends; returns true if it handled it
export function c2SceneEnd(state, id) {
  const c2 = state.c2;
  if (!c2) return false;
  const STEPS = chapterOf(c2).STEPS;
  const i = STEPS.findIndex((s) => s.done === id);
  if (i < 0) return id.startsWith('c2_') || id.startsWith('c3_');
  const next = STEPS[i + 1];
  c2.step = next.id;
  c2.open = false;
  c2.pz = next.id === 'end' ? null : newPuzzle(next.id, null, c2.level);
  if (next.id !== 'end') {
    // everyone walks to where the next puzzle starts (the story moves on)
    for (const s of ['p1', 'p2']) if (!next.open.includes(c2.rooms[s])) c2.rooms[s] = next.open[next.open.length - 1];
    if (next.spawn) { c2.rooms.p1 = next.spawn; c2.rooms.p2 = next.spawn; }
  }
  return true;
}

// a room rebuilt from a save: a running puzzle goes back to its setup screen
export function restoreC2(saved) {
  if (!saved || typeof saved !== 'object') return null;
  const c2 = { ...newC2('normal', saved.chapter || 2), ...saved };
  if (c2.pz && c2.pz.status === 'run') c2.pz = newPuzzle(c2.pz.kind, c2.pz);
  return c2;
}

export function c2Tick(state, dt) {
  return state.c2 ? puzzleTick(state.c2.pz, dt) : { ev: [], changed: false };
}
