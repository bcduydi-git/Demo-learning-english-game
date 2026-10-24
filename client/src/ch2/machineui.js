// Pieces of the signal transmitter screen, shared by the stand-alone
// prototype, the transmitter room of chapter 2 and the chapter 2 finale.
// Machine parts take callbacks so each caller decides which action to send.

import { h } from '../ui/dom.js';
import { line } from '../ui/enline.js';
import { speak, sfx } from '../audio.js';
import {
  TX_LEVELS, WIRE_RULES, VALVES, SHIFTS, BAR_PER_TURN, KEY_COLUMNS, KEY_WORDS_VI, LIGHTS, valveManual, TX_GLOSSARY,
} from '../../../shared/transmitter.js';

const WIRE_CSS = { red: '#d23a2c', blue: '#2f6fd6', yellow: '#f2c230', white: '#f4f1ea', black: '#1d1b22', green: '#3fa34d' };
const ORD = ['first', 'second', 'third', 'fourth', 'fifth', 'sixth'];

export function platePanel(p) {
  return h('div', { class: 'box tx-plate' },
    h('div', {}, h('div', { class: 'small' }, 'SERIAL NO.'), h('div', { class: 'en big' }, p.serial)),
    h('div', { class: 'tx-lights' }, ...LIGHTS.map((l) => h('div', { class: `tx-light ${p.lights[l] ? 'on' : ''}` }, h('i'), h('span', { class: 'en' }, l)))),
    h('div', {}, h('div', { class: 'small' }, 'STATION CLOCK'), h('div', { class: 'en big' }, p.time), h('div', { class: 'en' }, p.day)),
  );
}

export function moduleBox(title, solved, body) {
  return h('div', { class: `box tx-module ${solved ? 'solved' : ''}` },
    h('h3', {}, title, solved ? h('span', { class: 'tx-done' }, '✓ XONG') : null), body);
}

// ui keeps the selected wire between redraws
export function wiresBody({ wires, solved, ui, redraw, onCut }) {
  const list = h('div', { class: 'tx-wires' }, ...wires.colours.map((c, i) => {
    const cut = wires.cut.includes(i);
    return h('div', {
      class: `tx-wire ${cut ? 'cut' : ''} ${ui.selWire === i ? 'sel' : ''}`,
      title: `wire ${i + 1}`,
      onclick: () => { if (solved || cut) return; ui.selWire = ui.selWire === i ? null : i; sfx('click'); redraw(); },
    }, h('span', { class: 'n en' }, String(i + 1)), h('span', { class: 'bar', style: { background: WIRE_CSS[c] } }));
  }));
  const sel = ui.selWire ?? null;
  const btn = solved ? null : h('button', {
    class: 'btn red small', disabled: sel === null,
    onclick: () => { onCut(sel); ui.selWire = null; },
  }, sel === null ? 'Chọn một dây để cắt' : `✂ Cắt dây ${sel + 1}`);
  return h('div', {}, list, btn);
}

// ui.dials keeps the valve turns between redraws
export function valvesBody({ pressure, solved, ui, redraw, onConfirm }) {
  const dials = ui.dials || (ui.dials = { INTAKE: 0, RELEASE: 0, BYPASS: 0 });
  const dial = (v) => h('div', { class: 'tx-dial' },
    h('div', { class: 'en' }, v),
    h('div', { class: 'row', style: { justifyContent: 'center', gap: '4px' } },
      h('button', { class: 'btn small', disabled: solved, onclick: () => { dials[v] = Math.max(0, dials[v] - 1); sfx('click'); redraw(); } }, '−'),
      h('span', { class: 'en num' }, String(dials[v])),
      h('button', { class: 'btn small', disabled: solved, onclick: () => { dials[v] = Math.min(6, dials[v] + 1); sfx('click'); redraw(); } }, '+')),
    h('div', { class: 'small' }, 'turns'));
  return h('div', {},
    h('div', { class: 'tx-gauge' }, h('span', { class: 'small' }, 'PRESSURE'), h('span', { class: 'en big' }, `${pressure} bar`)),
    h('div', { class: 'row', style: { justifyContent: 'space-around' } }, ...VALVES.map(dial)),
    solved ? null : h('button', { class: 'btn gold small', onclick: () => onConfirm({ ...dials }) }, 'CONFIRM'));
}

export function keypadBody({ words, pressed, solved, onKey }) {
  return h('div', { class: 'tx-keys' }, ...words.map((word) => h('div', { class: 'tx-keywrap' },
    h('button', {
      class: `tx-key en ${pressed.includes(word) ? 'lit' : ''}`,
      disabled: solved || pressed.includes(word),
      onclick: () => onKey(word),
    }, word),
    h('button', { class: 'btn small', title: 'Nghe cách đọc', onclick: () => speak(word.toLowerCase(), 'narr') }, '🔊'))));
}

