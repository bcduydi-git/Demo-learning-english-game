// Chapter 2 prototype: "The Signal Transmitter".
// One player (the technician) sees the machine but has no manual; the other
// (the reader) has the manual but cannot see the machine. They fix three
// modules together before the time runs out, talking in English.
// Everything here is shared by the server (rules, checking) and the clients
// (what to draw). A new random machine is built for every attempt.

export const TX_LEVELS = {
  easy: { label: 'Dễ', seconds: 480, strikes: 5, wires: [3, 4], keys: 3 },
  normal: { label: 'Vừa', seconds: 360, strikes: 3, wires: [3, 5], keys: 4 },
  hard: { label: 'Hack não', seconds: 270, strikes: 3, wires: [4, 6], keys: 4 },
};
export const TX_PENALTY_MS = 15000;
export const TX_MODULES = ['wires', 'valves', 'keypad'];

// ---------------------------------------------------------------- random
export function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const pick = (r, list) => list[Math.floor(r() * list.length)];
const int = (r, lo, hi) => lo + Math.floor(r() * (hi - lo + 1));

// ---------------------------------------------------------------- machine plate
const LETTERS = 'ABDEFGHKLMNPRSTUVXZ'; // no I/O/C/Q: easy to mix up on a call
const VOWELS = 'AEIOU';
export const LIGHTS = ['PWR', 'AUX', 'SYNC'];
export const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

function makePlate(r) {
  const serial = `${pick(r, LETTERS)}${pick(r, LETTERS)}-${int(r, 1000, 9999)}`;
  const lights = {};
  for (const l of LIGHTS) lights[l] = r() < 0.5;
  const mins = int(r, 0, 24 * 12 - 1) * 5;
  return { serial, lights, time: `${String(Math.floor(mins / 60)).padStart(2, '0')}:${String(mins % 60).padStart(2, '0')}`, day: pick(r, DAYS) };
}
const lastDigit = (m) => Number(m.serial[m.serial.length - 1]);
const hasVowel = (m) => [...m.serial].some((c) => VOWELS.includes(c));

// ---------------------------------------------------------------- module 1: wires
export const COLOURS = ['red', 'blue', 'yellow', 'white', 'black', 'green'];
const count = (w, c) => w.filter((x) => x === c).length;
const first = (w, c) => w.indexOf(c);
const last = (w, c) => w.lastIndexOf(c);

