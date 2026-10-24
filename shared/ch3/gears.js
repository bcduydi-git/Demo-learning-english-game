// Chapter 3, puzzle 3 — "The lens gears".
// The lighthouse lens is turned by a chain of gears from a hand crank.
// One player has the blueprint (the gear chain and how far the lens must
// turn); the other stands at the crank and has the maintenance tag (the
// crank gear's size, and a gear that was replaced since the blueprint was
// drawn). Gears that touch turn in opposite directions; the number of
// turns changes with the number of teeth. The crank player sets the
// direction and the number of crank turns.

const int = (r, lo, hi) => lo + Math.floor(r() * (hi - lo + 1));
const pick = (r, l) => l[Math.floor(r() * l.length)];
export const TEETH = [10, 12, 15, 16, 20, 24, 30, 36, 40, 48];
export const TURNS = [0.5, 1, 1.5, 2, 3, 4, 6, 8];
export const DIRS = { cw: 'clockwise', acw: 'anticlockwise' };
const COUNT = { easy: 3, normal: 4, hard: 5 };
const NAMES = ['A', 'B', 'C', 'D', 'E'];

// lens turns for one crank turn, and whether the lens turns the same way
export function ratio(gears) {
  let r = 1;
  for (let i = 0; i < gears.length - 1; i++) {
    const driver = gears[i].compound ? gears[i].small : gears[i].teeth;
    const driven = gears[i + 1].compound ? gears[i + 1].big : gears[i + 1].teeth;
    r *= driver / driven;
  }
  return { r, same: (gears.length - 1) % 2 === 0 };
}

export function answer(d) {
  const { r, same } = ratio(d.gears);
  const turns = d.target.turns / r;
  return { turns, dir: same ? d.target.dir : d.target.dir === 'cw' ? 'acw' : 'cw' };
}

function create(level, r) {
  for (let k = 0; k < 2000; k++) {
    const n = COUNT[level];
    const gears = NAMES.slice(0, n).map((name) => ({ name, teeth: pick(r, TEETH) }));
    if (level === 'hard') {
      const c = gears[2];
      c.compound = true;
      c.big = pick(r, TEETH.slice(4));
      c.small = pick(r, TEETH.slice(0, 5));
      delete c.teeth;
    }
    const target = { turns: level === 'hard' ? pick(r, [0.5, 1, 1.5]) : pick(r, [1, 2]), dir: pick(r, ['cw', 'acw']) };
    const d = { gears, target };
    const a = answer(d);
    if (!TURNS.includes(a.turns)) continue;
    // what the blueprint shows: the crank gear's size is missing and one
    // gear is out of date (the tag has the real numbers)
    let replaced = null;
    if (level === 'normal') replaced = { gear: n - 1, part: 'teeth' };
    if (level === 'hard') replaced = { gear: 2, part: 'small' };
    if (replaced) {
      const real = gears[replaced.gear][replaced.part];
      const old = pick(r, TEETH.filter((t) => t !== real));
      const blue = JSON.parse(JSON.stringify(gears));
      blue[replaced.gear][replaced.part] = old;
      // using the old number must give a wrong answer
      if (answer({ gears: blue, target }).turns === a.turns) continue;
      replaced.old = old;
    }
    if (a.turns === target.turns && level !== 'easy') continue; // the sizes must matter
    return { gears, target, replaced, tries: [] };
  }
  throw new Error('gears: no puzzle');
}

function act(d, role, a) {
  if (role !== 'crank' || a.op !== 'crank') return undefined;
  const turns = Number(a.turns);
  if (!TURNS.includes(turns) || !DIRS[a.dir]) return undefined;
  const want = answer(d);
  d.tries.push({ turns, dir: a.dir });
  a.what = `${turns} vòng ${a.dir === 'cw' ? 'theo chiều kim đồng hồ' : 'ngược chiều kim đồng hồ'}`;
  return turns === want.turns && a.dir === want.dir ? 'solved' : 'strike';
}

export const gears = {
  roles: ['diagram', 'crank'],
  strikes: { easy: 4, normal: 3, hard: 3 },
  create,
  act,
};
