// Chapter 2 prototype: the signal transmitter (a "talk me through it" puzzle).
// The technician sees the machine, the reader sees the manual. Nothing on one
// screen is shown on the other, so everything has to go through the call.

import Phaser from 'phaser';
import { G, act, nameOf, partner, settings, on } from '../ctx.js';
import { h, clear } from '../ui/dom.js';
import { toast } from '../ui/hud.js';
import { line } from '../ui/enline.js';
import { music, ambience, sfx, speak } from '../audio.js';
import {
  TX_LEVELS, TX_MODULES, TX_PENALTY_MS, WIRE_RULES, VALVES, SHIFTS, BAR_PER_TURN, KEY_COLUMNS, KEY_WORDS_VI, LIGHTS,
  valveManual, TX_GLOSSARY, TX_PHRASES, wireAnswer, valveAnswer, keypadOrder, shiftFor,
} from '../../../shared/transmitter.js';

const MODULE_NAME = { wires: 'Dây cáp', valves: 'Van áp suất', keypad: 'Bàn phím chữ' };
const WIRE_CSS = { red: '#d23a2c', blue: '#2f6fd6', yellow: '#f2c230', white: '#f4f1ea', black: '#1d1b22', green: '#3fa34d' };
const ORD = ['first', 'second', 'third', 'fourth', 'fifth', 'sixth'];

