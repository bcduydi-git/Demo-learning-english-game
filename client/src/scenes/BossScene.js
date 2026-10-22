// Boss: The Storm. Each player defends their own lane by typing the words
// on falling clouds. Both lanes share the lamp's hearts and the Storm's HP.

import Phaser from 'phaser';
import { G, act, nameOf, partner, settings, on } from '../ctx.js';
import { net } from '../net.js';
import { BOSS, BOSS_SPEED } from '../../../shared/content.js';
import { sfx, speak, music, ambience } from '../audio.js';
import { h, clear } from '../ui/dom.js';
import { saveSettings } from '../store.js';

let uid = 0;
// like normalize() but keeps a trailing space so "go " can match "go left"
const typeNorm = (t) => String(t || '').toLowerCase().replace(/['’]/g, '').replace(/[^a-z0-9 ]/g, '').replace(/\s+/g, ' ').replace(/^ /, '');

export class BossScene extends Phaser.Scene {
  constructor() {
    super('Boss');
  }

  create() {
    this.clouds = [];
    this.ghosts = new Map();
    this.buf = '';
    this.wave = -1;
    this.spawnT = 1.5;
    this.pausedUntil = 0;
    this.finalBuf = '';
    this.finalDoneLocal = false;
    this.lastLane = 0;
    this.recentWords = [];

    const W = this.scale.width;
    const H = this.scale.height;
    this.bg = this.add.graphics().setDepth(-100);
    this.drawBg();
    this.flash = this.add.rectangle(0, 0, W, H, 0xffffff, 0).setOrigin(0).setDepth(50);
    this.storm = this.add.sprite(W / 2, 190, 'storm', 0).setScale(2).setDepth(5).play('storm_brew');
    this.tweens.add({ targets: this.storm, y: 202, duration: 1600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    this.lampGlow = this.add.image(W / 2, H - 120, 'holeBig').setScale(2.2).setAlpha(0.25).setTint(0xffd27a).setDepth(1).setBlendMode(Phaser.BlendModes.ADD);
    this.lamp = this.add.image(W / 2, H - 120, 'lamp1').setScale(2).setDepth(6);
    this.rain = this.add.particles(0, 0, 'dot', {
      x: { min: 0, max: W + 200 }, y: -10, lifespan: 1200, speedY: { min: 500, max: 650 }, speedX: -140, scaleX: 0.3, scaleY: 2.5,
      alpha: 0.35, tint: 0x9fb4e8, quantity: 3, frequency: 10,
    }).setDepth(2);
    this.beam = this.add.graphics().setDepth(20);
    this.divider = this.add.graphics().setDepth(3);
    this.laneLabels = [
      this.add.text(0, 0, '', { fontFamily: 'VT323', fontSize: '22px', color: '#f39b4f' }).setDepth(4),
      this.add.text(0, 0, '', { fontFamily: 'VT323', fontSize: '22px', color: '#4fc1bc' }).setDepth(4),
    ];
    this.layout();
    this.scale.on('resize', this.layout, this);

    this.hud = h('div', { id: 'bosshud' });
    document.getElementById('ui').append(this.hud);
    this.buildHud();

    this.keyHandler = (e) => this.onKey(e);
    window.addEventListener('keydown', this.keyHandler);
    this.offLane = (slot, d) => { if (slot !== G.slot) this.ghostData = d; };
    net.on('lane', this.offLane);
    this.events.once('shutdown', () => this.cleanup());

    music('boss');
    ambience('storm');
    this.cameras.main.fadeIn(800, 0, 0, 0);
    this.lightningT = 3;
    this.applyState(G.state);
  }

  cleanup() {
    window.removeEventListener('keydown', this.keyHandler);
    const list = net.handlers.lane || [];
    const i = list.indexOf(this.offLane);
    if (i >= 0) list.splice(i, 1);
    this.scale.off('resize', this.layout, this);
    this.hud.remove();
    if (this.overlay) this.overlay.remove();
    G.typing = false;
  }

  // ------------------------------------------------------------ layout
  layout() {
    const W = this.scale.width;
    const H = this.scale.height;
    this.W = W;
    this.H = H;
    this.drawBg();
    this.flash.setSize(W, H);
    this.storm.setPosition(W / 2, this.storm.y);
    this.lamp.setPosition(W / 2, H - 130);
    this.lampGlow.setPosition(W / 2, H - 140);
    this.topY = 270;
    this.bottomY = H - 190;
    const myLeft = G.slot === 'p1';
    this.lanes = {
      me: { x0: myLeft ? 20 : W / 2 + 20, x1: myLeft ? W / 2 - 20 : W - 20 },
      other: { x0: myLeft ? W / 2 + 20 : 20, x1: myLeft ? W - 20 : W / 2 - 20 },
    };
    this.divider.clear();
    this.divider.lineStyle(2, 0x5a6690, 0.5);
    for (let y = this.topY - 30; y < this.bottomY + 40; y += 16) this.divider.lineBetween(W / 2, y, W / 2, y + 8);
    const lp1 = G.slot === 'p1' ? this.lanes.me : this.lanes.other;
    const lp2 = G.slot === 'p2' ? this.lanes.me : this.lanes.other;
    this.laneLabels[0].setText(`◀ ${nameOf('p1')}`).setPosition(lp1.x0 + 4, this.topY - 40);
    this.laneLabels[1].setText(`${nameOf('p2')} ▶`).setPosition(lp2.x1 - 4, this.topY - 40).setOrigin(1, 0);
  }

  drawBg() {
    const W = this.scale.width;
    const H = this.scale.height;
    const g = this.bg;
    g.clear();
    const won = G.state && G.state.boss && G.state.boss.status === 'won';
    const top = won ? 0x1d3566 : 0x0d1022;
    const bot = won ? 0x6a7fb8 : 0x2b2d4e;
    const seaY = H - 200;
    for (let i = 0; i < 24; i++) {
      const c = Phaser.Display.Color.Interpolate.ColorWithColor(Phaser.Display.Color.ValueToColor(top), Phaser.Display.Color.ValueToColor(bot), 23, i);
      g.fillStyle(Phaser.Display.Color.GetColor(c.r, c.g, c.b), 1);
      g.fillRect(0, (seaY / 24) * i, W, seaY / 24 + 1);
    }
    // stars (seeded so they do not jump on resize)
    let seed = 7;
    const rnd = () => ((seed = (seed * 9301 + 49297) % 233280) / 233280);
    g.fillStyle(0xffffff, won ? 0.9 : 0.35);
    for (let i = 0; i < 90; i++) g.fillRect(Math.floor(rnd() * W), Math.floor(rnd() * seaY * 0.8), 2, 2);
    // the sea, with lines of waves
    g.fillStyle(won ? 0x2c5a8c : 0x142a48, 1);
    g.fillRect(0, seaY, W, H - seaY);
    g.fillStyle(won ? 0x72c4e6 : 0x2f5d86, 0.6);
    for (let i = 0; i < 40; i++) g.fillRect(Math.floor(rnd() * W), seaY + 6 + Math.floor(rnd() * 90), 10 + Math.floor(rnd() * 26), 2);
    // lamp-room window frame: wooden mullions with black outlines (pack style)
    const wood = 0xa8572a;
    const woodL = 0xe08a3c;
    const post = (x) => {
      g.fillStyle(0x000000, 1);
      g.fillRect(x - 9, 0, 18, H - 70);
      g.fillStyle(wood, 1);
      g.fillRect(x - 6, 0, 12, H - 70);
      g.fillStyle(woodL, 1);
      g.fillRect(x - 6, 0, 3, H - 70);
    };
    post(W / 4);
    post((W * 3) / 4);
    post(8);
    post(W - 8);
    g.fillStyle(0x000000, 1);
    g.fillRect(0, 0, W, 16);
    g.fillStyle(wood, 1);
    g.fillRect(0, 0, W, 12);
    // sill and stone floor
    g.fillStyle(0x000000, 1);
    g.fillRect(0, H - 76, W, 76);
    g.fillStyle(woodL, 1);
    g.fillRect(0, H - 73, W, 8);
    g.fillStyle(wood, 1);
    g.fillRect(0, H - 65, W, 5);
    for (let y = H - 58; y < H; y += 14) {
      for (let x = ((y / 14) % 2) * 20 - 20; x < W; x += 40) {
        g.fillStyle(0x8a8079, 1);
        g.fillRect(x + 1, y + 1, 37, 11);
        g.fillStyle(0xb0a69c, 1);
        g.fillRect(x + 1, y + 1, 37, 3);
      }
    }
  }

  // ------------------------------------------------------------ HUD / overlays
  buildHud() {
    this.hpFill = h('div', { style: { width: '100%' } });
    this.heartsEl = h('div', { class: 'hearts' });
    this.phaseEl = h('div', { class: 'phase' });
    this.typeBox = h('div', { class: 'box typebox' }, h('div', { class: 'lbl' }, 'Gõ chữ trên mây trong làn của bạn'), h('div', { class: 'buf' }));
    this.otherBox = h('div', { class: 'box typebox', style: { opacity: 0.6 } }, h('div', { class: 'lbl' }, `${nameOf(partner())} đang gõ`), h('div', { class: 'buf' }));
    const myLeft = G.slot === 'p1';
    this.typeBox.style[myLeft ? 'left' : 'right'] = '16px';
    this.otherBox.style[myLeft ? 'right' : 'left'] = '16px';
    this.hud.append(
      h('div', { class: 'box bar' }, this.phaseEl, h('div', { class: 'hp' }, this.hpFill), this.heartsEl),
      this.typeBox, this.otherBox,
    );
  }

  drawHud(b) {
    this.hpFill.style.width = `${Math.max(0, b.hp)}%`;
    clear(this.heartsEl);
    for (let i = 0; i < BOSS.lampHearts; i++) this.heartsEl.append(h('span', { style: { opacity: i < b.lamp ? 1 : 0.2 } }, '💛'));
    const ph = BOSS.phases[b.phase];
    this.phaseEl.textContent = b.status === 'final' ? 'FINAL — The keeper\'s words!' : ph ? ph.title : '';
    this.phaseEl.title = ph ? ph.vi : '';
  }

  showOverlay(content) {
    if (this.overlay) this.overlay.remove();
    this.overlay = null;
    if (!content) return;
    this.overlay = h('div', { class: 'center-overlay' }, h('div', { class: 'box' }, content));
    document.getElementById('ui').append(this.overlay);
  }

  diffPicker() {
    const wrap = h('div', { class: 'seg' });
    const draw = () => {
      clear(wrap);
      for (const [k, v] of Object.entries(BOSS_SPEED)) {
        wrap.append(h('button', { class: settings.boss === k ? 'on' : '', onclick: () => { settings.boss = k; saveSettings(); draw(); } }, v.label));
      }
    };
    draw();
    return wrap;
  }

  rulesOverlay(b) {
    const meReady = !!b.ready[G.slot];
    const pReady = !!b.ready[partner()];
    const pOn = G.state.players[partner()].connected;
    this.showOverlay(h('div', {},
      h('h2', { class: 'en', style: { fontSize: '40px', margin: '0 0 6px', color: '#f2c14e', fontWeight: 'normal' } }, 'The Storm'),
      h('ul', { class: 'rules' },
        h('li', {}, 'Mây chở chữ rơi xuống ngọn đèn. ', h('b', {}, 'Gõ đúng chữ'), ' trên đám mây ', h('b', {}, 'trong làn của bạn'), ' để bắn tia sáng. Không cần Enter.'),
        h('li', {}, 'Gõ sai ký tự: ô gõ nháy đỏ, ký tự đó không được nhận. ', h('span', { class: 'kbd' }, 'Backspace'), ' để xoá. Không phân biệt hoa/thường; dấu \' không bắt buộc.'),
        h('li', {}, 'Mây chạm đèn: đèn mất 1 💛 (cả đội có 5). Hết 💛 là thua — chơi lại trận này, không mất tiến trình.'),
        h('li', {}, '3 đợt: từ đơn → cụm từ → ', h('b', {}, 'tự nhớ'), ' (chỉ thấy nghĩa tiếng Việt, gõ tiếng Anh). Cuối cùng: mỗi người gõ một nửa "lời của người gác đèn".'),
        h('li', {}, 'Tất cả chữ đều là những gì hai bạn đã gặp trên đảo.'),
      ),
      h('div', { class: 'row' }, h('b', {}, 'Tốc độ làn của bạn:'), this.diffPicker()),
      h('p', { class: 'small' }, `Mỗi người chọn tốc độ riêng. ${pOn ? (pReady ? `✓ ${nameOf(partner())} đã sẵn sàng.` : `${nameOf(partner())} đang đọc luật...`) : ''}`),
      h('div', { class: 'row' }, h('span', { class: 'spacer' }),
        h('button', { class: 'btn gold', disabled: meReady, onclick: () => { act({ type: 'boss_ready', diff: settings.boss }); sfx('ui'); } }, meReady ? 'Đang chờ...' : 'Sẵn sàng ▶')),
    ));
  }

  lostOverlay() {
    this.showOverlay(h('div', {},
      h('h2', { class: 'en', style: { fontSize: '40px', margin: '0 0 6px', color: '#e0574b', fontWeight: 'normal' } }, 'The light went out...'),
      h('p', {}, 'Ngọn đèn đã tắt. Đừng lo — chỉ cần chơi lại trận này, mọi tiến trình trên đảo vẫn còn.'),
      this.missed.length ? h('div', {}, h('div', { class: 'small' }, 'Những chữ bị lọt — ôn lại một chút:'), h('div', { class: 'chips' }, ...[...new Set(this.missed)].slice(-8).map((t) => h('button', { class: 'chip', onclick: () => speak(t, 'narr') }, t)))) : null,
      h('div', { class: 'row', style: { marginTop: '10px' } }, h('b', {}, 'Tốc độ làn của bạn:'), this.diffPicker()),
      h('div', { class: 'row', style: { marginTop: '10px' } }, h('span', { class: 'spacer' }),
        h('button', { class: 'btn gold', onclick: () => { act({ type: 'boss_retry', diff: settings.boss }); sfx('ui'); } }, 'Thử lại ↻')),
    ));
  }

  // ------------------------------------------------------------ state
  applyState(s) {
    const b = s.boss;
    if (!b) { this.showOverlay(null); G.typing = false; return; }
    this.drawHud(b);
    this.lamp.setTexture(b.lamp > 0 ? 'lamp1' : 'lamp0');
    this.lampGlow.setAlpha(0.06 + 0.06 * b.lamp);
    const fighting = b.status === 'fight' || b.status === 'final';
    G.typing = fighting && !s.scene;
    if (s.scene) { this.showOverlay(null); return; }
    if (b.status === 'rules') this.rulesOverlay(b);
    else if (b.status === 'lost') this.lostOverlay();
    else this.showOverlay(null);
    if (b.wave !== this.wave) {
      this.wave = b.wave;
      this.resetLane();
    }
    if (b.status === 'final' && !this.finalMode) this.enterFinal(Math.max(3000, b.finalEndsAt - Date.now()));
    if (b.status !== 'final' && this.finalMode && b.status !== 'won') this.exitFinal();
    if (b.status === 'won' && !this.wonFx) {
      this.wonFx = true;
      this.exitFinal();
      this.victory();
    }
    this.statusSeen = b.status;
  }

  resetLane() {
    for (const c of this.clouds) c.obj.destroy();
    this.clouds = [];
    this.buf = '';
    this.missed = this.missed || [];
    this.spawnT = 1.2;
    this.renderBuf();
  }

  onEvent(e) {
    switch (e.e) {
      case 'boss_go':
        this.missed = [];
        this.banner(BOSS.phases[0].title, BOSS.phases[0].vi);
        sfx('thunder');
        break;
      case 'boss_hit':
        this.stormHit();
        break;
      case 'boss_phase': {
        const ph = BOSS.phases[e.phase];
        this.resetLane();
        this.pausedUntil = this.time.now + 2500;
        this.banner(ph.title, ph.vi);
        sfx('thunder');
        this.lightning();
        break;
      }
      case 'boss_final':
        this.enterFinal(e.ms);
        break;
      case 'final_fail':
        sfx('heart');
        this.cameras.main.shake(400, 0.01);
        this.finalDoneLocal = false;
        this.finalBuf = '';
        this.enterFinal(e.ms, true);
        break;
      case 'final_part':
        if (e.by !== G.slot) sfx('zap');
        break;
      case 'lamp_hit':
        sfx('heart');
        this.cameras.main.shake(250, 0.008);
        this.lamp.setTint(0xff7777);
        this.time.delayedCall(250, () => this.lamp.clearTint());
        break;
      case 'boss_lost':
        sfx('fail');
        this.lightning();
        break;
      case 'boss_won':
        sfx('success');
        break;
      default:
        break;
    }
  }

  banner(title, vi) {
    const t = this.add.text(this.W / 2, this.H / 2 - 40, title, { fontFamily: 'VT323', fontSize: '54px', color: '#f2c14e', stroke: '#2a1f2d', strokeThickness: 6 }).setOrigin(0.5).setDepth(60);
    const t2 = this.add.text(this.W / 2, this.H / 2 + 6, vi || '', { fontFamily: 'Be Vietnam Pro', fontSize: '18px', color: '#ffffff', stroke: '#2a1f2d', strokeThickness: 4 }).setOrigin(0.5).setDepth(60);
    this.tweens.add({ targets: [t, t2], alpha: 0, delay: 1800, duration: 600, onComplete: () => { t.destroy(); t2.destroy(); } });
  }

  // ------------------------------------------------------------ typing
  onKey(e) {
    const b = G.state && G.state.boss;
    if (!b || G.busy || G.state.scene) return;
    if (b.status !== 'fight' && b.status !== 'final') return;
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.key === 'Backspace') {
      e.preventDefault();
      if (this.finalMode) this.finalBuf = this.finalBuf.slice(0, -1);
      else this.buf = this.buf.slice(0, -1);
      this.renderBuf();
      return;
    }
    if (e.key === 'Escape') { this.buf = ''; this.renderBuf(); return; }
    if (e.key.length !== 1) return;
    e.preventDefault();
    const ch = e.key.toLowerCase();
    if (ch === "'" || ch === '’') return; // apostrophes are optional
    if (!/[a-z0-9 ]/.test(ch)) return;
    if (this.finalMode) { this.typeFinal(ch); return; }
    if (ch === ' ' && (!this.buf || this.buf.endsWith(' '))) return;
    const cand = this.buf + ch;
    const nc = typeNorm(cand);
    const ok = this.clouds.some((c) => c.norm.startsWith(nc));
    if (!ok) {
      sfx('wrong');
      this.typeBox.classList.remove('bad');
      void this.typeBox.offsetWidth;
      this.typeBox.classList.add('bad');
      setTimeout(() => this.typeBox.classList.remove('bad'), 250);
      return;
    }
    sfx('key');
    this.buf = cand;
    const n = typeNorm(this.buf);
    const done = this.clouds.filter((c) => c.norm === n).sort((a, b2) => b2.p - a.p)[0];
    if (done) this.hitCloud(done);
    this.renderBuf();
  }

  typeFinal(ch) {
    if (this.finalDoneLocal) return;
    const target = BOSS.final[G.slot];
    const cand = this.finalBuf + ch;
    if (!target.startsWith(cand)) { sfx('wrong'); this.typeBox.classList.add('bad'); setTimeout(() => this.typeBox.classList.remove('bad'), 250); return; }
    sfx('key');
    this.finalBuf = cand;
    if (cand === target) {
      this.finalDoneLocal = true;
      act({ type: 'boss_final' });
      sfx('zap');
      this.fireBeam(this.W / 2, 110, 0xfff3c0);
    }
    this.renderBuf();
  }

  renderBuf() {
    const el = this.typeBox.querySelector('.buf');
    if (this.finalMode) {
      const target = BOSS.final[G.slot];
      el.innerHTML = '';
      el.append(h('span', { style: { color: '#3c8a2c' } }, this.finalBuf), h('span', { style: { color: '#b9a59c' } }, target.slice(this.finalBuf.length)));
      if (this.finalDoneLocal) el.append(h('div', { class: 'lbl' }, `✓ Xong! Chờ ${nameOf(partner())}...`));
      return;
    }
    el.textContent = this.buf || ' ';
  }

  // ------------------------------------------------------------ clouds
  pickItem(phase) {
    const items = BOSS.phases[phase].items;
    for (let tries = 0; tries < 10; tries++) {
      const it = items[Math.floor(Math.random() * items.length)];
      const key = typeof it === 'string' ? it : it.en;
      if (!this.recentWords.includes(key) && !this.clouds.some((c) => c.target === key)) {
        this.recentWords.push(key);
        if (this.recentWords.length > Math.min(6, items.length - 2)) this.recentWords.shift();
        return it;
      }
    }
    return items[Math.floor(Math.random() * items.length)];
  }

  spawnCloud(phase) {
    const it = this.pickItem(phase);
    const target = typeof it === 'string' ? it : it.en;
    const recall = typeof it !== 'string';
    const sp = BOSS_SPEED[settings.boss] || BOSS_SPEED.normal;
    const dur = sp.base + sp.perChar * target.length + (recall ? 3 : 0);
    let hint = '';
    if (recall) {
      const words = target.split(' ');
      if (settings.boss === 'relaxed') hint = words.map((w) => w[0] + '_'.repeat(Math.max(0, w.replace(/'/g, '').length - 1))).join(' ');
      else if (settings.boss === 'normal') hint = words.map((w) => '_'.repeat(w.replace(/'/g, '').length)).join(' ');
    }
    const c = {
      id: ++uid, target, norm: typeNorm(target), recall, vi: recall ? it.vi : '', hint,
      xf: 0.15 + Math.random() * 0.7, p: 0, dur, spoke: false,
    };
    c.obj = this.makeCloudObj(c, false);
    this.clouds.push(c);
    if (recall && settings.boss === 'relaxed') { speak(target, 'storm'); c.spoke = true; }
  }

  makeCloudObj(c, ghost) {
    const cont = this.add.container(0, 0).setDepth(ghost ? 8 : 10);
    const label = c.recall ? c.vi : c.target;
    const txt = this.add.text(0, -1, label, { fontFamily: c.recall ? 'Be Vietnam Pro' : 'VT323', fontSize: c.recall ? '17px' : '30px', color: '#3b2a2a', fontStyle: c.recall ? 'bold' : '' }).setOrigin(0.5);
    const w = Math.max(96, txt.width + 44);
    const g = this.add.graphics();
    // storm cloud carrying the word: dark puffs around a paper label
    g.fillStyle(0x000000, 1);
    for (const [dx, dy, r] of [[-w / 2 + 8, -6, 18], [-w / 4, -22, 18], [w / 8, -26, 22], [w / 2 - 10, -8, 18]]) g.fillCircle(dx, dy, r + 3);
    g.fillStyle(0x4a4f6a, 1);
    for (const [dx, dy, r] of [[-w / 2 + 8, -6, 18], [-w / 4, -22, 18], [w / 8, -26, 22], [w / 2 - 10, -8, 18]]) g.fillCircle(dx, dy, r);
    g.fillStyle(0x6d7393, 1);
    g.fillCircle(-w / 4 - 4, -28, 7);
    g.fillCircle(w / 8 - 6, -34, 8);
    g.fillStyle(0x000000, 1);
    g.fillRoundedRect(-w / 2 - 3, -21, w + 6, 42, 9);
    g.fillStyle(0xb7604f, 1);
    g.fillRoundedRect(-w / 2, -18, w, 36, 7);
    g.fillStyle(0xffb66e, 1);
    g.fillRoundedRect(-w / 2 + 2, -16, w - 4, 32, 6);
    g.fillStyle(0xfbedea, 1);
    g.fillRoundedRect(-w / 2 + 5, -13, w - 10, 26, 4);
    cont.add(g);
    cont.add(txt);
    if (c.recall && c.hint) {
      cont.add(this.add.text(0, 32, c.hint, { fontFamily: 'VT323', fontSize: '24px', color: '#b4ffe0', stroke: '#000000', strokeThickness: 4 }).setOrigin(0.5));
    }
    if (!ghost) {
      c.typed = this.add.text(0, c.recall ? 54 : 32, '', { fontFamily: 'VT323', fontSize: '24px', color: '#8dff6a', stroke: '#000000', strokeThickness: 4 }).setOrigin(0.5);
      cont.add(c.typed);
    }
    if (ghost) cont.setAlpha(0.5);
    return cont;
  }

  cloudPos(c, lane) {
    const x = lane.x0 + 50 + (lane.x1 - lane.x0 - 100) * c.xf;
    const y = this.topY + (this.bottomY - this.topY) * c.p;
    return { x, y };
  }

  hitCloud(c) {
    const pos = this.cloudPos(c, this.lanes.me);
    this.fireBeam(pos.x, pos.y);
    sfx('zap');
    const em = this.add.particles(pos.x, pos.y, 'dot', { speed: { min: 40, max: 160 }, lifespan: 500, scale: { start: 1.2, end: 0 }, tint: [0xffe7a0, 0xffffff], emitting: false }).setDepth(30);
    em.explode(24);
    this.time.delayedCall(600, () => em.destroy());
    c.obj.destroy();
    this.clouds = this.clouds.filter((x) => x !== c);
    this.buf = '';
    act({ type: 'boss_hit', recall: c.recall, text: c.target });
  }

  fireBeam(x, y, color = 0xffe7a0) {
    const g = this.beam;
    g.clear();
    g.lineStyle(10, color, 0.35);
    g.lineBetween(this.lamp.x, this.lamp.y - 30, x, y);
    g.lineStyle(4, 0xffffff, 0.9);
    g.lineBetween(this.lamp.x, this.lamp.y - 30, x, y);
    this.tweens.addCounter({ from: 1, to: 0, duration: 220, onUpdate: (tw) => g.setAlpha(tw.getValue()), onComplete: () => { g.clear(); g.setAlpha(1); } });
  }

  stormHit() {
    this.storm.setTint(0xffffff);
    this.tweens.add({ targets: this.storm, x: this.W / 2 + 6, duration: 50, yoyo: true, repeat: 2, onComplete: () => this.storm.setX(this.W / 2) });
    this.time.delayedCall(120, () => this.storm.clearTint());
  }

  leak(c) {
    c.obj.destroy();
    this.clouds = this.clouds.filter((x) => x !== c);
    this.missed.push(c.target);
    const t = this.add.text(this.lamp.x + (Math.random() - 0.5) * 120, this.lamp.y - 90, `✗ ${c.target}`, { fontFamily: 'VT323', fontSize: '30px', color: '#ffb3a8', stroke: '#1a1020', strokeThickness: 4 }).setOrigin(0.5).setDepth(40);
    this.tweens.add({ targets: t, y: '-=40', alpha: 0, duration: 1800, onComplete: () => t.destroy() });
    if (typeNorm(this.buf) && c.norm.startsWith(typeNorm(this.buf)) && !this.clouds.some((x) => x.norm.startsWith(typeNorm(this.buf)))) this.buf = '';
    this.renderBuf();
    this.lightningAt(this.lamp.x, this.lamp.y);
    act({ type: 'boss_leak' });
  }

  lightning() {
    this.flash.setFillStyle(0xffffff, 0.7);
    this.tweens.add({ targets: this.flash, fillAlpha: 0, duration: 400 });
  }

  lightningAt(x, y) {
    const g = this.add.graphics().setDepth(25);
    g.lineStyle(4, 0xfff6a0, 1);
    let px = x + (Math.random() - 0.5) * 60;
    let py = this.topY - 40;
    while (py < y - 20) {
      const nx = px + (Math.random() - 0.5) * 40;
      const ny = py + 30 + Math.random() * 20;
      g.lineBetween(px, py, nx, ny);
      px = nx;
      py = ny;
    }
    this.tweens.add({ targets: g, alpha: 0, duration: 300, onComplete: () => g.destroy() });
    sfx('hit');
  }

  // ------------------------------------------------------------ final strike
  enterFinal(ms, again = false) {
    this.finalMode = true;
    for (const c of this.clouds) c.obj.destroy();
    this.clouds = [];
    this.finalEnd = this.time.now + (ms || 25000);
    if (!again) { this.finalBuf = ''; this.finalDoneLocal = false; }
    if (!this.finalText) {
      this.finalText = this.add.text(this.W / 2, this.H / 2 - 30, '', { fontFamily: 'VT323', fontSize: '40px', color: '#ffffff', stroke: '#1a1020', strokeThickness: 6, align: 'center' }).setOrigin(0.5).setDepth(45);
      this.finalSub = this.add.text(this.W / 2, this.H / 2 + 20, '', { fontFamily: 'Be Vietnam Pro', fontSize: '17px', color: '#ffe7a0', stroke: '#1a1020', strokeThickness: 4, align: 'center' }).setOrigin(0.5).setDepth(45);
      this.timerBar = this.add.rectangle(this.W / 2, this.H / 2 + 56, 400, 10, 0xf2c14e).setDepth(45);
    }
    this.finalText.setVisible(true).setText(`"${BOSS.final.p1}, ${BOSS.final.p2}."`);
    this.finalSub.setVisible(true).setText(`Đòn cuối! ${nameOf('p1')} gõ "${BOSS.final.p1}" · ${nameOf('p2')} gõ "${BOSS.final.p2}" — trước khi hết giờ.`);
    this.timerBar.setVisible(true);
    if (!again) { this.banner('FINAL STRIKE', 'Lời của người gác đèn!'); speak('Hold on, help is coming.', 'keeper'); }
    this.renderBuf();
  }

  exitFinal() {
    this.finalMode = false;
    if (this.finalText) { this.finalText.setVisible(false); this.finalSub.setVisible(false); this.timerBar.setVisible(false); }
    this.finalBuf = '';
    this.finalDoneLocal = false;
    this.renderBuf();
  }

  victory() {
    sfx('success');
    music('victory');
    ambience('island');
    this.rain.stop();
    this.lightning();
    this.tweens.add({ targets: this.storm, alpha: 0, scale: 3, duration: 1800 });
    this.lampGlow.setAlpha(0.6);
    this.tweens.add({ targets: this.lampGlow, scale: 7, duration: 2000 });
    this.drawBg();
    G.typing = false;
  }

  // ------------------------------------------------------------ loop
  update(time, dtMs) {
    const dt = Math.min(0.05, dtMs / 1000);
    const s = G.state;
    const b = s && s.boss;
    this.lightningT -= dt;
    if (this.lightningT <= 0 && (!b || b.status !== 'won')) {
      this.lightningT = 5 + Math.random() * 8;
      this.lightning();
      sfx('thunder');
    }
    if (!b) return;
    const fighting = b.status === 'fight' && !s.scene;
    if (fighting && time > this.pausedUntil) {
      const sp = BOSS_SPEED[settings.boss] || BOSS_SPEED.normal;
      this.spawnT -= dt;
      const maxClouds = b.phase === 2 ? 2 : 3;
      if (this.spawnT <= 0 && this.clouds.length < maxClouds) {
        this.spawnCloud(b.phase);
        this.spawnT = sp.gap * (b.phase === 2 ? 1.5 : 1) * (0.85 + Math.random() * 0.3);
      }
      for (const c of [...this.clouds]) {
        c.p += dt / c.dur;
        if (c.recall && !c.spoke && c.p > 0.5) { c.spoke = true; speak(c.target, 'storm'); }
        if (c.p >= 1) this.leak(c);
      }
    }
    // draw my clouds + typed progress
    const n = typeNorm(this.buf);
    let best = null;
    for (const c of this.clouds) {
      const pos = this.cloudPos(c, this.lanes.me);
      c.obj.setPosition(pos.x, pos.y);
      const match = n && c.norm.startsWith(n);
      if (match && (!best || c.p > best.p)) best = c;
      c.typed.setText(match ? c.target.slice(0, this.typedLen(c.target, n)) : '');
    }
    for (const c of this.clouds) c.obj.setScale(c === best ? 1.08 : 1);

    // final timer
    if (this.finalMode && this.timerBar) {
      const left = Math.max(0, this.finalEnd - time);
      this.timerBar.width = 400 * Math.min(1, left / 25000);
      this.timerBar.fillColor = left < 6000 ? 0xe0574b : 0xf2c14e;
    }

    // send my lane to partner ~6x/s
    if (time - this.lastLane > 160) {
      this.lastLane = time;
      net.lane({ c: this.clouds.map((c) => [c.id, c.recall ? c.vi : c.target, +c.xf.toFixed(3), +c.p.toFixed(3), c.recall ? 1 : 0]), b: this.finalMode ? this.finalBuf : this.buf, f: this.finalDoneLocal ? 1 : 0 });
    }
    this.drawGhosts();
  }

  typedLen(target, n) {
    // map normalised length back onto the displayed text (skip apostrophes)
    let i = 0;
    let k = 0;
    while (i < target.length && k < n.length) {
      if (target[i] === "'") { i++; continue; }
      i++;
      k++;
    }
    return i;
  }

  drawGhosts() {
    const d = this.ghostData;
    const seen = new Set();
    if (d && d.c && !this.finalMode) {
      for (const [id, text, xf, p, recall] of d.c) {
        seen.add(id);
        let gobj = this.ghosts.get(id);
        if (!gobj) {
          gobj = this.makeCloudObj({ target: text, vi: text, recall: !!recall, hint: '' }, true);
          this.ghosts.set(id, gobj);
        }
        const pos = this.cloudPos({ xf, p }, this.lanes.other);
        gobj.x += (pos.x - gobj.x) * 0.3 || pos.x;
        gobj.y += (pos.y - gobj.y) * 0.3;
        if (gobj.y === 0) gobj.setPosition(pos.x, pos.y);
      }
    }
    for (const [id, gobj] of this.ghosts) {
      if (!seen.has(id)) { gobj.destroy(); this.ghosts.delete(id); }
    }
    const ob = this.otherBox.querySelector('.buf');
    const txt = d ? (d.f ? '✓' : d.b || ' ') : ' ';
    if (ob.textContent !== txt) ob.textContent = txt;
  }
}

on('noop', () => {});
