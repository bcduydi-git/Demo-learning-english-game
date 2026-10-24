// Chapter 2 prototype: the signal transmitter (a "talk me through it" puzzle).
// The technician sees the machine, the reader sees the manual. Nothing on one
// screen is shown on the other, so everything has to go through the call.

import Phaser from 'phaser';
import { G, act, nameOf, partner } from '../ctx.js';
import { h, clear } from '../ui/dom.js';
import { toast } from '../ui/hud.js';
import { line } from '../ui/enline.js';
import { platePanel, moduleBox, wiresBody, valvesBody, keypadBody, wiresManual, valvesManual, keypadManual, glossaryPage, manualBook } from '../ch2/machineui.js';
import { music, ambience, sfx } from '../audio.js';
import {
  TX_LEVELS, TX_MODULES, TX_PENALTY_MS, LIGHTS, TX_PHRASES, wireAnswer, valveAnswer, keypadOrder, shiftFor,
} from '../../../shared/transmitter.js';

const MODULE_NAME = { wires: 'Dây cáp', valves: 'Van áp suất', keypad: 'Bàn phím chữ' };

const mmss = (ms) => {
  const s = Math.max(0, Math.ceil(ms / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
};

export class TransmitterScene extends Phaser.Scene {
  constructor() {
    super('Transmitter');
  }

  create() {
    this.mui = {}; // selected wire, valve dials, manual tab
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
      if (tx.status === 'run') { music('boss'); this.mui = {}; }
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
    const m = this.tx.machine;
    const ui = this.mui;
    const redraw = () => this.render();
    return h('div', { class: 'tx-main' },
      h('div', { class: 'tx-machine' },
        platePanel(m.plate),
        h('div', { class: 'tx-grid' },
          moduleBox('1 · Wires', m.solved.wires, wiresBody({ wires: m.wires, solved: m.solved.wires, ui, redraw, onCut: (index) => act({ type: 'tx_cut', index }) })),
          moduleBox('2 · Valves', m.solved.valves, valvesBody({ pressure: m.valves.pressure, solved: m.solved.valves, ui, redraw, onConfirm: (set) => act({ type: 'tx_valves', set }) })),
          moduleBox('3 · Keypad', m.solved.keypad, keypadBody({ words: m.keypad.words, pressed: m.keypad.pressed, solved: m.solved.keypad, onKey: (word) => act({ type: 'tx_key', word }) }))),
      ),
      this.phrasePanel('tech'),
    );
  }

  // ------------------------------------------------------------ reader
  manualView() {
    const lv = this.tx.level;
    const pages = [
      ['wires', '1 · Wires', () => wiresManual(lv)],
      ['valves', '2 · Valves', () => valvesManual(lv)],
      ['keypad', '3 · Keypad', () => keypadManual()],
      ['words', '📖 Sổ từ', () => glossaryPage()],
    ];
    return h('div', { class: 'tx-main' },
      manualBook(pages, this.mui, () => this.render(), (this.tx.machine && this.tx.machine.solved) || {}),
      this.phrasePanel('reader'),
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
