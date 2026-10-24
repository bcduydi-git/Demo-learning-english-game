// Puzzle 1 — "Position in the static" (on the Aurora's bridge).
// A station broadcasts its position. Both players hear the same message,
// but static covers different parts for each of them. Numbers like
// thirteen / thirty sound alike; the navigator's chart (grid squares with
// ranges) settles them, but only the radio operator hears the grid square.
// The navigator types the position.

export const NATO = ['Alpha', 'Bravo', 'Charlie', 'Delta', 'Echo', 'Foxtrot', 'Golf', 'Hotel', 'Kilo', 'Lima', 'Mike', 'November', 'Oscar', 'Papa', 'Romeo', 'Sierra', 'Tango', 'Victor', 'Whiskey', 'Yankee', 'Zulu'];

const ONES = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
const TENS = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
export function numberWords(n) {
  if (n < 20) return ONES[n];
  if (n < 100) return TENS[Math.floor(n / 10)] + (n % 10 ? '-' + ONES[n % 10] : '');
  return `${ONES[Math.floor(n / 100)]} hundred${n % 100 ? ' and ' + numberWords(n % 100) : ''}`;
}

// numbers that sound alike: -teen / -ty
export const PAIRS = [[13, 30], [14, 40], [15, 50], [16, 60], [17, 70], [18, 80], [19, 90]];
const pick = (r, l) => l[Math.floor(r() * l.length)];
const int = (r, lo, hi) => lo + Math.floor(r() * (hi - lo + 1));
const other = (pair, v) => (pair[0] === v ? pair[1] : pair[0]);

// who hears each part clearly, by level
const HEAR = {
  easy: { latDeg: ['nav', 'radio'], latMin: ['nav'], lonDeg: ['nav', 'radio'], lonMin: ['nav'], grid: ['radio'], fix: [] },
  normal: { latDeg: ['nav'], latMin: ['radio'], lonDeg: ['nav'], lonMin: ['radio'], grid: ['radio'], fix: ['nav'] },
  hard: { latDeg: ['radio'], latMin: ['nav'], lonDeg: ['nav'], lonMin: ['radio'], grid: ['radio'], fix: ['nav'] },
};

function square(r, used) {
  let g;
  do g = `${pick(r, NATO)} ${int(r, 1, 9)}`; while (used.has(g));
  used.add(g);
  return g;
}
const range10 = (m) => [Math.floor(m / 10) * 10, Math.floor(m / 10) * 10 + 9];

function create(level, r) {
  const latDegPair = pick(r, PAIRS.slice(0, 6));
  const latMinPair = pick(r, PAIRS.slice(0, 3));
  const lonDegPair = pick(r, PAIRS);
  const pos = {
    latDeg: pick(r, latDegPair),
    latMin: pick(r, latMinPair),
    lonDeg: pick(r, lonDegPair),
    lonMin: int(r, 0, 59),
  };
  // the chart: the true square plus look-alikes made from the sound-alike numbers
  const used = new Set();
  const row = (p) => ({ grid: square(r, used), latDeg: p.latDeg, latMin: range10(p.latMin), lonDeg: p.lonDeg, lonMin: range10(p.lonMin) });
  const truth = row(pos);
  const fakes = [
    { ...pos, latDeg: other(latDegPair, pos.latDeg) },
    { ...pos, latMin: other(latMinPair, pos.latMin) },
    { ...pos, lonDeg: other(lonDegPair, pos.lonDeg) },
  ];
  if (level !== 'easy') fakes.push({ ...pos, latMin: other(latMinPair, pos.latMin), lonDeg: other(lonDegPair, pos.lonDeg) });
  const chart = [truth, ...fakes.map(row)].sort(() => r() - 0.5);

  const hear = HEAR[level];
  const parts = [
    { key: 'intro', en: `Attention, all vessels. This is Halcyon Station, calling on channel ${numberWords(int(r, 11, 19))}.`, hear: ['nav', 'radio'] },
    { key: 'latDeg', en: `Our position is ${numberWords(pos.latDeg)} degrees,`, hear: hear.latDeg },
    { key: 'latMin', en: `${numberWords(pos.latMin)} minutes north,`, hear: hear.latMin },
    { key: 'lonDeg', en: `${numberWords(pos.lonDeg)} degrees,`, hear: hear.lonDeg },
  ];
  let wrongMin = pos.lonMin;
  if (level !== 'easy') {
    do wrongMin = int(r, 0, 59); while (Math.floor(wrongMin / 10) === Math.floor(pos.lonMin / 10));
  }
  parts.push(
    { key: 'lonMin', en: `${numberWords(wrongMin)} minutes west.`, hear: hear.lonMin },
    { key: 'grid', en: `Our grid square is ${truth.grid}.`, hear: hear.grid },
  );
  if (level !== 'easy') parts.push({ key: 'fix', en: `Correction: the minutes west are ${numberWords(pos.lonMin)}, not ${numberWords(wrongMin)}.`, hear: hear.fix });
  parts.push({ key: 'outro', en: 'Please approach from the south. Repeat: from the south.', hear: ['nav', 'radio'] });
  return { pos, chart, parts, tries: [] };
}

function act(d, role, a) {
  if (a.op !== 'submit' || role !== 'nav') return undefined;
  const v = a.value || {};
  const got = { latDeg: Number(v.latDeg), latMin: Number(v.latMin), lonDeg: Number(v.lonDeg), lonMin: Number(v.lonMin) };
  d.tries.push(got);
  const ok = Object.keys(got).every((k) => got[k] === d.pos[k]);
  a.what = `${got.latDeg}°${got.latMin}′N ${got.lonDeg}°${got.lonMin}′W`;
  return ok ? 'solved' : 'strike';
}

export const coords = {
  roles: ['nav', 'radio'],
  strikes: { easy: 5, normal: 3, hard: 3 },
  create,
  act,
};

export const fmtPos = (p) => `${p.latDeg}°${String(p.latMin).padStart(2, '0')}′N  ${p.lonDeg}°${String(p.lonMin).padStart(2, '0')}′W`;
