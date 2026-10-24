// Chapter 2 — "The Green Light". The station is a set of rooms on a map:
// click a room to walk there, read what is lying around, and open the
// puzzle of the current step. Puzzles show each player only their own side.

import Phaser from 'phaser';
import { G, act, nameOf, partner } from '../ctx.js';
import { h, clear, portraitUrl } from '../ui/dom.js';
import { toast } from '../ui/hud.js';
import { line } from '../ui/enline.js';
import { openModal } from '../ui/modal.js';
import { clearLastSession } from '../store.js';
import { music, ambience, sfx, speak } from '../audio.js';

import { PUZZLES, LEVELS, roleOf } from '../../../shared/ch2/puzzle.js';
import { stepOf, isOpen, chapterOf, ALL_ROLE_INFO as ROLE_INFO } from '../../../shared/ch2/index.js';
import { VIEWS, PHRASES } from '../ch2/puzzles.js';

const ROOM_LOOK = {
  bridge: { wall: 0x1d2b44, floor: 0x3a3f4f, accent: 0x6dff8a, kind: 'ship' },
  dock: { wall: 0x14233a, floor: 0x5b4636, accent: 0x6dff8a, kind: 'sea' },
  hub: { wall: 0x2c3a4a, floor: 0x4a4f58, accent: 0xf2c230, kind: 'room' },
  west: { wall: 0x23394f, floor: 0x2f5a78, accent: 0x7fd6ff, kind: 'water' },
  east: { wall: 0x2a3a3a, floor: 0x2f6a6a, accent: 0x7fffd6, kind: 'water' },
  office: { wall: 0x3a2f2a, floor: 0x5a4636, accent: 0xffd27a, kind: 'room' },
  lockers: { wall: 0x2f3440, floor: 0x50525a, accent: 0xc0c8d8, kind: 'room' },
  dome: { wall: 0x0b1024, floor: 0x262a3a, accent: 0x6dff8a, kind: 'stars' },
  transmitter: { wall: 0x1a1a22, floor: 0x2a2a33, accent: 0xff6a5a, kind: 'room' },
  deck: { wall: 0x2a4a6a, floor: 0x6a5038, accent: 0x6dff8a, kind: 'sea' },
  landing: { wall: 0x2a3a52, floor: 0x55565e, accent: 0x7fd6ff, kind: 'sea' },
  stairs: { wall: 0x4a3f38, floor: 0x3a3430, accent: 0xffd27a, kind: 'room' },
  keeperroom: { wall: 0x5a4636, floor: 0x6a5038, accent: 0xffd27a, kind: 'room' },
  gearroom: { wall: 0x3a3a3a, floor: 0x4a4038, accent: 0xf2c230, kind: 'room' },
  lantern: { wall: 0x0b1024, floor: 0x3a3430, accent: 0x6dff8a, kind: 'stars' },
};

export class Chapter2Scene extends Phaser.Scene {
  constructor() {
    super('Chapter2');
  }

  create() {
    this.ui = {}; // local puzzle UI state by kind
    this.sig = '';
    this.root = h('div', { id: 'c2ui' });
    document.getElementById('ui').append(this.root);
    this.scale.on('resize', this.drawRoom, this);
    this.events.once('shutdown', () => {
      this.root.remove();
      this.scale.off('resize', this.drawRoom, this);
    });
    music('night');
    ambience('indoor');
    this.room = null;
    this.applyState(G.state);
  }

  myRoom() {
    return G.state.c2.rooms[G.slot];
  }

