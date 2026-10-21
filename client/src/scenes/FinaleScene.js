// Finale: the radio call with the rescue ship (answer in your own words),
// then guiding the boat through the dark bay. One player turns the lamp and
// sees the rocks; the other gives the boat its commands. Roles swap halfway.

import Phaser from 'phaser';
import { G, act, nameOf, partner, settings, on } from '../ctx.js';
import { CALL, BAY, BOAT_COMMANDS } from '../../../shared/content.js';
import { mastLane } from '../../../shared/logic.js';
import { sfx, speak, music, ambience, speechInputSupported, listenOnce, stopSpeech } from '../audio.js';
import { h, clear, portraitUrl } from '../ui/dom.js';
import { PHRASE_BY_ID } from '../../../shared/phrases.js';
import { toast } from '../ui/hud.js';

const LANE_W = 48;
const ROW_H = 40;
const X0 = 60;
const BASE_Y = BAY.rows.length * ROW_H + 260;

export class FinaleScene extends Phaser.Scene {
  constructor() {
    super('Finale');
  }

  create() {
    this.mode = null;
    this.hintLevel = 0;
    this.beamShown = 0;
    this.lastBeamSent = 0;
    this.keys = this.input.keyboard.addKeys('LEFT,RIGHT,A,D');
    this.ui = h('div', { class: 'pass' });
    document.getElementById('ui').append(this.ui);
    this.events.once('shutdown', () => { this.ui.remove(); G.typing = false; stopSpeech(); });
    this.scale.on('resize', this.onResize, this);
    this.events.once('shutdown', () => this.scale.off('resize', this.onResize, this));
    music('night');
    ambience('island');
    this.cameras.main.fadeIn(800, 0, 0, 0);
    this.applyState(G.state);
  }

  onResize() {
    if (this.mode === 'boat') this.fitBoatCamera();
    if (this.mode === 'call') this.buildCallBg();
  }

  applyState(s) {
    const want = s.boat || (s.call && s.call.q >= CALL.length) ? 'boat' : 'call';
    if (want !== this.mode) {
      this.children.removeAll(true);
      this.mode = want;
      if (want === 'call') this.buildCallBg();
      else this.buildBay();
    }
    if (this.mode === 'call') this.renderCall(s);
    else this.renderBoatUi(s);
  }

