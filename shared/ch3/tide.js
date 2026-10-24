// Chapter 3, puzzle 1 — "The tide window".
// The Aurora must cross a reef on the way to the Sunken Light. One player
// has today's tide table (and, on the hardest level, a notice that changes
// it); the other has the route card: how much water the ship needs, how
// long the crossing takes, when it can leave and when it must arrive.
// Only together can they find the EARLIEST possible departure time.

const int = (r, lo, hi) => lo + Math.floor(r() * (hi - lo + 1));
export const DAY = [6 * 60, 22 * 60]; // the table covers 06:00 to 22:00
export const fmt = (m) => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;

const STEP = { easy: 60, normal: 60, hard: 30 };
const CROSS = { easy: 60, normal: 120, hard: 90 };
export const SPRING = 0.3; // hard: "add 0.3 m to every height"

// the earliest departure where the water stays deep enough for the whole crossing
export function earliest(d) {
  const add = d.notice ? SPRING : 0;
  const at = (m) => d.table.find((x) => x.t === m);
  for (let t = d.route.leave; t + d.route.cross <= d.route.arrive; t += d.step) {
    let ok = true;
    for (let m = t; m <= t + d.route.cross; m += d.step) {
      const row = at(m);
      if (!row || row.h + add < d.route.min - 1e-9) { ok = false; break; }
    }
    if (ok) return t;
  }
  return null;
}

function create(level, r) {
  for (let k = 0; k < 500; k++) {
    const step = STEP[level];
    const mean = 2.3 + r() * 0.4;
    const amp = 1.3 + r() * 0.6;
    const phase = r() * 12.42;
    const table = [];
    for (let m = DAY[0]; m <= DAY[1]; m += step) {
      const hrs = m / 60;
      table.push({ t: m, h: Math.round((mean + amp * Math.cos((2 * Math.PI * (hrs - phase)) / 12.42)) * 10) / 10 });
    }
    const d = {
      step,
      table,
      notice: level === 'hard',
      route: {
        min: Math.round((2.6 + r() * 0.8) * 10) / 10,
        cross: CROSS[level],
        leave: int(r, 8, 12) * 60,
        arrive: int(r, 18, 21) * 60 + (r() < 0.5 ? 30 : 0),
      },
      tries: [],
    };
    const ans = earliest(d);
    if (ans === null) continue;
    // the first slots after "leave" must not work, so the table really matters
    if (ans - d.route.leave < 2 * step) continue;
    // on the hardest level the notice must change the answer
    if (level === 'hard') {
      const plain = earliest({ ...d, notice: false });
      if (plain === ans) continue;
    }
    d.answer = ans;
    return d;
  }
  throw new Error('tide: no puzzle');
}

function act(d, role, a) {
  if (role !== 'chart' || a.op !== 'depart') return undefined;
  const t = Number(a.time);
  if (!Number.isFinite(t)) return undefined;
  d.tries.push(t);
  a.what = `khởi hành ${fmt(t)}`;
  return t === d.answer ? 'solved' : 'strike';
}

export const tide = {
  roles: ['tables', 'chart'],
  strikes: { easy: 4, normal: 3, hard: 3 },
  create,
  act,
};