  // ------------------------------------------------------------ background
  drawRoom() {
    const room = this.myRoom();
    const W = this.scale.width;
    const H = this.scale.height;
    if (this.bg) this.bg.destroy(true);
    this.bg = this.add.container(0, 0).setDepth(-10);
    const key = `c2room_${room}`;
    if (this.textures.exists(key)) {
      // fill the screen; a whole-number zoom keeps every art pixel square,
      // unless it would crop too much of the picture on this screen
      const img = this.add.image(Math.round(W / 2), Math.round(H / 2), key);
      const cover = Math.max(W / img.width, H / img.height);
      const whole = Math.ceil(cover);
      img.setScale(whole / cover <= 1.12 ? whole : cover);
      this.bg.add(img);
      return;
    }
    // placeholder until the drawn backgrounds arrive (assets/ch2/rooms/<room>.png)
    const L = ROOM_LOOK[room] || ROOM_LOOK.hub;
    const g = this.add.graphics();
    this.bg.add(g);
    const horizon = H * 0.58;
    g.fillStyle(L.wall, 1).fillRect(0, 0, W, horizon);
    g.fillStyle(L.floor, 1).fillRect(0, horizon, W, H - horizon);
    g.lineStyle(2, 0x000000, 0.35);
    for (let x = 0; x < W; x += 64) g.lineBetween(x, horizon, x + (x - W / 2) * 0.6, H);
    if (L.kind === 'stars' || L.kind === 'ship' || L.kind === 'sea') {
      for (let i = 0; i < 70; i++) g.fillStyle(0xffffff, Math.random() * 0.7 + 0.2).fillRect(Math.random() * W, Math.random() * horizon * 0.8, 2, 2);
    }
    if (L.kind === 'ship' || L.kind === 'room') {
      g.fillStyle(0x0b1324, 1);
      for (let i = 0; i < 3; i++) g.fillRoundedRect(W * (0.15 + i * 0.28), horizon * 0.18, W * 0.18, horizon * 0.42, 8);
      g.lineStyle(4, 0x000000, 0.8);
      for (let i = 0; i < 3; i++) g.strokeRoundedRect(W * (0.15 + i * 0.28), horizon * 0.18, W * 0.18, horizon * 0.42, 8);
    }
    if (L.kind === 'sea' || L.kind === 'ship') {
      g.fillStyle(0x10284a, 1).fillRect(0, horizon * 0.7, W, horizon * 0.3);
    }
    if (L.kind === 'water') {
      g.fillStyle(L.accent, 0.25).fillRect(0, horizon + (H - horizon) * 0.35, W, H);
    }
    // the green light, somewhere in every room
    const glow = this.add.circle(W * 0.86, horizon * 0.22, 6, 0x6dff8a, 1);
    const halo = this.add.circle(W * 0.86, horizon * 0.22, 22, 0x6dff8a, 0.12);
    this.bg.add([halo, glow]);
    this.tweens.add({ targets: [glow, halo], alpha: 0.15, duration: 900, yoyo: true, repeat: -1 });
    this.loadRoomArt(room);
  }

  loadRoomArt(room) {
    const key = `c2room_${room}`;
    if (!Chapter2Scene.art) {
      // which rooms have a drawn background (assets/ch2/rooms/manifest.json)
      Chapter2Scene.art = fetch('assets/ch2/rooms/manifest.json').then((r) => r.json()).then((m) => m.rooms || []).catch(() => []);
    }
    Chapter2Scene.art.then((list) => { if (list.includes(room) && this.scene.isActive()) this.loadRoomImage(room, key); });
  }

  loadRoomImage(room, key) {
    if (this.textures.exists(key) || this.triedArt?.[room]) return;
    this.triedArt = { ...(this.triedArt || {}), [room]: true };
    this.load.image(key, `assets/ch2/rooms/${room}.png`);
    this.load.once('complete', () => { if (this.textures.exists(key) && this.myRoom() === room) this.drawRoom(); });
    this.load.start();
  }

  // ------------------------------------------------------------ state
  applyState(s) {
    if (!s || !s.c2) return;
    this.C = chapterOf(s.c2); // rooms, steps and words of the chapter being played
    if (this.chapter !== (s.c2.chapter || 2)) { this.chapter = s.c2.chapter || 2; this.room = null; this.ui = {}; music(this.chapter === 3 ? 'woods' : 'night'); }
    if (this.room !== s.c2.rooms[G.slot]) {
      this.room = s.c2.rooms[G.slot];
      this.drawRoom();
    }
    const c2 = s.c2;
    // the clock of timed puzzles ticks every second: update it alone so
    // the rest of the screen (and the manual's scroll position) stays put
    const sig = JSON.stringify({ c2, sc: !!s.scene, p: [s.players.p1, s.players.p2] }, (k, v) => (k === 'left' ? 0 : v));
    if (sig !== this.sig) {
      this.sig = sig;
      this.render();
    }
    this.drawClock();
  }

  drawClock() {
    const pz = G.state.c2.pz;
    if (!this.clockEl || !pz || !pz.data || pz.data.left == null) return;
    const sec = Math.max(0, Math.ceil(pz.data.left / 1000));
    this.clockEl.textContent = `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`;
    this.clockEl.classList.toggle('low', sec < 60);
  }