// Wires are numbered from the top (1). The first rule that matches decides.
// cut() returns a 0-based index.
export const WIRE_RULES = {
  3: [
    { en: 'If there is no blue wire, cut the second wire.', vi: 'Nếu không có dây xanh dương nào, cắt dây thứ hai.', test: (w) => count(w, 'blue') === 0, cut: () => 1 },
    { en: 'Otherwise, if the AUX light is on, cut the last wire.', vi: 'Nếu không, nếu đèn AUX đang sáng, cắt dây cuối cùng.', test: (w, m) => m.lights.AUX, cut: (w) => w.length - 1 },
    { en: 'Otherwise, if there is more than one red wire, cut the first red wire.', vi: 'Nếu không, nếu có nhiều hơn một dây đỏ, cắt dây đỏ đầu tiên.', test: (w) => count(w, 'red') > 1, cut: (w) => first(w, 'red') },
    { en: 'Otherwise, cut the first wire.', vi: 'Nếu không, cắt dây thứ nhất.', test: () => true, cut: () => 0 },
  ],
  4: [
    { en: 'If the last digit of the serial number is even and there are at least two yellow wires, cut the third wire.', vi: 'Nếu chữ số cuối của số sê-ri là số chẵn và có ít nhất hai dây vàng, cắt dây thứ ba.', test: (w, m) => lastDigit(m) % 2 === 0 && count(w, 'yellow') >= 2, cut: () => 2 },
    { en: 'Otherwise, if the first wire is white, cut the last wire.', vi: 'Nếu không, nếu dây thứ nhất màu trắng, cắt dây cuối cùng.', test: (w) => w[0] === 'white', cut: (w) => w.length - 1 },
    { en: 'Otherwise, if there are no black wires, cut the second wire.', vi: 'Nếu không, nếu không có dây đen nào, cắt dây thứ hai.', test: (w) => count(w, 'black') === 0, cut: () => 1 },
    { en: 'Otherwise, cut the last black wire.', vi: 'Nếu không, cắt dây đen cuối cùng.', test: () => true, cut: (w) => last(w, 'black') },
  ],
  5: [
    { en: 'If there is exactly one green wire, cut it — unless the SYNC light is on, in which case cut the first wire.', vi: 'Nếu có đúng một dây xanh lá, cắt dây đó — trừ khi đèn SYNC đang sáng, khi đó cắt dây thứ nhất.', test: (w) => count(w, 'green') === 1, cut: (w, m) => (m.lights.SYNC ? 0 : first(w, 'green')) },
    { en: 'Otherwise, if the serial number contains a vowel (A, E, I, O or U), cut the fourth wire.', vi: 'Nếu không, nếu số sê-ri có chứa nguyên âm (A, E, I, O hoặc U), cắt dây thứ tư.', test: (w, m) => hasVowel(m), cut: () => 3 },
    { en: 'Otherwise, if there are more red wires than blue wires, cut the last red wire.', vi: 'Nếu không, nếu số dây đỏ nhiều hơn số dây xanh dương, cắt dây đỏ cuối cùng.', test: (w) => count(w, 'red') > count(w, 'blue'), cut: (w) => last(w, 'red') },
    { en: 'Otherwise, cut the third wire.', vi: 'Nếu không, cắt dây thứ ba.', test: () => true, cut: () => 2 },
  ],
  6: [
    { en: 'If there are no yellow wires, cut the fifth wire.', vi: 'Nếu không có dây vàng nào, cắt dây thứ năm.', test: (w) => count(w, 'yellow') === 0, cut: () => 4 },
    { en: 'Otherwise, if the last wire is the same colour as the first wire, cut the first wire.', vi: 'Nếu không, nếu dây cuối cùng cùng màu với dây thứ nhất, cắt dây thứ nhất.', test: (w) => w[0] === w[w.length - 1], cut: () => 0 },
    { en: 'Otherwise, if the PWR light is off and there is at least one white wire, cut the last white wire.', vi: 'Nếu không, nếu đèn PWR đang tắt và có ít nhất một dây trắng, cắt dây trắng cuối cùng.', test: (w, m) => !m.lights.PWR && count(w, 'white') >= 1, cut: (w) => last(w, 'white') },
    { en: 'Otherwise, cut the fourth wire.', vi: 'Nếu không, cắt dây thứ tư.', test: () => true, cut: () => 3 },
  ],
};

export function wireAnswer(wires, plate) {
  const rules = WIRE_RULES[wires.length];
  for (let i = 0; i < rules.length; i++) {
    if (rules[i].test(wires, plate)) return { index: rules[i].cut(wires, plate), rule: i };
  }
  return null;
}

function makeWires(r, level, plate) {
  const [lo, hi] = TX_LEVELS[level].wires;
  const n = int(r, lo, hi);
  const palette = n <= 4 ? COLOURS.slice(0, 5) : COLOURS;
  // aim at a random rule so every rule in the manual comes up over time
  const target = int(r, 0, WIRE_RULES[n].length - 1);
  let w;
  for (let k = 0; k < 200; k++) {
    w = Array.from({ length: n }, () => pick(r, palette));
    if (wireAnswer(w, plate).rule === target) break;
  }
  return { colours: w, cut: [] };
}