// ------------------------------------------------------------ manual pages
export function wiresManual(level) {
  const wrap = h('div', { class: 'tx-page' },
    line('Wires are numbered from the top, starting at 1. Cut exactly ONE wire.', 'Dây được đánh số từ trên xuống, bắt đầu từ 1. Chỉ cắt đúng MỘT dây.'),
    line('First, ask how many wires there are. Then go down the list for that number and follow the FIRST rule that matches.', 'Trước tiên, hỏi có bao nhiêu dây. Sau đó dò danh sách ứng với số dây đó và làm theo luật ĐẦU TIÊN khớp.'),
  );
  const [lo, hi] = TX_LEVELS[level].wires;
  const sizes = Object.keys(WIRE_RULES).map(Number).filter((n) => n >= lo && n <= hi);
  for (const n of sizes) wrap.append(h('h4', { class: 'en' }, `${n} wires`), ...WIRE_RULES[n].map((r, i) => line(`${i + 1}. ${r.en}`, r.vi, 'rule')));
  wrap.append(h('p', { class: 'small' }, `Màu dây có thể gặp: red (đỏ), blue (xanh dương), yellow (vàng), white (trắng), black (đen)${sizes.some((n) => n >= 5) ? ', green (xanh lá)' : ''}. Thứ tự: ${ORD.slice(0, Math.max(...sizes)).join(', ')}.`));
  return wrap;
}

export function valvesManual(level) {
  const table = h('table', { class: 'tx-table' },
    h('tr', {}, h('th', {}, 'Shift'), h('th', {}, 'Station time'), h('th', {}, 'Normal range')),
    ...SHIFTS.map((s) => h('tr', {}, h('td', {}, s.name, h('div', { class: 'small' }, s.vi)), h('td', { class: 'en' }, `${s.from} – ${s.to}`), h('td', { class: 'en' }, `${s.lo} – ${s.hi} bar`))));
  return h('div', { class: 'tx-page' },
    line('The pressure must stay inside the normal range for the shift on duty.', 'Áp suất phải nằm trong khoảng bình thường của ca đang trực.'),
    table,
    ...valveManual(level).map((l) => line(l.en, l.vi, 'rule')),
    h('p', { class: 'small' }, `Ví dụ: khoảng 40–55 bar, áp suất 67 bar → cao hơn 12 bar → cần 3 vòng (mỗi vòng ${BAR_PER_TURN} bar, làm tròn lên).`),
  );
}

export function keypadManual() {
  const table = h('table', { class: 'tx-table tx-cols' },
    h('tr', {}, ...KEY_COLUMNS.map((_, i) => h('th', {}, `Column ${String.fromCharCode(65 + i)}`))),
    ...KEY_COLUMNS[0].map((_, r) => h('tr', {}, ...KEY_COLUMNS.map((c) => h('td', { class: 'en', title: KEY_WORDS_VI[c[r]] || '' }, c[r])))));
  return h('div', { class: 'tx-page' },
    line('Each key shows one word. Find the ONE column that contains all of the words on the keys.', 'Mỗi phím có một từ. Tìm MỘT cột chứa tất cả các từ trên phím.'),
    line('Press the keys in the order the words appear in that column, from top to bottom.', 'Bấm các phím theo thứ tự các từ xuất hiện trong cột đó, từ trên xuống.'),
    line('Be careful: some words sound the same but are spelled differently (SEA and SEE, for example). Ask your partner to spell any word you are not sure about.', 'Cẩn thận: có những từ đọc giống nhau nhưng viết khác nhau (ví dụ SEA và SEE). Hỏi người kia đánh vần những từ bạn chưa chắc.', 'rule'),
    line('A wrong key resets the keypad: start again from the first word.', 'Bấm sai một phím thì bàn phím xoá hết: làm lại từ từ đầu tiên.', 'rule'),
    table,
  );
}

export function glossaryPage(list = TX_GLOSSARY, note = 'Những từ hay gặp trong sổ tay kỹ thuật và đề TOEIC. Bấm 🔊 để nghe.') {
  return h('div', { class: 'tx-page' },
    h('p', { class: 'small' }, note),
    h('div', { class: 'tx-words' }, ...list.map(([en, vi]) => h('div', { class: 'card' },
      h('span', { class: 'en', style: { flex: 1 } }, en), h('span', { class: 'small' }, vi),
      h('button', { class: 'btn small', onclick: () => speak(en, 'narr') }, '🔊')))),
  );
}

// manual with tabs; pages: [[id, label, () => node]]
export function manualBook(pages, ui, redraw, solved = {}) {
  const tab = ui.tab && pages.some((p) => p[0] === ui.tab) ? ui.tab : pages[0][0];
  const bar = h('div', { class: 'tx-tabs' }, ...pages.map(([id, label]) => h('button', {
    class: `${tab === id ? 'on' : ''} ${solved[id] ? 'ok' : ''}`,
    onclick: () => { ui.tab = id; sfx('click'); redraw(); },
  }, (solved[id] ? '✓ ' : '') + label)));
  return h('div', { class: 'box tx-manual' },
    h('div', { class: 'tx-manual-head' }, h('span', { class: 'en' }, 'TRANSMITTER MAINTENANCE MANUAL'), h('span', { class: 'small' }, 'rev. 7')),
    bar, pages.find((p) => p[0] === tab)[2]());
}