  // ------------------------------------------------------------ call
  buildCallBg() {
    this.children.removeAll(true);
    const W = this.scale.width;
    const H = this.scale.height;
    const g = this.add.graphics();
    for (let i = 0; i < 20; i++) {
      const c = Phaser.Display.Color.Interpolate.ColorWithColor(Phaser.Display.Color.ValueToColor(0x0b1230), Phaser.Display.Color.ValueToColor(0x24345e), 19, i);
      g.fillStyle(Phaser.Display.Color.GetColor(c.r, c.g, c.b), 1);
      g.fillRect(0, (H * 0.6 / 20) * i, W, H * 0.6 / 20 + 1);
    }
    g.fillStyle(0x10223d, 1);
    g.fillRect(0, H * 0.6, W, H * 0.4);
    for (let i = 0; i < 70; i++) {
      this.add.rectangle(Math.random() * W, Math.random() * H * 0.55, 2, 2, 0xffffff, Math.random() * 0.8 + 0.2);
    }
    // lighthouse silhouette with a sweeping beam
    const lx = W * 0.22;
    const ly = H * 0.6;
    this.add.image(lx, ly, 'lighthouse_on').setOrigin(0.5, 1).setScale(2);
    const beam = this.add.graphics().setBlendMode(Phaser.BlendModes.ADD);
    beam.fillStyle(0xffe7a0, 0.18);
    beam.fillTriangle(0, 0, 1400, -70, 1400, 70);
    beam.setPosition(lx, ly - 260);
    this.tweens.add({ targets: beam, angle: { from: -15, to: 25 }, duration: 4000, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    // the ship's light far away
    const ship = this.add.rectangle(W * 0.78, H * 0.6 - 6, 6, 6, 0xff5555);
    this.tweens.add({ targets: ship, alpha: 0.2, duration: 600, yoyo: true, repeat: -1 });
    this.add.rectangle(W * 0.78 + 14, H * 0.6 - 4, 18, 4, 0x8899aa);
    // waves
    for (let i = 0; i < 30; i++) {
      const w = this.add.rectangle(Math.random() * W, H * 0.62 + Math.random() * H * 0.36, 10 + Math.random() * 20, 2, 0x5a7fb0, 0.5);
      this.tweens.add({ targets: w, x: '+=30', alpha: 0.1, duration: 2000 + Math.random() * 2000, yoyo: true, repeat: -1 });
    }
  }

  renderCall(s) {
    const c = s.call;
    if (!c || s.scene) { clear(this.ui); this.callKey = null; G.typing = false; return; }
    const q = CALL[c.q];
    if (!q) { clear(this.ui); return; }
    const key = `${c.q}`;
    const mine = q.to === G.slot || !s.players[q.to].connected;
    G.typing = mine;
    if (this.callKey === key) {
      this.updateCallTries(c);
      return;
    }
    this.callKey = key;
    this.hintLevel = 0;
    clear(this.ui);
    const qText = h('div', { class: 'en' }, settings.sub === 'always' ? q.q.en : '🎧 ...');
    const viEl = h('div', { class: `small ${settings.vi === 'always' ? '' : 'hidden'}` }, q.q.vi);
    const play = (rate = 1) => speak(q.q.en, 'captain', { rate }).then(() => { if (settings.sub === 'after') qText.textContent = q.q.en; });
    const hintEl = h('div', { class: 'hint' });
    const input = h('input', { type: 'text', class: 'en-input', maxlength: 100, placeholder: mine ? 'Trả lời bằng tiếng Anh...' : '', style: { flex: 1 }, disabled: !mine });
    const submit = (text, spoken = false) => {
      const t = (text ?? input.value).trim();
      if (!t) return;
      act({ type: 'call_answer', q: c.q, text: t, hinted: this.hintLevel > 0, spoken });
      sfx('radio');
      input.value = '';
    };
    input.addEventListener('keydown', (e) => { e.stopPropagation(); if (e.key === 'Enter') submit(); });
    const mic = mine && speechInputSupported() && settings.mic ? h('button', { class: 'btn', onclick: async (e) => {
      const b = e.currentTarget;
      b.disabled = true;
      hintEl.textContent = '🎙 Đang nghe...';
      try { const t = await listenOnce(); input.value = t; hintEl.textContent = 'Kiểm tra câu trên rồi bấm Gửi.'; } catch { hintEl.textContent = 'Micro không nghe rõ — gõ câu trả lời nhé.'; }
      b.disabled = false;
      input.focus();
    } }, '🎙') : null;
    const hintBtn = h('button', { class: 'btn small', onclick: () => {
      this.hintLevel = Math.min(2, this.hintLevel + 1);
      if (this.hintLevel === 1) hintEl.textContent = q.model.split(' ').map((w) => w[0] + w.slice(1).replace(/[a-z]/gi, '_')).join(' ');
      else { hintEl.textContent = `${q.model}  —  ${PHRASE_BY_ID[q.phrase] ? PHRASE_BY_ID[q.phrase].vi : ''}`; }
    } }, '💡 Gợi ý');
    this.triesEl = h('div', { class: 'small' });
    this.modelBtn = h('button', { class: 'btn small hidden', onclick: () => submit(q.model) }, `Gửi câu mẫu: "${q.model}"`);
    const box = h('div', { id: 'call', class: 'box' },
      h('img', { src: portraitUrl('captain') }),
      h('div', { style: { flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' } },
        h('div', { class: 'name en', style: { fontSize: '24px', color: '#f2c14e' } }, `📻 Captain Marlow · ${mine ? 'hỏi bạn' : `hỏi ${nameOf(q.to)}`}`),
        h('div', { class: 'q' }, qText, viEl),
        h('div', { class: 'row' },
          h('button', { class: 'btn small', onclick: () => play(1) }, '🔊'),
          h('button', { class: 'btn small', onclick: () => play(0.75) }, '🐢'),
          settings.sub !== 'always' ? h('button', { class: 'btn small', onclick: () => { qText.textContent = q.q.en; } }, 'Hiện chữ') : null,
          settings.vi !== 'off' && settings.vi !== 'always' ? h('button', { class: 'btn small', onclick: () => viEl.classList.toggle('hidden') }, 'VI') : null,
          mine ? hintBtn : null,
        ),
        mine
          ? h('div', { class: 'row' }, input, mic, h('button', { class: 'btn gold', onclick: () => submit() }, 'Gửi'))
          : h('div', { class: 'small' }, `Đến lượt ${nameOf(q.to)} trả lời. Bạn có thể nhắc nhỏ qua cuộc gọi!`),
        hintEl, this.triesEl, this.modelBtn,
        h('div', { class: 'small' }, 'Không cần đúng ngữ pháp từng chữ — thuyền trưởng chỉ cần hiểu ý chính.'),
      ),
    );
    this.ui.append(box);
    sfx('radio');
    setTimeout(() => play(1), 400);
    if (mine) setTimeout(() => input.focus(), 50);
    this.updateCallTries(c);
  }

  updateCallTries(c) {
    if (!this.triesEl) return;
    this.triesEl.textContent = c.tries ? `Thuyền trưởng chưa hiểu (${c.tries} lần). Thử nói khác đi, hoặc dùng 💡.` : '';
    if (c.tries >= 3) this.modelBtn.classList.remove('hidden');
  }

  // ------------------------------------------------------------ bay
  buildBay() {
    clear(this.ui);
    this.callKey = null;
    const width = X0 * 2 + LANE_W * (BAY.lanes - 1);
    this.bayW = width;
    this.add.tileSprite(-200, 0, width + 400, BASE_Y + 200, 'water0').setOrigin(0).setDepth(-10);
    // shore + dock at the top
    const g = this.add.graphics().setDepth(-5);
    g.fillStyle(0xd8c08a, 1);
    g.fillRect(-200, 0, width + 400, 70);
    g.fillStyle(0x5d9c3f, 1);
    g.fillRect(-200, 0, width + 400, 40);
    g.fillStyle(0x94602e, 1);
    g.fillRect(width / 2 - 20, 60, 40, 80);
    for (let y = 64; y < 140; y += 8) { g.fillStyle(0x744820, 1); g.fillRect(width / 2 - 20, y, 40, 2); }
    this.add.image(width / 2, 40, 'lighthouse_on').setOrigin(0.5, 1).setDepth(-4);
    // rocks
    this.rocks = [];
    BAY.rows.forEach((row, r) => {
      [...row].forEach((ch, l) => {
        if (ch === 'R') this.rocks.push(this.add.image(X0 + l * LANE_W, BASE_Y - r * ROW_H - ROW_H / 2, 'searock').setScale(1.4).setDepth(1));
      });
    });
    const mastRow = BAY.rows.findIndex((r) => r.includes('M'));
    this.mastY = BASE_Y - mastRow * ROW_H - ROW_H / 2;
    this.mast = this.add.image(0, this.mastY, 'mast').setDepth(2).setScale(1.6);
    this.boat = this.add.image(X0 + BAY.startLane * LANE_W, BASE_Y, 'boat').setDepth(3).setScale(1.2);
    this.wake = this.add.particles(0, 0, 'dot', { lifespan: 900, speedY: { min: 10, max: 30 }, speedX: { min: -12, max: 12 }, scale: { start: 0.8, end: 0 }, alpha: { start: 0.6, end: 0 }, frequency: 60, tint: 0xeaf7ff }).setDepth(2);
    // darkness with the lamp's beam cut out
    this.dark = this.add.renderTexture(-200, 0, width + 400, BASE_Y + 200).setOrigin(0).setDepth(10);
    this.cone = this.make.graphics({ add: false });
    this.beamLine = this.add.graphics().setDepth(11).setBlendMode(Phaser.BlendModes.ADD);
    this.bubble = this.add.text(0, 0, '', { fontFamily: 'VT323', fontSize: '16px', color: '#2a1f2d', backgroundColor: '#f3efe4', padding: { x: 4, y: 2 } }).setOrigin(0.5, 1).setDepth(20).setResolution(3);
    this.cameras.main.setBounds(-200, -40, width + 400, BASE_Y + 240);
    this.fitBoatCamera();
    this.boatUiKey = null;
    this.input.on('pointermove', (p) => this.onPointer(p));
  }

  fitBoatCamera() {
    const cam = this.cameras.main;
    cam.setZoom(Math.max(1, Math.min(this.scale.width / (this.bayW + 140), this.scale.height / 420)));
    cam.startFollow(this.boat, true, 0.08, 0.08, 0, -this.scale.height / cam.zoom * 0.18);
  }

  onPointer(p) {
    const b = G.state.boat;
    if (!b || b.beamer !== G.slot) return;
    const cx = this.scale.width / 2;
    this.localBeam = Phaser.Math.Clamp(((p.x - cx) / (this.scale.width / 2.4)) * 70, -70, 70);
  }

  renderBoatUi(s) {
    const b = s.boat;
    if (!b || s.scene) {
      if (this.boatUiKey !== 'none') { clear(this.ui); this.boatUiKey = 'none'; }
      G.typing = false;
      return;
    }
    const role = b.commander === G.slot ? 'cmd' : 'beam';
    const key = `${role}:${b.swapped}:${b.done}`;
    if (b.done) { clear(this.ui); return; }
    if (this.boatUiKey === key) return;
    this.boatUiKey = key;
    clear(this.ui);
    G.typing = role === 'cmd';
    if (role === 'cmd') {
      const input = h('input', { type: 'text', class: 'en-input', maxlength: 40, placeholder: 'Gõ lệnh cho thuyền...', style: { flex: 1 } });
      const send = (text, spoken = false) => {
        const t = (text ?? input.value).trim();
        if (!t) return;
        act({ type: 'boat_cmd', text: t, spoken });
        input.value = '';
      };
      input.addEventListener('keydown', (e) => { e.stopPropagation(); if (e.key === 'Enter') send(); });
      const hint = h('div', { class: 'small hidden' }, 'Lệnh: ', ...BOAT_COMMANDS.map((c) => h('span', { class: 'en', style: { fontSize: '20px', marginRight: '10px', color: '#fff' } }, c.words[0])));
      const micNote = h('span', { class: 'small' });
      const mic = speechInputSupported() && settings.mic ? h('button', { class: 'btn', title: 'Nói lệnh tiếng Anh', onclick: async (e) => {
        const btn = e.currentTarget;
        btn.disabled = true;
        micNote.textContent = '🎙 Đang nghe...';
        try { const t = await listenOnce(); micNote.textContent = `Máy nghe: "${t}"`; send(t, true); } catch { micNote.textContent = 'Không nghe rõ — gõ lệnh nhé.'; }
        btn.disabled = false;
        input.focus();
      } }, '🎙') : null;
      this.ui.append(h('div', { id: 'call', class: 'box', style: { flexDirection: 'column', gap: '8px' } },
        h('div', {}, h('b', {}, '⛵ Bạn chỉ huy con thuyền. '), `Trời tối, bạn không thấy đá. Nghe ${nameOf(partner())} (đang cầm đèn) chỉ đường rồi gõ lệnh tiếng Anh. Thuyền chỉ di chuyển khi bạn ra lệnh "keep going".`),
        h('div', { class: 'row' }, input, mic, h('button', { class: 'btn gold', onclick: () => send() }, 'Ra lệnh')),
        h('div', { class: 'row' }, h('button', { class: 'btn small', onclick: () => hint.classList.toggle('hidden') }, '💡 Danh sách lệnh'), micNote),
        hint,
      ));
      setTimeout(() => input.focus(), 50);
    } else {
      this.ui.append(h('div', { id: 'call', class: 'box', style: { flexDirection: 'column', gap: '6px' } },
        h('div', {}, h('b', {}, '🔦 Bạn cầm đèn hải đăng. '), `Di chuột trái/phải hoặc giữ ← → để xoay đèn. Chỉ bạn thấy đá ngầm. Hãy nói cho ${nameOf(partner())} bằng tiếng Anh: "Go left!", "Stop!", "Keep going!", "Watch out!"`),
        h('div', { class: 'small' }, 'Không tiện nói? Mở Radio (R) để gửi câu.'),
      ));
    }
  }

  onEvent(e) {
    if (e.e === 'boat_reply') {
      const mine = e.by === G.slot;
      this.bubble.setText(`${e.ok ? '' : '❓ '}${e.reply}`);
      clearTimeout(this.bubbleT);
      this.bubbleT = setTimeout(() => this.bubble.setText(''), 2500);
      if (!mine) toast(`⛵ ${nameOf(e.by)}: "${e.text}"`);
      speak(e.reply, 'captain');
      sfx(e.ok ? 'ui' : 'wrong');
    }
    if (e.e === 'bump') {
      sfx('thud');
      this.cameras.main.shake(300, 0.01);
      toast('💥 Thuyền va đá! Lùi lại một chút. "Watch out!"', 'bad');
      speak('We hit a rock! Watch out!', 'captain');
    }
    if (e.e === 'swap') {
      sfx('success');
      toast(`🔄 Đổi vai! Giờ ${nameOf(G.state.boat.beamer)} cầm đèn, ${nameOf(G.state.boat.commander)} chỉ huy thuyền.`, 'good');
      speak('Halfway there! Switch!', 'captain');
    }
    if (e.e === 'call_ok') {
      sfx('success');
      toast(`📻 ${e.understood}`, 'good');
      speak(e.understood.replace(/^Captain:\s*/, ''), 'captain');
    }
    if (e.e === 'call_retry') {
      sfx('wrong');
      speak('Sorry? Say that again, please.', 'captain');
      toast(`📻 Captain: "Sorry? Say that again, please." (${nameOf(e.by)}: "${e.text}")`, 'bad');
    }
    if (e.e === 'boat_done') {
      sfx('success');
      music('victory');
    }
  }

  update(time, dtMs) {
    if (this.mode !== 'boat') return;
    const dt = Math.min(0.05, dtMs / 1000);
    const b = G.state.boat;
    if (!b) return;
    // boat position (smooth)
    const tx = X0 + b.lane * LANE_W;
    const ty = BASE_Y - b.y * ROW_H;
    this.boat.x += (tx - this.boat.x) * Math.min(1, dt * 10);
    this.boat.y += (ty - this.boat.y) * Math.min(1, dt * 10);
    this.boat.angle = (tx - this.boat.x) * 0.6;
    this.wake.setPosition(this.boat.x, this.boat.y + 22);
    this.wake.emitting = !!b.moving;
    const ml = mastLane(b.t);
    this.mast.setVisible(ml !== null);
    if (ml !== null) this.mast.x = X0 + (ml + 0.5) * LANE_W;
    this.bubble.setPosition(this.boat.x, this.boat.y - 30);

    // beam angle: the beamer steers locally, everyone else follows the state
    const mineBeam = b.beamer === G.slot;
    if (mineBeam) {
      if (this.localBeam === undefined) this.localBeam = b.beam;
      if (this.keys.LEFT.isDown || this.keys.A.isDown) this.localBeam = Math.max(-70, this.localBeam - 80 * dt);
      if (this.keys.RIGHT.isDown || this.keys.D.isDown) this.localBeam = Math.min(70, this.localBeam + 80 * dt);
      this.beamShown = this.localBeam;
      if (time - this.lastBeamSent > 100 && Math.abs(this.localBeam - b.beam) > 0.5) {
        this.lastBeamSent = time;
        act({ type: 'beam', angle: Math.round(this.localBeam) });
      }
    } else {
      this.beamShown += (b.beam - this.beamShown) * Math.min(1, dt * 8);
    }

    // darkness: the beamer moves a pool of light over the water ahead of the boat
    const ox = this.bayW / 2;
    const oy = 30;
    const poolY = this.boat.y - ROW_H * 2.4;
    const poolX = ox + (this.beamShown / 70) * (this.bayW / 2 + 10);
    const rt = this.dark;
    rt.clear();
    rt.fill(0x050812, mineBeam ? 0.88 : 0.96);
    const cone = this.cone;
    cone.clear();
    cone.fillStyle(0xffffff, 1);
    if (mineBeam) cone.fillEllipse(poolX - rt.x, poolY - rt.y, 150, 130);
    cone.fillCircle(this.boat.x - rt.x, this.boat.y - rt.y, mineBeam ? 30 : 34);
    cone.fillCircle(ox - rt.x, 60 - rt.y, 60);
    rt.erase(cone);
    // the beam itself: bright for the beamer, a faint hint for the commander
    this.beamLine.clear();
    this.beamLine.fillStyle(0xffe7a0, mineBeam ? 0.14 : 0.05);
    this.beamLine.fillTriangle(ox, oy, poolX - 60, poolY, poolX + 60, poolY);
    this.beamLine.fillEllipse(poolX, poolY, 150, 130);
  }
}

on('noop', () => {});