// ---------------------------------------------------------------- module 2: valves
export const VALVES = ['INTAKE', 'RELEASE', 'BYPASS'];
export const SHIFTS = [
  { name: 'Morning shift', vi: 'Ca sáng', from: '06:00', to: '13:59', lo: 40, hi: 55 },
  { name: 'Afternoon shift', vi: 'Ca chiều', from: '14:00', to: '21:59', lo: 50, hi: 65 },
  { name: 'Night shift', vi: 'Ca đêm', from: '22:00', to: '05:59', lo: 30, hi: 45 },
];
export const BAR_PER_TURN = 5;
const minutes = (t) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3));

export function shiftFor(plate, level) {
  if (level === 'hard' && (plate.day === 'Saturday' || plate.day === 'Sunday')) return SHIFTS[2];
  const m = minutes(plate.time);
  if (m >= 360 && m < 840) return SHIFTS[0];
  if (m >= 840 && m < 1320) return SHIFTS[1];
  return SHIFTS[2];
}

// -> { valve: 'RELEASE' | 'INTAKE' | 'BYPASS' | null, turns }
export function valveAnswer(pressure, plate, level) {
  const s = shiftFor(plate, level);
  if (pressure >= s.lo && pressure <= s.hi) return { valve: null, turns: 0 };
  if (pressure > s.hi) {
    const valve = level !== 'easy' && !plate.lights.PWR ? 'BYPASS' : 'RELEASE';
    return { valve, turns: Math.ceil((pressure - s.hi) / BAR_PER_TURN) };
  }
  return { valve: 'INTAKE', turns: Math.ceil((s.lo - pressure) / BAR_PER_TURN) };
}

export function valveManual(level) {
  const lines = [
    { en: 'Step 1. Read the station clock and find the shift on duty. Each shift has its own normal pressure range.', vi: 'Bước 1. Đọc đồng hồ của trạm và tìm ca đang trực. Mỗi ca có khoảng áp suất bình thường riêng.' },
  ];
  if (level === 'hard') lines.push({ en: 'On Saturdays and Sundays, the night shift range applies all day.', vi: 'Vào thứ Bảy và Chủ nhật, khoảng của ca đêm áp dụng cả ngày.' });
  lines.push(
    { en: 'Step 2. If the pressure is inside the normal range (limits included), leave every valve at 0 and press CONFIRM.', vi: 'Bước 2. Nếu áp suất nằm trong khoảng bình thường (tính cả hai giới hạn), để mọi van ở 0 và bấm CONFIRM.' },
    { en: 'Step 3. If the pressure is too high, open the RELEASE valve. If it is too low, open the INTAKE valve.', vi: 'Bước 3. Nếu áp suất quá cao, mở van RELEASE. Nếu quá thấp, mở van INTAKE.' },
  );
  if (level !== 'easy') lines.push({ en: 'Exception: if the PWR light is off, use the BYPASS valve instead of the RELEASE valve.', vi: 'Ngoại lệ: nếu đèn PWR đang tắt, dùng van BYPASS thay vì van RELEASE.' });
  lines.push({ en: `Step 4. Each turn changes the pressure by ${BAR_PER_TURN} bar. Use the smallest number of turns that brings the pressure back inside the range. Open only one valve, then press CONFIRM.`, vi: `Bước 4. Mỗi vòng xoay làm áp suất thay đổi ${BAR_PER_TURN} bar. Dùng số vòng ít nhất để đưa áp suất về trong khoảng. Chỉ mở một van, rồi bấm CONFIRM.` });
  return lines;
}

function makeValves(r, plate, level) {
  const s = shiftFor(plate, level);
  const roll = r();
  let p;
  if (roll < 0.15) p = int(r, s.lo, s.hi);
  else if (roll < 0.6) p = s.hi + int(r, 1, 24);
  else p = s.lo - int(r, 1, Math.min(24, s.lo - 5));
  return { pressure: p, done: false };
}

