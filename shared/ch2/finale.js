// Puzzle 6 — "The last signal" (chapter 2 finale).
// Two transmitter units must run before the storm hits. Each player works
// one unit and holds the manual for the OTHER unit, so the reading goes
// both ways:
//   phase 1  A works the wires of the main unit, B reads the wire rules
//   phase 2  roles swap: B works the valves of the backup unit, A reads
//   phase 3  both at once: A types a phrase from memory into the voice lock
//            (B holds the clue), while B works the keypad (A holds the
//            columns)
//   phase 4  both press SEND within a few seconds of each other
// Against the clock; every mistake costs a strike and time.

import { newMachine, TX_PENALTY_MS } from '../transmitter.js';
import { normalize } from '../phrases.js';
import { cutWire, setValves, pressKey } from './machine.js';

export const SEND_WINDOW_MS = 4000;
const SECONDS = { easy: 540, normal: 420, hard: 330 };

// phrases met in chapters 1 and 2, to type from memory
export const RECALL = [
  { id: 'say_again', answers: ['say that again please', 'say that again', 'say it again please', 'could you say that again please', 'could you say that again'], vi: 'Câu nhờ người kia nói lại lần nữa (lịch sự).', en: "What you say, politely, when you didn't catch something and want to hear it again.", hint: 'S _ _ _   t _ _ _   a _ _ _ _ ,   p _ _ _ _ _ .' },
  { id: 'spell', answers: ['could you spell that please', 'could you spell that', 'can you spell that please', 'can you spell that'], vi: 'Câu nhờ người kia đánh vần một từ.', en: 'A polite question: you want your partner to say a word letter by letter.', hint: 'C _ _ _ _   y _ _   s _ _ _ _   t _ _ _ ,   p _ _ _ _ _ ?' },
  { id: 'door', answers: ['hold on help is coming'], vi: 'Lời của người gác đèn đã mở cửa hải đăng.', en: "The keeper's words that opened the lighthouse door.", hint: 'H _ _ _   o _ ,   h _ _ _   i _   c _ _ _ _ _ .' },
  { id: 'hear', answers: ['yes i can hear you', 'i can hear you'], vi: 'Câu trả lời khi nghe rõ qua radio.', en: 'Your answer on the radio when someone asks "Can you hear me?"', hint: 'Y _ _ ,   I   c _ _   h _ _ _   y _ _ .' },
  { id: 'help', answers: ['we need help'], vi: 'Câu báo với đội cứu hộ rằng mình đang gặp nạn.', en: 'Three words you say on the radio when you are in trouble.', hint: 'W _   n _ _ _   h _ _ _ .' },
  { id: 'which', answers: ['which one'], vi: 'Câu hỏi khi có nhiều thứ và không biết chọn cái nào.', en: "Two words you ask when there are several things and you aren't sure.", hint: 'W _ _ _ _   o _ _ ?' },
  { id: 'watch', answers: ['watch out', 'look out'], vi: 'Câu hét lên để cảnh báo nguy hiểm.', en: 'Two words you shout when someone is in danger.', hint: 'W _ _ _ _   o _ _ !' },
  { id: 'keep', answers: ['keep going', 'go on'], vi: 'Lệnh bảo người kia cứ đi tiếp, đừng dừng.', en: 'Two words that tell someone not to stop.', hint: 'K _ _ _   g _ _ _ _ .' },
];

function create(level, r) {
  const seed = () => Math.floor(r() * 2 ** 31);
  const main = newMachine(level, seed());
  const backup = newMachine(level, seed());
  return {
    phase: 1,
    main: { plate: main.plate, wires: main.wires },
    backup: { plate: backup.plate, valves: backup.valves, keypad: backup.keypad },
    recall: { id: RECALL[Math.floor(r() * RECALL.length)].id, tries: [] },
    solved: { wires: false, valves: false, recall: false, keypad: false },
    send: { a: 0, b: 0 },
    left: SECONDS[level] * 1000,
  };
}

export const recallOf = (d) => RECALL.find((x) => x.id === d.recall.id);

function act(d, role, a, ev, level, now = Date.now()) {
  let ok;
  let part;
  if (a.op === 'cut' && role === 'a' && d.phase === 1) { part = 'wires'; ok = cutWire(d.main.wires, d.main.plate, a.index); a.what = `dây ${Number(a.index) + 1}`; }
  if (a.op === 'valves' && role === 'b' && d.phase === 2) { part = 'valves'; ok = setValves(d.backup.valves.pressure, d.backup.plate, level, a.set); a.what = 'van áp suất'; }
  if (a.op === 'recall' && role === 'a' && d.phase === 3 && !d.solved.recall) {
    part = 'recall';
    const t = normalize(a.text);
    if (!t) return undefined;
    d.recall.tries.push(String(a.text).slice(0, 60));
    ok = recallOf(d).answers.includes(t);
    a.what = `khoá giọng nói ("${String(a.text).slice(0, 40)}")`;
  }
  if (a.op === 'key' && role === 'b' && d.phase === 3 && !d.solved.keypad) {
    part = 'keypad';
    ok = pressKey(d.backup.keypad, a.word);
    a.what = `phím ${a.word}`;
    if (ok && d.backup.keypad.pressed.length < d.backup.keypad.words.length) { ev.push({ e: 'tx_key_ok' }); return 'ok'; }
  }
  if (a.op === 'send' && d.phase === 4 && (role === 'a' || role === 'b')) {
    d.send[role] = now;
    ev.push({ e: 'finale_send', side: role });
    const other = d.send[role === 'a' ? 'b' : 'a'];
    return other && now - other <= SEND_WINDOW_MS ? 'solved' : 'ok';
  }
  if (ok === undefined) return undefined;
  if (!ok) { d.left = Math.max(0, d.left - TX_PENALTY_MS); return 'strike'; }
  d.solved[part] = true;
  ev.push({ e: 'pz_part', part });
  const before = d.phase;
  if (d.phase === 1) d.phase = 2;
  else if (d.phase === 2) d.phase = 3;
  else if (d.phase === 3 && d.solved.recall && d.solved.keypad) d.phase = 4;
  if (d.phase !== before) ev.push({ e: 'finale_phase', phase: d.phase });
  return 'ok';
}

export const finale = {
  roles: ['a', 'b'],
  strikes: { easy: 6, normal: 4, hard: 4 },
  create,
  act,
  timed: true,
};
