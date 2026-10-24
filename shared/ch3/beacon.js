// Chapter 3, puzzle 4 (finale) — "Light for the ships".
// A storm, and ships heading for the reef. The lookout watches each ship
// through the binoculars (an English description, its flag, distance and
// visibility) but has no rule book. The keeper has the light code book and
// the lamp, but cannot see the ships. For each ship the keeper sends the
// right colour and flash pattern. After the second ship the two swap
// places. When every ship is safe, both press LIGHT together.

const int = (r, lo, hi) => lo + Math.floor(r() * (hi - lo + 1));
const pick = (r, l) => l[Math.floor(r() * l.length)];
export const COLOURS = ['white', 'green', 'yellow', 'red'];
export const FLAGS = ['blue', 'white', 'yellow', 'orange'];
export const LIGHT_WINDOW_MS = 4000;
const SECONDS = { easy: 480, normal: 360, hard: 300 };
const SHIPS = { easy: 3, normal: 3, hard: 4 };

export const TYPES = {
  fishing: { colour: 'white', flashes: ['S', 'S'], descs: [
    'A small wooden boat with nets hanging over the side.',
    'A little boat. Two people on board are pulling in a fishing net.',
    'A tiny boat with a short mast and a pile of nets at the back.',
  ] },
  passenger: { colour: 'green', flashes: ['L'], descs: [
    'A big white ship with rows of windows. People are standing on the deck.',
    'A tall ship with many lights in its windows and lifeboats along the side.',
    'A large ship with several decks. Someone on deck is waving at us.',
  ] },
  cargo: { colour: 'yellow', flashes: ['S', 'S', 'S'], descs: [
    'A long, heavy ship loaded with colourful containers.',
    'A huge, slow ship. Its deck is covered with metal boxes stacked high.',
    'A very long ship with cranes on deck and containers in rows.',
  ] },
};

// the code book, by level (what the keeper reads)
export function codeBook(level) {
  const rules = [
    { en: 'Fishing boats: show a WHITE light with two short flashes.', vi: 'Thuyền đánh cá: đèn TRẮNG, hai chớp ngắn.' },
    { en: 'Passenger ships: show a GREEN light with one long flash.', vi: 'Tàu chở khách: đèn XANH LÁ, một chớp dài.' },
    { en: 'Cargo ships: show a YELLOW light with three short flashes.', vi: 'Tàu chở hàng: đèn VÀNG, ba chớp ngắn.' },
  ];
  if (level !== 'easy') {
    rules.push(
      { en: 'If visibility is below 2 km, add one long flash at the end.', vi: 'Nếu tầm nhìn dưới 2 km, thêm một chớp dài ở cuối.' },
      { en: 'If the ship is closer than 1 nautical mile, use a RED light instead (reef warning) — unless it flies a blue flag, which means a pilot is on board.', vi: 'Nếu tàu ở gần hơn 1 hải lý, dùng đèn ĐỎ thay vào đó (cảnh báo rạn đá) — trừ khi tàu treo cờ xanh dương, nghĩa là có hoa tiêu trên tàu.' },
    );
  }
  if (level === 'hard') rules.push({ en: 'Ships flying a yellow flag use short flashes only: change every long flash into two short ones. Do this last.', vi: 'Tàu treo cờ vàng chỉ dùng chớp ngắn: đổi mỗi chớp dài thành hai chớp ngắn. Làm bước này sau cùng.' });
  return rules;
}
export const RECOGNISE = [
  { en: 'Fishing boats are small and usually carry nets.', vi: 'Thuyền đánh cá nhỏ và thường mang lưới.' },
  { en: 'Passenger ships are large, with many windows, lifeboats and people on deck.', vi: 'Tàu chở khách lớn, nhiều cửa sổ, có xuồng cứu sinh và người trên boong.' },
  { en: 'Cargo ships are very long and carry containers.', vi: 'Tàu chở hàng rất dài và chở công-te-nơ.' },
];

export function signalFor(ship, level) {
  const T = TYPES[ship.type];
  let colour = T.colour;
  let flashes = [...T.flashes];
  if (level !== 'easy') {
    if (ship.visibility < 2) flashes.push('L');
    if (ship.distance < 1 && ship.flag !== 'blue') colour = 'red';
  }
  if (level === 'hard' && ship.flag === 'yellow') flashes = flashes.flatMap((f) => (f === 'L' ? ['S', 'S'] : [f]));
  return { colour, flashes };
}

function ship(r, level, i) {
  const type = pick(r, Object.keys(TYPES));
  const s = {
    type,
    desc: pick(r, TYPES[type].descs),
    flag: pick(r, FLAGS),
    distance: Math.round((0.4 + r() * 3.2) * 10) / 10,
    visibility: Math.round((0.8 + r() * 5) * 10) / 10,
  };
  // make the special rules come up: one close ship, one in fog
  if (level !== 'easy' && i === 0) s.visibility = Math.round((0.8 + r() * 1) * 10) / 10;
  if (level !== 'easy' && i === 1) s.distance = Math.round((0.3 + r() * 0.6) * 10) / 10;
  if (level === 'hard' && i === 2) { s.flag = 'yellow'; s.visibility = 1.5; }
  return s;
}

function create(level, r) {
  const ships = [];
  for (let i = 0; i < SHIPS[level]; i++) ships.push(ship(r, level, i));
  return { ships, cur: 0, swapAt: 2, light: { lookout: 0, keeper: 0 }, left: SECONDS[level] * 1000, sent: [] };
}

// who does what right now (the two players swap after the second ship)
export function dutyOf(d, role) {
  const swapped = d.cur >= d.swapAt;
  return swapped ? (role === 'lookout' ? 'keeper' : 'lookout') : role;
}

function act(d, role, a, ev, level, now = Date.now()) {
  if (a.op === 'signal' && d.cur < d.ships.length && dutyOf(d, role) === 'keeper') {
    const want = signalFor(d.ships[d.cur], level);
    const got = { colour: a.colour, flashes: Array.isArray(a.flashes) ? a.flashes.filter((f) => f === 'S' || f === 'L').slice(0, 8) : [] };
    if (!COLOURS.includes(got.colour)) return undefined;
    d.sent.push({ ship: d.cur, ...got });
    a.what = `tàu ${d.cur + 1}: đèn ${got.colour} ${got.flashes.join('') || '(không chớp)'}`;
    if (got.colour !== want.colour || got.flashes.join('') !== want.flashes.join('')) {
      d.left = Math.max(0, d.left - 15000);
      return 'strike';
    }
    d.cur += 1;
    ev.push({ e: 'beacon_ship', n: d.cur, swap: d.cur === d.swapAt });
    return 'ok';
  }
  if (a.op === 'light' && d.cur >= d.ships.length && (role === 'lookout' || role === 'keeper')) {
    d.light[role] = now;
    ev.push({ e: 'beacon_light', side: role });
    const other = d.light[role === 'lookout' ? 'keeper' : 'lookout'];
    return other && now - other <= LIGHT_WINDOW_MS ? 'solved' : 'ok';
  }
  return undefined;
}

export const beacon = {
  roles: ['lookout', 'keeper'],
  strikes: { easy: 5, normal: 4, hard: 4 },
  create,
  act,
  timed: true,
};