// ---------------------------------------------------------------- module 3: keypad
// Some words sound the same but are spelled differently. The reader must
// ask for spelling to pick the right column.
export const KEY_COLUMNS = [
  ['WAIT', 'SHIFT', 'SEA', 'VALVE', 'HOUR', 'BRAKE', 'SIGNAL'],
  ['SIGNAL', 'WEIGHT', 'SEE', 'SHIFT', 'DELAY', 'OUR', 'BREAK'],
  ['DELAY', 'RIGHT', 'SAIL', 'VALVE', 'NOTIFY', 'PIECE', 'HERE'],
  ['NOTIFY', 'WRITE', 'SALE', 'PEACE', 'REPAIR', 'HEAR', 'WAIT'],
  ['REPAIR', 'WEEK', 'PLANE', 'SEE', 'STAFF', 'MAIL', 'RIGHT'],
  ['STAFF', 'WEAK', 'PLAIN', 'MALE', 'SEA', 'HOUR', 'SALE'],
];
export const SOUND_ALIKE = [['WAIT', 'WEIGHT'], ['SEA', 'SEE'], ['HOUR', 'OUR'], ['BRAKE', 'BREAK'], ['RIGHT', 'WRITE'], ['SAIL', 'SALE'], ['PIECE', 'PEACE'], ['HERE', 'HEAR'], ['WEEK', 'WEAK'], ['PLANE', 'PLAIN'], ['MAIL', 'MALE']];
const soundsLike = (w) => SOUND_ALIKE.some((p) => p.includes(w));
export const KEY_WORDS_VI = {
  WAIT: 'chờ', WEIGHT: 'cân nặng', SEA: 'biển', SEE: 'nhìn thấy', HOUR: 'giờ (60 phút)', OUR: 'của chúng ta', BRAKE: 'phanh', BREAK: 'giờ nghỉ / làm vỡ',
  RIGHT: 'bên phải / đúng', WRITE: 'viết', SAIL: 'cánh buồm', SALE: 'đợt giảm giá', PIECE: 'mảnh', PEACE: 'hoà bình', HERE: 'ở đây', HEAR: 'nghe',
  WEEK: 'tuần', WEAK: 'yếu', PLANE: 'máy bay', PLAIN: 'đơn giản / đồng bằng', MAIL: 'thư', MALE: 'nam giới',
  SHIFT: 'ca làm việc', VALVE: 'van', SIGNAL: 'tín hiệu', DELAY: 'trì hoãn', NOTIFY: 'thông báo', REPAIR: 'sửa chữa', STAFF: 'nhân viên',
};

export function keypadColumn(words) {
  const cols = KEY_COLUMNS.map((c, i) => i).filter((i) => words.every((w) => KEY_COLUMNS[i].includes(w)));
  return cols.length === 1 ? cols[0] : -1;
}
export function keypadOrder(words) {
  const c = keypadColumn(words);
  return [...words].sort((a, b) => KEY_COLUMNS[c].indexOf(a) - KEY_COLUMNS[c].indexOf(b));
}

function makeKeypad(r, level) {
  const k = TX_LEVELS[level].keys;
  for (let tries = 0; tries < 200; tries++) {
    const col = KEY_COLUMNS[int(r, 0, KEY_COLUMNS.length - 1)];
    const words = [...col].sort(() => r() - 0.5).slice(0, k);
    if (keypadColumn(words) < 0) continue;
    const alike = words.filter(soundsLike).length;
    if (level === 'hard' && alike < 2) continue;
    if (level === 'normal' && alike < 1) continue;
    return { words, pressed: [] };
  }
  return { words: KEY_COLUMNS[0].slice(0, k), pressed: [] };
}

// ---------------------------------------------------------------- whole machine
export function newMachine(level = 'normal', seed = Math.floor(Math.random() * 2 ** 31)) {
  const r = rng(seed);
  const plate = makePlate(r);
  return {
    seed,
    plate,
    wires: makeWires(r, level, plate),
    valves: makeValves(r, plate, level),
    keypad: makeKeypad(r, level),
    solved: { wires: false, valves: false, keypad: false },
  };
}

