// Which browser voice each character speaks with. Pure (no DOM), so it can be
// unit tested. The browser gives a different set of English voices on every
// machine (Chrome on Windows: about 6, Edge: dozens of "Natural" ones), so the
// voices are shared out once per machine: each character gets its own voice
// when there are enough, and the closest same-gender one otherwise, with a
// pitch/rate shift so two characters on one voice still sound apart.

// Characters in the order they choose (the ones heard most choose first).
export const CAST = {
  lac: { label: 'Lắc', gender: 'm', pitch: 1, rate: 1, pref: ['guy', 'ryan', 'google uk english male', 'david', 'daniel', 'alex'] },
  tim: { label: 'Tím', gender: 'f', pitch: 1.1, rate: 1, pref: ['aria', 'jenny', 'zira', 'samantha', 'google us english', 'ava'] },
  keeper: { label: 'Người gác đèn', gender: 'f', pitch: 0.95, rate: 0.92, pref: ['sonia', 'libby', 'google uk english female', 'hazel', 'susan', 'moira', 'karen'] },
  captain: { label: 'Thuyền trưởng', gender: 'm', pitch: 0.9, rate: 0.98, pref: ['ryan', 'thomas', 'george', 'mark', 'christopher', 'daniel', 'google uk english male'] },
  pip: { label: 'Pip (con vẹt)', gender: 'f', pitch: 1.8, rate: 1.08, pref: ['ana', 'google us english', 'samantha', 'zira', 'aria'] },
  narr: { label: 'Người dẫn & từ vựng', gender: '', pitch: 1, rate: 1, pref: ['emma', 'jenny', 'google us english', 'aria', 'samantha'] },
  storm: { label: 'Cơn bão', gender: 'm', pitch: 0.3, rate: 0.85, pref: ['eric', 'brian', 'david', 'mark', 'male'] },
};

const FEMALE = /female|woman|zira|aria|jenny|samantha|libby|sonia|hazel|susan|karen|moira|michelle|emma|ava|allison|victoria|tessa|fiona|serena|kate|natasha|clara|sara|catherine|heather|linda|ana\b|emily|joanna|kimberly|salli|ivy|amy|olivia|nicole|veena|isla|maisie|molly|neerja|yan|leah|elsa|google us english/;
const MALE = /\bmale|\bman\b|david|mark|guy|ryan|daniel|alex|george|james|fred|tom\b|thomas|christopher|eric|andrew|brian|william|liam|oliver|aaron|rishi|steffan|roger|davis|tony|jason|matthew|joey|justin|kevin|russell|connor|prabhat|mitchell|luke|ralph|albert|bruce|junior/;

export function genderOf(name) {
  const n = name.toLowerCase();
  // "Google UK English Male" also contains "english" + "male" inside "female"
  if (/female/.test(n)) return 'f';
  if (MALE.test(n)) return 'm';
  if (FEMALE.test(n)) return 'f';
  return '';
}

export function quality(v) {
  const n = v.name.toLowerCase();
  let s = 0;
  if (/natural|online|neural|premium|enhanced/.test(n)) s += 6;
  if (/^en-us/i.test(v.lang)) s += 1;
  else if (/^en-gb/i.test(v.lang)) s += 0.5;
  return s;
}

// voices: [{ name, lang }], overrides: { character: voiceName }
// -> { character: { voice, pitch, rate } }   (voice null when none at all)
export function allocate(voices, overrides = {}) {
  const out = {};
  const uses = new Map();
  const take = (who, v) => {
    const n = uses.get(v.name) || 0;
    uses.set(v.name, n + 1);
    const c = CAST[who];
    // the 2nd, 3rd... character on the same voice is shifted further away
    const shift = [1, 0.82, 1.2, 0.7, 1.35][Math.min(n, 4)];
    const pitch = who === 'pip' || who === 'storm' ? c.pitch : Math.max(0.1, Math.min(2, c.pitch * shift));
    out[who] = { voice: v, pitch, rate: c.rate * (n ? 0.96 + 0.04 * (n % 2) : 1), shared: n > 0 };
  };
  // the player's own choices first, so the rest avoid them
  for (const who of Object.keys(CAST)) {
    const v = overrides[who] && voices.find((x) => x.name === overrides[who]);
    if (v) { out[who] = null; take(who, v); out[who].fixed = true; }
  }
  for (const who of Object.keys(CAST)) {
    if (out[who]) continue;
    if (!voices.length) { out[who] = { voice: null, pitch: CAST[who].pitch, rate: CAST[who].rate, shared: false }; continue; }
    const c = CAST[who];
    const score = (v) => {
      const n = v.name.toLowerCase();
      let s = quality(v);
      c.pref.forEach((p, i) => { if (n.includes(p)) s = Math.max(s, quality(v) + 10 - i * 0.6); });
      const g = genderOf(v.name);
      if (c.gender && g === c.gender) s += 20;
      else if (c.gender && g && g !== c.gender) s -= 30;
      s -= (uses.get(v.name) || 0) * 25; // strongly prefer a voice nobody has yet
      return s;
    };
    const best = [...voices].sort((a, b) => score(b) - score(a))[0];
    take(who, best);
  }
  return out;
}