  onEvent(e) {
    const c2 = G.state && G.state.c2;
    if (!c2) return;
    const who = e.by === G.slot ? 'Bạn' : e.by ? nameOf(e.by) : '';
    switch (e.e) {
      case 'pz_start': sfx('door'); if (c2.pz && c2.pz.kind === 'coords') music('boss'); break;
      case 'pz_strike': sfx('wrong'); this.cameras.main.shake(160, 0.005); toast(`✗ Sai: ${e.what || 'chưa đúng'}`, 'bad'); break;
      case 'pz_failed': sfx('fail'); if (e.why === 'time') toast('⏰ Hết giờ rồi!', 'bad'); break;
      case 'pz_part': sfx('success'); break;
      case 'tx_key_ok': sfx('click'); break;
      case 'finale_phase': toast(e.phase === 2 ? '🔄 Đổi vai! Giờ đến máy dự phòng.' : e.phase === 3 ? '⚡ Cả hai cùng làm một lúc!' : '📡 Sẵn sàng gửi! Cùng bấm SEND!', 'good'); break;
      case 'finale_send':
        if (c2.pz && roleOf(c2.pz, G.slot) !== e.side) {
          const ui = this.ui.finale || (this.ui.finale = {});
          ui.partnerSend = performance.now();
          this.render();
          setTimeout(() => this.render(), 4100);
        }
        break;
      case 'pz_done': sfx('success'); music('night'); toast('✓ Hoàn thành thử thách!', 'good'); break;
      case 'flood_hatch':
        if (c2.pz && roleOf(c2.pz, G.slot) !== e.side) {
          const ui = this.ui.flood || (this.ui.flood = {});
          ui.partnerHatch = performance.now();
          sfx('door');
          this.render();
          setTimeout(() => this.render(), 4100);
        }
        break;
      case 'beacon_ship': sfx('success'); toast(e.swap ? `✓ Tàu ${e.n} an toàn! 🔄 Đổi vai: người quan sát giờ phát đèn.` : `✓ Tàu ${e.n} đã đổi hướng, an toàn!`, 'good'); break;
      case 'beacon_light':
        if (c2.pz && roleOf(c2.pz, G.slot) !== e.side) {
          const ui = this.ui.beacon || (this.ui.beacon = {});
          ui.partnerLight = performance.now();
          this.render();
          setTimeout(() => this.render(), 4100);
        }
        break;
      case 'antenna_round': sfx('success'); toast('✓ Đĩa thứ nhất đã đúng hướng! Giờ đổi phía.', 'good'); break;
      case 'c2_moved': if (e.by !== G.slot) toast(`${who} đi tới ${this.C.ROOMS[e.room].vi}`); break;
      default: break;
    }
  }

  // ------------------------------------------------------------ views
  render() {
    const s = G.state;
    const c2 = s.c2;
    // keep focus and caret in a text box across redraws
    const f = document.activeElement;
    const fk = f && this.root.contains(f) && f.dataset && f.dataset.k;
    const caret = fk && f.selectionStart;
    clear(this.root);
    this.clockEl = null;
    this.root.append(this.topBar(c2), this.mapPanel(c2), this.roomPanel(c2));
    if (c2.step === 'end' && !s.scene) this.root.append(this.endPanel(c2));
    else if (c2.open && c2.pz && !s.scene) this.root.append(this.puzzlePanel(c2));
    if (fk) {
      const el = this.root.querySelector(`[data-k="${fk}"]`);
      if (el) { el.focus(); try { el.setSelectionRange(caret, caret); } catch { /* not a text box */ } }
    }
    this.drawClock();
  }

  topBar(c2) {
    const st = stepOf(c2);
    const n = this.C.STEPS.findIndex((x) => x.id === st.id);
    return h('div', { class: 'box c2-top' },
      h('div', { class: 'small' }, this.C.TITLE.vi),
      h('b', {}, st.id === 'end' ? `Hết chương ${c2.chapter || 2}` : `Thử thách ${n + 1}/${this.C.STEPS.length - 1}: ${st.vi}`),
      st.id !== 'end' ? h('div', { class: 'small' }, `Đến ${this.C.ROOMS[st.room].vi} để bắt đầu.`) : null);
  }

