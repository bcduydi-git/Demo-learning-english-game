// Puzzle 2 — "Two flooded wings".
// Each player is stuck in one wing with three flooded rooms. The hatch of a
// wing opens only when its three water levels match the numbers on the
// hatch. But every valve a player turns changes the water in the OTHER
// wing (and, on the hardest level, a little in their own). So each player
// must ask for the other wing's levels and targets, work out the turns,
// and tell each other "turn valve two twice". Both hatches have to be
// opened within a few seconds of each other: count down together.
// Levels may go out of the 0-9 range for a while (shown as a warning); only
// a hatch opened at the wrong levels costs a strike.

export const ROOMS = ['A', 'B', 'C'];
export const MAX_LEVEL = 9;
export const HATCH_WINDOW_MS = 4000;
const int = (r, lo, hi) => lo + Math.floor(r() * (hi - lo + 1));
const pick = (r, l) => l[Math.floor(r() * l.length)];

// effect matrix: valve i -> change per turn in rooms of the other wing.
// easy: one room per valve; normal: triangular (solve one by one);
// hard: triangular + a side effect in your own wing.
function matrix(r, level) {
  const order = [0, 1, 2].sort(() => r() - 0.5);
  return [0, 1, 2].map((i) => {
    const row = [0, 0, 0];
    row[order[i]] = pick(r, [1, 2]) * (r() < 0.25 && level !== 'easy' ? -1 : 1);
    if (level !== 'easy' && i < 2) row[order[i + 1 + Math.floor(r() * (2 - i))]] = pick(r, [-1, 1]);
    return row;
  });
}
const apply = (levels, m, turns, sign = 1) => levels.map((v, room) => v + sign * m.reduce((s, row, i) => s + row[room] * turns[i], 0));
const inRange = (l) => l.every((v) => v >= 0 && v <= MAX_LEVEL);

function wing(r, level) {
  return { start: [0, 0, 0].map(() => int(r, 2, 7)), effect: matrix(r, level), self: level === 'hard' ? [0, 1, 2].map(() => [0, 0, 0]) : null };
}

function create(level, r) {
  for (let k = 0; k < 500; k++) {
    const w = { west: wing(r, level), east: wing(r, level) };
    if (level === 'hard') {
      // one valve on each side also moves your own water by one
      for (const side of ['west', 'east']) w[side].self[int(r, 0, 2)][int(r, 0, 2)] = pick(r, [-1, 1]);
    }
    const turns = { west: [0, 1, 2].map(() => int(r, 0, 3)), east: [0, 1, 2].map(() => int(r, 0, 3)) };
    if (turns.west.every((t) => t === 0) || turns.east.every((t) => t === 0)) continue;
    // targets reached by the hidden solution
    const target = {
      west: apply(apply(w.west.start, w.east.effect, turns.east), w.west.self || [[0, 0, 0], [0, 0, 0], [0, 0, 0]], turns.west),
      east: apply(apply(w.east.start, w.west.effect, turns.west), w.east.self || [[0, 0, 0], [0, 0, 0], [0, 0, 0]], turns.east),
    };
    if (!inRange(target.west) || !inRange(target.east)) continue;
    if (target.west.every((v, i) => v === w.west.start[i]) || target.east.every((v, i) => v === w.east.start[i])) continue;
    return {
      west: { ...w.west, target: target.west, turns: [0, 0, 0], hatch: 0 },
      east: { ...w.east, target: target.east, turns: [0, 0, 0], hatch: 0 },
      solution: turns,
    };
  }
  throw new Error('flood: no puzzle');
}

// current water in one wing
export function levels(d, side) {
  const me = d[side];
  const them = d[side === 'west' ? 'east' : 'west'];
  let l = apply(me.start, them.effect, them.turns);
  if (me.self) l = apply(l, me.self, me.turns);
  return l;
}

function act(d, role, a, ev, level, now = Date.now()) {
  if (role !== 'west' && role !== 'east') return undefined;
  const me = d[role];
  if (a.op === 'turn') {
    const i = Number(a.valve);
    const dir = a.dir === -1 ? -1 : 1;
    if (!(i >= 0 && i < 3)) return undefined;
    if (me.turns[i] + dir < 0 || me.turns[i] + dir > 6) return undefined;
    me.turns[i] += dir;
    me.hatch = 0;
    d[role === 'west' ? 'east' : 'west'].hatch = 0;
    ev.push({ e: 'flood_turn', side: role, valve: i, dir });
    return 'ok';
  }
  if (a.op === 'hatch') {
    const ok = levels(d, role).every((v, k) => v === me.target[k]);
    if (!ok) { a.what = `cửa khoang cánh ${role === 'west' ? 'Tây' : 'Đông'} chưa đúng mực nước`; me.hatch = 0; return 'strike'; }
    me.hatch = now;
    const other = d[role === 'west' ? 'east' : 'west'];
    ev.push({ e: 'flood_hatch', side: role });
    if (other.hatch && now - other.hatch <= HATCH_WINDOW_MS) return 'solved';
    return 'ok';
  }
  return undefined;
}

export const flood = {
  roles: ['west', 'east'],
  strikes: { easy: 6, normal: 4, hard: 4 },
  create,
  act,
};