const mmss = (ms) => {
  const s = Math.max(0, Math.ceil(ms / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
};

export class TransmitterScene extends Phaser.Scene {
  constructor() {
    super('Transmitter');
  }

  create() {
    this.tab = 'wires';
    this.dials = { INTAKE: 0, RELEASE: 0, BYPASS: 0 };
    this.selWire = null;
    this.sig = '';
    this.drawBackground();
    this.scale.on('resize', this.drawBackground, this);
    this.ui = h('div', { id: 'txui' });
    document.getElementById('ui').append(this.ui);
    this.clock = setInterval(() => this.drawClock(), 200);
    this.events.once('shutdown', () => {
      clearInterval(this.clock);
      this.ui.remove();
      this.scale.off('resize', this.drawBackground, this);
    });
    ambience('indoor');
    this.lastStatus = null;
    this.applyState(G.state);
  }

  drawBackground() {
    const W = this.scale.width;
    const H = this.scale.height;
    if (this.bg) this.bg.destroy();
    const g = this.add.graphics().setDepth(-10);
    g.fillGradientStyle(0x0b1324, 0x0b1324, 0x14243a, 0x14243a, 1);
    g.fillRect(0, 0, W, H);
    g.lineStyle(1, 0x1f3a52, 0.6);
    for (let x = 0; x < W; x += 32) g.lineBetween(x, 0, x, H);
    for (let y = 0; y < H; y += 32) g.lineBetween(0, y, W, y);
    this.bg = g;
  }

  // ------------------------------------------------------------ state
  applyState(s) {
    const tx = s && s.tx;
    if (!tx) return;
    this.tx = tx;
    this.leftAt = performance.now();
    this.leftMs = tx.left;
    if (tx.status !== this.lastStatus) {
      if (tx.status === 'run') { music('boss'); this.tab = 'wires'; this.dials = { INTAKE: 0, RELEASE: 0, BYPASS: 0 }; this.selWire = null; }
      else if (tx.status === 'setup') music('night');
      this.lastStatus = tx.status;
    }
    // redraw everything except the clock only when something else changed
    const sig = JSON.stringify({ ...tx, left: 0, ready: tx.ready, p: [s.players.p1, s.players.p2] });
    if (sig !== this.sig) {
      this.sig = sig;
      this.render();
    }
    this.drawClock();
  }

  onEvent(e) {
    const who = e.by === G.slot ? 'Bạn' : e.by ? nameOf(e.by) : '';
    switch (e.e) {
      case 'tx_start': sfx('door'); toast('📡 Máy đã bật. Bắt đầu tính giờ!', 'good'); break;
      case 'tx_strike':
        sfx('wrong');
        this.cameras.main.shake(180, 0.006);
        toast(`✗ Sai ở ${MODULE_NAME[e.module]} (${e.what}). −${TX_PENALTY_MS / 1000} giây`, 'bad');
        break;
      case 'tx_solved': sfx('success'); toast(`✓ ${who} đã xử lý xong: ${MODULE_NAME[e.module]}`, 'good'); break;
      case 'tx_key_ok': sfx('click'); break;
      case 'tx_won': music('victory'); break;
      case 'tx_lost': sfx('fail'); break;
      default: break;
    }
  }

  drawClock() {
    const tx = this.tx;
    if (!tx || !this.clockEl) return;
    const ms = tx.status === 'run' ? this.leftMs - (performance.now() - this.leftAt) : tx.left;
    this.clockEl.textContent = mmss(ms);
    this.clockEl.classList.toggle('low', tx.status === 'run' && ms < 60000);
  }

  // ------------------------------------------------------------ views
  render() {
    const tx = this.tx;
    clear(this.ui);
    this.clockEl = null;
    if (tx.status === 'setup') this.ui.append(this.setupView());
    else if (tx.status === 'run') this.ui.append(this.statusBar(), tx.tech === G.slot ? this.machineView() : this.manualView());
    else this.ui.append(this.statusBar(), this.resultView());
  }

  statusBar() {
    const tx = this.tx;
    const L = TX_LEVELS[tx.level];
    this.clockEl = h('div', { class: 'tx-clock en' });
    const strikes = h('div', { class: 'tx-strikes', title: 'Số lần sai' },
      ...Array.from({ length: L.strikes }, (_, i) => h('span', { class: i < tx.strikes ? 'x' : '' }, i < tx.strikes ? '✗' : '○')));
    const mods = h('div', { class: 'row' }, ...TX_MODULES.map((m) => h('span', { class: `tx-chip ${tx.machine && tx.machine.solved[m] ? 'ok' : ''}` }, `${tx.machine && tx.machine.solved[m] ? '✓' : '•'} ${MODULE_NAME[m]}`)));
    const me = tx.tech === G.slot ? '🔧 Bạn đứng máy' : '📘 Bạn cầm sổ tay';
    return h('div', { class: 'box tx-bar' },
      h('div', {}, h('div', { class: 'small' }, `📡 Máy phát tín hiệu · ${L.label}`), h('b', {}, me)),
      this.clockEl, strikes, mods);
  }

  setupView() {
    const tx = this.tx;
    const tech = tx.tech;
    const reader = tech === 'p1' ? 'p2' : 'p1';
    const roleCard = (slot, icon, title, desc) => h('div', { class: `role ${slot === G.slot ? 'sel' : ''}` },
      h('div', { class: 'role-icon' }, icon),
      h('div', {}, h('h3', {}, `${title}: ${nameOf(slot)}${slot === G.slot ? ' (bạn)' : ''}`), h('p', {}, desc)));
    const levels = h('div', { class: 'seg' }, ...Object.entries(TX_LEVELS).map(([k, v]) => h('button', {
      class: tx.level === k ? 'on' : '', onclick: () => { sfx('click'); act({ type: 'tx_level', level: k }); },
    }, `${v.label} · ${mmss(v.seconds * 1000)} · sai tối đa ${v.strikes - 1} lần`)));
    const pOn = this.state().players[partner()].connected;
    const meReady = !!tx.ready[G.slot];
    const pReady = !!tx.ready[partner()];
    return h('div', { class: 'center-overlay' }, h('div', { class: 'box tx-setup' },
      h('div', { class: 'small', style: { letterSpacing: '.1em' } }, 'BẢN THỬ CHƯƠNG 2'),
      h('h2', { class: 'en', style: { fontSize: '40px', margin: '0 0 4px' } }, 'The Signal Transmitter'),
      h('p', {}, 'Trong trạm nghiên cứu giữa biển, máy phát tín hiệu đang báo lỗi. Gỡ đủ 3 bộ phận trước khi hết giờ: ', h('b', {}, 'dây cáp, van áp suất, bàn phím chữ'), '.'),
      h('div', { class: 'roles' },
        roleCard(tech, '🔧', 'Đứng máy', 'Thấy cỗ máy và thao tác, nhưng không có sổ tay. Tả thật rõ những gì bạn thấy.'),
        roleCard(reader, '📘', 'Cầm sổ tay', 'Có sổ tay hướng dẫn bằng tiếng Anh, nhưng không thấy máy. Hỏi, đọc luật, rồi bảo người kia làm gì.')),
      h('div', { class: 'row' }, h('button', { class: 'btn small', onclick: () => { sfx('click'); act({ type: 'tx_swap' }); } }, '⇄ Đổi vai')),
      h('div', {}, h('b', {}, 'Mức khó'), ' ', h('span', { class: 'small' }, '(chung cho cả hai, ai chọn cũng được)')),
      levels,
      h('div', { class: 'tx-tip' },
        '📞 Gọi thoại cho nhau và ', h('b', {}, 'chỉ nói tiếng Anh'), ' nếu có thể. Đừng nhìn màn hình của nhau! ',
        'Mỗi lần chơi là một cỗ máy mới. Làm sai bị trừ ', h('b', {}, `${TX_PENALTY_MS / 1000} giây`), ' và mất một lượt sai.'),
      h('div', { class: 'row' },
        h('button', { class: 'btn ghost', onclick: () => act({ type: 'tx_exit' }) }, '← Thoát bản thử'),
        h('span', { class: 'spacer' }),
        h('span', { class: 'small' }, pOn ? (pReady ? `✓ ${nameOf(partner())} đã sẵn sàng` : `${nameOf(partner())} đang xem...`) : `${nameOf(partner())} chưa vào`),
        h('button', { class: 'btn gold', disabled: meReady, onclick: () => { sfx('click'); act({ type: 'tx_ready' }); } }, meReady ? 'Đang chờ...' : 'Sẵn sàng ▶'),
      ),
    ));
  }

  state() {
    return G.state;
  }

  // ------------------------------------------------------------ technician
  machineView() {
    const tx = this.tx;
    const m = tx.machine;
    const p = m.plate;
    const plate = h('div', { class: 'box tx-plate' },
      h('div', {}, h('div', { class: 'small' }, 'SERIAL NO.'), h('div', { class: 'en big' }, p.serial)),
      h('div', { class: 'tx-lights' }, ...LIGHTS.map((l) => h('div', { class: `tx-light ${p.lights[l] ? 'on' : ''}` }, h('i'), h('span', { class: 'en' }, l)))),
      h('div', {}, h('div', { class: 'small' }, 'STATION CLOCK'), h('div', { class: 'en big' }, p.time), h('div', { class: 'en' }, p.day)),
    );
    const box = (id, title, body) => h('div', { class: `box tx-module ${m.solved[id] ? 'solved' : ''}` },
      h('h3', {}, title, m.solved[id] ? h('span', { class: 'tx-done' }, '✓ XONG') : null), body);

    // wires
    const w = m.wires;
    const wires = h('div', { class: 'tx-wires' }, ...w.colours.map((c, i) => {
      const cut = w.cut.includes(i);
      return h('div', {
        class: `tx-wire ${cut ? 'cut' : ''} ${this.selWire === i ? 'sel' : ''}`,
        title: `wire ${i + 1}`,
        onclick: () => { if (m.solved.wires || cut) return; this.selWire = this.selWire === i ? null : i; sfx('click'); this.render(); },
      }, h('span', { class: 'n en' }, String(i + 1)), h('span', { class: 'bar', style: { background: WIRE_CSS[c] } }));
    }));
    const cutBtn = m.solved.wires ? null : h('button', {
      class: 'btn red small', disabled: this.selWire === null,
      onclick: () => { act({ type: 'tx_cut', index: this.selWire }); this.selWire = null; },
    }, this.selWire === null ? 'Chọn một dây để cắt' : `✂ Cắt dây ${this.selWire + 1}`);

    // valves
    const dial = (v) => h('div', { class: 'tx-dial' },
      h('div', { class: 'en' }, v),
      h('div', { class: 'row', style: { justifyContent: 'center', gap: '4px' } },
        h('button', { class: 'btn small', disabled: m.solved.valves, onclick: () => { this.dials[v] = Math.max(0, this.dials[v] - 1); sfx('click'); this.render(); } }, '−'),
        h('span', { class: 'en num' }, String(this.dials[v])),
        h('button', { class: 'btn small', disabled: m.solved.valves, onclick: () => { this.dials[v] = Math.min(6, this.dials[v] + 1); sfx('click'); this.render(); } }, '+')),
      h('div', { class: 'small' }, 'turns'));
    const valves = h('div', {},
      h('div', { class: 'tx-gauge' }, h('span', { class: 'small' }, 'PRESSURE'), h('span', { class: 'en big' }, `${m.valves.pressure} bar`)),
      h('div', { class: 'row', style: { justifyContent: 'space-around' } }, ...VALVES.map(dial)),
      m.solved.valves ? null : h('button', { class: 'btn gold small', onclick: () => act({ type: 'tx_valves', set: { ...this.dials } }) }, 'CONFIRM'));

    // keypad
    const k = m.keypad;
    const keys = h('div', { class: 'tx-keys' }, ...k.words.map((word) => h('div', { class: 'tx-keywrap' },
      h('button', {
        class: `tx-key en ${k.pressed.includes(word) ? 'lit' : ''}`,
        disabled: m.solved.keypad || k.pressed.includes(word),
        onclick: () => act({ type: 'tx_key', word }),
      }, word),
      h('button', { class: 'btn small', title: 'Nghe cách đọc', onclick: () => speak(word.toLowerCase(), 'narr') }, '🔊'))));

    return h('div', { class: 'tx-main' },
      h('div', { class: 'tx-machine' },
        plate,
        h('div', { class: 'tx-grid' },
          box('wires', '1 · Wires', h('div', {}, wires, cutBtn)),
          box('valves', '2 · Valves', valves),
          box('keypad', '3 · Keypad', keys)),
      ),
      this.phrasePanel('tech'),
    );
  }

  // ------------------------------------------------------------ reader
  manualView() {
    const tx = this.tx;
    const tabs = [['wires', '1 · Wires'], ['valves', '2 · Valves'], ['keypad', '3 · Keypad'], ['words', '📖 Sổ từ']];
    const tabBar = h('div', { class: 'tx-tabs' }, ...tabs.map(([id, label]) => h('button', {
      class: `${this.tab === id ? 'on' : ''} ${tx.machine && tx.machine.solved[id] ? 'ok' : ''}`,
      onclick: () => { this.tab = id; sfx('click'); this.render(); },
    }, (tx.machine && tx.machine.solved[id] ? '✓ ' : '') + label)));
    let page;
    if (this.tab === 'wires') page = this.wiresPage();
    else if (this.tab === 'valves') page = this.valvesPage();
    else if (this.tab === 'keypad') page = this.keypadPage();
    else page = this.wordsPage();
    return h('div', { class: 'tx-main' },
      h('div', { class: 'box tx-manual' },
        h('div', { class: 'tx-manual-head' }, h('span', { class: 'en' }, 'TRANSMITTER MAINTENANCE MANUAL'), h('span', { class: 'small' }, 'rev. 7')),
        tabBar, page),
      this.phrasePanel('reader'),
    );
  }

  wiresPage() {
    const wrap = h('div', { class: 'tx-page' },
      line('Wires are numbered from the top, starting at 1. Cut exactly ONE wire.', 'Dây được đánh số từ trên xuống, bắt đầu từ 1. Chỉ cắt đúng MỘT dây.'),
      line('First, ask how many wires there are. Then go down the list for that number and follow the FIRST rule that matches.', 'Trước tiên, hỏi có bao nhiêu dây. Sau đó dò danh sách ứng với số dây đó và làm theo luật ĐẦU TIÊN khớp.'),
    );
    const sizes = Object.keys(WIRE_RULES).map(Number).filter((n) => {
      const [lo, hi] = TX_LEVELS[this.tx.level].wires;
      return n >= lo && n <= hi;
    });
    for (const n of sizes) {
      wrap.append(h('h4', { class: 'en' }, `${n} wires`), ...WIRE_RULES[n].map((r, i) => line(`${i + 1}. ${r.en}`, r.vi, 'rule')));
    }
    wrap.append(h('p', { class: 'small' }, `Màu dây có thể gặp: red (đỏ), blue (xanh dương), yellow (vàng), white (trắng), black (đen)${sizes.some((n) => n >= 5) ? ', green (xanh lá)' : ''}. Thứ tự: ${ORD.slice(0, Math.max(...sizes)).join(', ')}.`));
    return wrap;
  }

  valvesPage() {
    const lv = this.tx.level;
    const table = h('table', { class: 'tx-table' },
      h('tr', {}, h('th', {}, 'Shift'), h('th', {}, 'Station time'), h('th', {}, 'Normal range')),
      ...SHIFTS.map((s) => h('tr', {}, h('td', {}, s.name, h('div', { class: 'small' }, s.vi)), h('td', { class: 'en' }, `${s.from} – ${s.to}`), h('td', { class: 'en' }, `${s.lo} – ${s.hi} bar`))));
    return h('div', { class: 'tx-page' },
      line('The pressure must stay inside the normal range for the shift on duty.', 'Áp suất phải nằm trong khoảng bình thường của ca đang trực.'),
      table,
      ...valveManual(lv).map((l) => line(l.en, l.vi, 'rule')),
      h('p', { class: 'small' }, `Ví dụ: khoảng 40–55 bar, áp suất 67 bar → cao hơn 12 bar → cần 3 vòng (mỗi vòng ${BAR_PER_TURN} bar, làm tròn lên).`),
    );
  }

  keypadPage() {
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

  wordsPage() {
    return h('div', { class: 'tx-page' },
      h('p', { class: 'small' }, 'Những từ hay gặp trong sổ tay kỹ thuật và đề TOEIC. Bấm 🔊 để nghe.'),
      h('div', { class: 'tx-words' }, ...TX_GLOSSARY.map(([en, vi]) => h('div', { class: 'card' },
        h('span', { class: 'en', style: { flex: 1 } }, en), h('span', { class: 'small' }, vi),
        h('button', { class: 'btn small', onclick: () => speak(en, 'narr') }, '🔊')))),
    );
  }

  phrasePanel(role) {
    const list = TX_PHRASES[role];
    const open = this.phrasesOpen !== false;
    return h('div', { class: `box tx-phrases ${open ? '' : 'closed'}` },
      h('div', { class: 'row', style: { justifyContent: 'space-between' } },
        h('b', {}, role === 'tech' ? '🗣 Câu bạn sẽ cần nói' : '🗣 Câu bạn sẽ cần hỏi'),
        h('button', { class: 'btn small', onclick: () => { this.phrasesOpen = !open; this.render(); } }, open ? 'Ẩn' : 'Hiện')),
      open ? h('div', {}, ...list.map(([en, vi]) => line(en, vi))) : null,
    );
  }

  // ------------------------------------------------------------ result
  resultView() {
    const tx = this.tx;
    const won = tx.status === 'won';
    const L = TX_LEVELS[tx.level];
    const used = L.seconds * 1000 - tx.left;
    return h('div', { class: 'center-overlay' }, h('div', { class: 'box tx-setup' },
      h('div', { class: 'logo', style: { fontSize: '46px' } }, won ? 'SIGNAL ONLINE!' : 'SYSTEM FAILURE'),
      h('p', {}, won
        ? `Hai bạn đã gỡ xong cả 3 bộ phận ở mức ${L.label}, còn dư ${mmss(tx.left)}, sai ${tx.strikes} lần.`
        : (tx.lostWhy === 'time' ? 'Hết giờ rồi! ' : `Sai ${tx.strikes} lần, máy tự ngắt. `) + `Đã xong ${TX_MODULES.filter((m) => tx.machine.solved[m]).length}/3 bộ phận sau ${mmss(used)}.`),
      h('p', { class: 'small' }, `Lần chơi thứ ${tx.attempts} · đã thắng ${tx.wins} lần. Mỗi lần chơi lại là một cỗ máy mới. Thử đổi vai để luyện cả nói lẫn nghe!`),
      this.answerReview(),
      h('div', { class: 'row' },
        h('button', { class: 'btn ghost', onclick: () => act({ type: 'tx_exit' }) }, '← Thoát bản thử'),
        h('span', { class: 'spacer' }),
        h('button', { class: 'btn gold', onclick: () => { sfx('click'); act({ type: 'tx_again' }); } }, '↻ Chơi lại (máy mới)'),
      ),
    ));
  }

  // after the round, both players can see the machine and why each answer was right
  answerReview() {
    const m = this.tx.machine;
    if (!m) return null;
    const p = m.plate;
    const lv = this.tx.level;
    const w = wireAnswer(m.wires.colours, p);
    const v = valveAnswer(m.valves.pressure, p, lv);
    const sh = shiftFor(p, lv);
    return h('details', { class: 'tx-review' },
      h('summary', {}, 'Xem lại cỗ máy vừa rồi và đáp án'),
      h('p', { class: 'small' }, `Serial ${p.serial} · đèn sáng: ${LIGHTS.filter((l) => p.lights[l]).join(', ') || 'không có'} · đồng hồ ${p.time} ${p.day}`),
      h('p', {}, h('b', {}, 'Dây cáp: '), `${m.wires.colours.join(', ')} → luật số ${w.rule + 1} (${m.wires.colours.length} wires) → cắt dây ${w.index + 1}.`),
      h('p', {}, h('b', {}, 'Van: '), `${m.valves.pressure} bar, ${sh.name} (${sh.lo}–${sh.hi}) → `, v.valve ? `${v.valve} ${v.turns} vòng.` : 'không mở van, chỉ CONFIRM.'),
      h('p', {}, h('b', {}, 'Bàn phím: '), keypadOrder(m.keypad.words).join(' → ')),
    );
  }
}