  mapPanel(c2) {
    const map = h('div', { class: 'c2-map' });
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 100 100');
    svg.setAttribute('preserveAspectRatio', 'none');
    for (const [a, b] of this.C.LINKS) {
      const l = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      for (const [k, v] of Object.entries({ x1: this.C.ROOMS[a].x + 9, y1: this.C.ROOMS[a].y + 6, x2: this.C.ROOMS[b].x + 9, y2: this.C.ROOMS[b].y + 6 })) l.setAttribute(k, v);
      l.setAttribute('class', isOpen(c2, a) && isOpen(c2, b) ? 'open' : '');
      svg.append(l);
    }
    map.append(svg);
    const busy = c2.pz && c2.pz.status === 'run';
    for (const [id, r] of Object.entries(this.C.ROOMS)) {
      const open = isOpen(c2, id) && !r.locked;
      const here = ['p1', 'p2'].filter((p) => c2.rooms[p] === id);
      const isStep = stepOf(c2).room === id && c2.step !== 'end';
      map.append(h('div', {
        class: `c2-room ${open ? 'open' : 'locked'} ${c2.rooms[G.slot] === id ? 'me' : ''} ${isStep ? 'goal' : ''}`,
        style: { left: `${r.x}%`, top: `${r.y}%` },
        title: r.locked || (open ? r.vi : 'Chưa mở'),
        onclick: () => { if (open && !busy && c2.rooms[G.slot] !== id) { sfx('click'); act({ type: 'c2_move', room: id }); } },
      }, h('span', { class: 'n' }, open ? r.vi : (r.locked ? '🔒 ' + r.vi : '🔒')),
      h('span', { class: 'who' }, ...here.map((p) => h('img', { src: portraitUrl(p), title: nameOf(p) })))));
    }
    return h('div', { class: 'box c2-mapbox' }, h('div', { class: 'small' }, `🗺 Bản đồ trạm${busy ? ' · đang làm thử thách' : ' · bấm phòng để đi'}`), map);
  }

  roomPanel(c2) {
    const id = c2.rooms[G.slot];
    const r = this.C.ROOMS[id];
    const st = stepOf(c2);
    const other = c2.rooms[partner()];
    const notes = r.notes.map((n) => h('button', { class: 'btn small', onclick: () => this.openNote(n) }, `📄 ${n.title}`));
    const canStart = c2.pz && st.room === id && !c2.open && c2.step !== 'end';
    return h('div', { class: 'box c2-roombox' },
      h('div', { class: 'en', style: { fontSize: '28px', lineHeight: 1 } }, r.name),
      h('div', { class: 'small' }, r.vi, ' · ', other === id ? `${nameOf(partner())} ở cùng phòng` : `${nameOf(partner())} đang ở ${this.C.ROOMS[other].vi}`),
      h('div', { class: 'row', style: { marginTop: '6px' } }, ...notes, h('button', { class: 'btn small', onclick: () => this.openWords(c2) }, `📖 Sổ từ chương ${c2.chapter || 2}`)),
      canStart ? h('button', { class: 'btn gold', style: { marginTop: '8px' }, onclick: () => act({ type: 'c2_open' }) }, `▶ Thử thách: ${st.vi}`) : null,
      !canStart && c2.step !== 'end' && st.room !== id ? h('div', { class: 'small', style: { marginTop: '6px' } }, `Thử thách tiếp theo ở: ${this.C.ROOMS[st.room].vi}`) : null,
    );
  }

  openWords(c2) {
    const m = openModal(`📖 Sổ từ chương ${c2.chapter || 2}`, { id: 'c2words', wide: true });
    m.body.append(h('p', { class: 'small' }, `Từ và cụm từ kiểu TOEIC gặp trong chương ${c2.chapter || 2}. Thử thách đã xong có dấu ✓. Bấm 🔊 để nghe.`));
    for (const x of this.C.STEPS.filter((st) => this.C.WORDS[st.id])) {
      m.body.append(h('h3', {}, `${c2.results[x.id] ? '✓ ' : ''}${x.vi}`),
        h('div', { class: 'tx-words' }, ...this.C.WORDS[x.id].map(([en, vi]) => h('div', { class: 'card' },
          h('span', { class: 'en', style: { flex: 1 } }, en), h('span', { class: 'small' }, vi),
          h('button', { class: 'btn small', onclick: () => speak(en, 'narr') }, '🔊')))));
    }
  }

