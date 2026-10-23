// Puzzle 4 — "Aligning the antenna".
// The two players stand on opposite sides of a glass panel of lights under
// the dome, so one player's left is the other's right. One player holds the
// star chart (the pattern to light, drawn as seen from their side) and can
// watch the panel; the other works the switches. Then they swap sides for
// the second dish. On the hardest level each switch also flips the light
// above it, and only the player at the switches is told so.

const int = (r, lo, hi) => lo + Math.floor(r() * (hi - lo + 1));
export const SIZE = { easy: 4, normal: 5, hard: 5 };
const COUNT = { easy: 4, normal: 6, hard: 7 };
const START = { easy: 2, normal: 3, hard: 4 };

const key = (row, col) => `${row},${col}`;
export const mirror = (cells, n) => cells.map((k) => { const [r, c] = k.split(',').map(Number); return key(r, n - 1 - c); });
const same = (a, b) => a.length === b.length && a.every((k) => b.includes(k));

function round(r, level, describer, controller) {
  const n = SIZE[level];
  for (;;) {
    const all = [];
    for (let row = 0; row < n; row++) for (let col = 0; col < n; col++) all.push(key(row, col));
    const shuffled = [...all].sort(() => r() - 0.5);
    const target = shuffled.slice(0, COUNT[level]);
    const lit = shuffled.slice(COUNT[level] - 1, COUNT[level] - 1 + START[level]); // shares one light with the target
    // the pattern must not look the same in a mirror, or left/right would not matter
    if (same(target, mirror(target, n)) || same(lit, target)) continue;
    return { describer, controller, n, target, lit, link: level === 'hard' };
  }
}

function create(level, r) {
  return { rounds: [round(r, level, 'north', 'south'), round(r, level, 'south', 'north')], cur: 0 };
}

// Cells are stored as the SOUTH player sees them. North sees them mirrored.
export const viewOf = (cells, n, side) => (side === 'south' ? cells : mirror(cells, n));

function act(d, role, a, ev) {
  const rd = d.rounds[d.cur];
  if (!rd || role !== rd.controller) return undefined;
  if (a.op === 'toggle') {
    // the controller clicks in their own view; turn it into stored cells
    const [row, col] = [Number(a.row), Number(a.col)];
    if (!(row >= 0 && row < rd.n && col >= 0 && col < rd.n)) return undefined;
    const real = role === 'south' ? key(row, col) : key(row, rd.n - 1 - col);
    const flip = (k) => { const i = rd.lit.indexOf(k); if (i >= 0) rd.lit.splice(i, 1); else rd.lit.push(k); };
    flip(real);
    if (rd.link && row > 0) flip(key(row - 1, Number(real.split(',')[1])));
    ev.push({ e: 'antenna_toggle' });
    return 'ok';
  }
  if (a.op === 'align') {
    if (!same(rd.lit, rd.target)) { a.what = `đĩa ${d.cur + 1}`; return 'strike'; }
    d.cur += 1;
    ev.push({ e: 'antenna_round', round: d.cur });
    return d.cur >= d.rounds.length ? 'solved' : 'ok';
  }
  return undefined;
}

export const antenna = {
  roles: ['north', 'south'],
  strikes: { easy: 5, normal: 3, hard: 3 },
  create,
  act,
};
