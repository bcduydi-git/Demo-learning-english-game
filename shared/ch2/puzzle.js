// Common frame for the chapter 2 puzzles: setup (pick level, swap roles,
// both ready) -> run -> done, or failed after too many strikes (then a new
// random puzzle). Each puzzle module provides:
//   roles      [roleA, roleB]: names of the two sides, given to p1 / p2
//   strikes    max strikes per level
//   create(level, r)            -> puzzle data (random)
//   act(pz, role, a, ev)        -> 'ok' | 'strike' | 'solved' | undefined
// Only the side named in each action's role may do it; the server checks.

import { rng } from '../transmitter.js';
import { coords } from './coords.js';
import { flood } from './flood.js';
import { keycard } from './keycard.js';
import { antenna } from './antenna.js';

export const PUZZLES = { coords, flood, keycard, antenna };
export const LEVELS = { easy: 'Dễ', normal: 'Vừa', hard: 'Hack não' };

export function newPuzzle(kind, prev, level = 'normal') {
  const P = PUZZLES[kind];
  return {
    kind,
    status: 'setup',
    level: (prev && prev.level) || level,
    roles: (prev && prev.roles) || { [P.roles[0]]: 'p1', [P.roles[1]]: 'p2' },
    ready: {},
    strikes: 0,
    attempts: (prev && prev.attempts) || 0,
    ms: 0,
    data: null,
  };
}

export const roleOf = (pz, slot) => Object.keys(pz.roles).find((r) => pz.roles[r] === slot);

// -> events
export function puzzleAction(state, pz, slot, a, seed) {
  const ev = [];
  const P = PUZZLES[pz.kind];
  switch (a.op) {
    case 'level':
      if (pz.status === 'setup' && LEVELS[a.level]) { pz.level = a.level; pz.ready = {}; }
      break;
    case 'swap':
      if (pz.status === 'setup') {
        const [ra, rb] = P.roles;
        pz.roles = { [ra]: pz.roles[rb], [rb]: pz.roles[ra] };
        pz.ready = {};
      }
      break;
    case 'ready':
      if (pz.status === 'setup') {
        pz.ready[slot] = true;
        const need = ['p1', 'p2'].filter((s) => state.players[s].connected);
        if (need.every((s) => pz.ready[s])) {
          const s = Number.isInteger(a.seed) ? a.seed : (seed ?? Math.floor(Math.random() * 2 ** 31));
          pz.data = P.create(pz.level, rng(s));
          pz.status = 'run';
          pz.strikes = 0;
          pz.ms = 0;
          pz.attempts += 1;
          ev.push({ e: 'pz_start', kind: pz.kind });
        }
      }
      break;
    case 'again':
      if (pz.status === 'failed') Object.assign(pz, newPuzzle(pz.kind, pz));
      break;
    default: {
      if (pz.status !== 'run') break;
      const role = roleOf(pz, slot);
      const res = P.act(pz.data, role, a, ev, pz.level);
      if (res === 'strike') {
        pz.strikes += 1;
        ev.push({ e: 'pz_strike', kind: pz.kind, by: slot, what: a.what || '' });
        if (pz.strikes >= P.strikes[pz.level]) { pz.status = 'failed'; ev.push({ e: 'pz_failed', kind: pz.kind }); }
      } else if (res === 'solved') {
        pz.status = 'done';
        ev.push({ e: 'pz_done', kind: pz.kind });
      }
    }
  }
  return ev;
}