  openNote(n) {
    const m = openModal(`📄 ${n.title}`, { id: 'c2note' });
    m.body.append(h('div', { class: 'note-paper' }, line(n.en, n.vi)));
  }

  // ------------------------------------------------------------ puzzle frame
  puzzlePanel(c2) {
    const pz = c2.pz;
    const P = PUZZLES[pz.kind];
    const st = this.C.STEPS.find((x) => x.id === pz.kind);
    const myRole = roleOf(pz, G.slot);
    const send = (op, extra = {}) => act({ type: 'c2_pz', op, ...extra });
    const wrap = h('div', { class: 'c2-overlay' });
    if (pz.status === 'setup') {
      const card = (role) => {
        const info = ROLE_INFO[role];
        const slot = pz.roles[role];
        return h('div', { class: `role ${slot === G.slot ? 'sel' : ''}` }, h('div', { class: 'role-icon' }, info.icon),
          h('div', {}, h('h3', {}, `${info.vi}: ${nameOf(slot)}${slot === G.slot ? ' (bạn)' : ''}`), h('p', {}, info.desc)));
      };
      const pOn = G.state.players[partner()].connected;
      const meReady = !!pz.ready[G.slot];
      wrap.append(h('div', { class: 'box c2-setup' },
        h('div', { class: 'small' }, `THỬ THÁCH ${this.C.STEPS.findIndex((x) => x.id === pz.kind) + 1}/${this.C.STEPS.length - 1}`),
        h('h2', { class: 'en', style: { fontSize: '36px', margin: '0 0 4px' } }, st.title),
        h('p', {}, st.vi, '. Mỗi người chỉ thấy một nửa thông tin: hãy gọi thoại và nói chuyện bằng tiếng Anh.'),
        h('div', { class: 'roles' }, ...P.roles.map(card)),
        h('div', { class: 'row' }, h('button', { class: 'btn small', onclick: () => send('swap') }, '⇄ Đổi vai')),
        h('div', {}, h('b', {}, 'Mức khó'), h('span', { class: 'small' }, ` (chung, sai tối đa: ${Object.entries(P.strikes).map(([k, v]) => `${LEVELS[k]} ${v - 1}`).join(' · ')})`)),
        h('div', { class: 'seg' }, ...Object.entries(LEVELS).map(([k, v]) => h('button', { class: pz.level === k ? 'on' : '', onclick: () => send('level', { level: k }) }, v))),
        h('div', { class: 'row' },
          h('button', { class: 'btn ghost', onclick: () => act({ type: 'c2_close' }) }, '← Để sau'),
          h('span', { class: 'spacer' }),
          h('span', { class: 'small' }, pOn ? (pz.ready[partner()] ? `✓ ${nameOf(partner())} đã sẵn sàng` : `${nameOf(partner())} đang xem...`) : `${nameOf(partner())} chưa vào`),
          h('button', { class: 'btn gold', disabled: meReady, onclick: () => send('ready') }, meReady ? 'Đang chờ...' : 'Sẵn sàng ▶')),
      ));
      return wrap;
    }
    if (pz.status === 'failed') {
      wrap.append(h('div', { class: 'box c2-setup' },
        h('div', { class: 'logo', style: { fontSize: '40px' } }, 'TRY AGAIN'),
        h('p', {}, `Sai ${pz.strikes} lần rồi. Lần sau sẽ là một đề mới. Có thể đổi vai hoặc hạ mức khó.`),
        h('div', { class: 'row' }, h('span', { class: 'spacer' }), h('button', { class: 'btn gold', onclick: () => send('again') }, '↻ Làm lại'))));
      return wrap;
    }
    if (pz.status !== 'run') return wrap;
    const ui = this.ui[pz.kind] || (this.ui[pz.kind] = {});
    if (ui.attempt !== pz.attempts) { for (const k of Object.keys(ui)) delete ui[k]; ui.attempt = pz.attempts; }
    const body = VIEWS[pz.kind]({ pz, d: pz.data, role: myRole, send, ui, redraw: () => this.render() });
    const strikes = h('span', { class: 'tx-strikes' }, ...Array.from({ length: P.strikes[pz.level] }, (_, i) => h('span', { class: i < pz.strikes ? 'x' : '' }, i < pz.strikes ? '✗' : '○')));
    const phr = PHRASES[myRole] || [];
    this.clockEl = P.timed ? h('div', { class: 'tx-clock en' }) : null;
    wrap.append(h('div', { class: 'c2-run' },
      h('div', { class: 'box c2-runhead' },
        h('div', {}, h('div', { class: 'small' }, `${st.title} · ${LEVELS[pz.level]}`), h('b', {}, `${ROLE_INFO[myRole].icon} Bạn: ${ROLE_INFO[myRole].vi}`)),
        h('span', { class: 'small' }, `${nameOf(partner())}: ${ROLE_INFO[Object.keys(pz.roles).find((r) => r !== myRole)].vi}`),
        this.clockEl,
        strikes),
      h('div', { class: 'c2-cols' },
        h('div', { class: 'c2-main' }, ...body),
        h('div', { class: 'box tx-phrases' }, h('b', {}, '🗣 Câu có thể dùng'), ...phr.map(([en, vi]) => line(en, vi)))),
    ));
    return wrap;
  }