export function newTx(prev) {
  const level = (prev && TX_LEVELS[prev.level] && prev.level) || 'normal';
  return {
    status: 'setup', // setup | run | won | lost
    level,
    tech: (prev && prev.tech) || 'p1', // who stands at the machine
    ready: {},
    left: TX_LEVELS[level].seconds * 1000,
    strikes: 0,
    machine: null,
    attempts: (prev && prev.attempts) || 0,
    wins: (prev && prev.wins) || 0,
    lostWhy: '',
  };
}

// ---------------------------------------------------------------- actions
// Returns events for the clients. Only the technician can touch the machine.
export function txAction(state, slot, a) {
  const tx = state.tx;
  const ev = [];
  if (!tx) return ev;
  const L = TX_LEVELS[tx.level];
  const strike = (module, what) => {
    tx.strikes += 1;
    tx.left = Math.max(0, tx.left - TX_PENALTY_MS);
    ev.push({ e: 'tx_strike', module, what, by: slot });
    if (tx.strikes >= L.strikes) { tx.status = 'lost'; tx.lostWhy = 'strikes'; ev.push({ e: 'tx_lost', why: 'strikes' }); }
  };
  const solve = (module) => {
    tx.machine.solved[module] = true;
    ev.push({ e: 'tx_solved', module, by: slot });
    if (TX_MODULES.every((m) => tx.machine.solved[m])) { tx.status = 'won'; tx.wins += 1; ev.push({ e: 'tx_won' }); }
  };

  switch (a.type) {
    case 'tx_level':
      if (tx.status === 'setup' && TX_LEVELS[a.level]) { tx.level = a.level; tx.left = TX_LEVELS[a.level].seconds * 1000; tx.ready = {}; }
      break;
    case 'tx_swap':
      if (tx.status !== 'run') { tx.tech = tx.tech === 'p1' ? 'p2' : 'p1'; tx.ready = {}; }
      break;
    case 'tx_ready':
      if (tx.status === 'setup') {
        tx.ready[slot] = true;
        const need = ['p1', 'p2'].filter((s) => state.players[s].connected);
        if (need.every((s) => tx.ready[s])) {
          tx.machine = newMachine(tx.level, a.seed);
          tx.status = 'run';
          tx.left = L.seconds * 1000;
          tx.strikes = 0;
          tx.attempts += 1;
          ev.push({ e: 'tx_start' });
        }
      }
      break;
    case 'tx_again': // after a result: back to setup with a new machine next time
      if (tx.status === 'won' || tx.status === 'lost') Object.assign(tx, newTx(tx));
      break;
    case 'tx_cut': {
      if (tx.status !== 'run' || slot !== tx.tech) break;
      const w = tx.machine.wires;
      const i = Number(a.index);
      if (tx.machine.solved.wires || !(i >= 0 && i < w.colours.length) || w.cut.includes(i)) break;
      w.cut.push(i);
      if (i === wireAnswer(w.colours, tx.machine.plate).index) solve('wires');
      else strike('wires', `dây ${i + 1}`);
      break;
    }
    case 'tx_valves': {
      if (tx.status !== 'run' || slot !== tx.tech || tx.machine.solved.valves) break;
      const want = valveAnswer(tx.machine.valves.pressure, tx.machine.plate, tx.level);
      const set = a.set || {};
      const opened = VALVES.filter((v) => Number(set[v]) > 0);
      const ok = want.valve === null
        ? opened.length === 0
        : opened.length === 1 && opened[0] === want.valve && Number(set[want.valve]) === want.turns;
      if (ok) solve('valves');
      else strike('valves', opened.map((v) => `${v} ${set[v]}`).join(', ') || 'không mở van');
      break;
    }
    case 'tx_key': {
      if (tx.status !== 'run' || slot !== tx.tech || tx.machine.solved.keypad) break;
      const k = tx.machine.keypad;
      if (!k.words.includes(a.word) || k.pressed.includes(a.word)) break;
      const order = keypadOrder(k.words);
      if (order[k.pressed.length] === a.word) {
        k.pressed.push(a.word);
        ev.push({ e: 'tx_key_ok', word: a.word });
        if (k.pressed.length === k.words.length) solve('keypad');
      } else {
        k.pressed = [];
        strike('keypad', a.word);
      }
      break;
    }
    default:
      break;
  }
  return ev;
}

