// Puzzle 5 — the signal transmitter, now inside the station's transmitter
// room. Same machine and manual as the stand-alone prototype
// (shared/transmitter.js): the technician sees the machine, the reader has
// the manual. Runs against the clock; a strike also costs time.

import { newMachine, wireAnswer, valveAnswer, keypadOrder, VALVES, TX_LEVELS, TX_PENALTY_MS, TX_MODULES } from '../transmitter.js';

function create(level, r) {
  return { ...newMachine(level, Math.floor(r() * 2 ** 31)), left: TX_LEVELS[level].seconds * 1000 };
}

// shared checks, also used by the finale
export function cutWire(m, plate, index) {
  const i = Number(index);
  if (!(i >= 0 && i < m.colours.length) || m.cut.includes(i)) return undefined;
  m.cut.push(i);
  return i === wireAnswer(m.colours, plate).index;
}
export function setValves(pressure, plate, level, set = {}) {
  const want = valveAnswer(pressure, plate, level);
  const opened = VALVES.filter((v) => Number(set[v]) > 0);
  return want.valve === null ? opened.length === 0 : opened.length === 1 && opened[0] === want.valve && Number(set[want.valve]) === want.turns;
}
export function pressKey(k, word) {
  if (!k.words.includes(word) || k.pressed.includes(word)) return undefined;
  if (keypadOrder(k.words)[k.pressed.length] === word) { k.pressed.push(word); return true; }
  k.pressed = [];
  return false;
}

function act(d, role, a, ev, level) {
  if (role !== 'tech') return undefined;
  let ok;
  let mod;
  if (a.op === 'cut' && !d.solved.wires) { mod = 'wires'; ok = cutWire(d.wires, d.plate, a.index); a.what = `dây ${Number(a.index) + 1}`; }
  if (a.op === 'valves' && !d.solved.valves) { mod = 'valves'; ok = setValves(d.valves.pressure, d.plate, level, a.set); a.what = 'van áp suất'; }
  if (a.op === 'key' && !d.solved.keypad) {
    mod = 'keypad';
    ok = pressKey(d.keypad, a.word);
    a.what = `phím ${a.word}`;
    if (ok && d.keypad.pressed.length < d.keypad.words.length) { ev.push({ e: 'tx_key_ok' }); return 'ok'; }
  }
  if (ok === undefined) return undefined;
  if (!ok) { d.left = Math.max(0, d.left - TX_PENALTY_MS); return 'strike'; }
  d.solved[mod] = true;
  ev.push({ e: 'pz_part', part: mod });
  return TX_MODULES.every((m) => d.solved[m]) ? 'solved' : 'ok';
}

export const machine = {
  roles: ['tech', 'reader'],
  strikes: Object.fromEntries(Object.entries(TX_LEVELS).map(([k, v]) => [k, v.strikes])),
  create,
  act,
  timed: true,
};