  endPanel(c2) {
    const rows = this.C.STEPS.filter((x) => PUZZLES[x.id]).map((x) => {
      const r = c2.results[x.id];
      const mm = r ? `${Math.floor(r.ms / 60000)}:${String(Math.floor(r.ms / 1000) % 60).padStart(2, '0')}` : '—';
      return h('tr', {}, h('td', {}, x.vi), h('td', {}, r ? LEVELS[r.level] : '—'), h('td', {}, r ? String(r.strikes) : '—'), h('td', {}, r ? String(r.attempts) : '—'), h('td', { class: 'en' }, mm));
    });
    const ch = c2.chapter || 2;
    const table = h('table', { class: 'tx-table' }, h('tr', {}, h('th', {}, 'Thử thách'), h('th', {}, 'Mức'), h('th', {}, 'Sai'), h('th', {}, 'Lượt chơi'), h('th', {}, 'Thời gian')), ...rows);
    if (ch === 3) {
      return h('div', { class: 'c2-overlay' }, h('div', { class: 'box c2-setup' },
        h('div', { class: 'logo', style: { fontSize: '52px' } }, 'THE END'),
        h('p', {}, `${nameOf('p1')} và ${nameOf('p2')} đã đưa bà Eleanor về nhà và giữ cho Ngọn Hải Đăng Chìm luôn sáng. Cảm ơn hai bạn đã chơi Beacon Isle!`),
        table,
        h('div', { class: 'tx-tip' }, 'Muốn luyện thêm: mỗi thử thách của chương 2 và 3 đều tạo đề mới mỗi lần, và có mức Hack não. Chơi lại từ phòng chờ (Chương 2 ▶ / Chương 3 ▶), nhớ đổi vai để luyện cả nói lẫn nghe.'),
        h('div', { class: 'row' },
          h('button', { class: 'btn', onclick: () => this.openWords(c2) }, '📖 Sổ từ chương 3'),
          h('span', { class: 'spacer' }),
          h('button', { class: 'btn gold', onclick: () => { clearLastSession(); G.net.close(); location.href = location.pathname; } }, 'Về màn hình chính')),
      ));
    }
    return h('div', { class: 'c2-overlay' }, h('div', { class: 'box c2-setup' },
      h('div', { class: 'logo', style: { fontSize: '44px' } }, 'SIGNAL SENT!'),
      h('p', {}, `${nameOf('p1')} và ${nameOf('p2')} đã đi hết chương 2: sáu thử thách ở trạm Halcyon.`),
      table,
      h('div', { style: { margin: '6px 0', padding: '10px', border: '2px dashed #4fc1bc', borderRadius: '4px' } },
        h('div', { class: 'en', style: { fontSize: '30px', color: '#2f8f8a' } }, 'To be continued...'),
        h('div', {}, 'Chương 3 — Ngọn Hải Đăng Chìm.')),
      h('div', { class: 'row' },
        h('button', { class: 'btn', onclick: () => this.openWords(c2) }, '📖 Sổ từ chương 2'),
        h('button', { class: 'btn small', onclick: () => act({ type: 'tx_open' }) }, '🧪 Luyện thêm Máy phát'),
        h('span', { class: 'spacer' }),
        h('button', { class: 'btn teal', onclick: () => act({ type: 'ch3_start' }) }, 'Chương 3 ▶')),
    ));
  }

}