// Time runs only while the round is on.
export function txTick(state, dt) {
  const tx = state.tx;
  if (!tx || tx.status !== 'run') return { ev: [], changed: false };
  const before = Math.ceil(tx.left / 1000);
  tx.left = Math.max(0, tx.left - dt * 1000);
  const ev = [];
  if (tx.left <= 0) { tx.status = 'lost'; tx.lostWhy = 'time'; ev.push({ e: 'tx_lost', why: 'time' }); }
  return { ev, changed: ev.length > 0 || Math.ceil(tx.left / 1000) !== before };
}

// ---------------------------------------------------------------- learning
// Words worth keeping from this machine (TOEIC-style), shown in the manual
// glossary and on the result screen.
export const TX_GLOSSARY = [
  ['valve', 'van'], ['pressure', 'áp suất'], ['release', 'xả ra'], ['intake', 'nạp vào'], ['shift', 'ca làm việc'],
  ['on duty', 'đang trực'], ['range', 'khoảng (giá trị)'], ['limits included', 'tính cả hai giới hạn'], ['exception', 'ngoại lệ'],
  ['instead of', 'thay vì'], ['unless', 'trừ khi'], ['otherwise', 'nếu không thì'], ['in which case', 'khi đó, trong trường hợp đó'],
  ['at least', 'ít nhất'], ['exactly', 'đúng, chính xác'], ['serial number', 'số sê-ri'], ['indicator light', 'đèn báo'],
  ['digit', 'chữ số'], ['even / odd', 'chẵn / lẻ'], ['vowel', 'nguyên âm'], ['spell', 'đánh vần'], ['the smallest number of', 'số … ít nhất'],
];

// Sentences each side will need on the call.
export const TX_PHRASES = {
  reader: [
    ['How many wires are there?', 'Có bao nhiêu dây?'],
    ['What colour is the last wire?', 'Dây cuối cùng màu gì?'],
    ['Is the AUX light on or off?', 'Đèn AUX sáng hay tắt?'],
    ["What's the last digit of the serial number?", 'Chữ số cuối của số sê-ri là gì?'],
    ['What time does the station clock show?', 'Đồng hồ của trạm chỉ mấy giờ?'],
    ["What's the pressure reading?", 'Đồng hồ áp suất chỉ bao nhiêu?'],
    ['Could you spell that, please?', 'Bạn đánh vần giúp mình được không?'],
    ['Read me the words from left to right.', 'Đọc cho mình các từ từ trái sang phải.'],
  ],
  tech: [
    ['There are five wires.', 'Có năm dây.'],
    ['From the top: red, blue, blue, white.', 'Từ trên xuống: đỏ, xanh dương, xanh dương, trắng.'],
    ['The PWR light is off.', 'Đèn PWR đang tắt.'],
    ['The serial number is K-R-3-5-1-8.', 'Số sê-ri là K-R-3-5-1-8.'],
    ["It's twenty past two in the afternoon.", 'Bây giờ là hai giờ hai mươi chiều.'],
    ['The gauge reads seventy-two bar.', 'Đồng hồ chỉ bảy mươi hai bar.'],
    ["It's spelled W-E-I-G-H-T.", 'Từ đó đánh vần là W-E-I-G-H-T.'],
    ['Which one should I press first?', 'Mình nên bấm cái nào trước?'],
  ],
};
