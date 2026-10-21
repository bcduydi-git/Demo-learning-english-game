// The island: exploration, interactions, the fog-woods lookout puzzle,
// partner sync and atmosphere.

import Phaser from 'phaser';
import { G, act, nameOf, partner, on, fill, settings } from '../ctx.js';
import { net } from '../net.js';
import { sfx, ambience, music, speak } from '../audio.js';
import { setPrompt, toast, setPointer } from '../ui/hud.js';
import { openReader, openStation, openGenerator, openDoor, openJournal } from '../ui/panels.js';
import { dialogueOpen } from '../ui/dialogue.js';
import { sendRadio } from '../ui/radio.js';
import { h } from '../ui/dom.js';

const T = 16;
const SPEED = 74;
const BLOCK = new Set('~,#WB%tToL'.split(''));
const DIRS = ['down', 'left', 'right', 'up'];

const C = (x, y) => ({ x: x * T + 8, y: y * T + 8 });

export class WorldScene extends Phaser.Scene {
  constructor() {
    super('World');
  }

  create() {
    const map = this.cache.json.get('map');
    this.mapData = map;
    this.grid = map.grid.map((r) => r.split(''));
    this.W = map.w;
    this.H = map.h;
    this.cfg = this.registry.get('charcfg') || {};
    this.revealedTraps = new Set();
    this.trapSet = new Set(map.traps.map(([x, y]) => `${x},${y}`));
    this.lookout = false;
    this.inside = false;
    this.lastSent = 0;
    this.stepT = 0;
    this.invulnUntil = 0;
    this.lastArea = null;

    // --- layers
    const PW = this.W * T;
    const PH = this.H * T;
    this.water = this.add.tileSprite(0, 0, PW, PH, 'water0').setOrigin(0).setDepth(-3000);
    this.water2 = this.add.tileSprite(0, 0, PW, PH, 'water1').setOrigin(0).setDepth(-2999).setAlpha(0.45);
    this.add.image(0, 0, 'ground').setOrigin(0).setDepth(-2000);
    // sparkles on the sea
    this.add.particles(0, 0, 'dot', {
      x: { min: 0, max: PW }, y: { min: 0, max: PH }, lifespan: 1400, scale: { start: 0.5, end: 0 }, alpha: { start: 0.7, end: 0 },
      frequency: 90, quantity: 1, tint: 0xcfefff,
      emitCallback: (p) => { if (!this.isWater(p.x, p.y)) p.lifeCurrent = 0; },
    }).setDepth(-1990);

    // --- decoration
    for (const d of map.deco) {
      const wide = d.type === 'tree' || d.type === 'pine' || d.type === 'boulder';
      const key = { tree: 'tree0', pine: 'tree1', boulder: 'boulder', bush: 'bush', plant: `plant${d.v || 0}`, rock: `rock${d.v || 0}` }[d.type] || 'rock0';
      const s = this.add.image(wide ? (d.x + 1) * T : d.x * T + 8, (d.y + 1) * T, key).setOrigin(0.5, 1);
      s.setDepth(s.y);
      if (d.type === 'tree' || d.type === 'pine' || d.type === 'plant') {
        this.tweens.add({ targets: s, angle: { from: -0.8, to: 0.8 }, duration: 2000 + Math.random() * 1200, yoyo: true, repeat: -1, ease: 'Sine.easeInOut', delay: Math.random() * 1500 });
      }
    }
    // hedges (fog woods walls)
    for (let y = 0; y < this.H; y++) {
      for (let x = 0; x < this.W; x++) {
        if (this.grid[y][x] === 't') {
          const s = this.add.image(x * T + 8, y * T + 16, (x * 7 + y * 3) % 5 === 0 ? 'hedge1' : 'hedge0').setOrigin(0.5, 1);
          s.setDepth(s.y);
        }
      }
    }
    // thorn traps (only visible from the lookout tower, or after stepping on one)
    this.thorns = {};
    for (const [x, y] of map.traps) {
      this.thorns[`${x},${y}`] = this.add.image(x * T + 8, y * T + 8, 'thorns').setDepth(y * T + 1).setVisible(false);
    }

    this.objs = {};
    this.buildObjects();

    // --- players
    this.me = this.makePlayer(G.slot, true);
    this.other = this.makePlayer(partner(), false);
    const saved = G.state.pos && G.state.pos[G.slot];
    const spawn = map.spawns[G.slot];
    if (saved && Number.isFinite(saved.x) && !this.blockedAt(saved.x, saved.y)) this.me.setPosition(saved.x, saved.y);
    else this.me.setPosition(spawn[0] * T + 8, spawn[1] * T + 12);
    const op = G.state.pos && G.state.pos[partner()];
    if (op && Number.isFinite(op.x)) { this.other.setPosition(op.x, op.y); this.other.target = { ...op }; }
    else { const s2 = map.spawns[partner()]; this.other.setPosition(s2[0] * T + 8, s2[1] * T + 12); }

    // Pip
    this.pip = this.add.sprite(this.me.x + 16, this.me.y - 20, 'pip', 0).setDepth(9000).setVisible(false);
    this.pip.play('pip_fly');

    // gulls
    this.gulls = [];
    for (let i = 0; i < 4; i++) {
      const g = this.add.sprite(Math.random() * PW, Math.random() * PH, 'gull').setDepth(9500).play('gull_fly').setAlpha(0.9);
      g.vx = (Math.random() < 0.5 ? -1 : 1) * (18 + Math.random() * 14);
      g.vy = (Math.random() - 0.5) * 6;
      g.setFlipX(g.vx < 0);
      this.gulls.push(g);
    }

    // fog over the woods
    const [wx0, wy0, wx1, wy1] = map.areas.woods;
    this.woods = new Phaser.Geom.Rectangle(wx0 * T, wy0 * T, (wx1 - wx0 + 1) * T, (wy1 - wy0 + 1) * T);
    this.fog = this.add.renderTexture(this.woods.x - 16, this.woods.y - 16, this.woods.width + 32, this.woods.height + 32).setOrigin(0).setDepth(8000);
    this.fogMist = this.add.particles(0, 0, 'soft', {
      x: { min: this.woods.x, max: this.woods.right }, y: { min: this.woods.y, max: this.woods.bottom },
      lifespan: 5000, speedX: { min: 3, max: 9 }, scale: { start: 2, end: 4 }, alpha: { start: 0.18, end: 0 }, frequency: 220, tint: 0xd8f0e0,
    }).setDepth(8001);

    // interior bounds
    const [ix0, iy0, ix1, iy1] = map.areas.interior;
    this.interior = new Phaser.Geom.Rectangle(ix0 * T, iy0 * T, (ix1 - ix0 + 1) * T, (iy1 - iy0 + 1) * T);
    this.islandBounds = new Phaser.Geom.Rectangle(0, 0, 62 * T, this.H * T);
    // black frame around the interior so nothing else shows on big screens
    const ir = this.interior;
    const big = 4000;
    this.interiorFrame = [
      this.add.rectangle(ir.x - big, ir.y - big, big * 2 + ir.width, big, 0x07060b),
      this.add.rectangle(ir.x - big, ir.bottom, big * 2 + ir.width, big, 0x07060b),
      this.add.rectangle(ir.x - big, ir.y, big, ir.height, 0x07060b),
      this.add.rectangle(ir.right, ir.y, big, ir.height, 0x07060b),
    ].map((r) => r.setOrigin(0).setDepth(9640).setVisible(false));

    // light tint over everything (time of day)
    this.tint = this.add.rectangle(0, 0, 10, 10, 0xffffff).setOrigin(0).setScrollFactor(0).setDepth(9650).setBlendMode(Phaser.BlendModes.MULTIPLY);
    this.rain = this.add.particles(0, 0, 'dot', {
      x: { min: -100, max: 800 }, y: { min: -20, max: 0 }, lifespan: 700, speedY: { min: 240, max: 300 }, speedX: -40, scaleX: 0.2, scaleY: 1.2,
      alpha: 0.4, tint: 0xbcd6ff, quantity: 2, frequency: 12,
    }).setDepth(9660);
    this.rain.stop();

    this.promptIcon = this.add.image(0, 0, 'prompt').setDepth(9750).setVisible(false);
    this.tweens.add({ targets: this.promptIcon, y: '-=3', duration: 400, yoyo: true, repeat: -1 });

    // labels
    this.nameMe = this.label(nameOf(G.slot));
    this.nameOther = this.label(nameOf(partner()));
    this.bubbleOther = this.add.text(0, 0, '', { fontFamily: 'VT323', fontSize: '12px', color: '#2a1f2d', backgroundColor: '#f3efe4', padding: { x: 3, y: 1 } }).setOrigin(0.5, 1).setDepth(9700).setResolution(4).setVisible(false);

    // input
    this.keys = this.input.keyboard.addKeys('W,A,S,D,UP,DOWN,LEFT,RIGHT,E,SPACE,ESC', false);
    this.input.keyboard.disableGlobalCapture();
    this.input.keyboard.on('keydown-E', () => this.onInteractKey());
    this.input.keyboard.on('keydown-SPACE', () => this.onInteractKey());
    this.input.keyboard.on('keydown-ESC', () => { if (this.lookout) this.setLookout(false); });

    // camera
    this.cameras.main.startFollow(this.me, true, 0.12, 0.12);
    this.cameras.main.roundPixels = true;
    this.onResize();
    this.scale.on('resize', this.onResize, this);
    this.updateArea(true);

    // network
    this.offPos = (slot, p) => { if (slot !== G.slot) this.other.target = p; };
    net.on('pos', this.offPos);
    this.events.once('shutdown', () => this.cleanup());

    this.applyState(G.state, true);
    ambience('island');
    music('island');
    this.cameras.main.fadeIn(600, 0, 0, 0);
  }

  cleanup() {
    const list = net.handlers.pos || [];
    const i = list.indexOf(this.offPos);
    if (i >= 0) list.splice(i, 1);
    this.scale.off('resize', this.onResize, this);
    setPrompt('');
    setPointer(null);
    if (this.pad) this.pad.remove();
  }

  label(text) {
    return this.add.text(0, 0, text, { fontFamily: 'VT323', fontSize: '11px', color: '#ffffff', stroke: '#2a1f2d', strokeThickness: 3 }).setOrigin(0.5, 1).setDepth(9700).setResolution(4);
  }

  makePlayer(slot, isMe) {
    const c = this.cfg[slot] || {};
    const fh = c.frameHeight || 32;
    const s = this.add.sprite(0, 0, `char_${slot}`, 0);
    s.setOrigin(0.5, (fh - 1) / fh);
    s.setScale(c.scale || 1);
    s.slot = slot;
    s.dir = 'down';
    s.isMe = isMe;
    return s;
  }

  onResize() {
    const w = this.scale.width;
    const h2 = this.scale.height;
    this.zoom = Math.max(2, Math.min(5, Math.round(Math.min(w / 420, h2 / 250))));
    if (!this.lookout) this.cameras.main.setZoom(this.zoom);
    if (this.tint) this.tint.setSize(w, h2);
    for (const t of [this.nameMe, this.nameOther, this.bubbleOther]) if (t) t.setResolution(this.zoom + 1);
  }

  // ------------------------------------------------------------ objects
  buildObjects() {
    const add = (id, key, x, y, ox = 0.5, oy = 1, depthOff = 0) => {
      const s = this.add.image(x, y, key).setOrigin(ox, oy);
      s.setDepth(y + depthOff);
      this.objs[id] = s;
      return s;
    };
    const M = this.mapData.objects.reduce((a, o) => { a[o.id] = o; return a; }, {});
    add('wreck', 'wreck', M.wreck.x * T + 8, (M.wreck.y + 1) * T + 2);
    add('crate', 'crate', M.crate.x * T + 8, (M.crate.y + 1) * T);
    add('bottle', 'bottle', M.bottle.x * T + 8, M.bottle.y * T + 13);
    this.tweens.add({ targets: this.objs.bottle, y: '-=2', angle: 8, duration: 1200, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    add('log', 'log', M.log.x * T + 8, M.log.y * T + 16);
    add('cottage', 'cottage', M.cottage.x * T, (M.cottage.y + 1) * T, 0, 1);
    add('shed', 'shed', M.shed.x * T, (M.shed.y + 1) * T, 0, 1);
    add('lighthouse', 'lighthouse', M.lighthouse.x * T + 8, (M.lighthouse.y + 1) * T);
    this.objs.doorGlow = this.add.image(M.lighthouse.x * T + 8 + 12, M.lighthouse.y * T + 2, 'door_glow').setDepth(M.lighthouse.y * T + 20).setVisible(false).setScale(0.6);
    this.tweens.add({ targets: this.objs.doorGlow, alpha: 0.3, duration: 700, yoyo: true, repeat: -1 });
    add('tower', 'tower', (M.tower.x) * T, (M.tower.y + 1) * T);
    for (const id of ['sign_beach', 'sign_woods', 'sign_tower']) add(id, 'sign', M[id].x * T + 8, (M[id].y + 1) * T);
    add('lens', 'chest', M.lens.x * T + 8, (M.lens.y + 1) * T);
    this.objs.lensGlow = this.add.image(M.lens.x * T + 8, M.lens.y * T - 6, 'lens').setDepth(M.lens.y * T + 20);
    this.tweens.add({ targets: this.objs.lensGlow, y: '-=3', duration: 900, yoyo: true, repeat: -1 });
    add('rug', 'rug', M.rug.x * T + 8, M.rug.y * T + 8, 0.5, 0.5, -400);
    add('journal', 'desk', (M.journal.x + 1) * T, (M.journal.y + 1) * T);
    add('station', 'station', (M.station.x + 1) * T, (M.station.y + 1) * T);
    add('bed', 'bed', (M.bed.x + 1) * T, (M.bed.y + 2) * T, 0.5, 1, -300);
    add('shelf', 'shelf', (M.shelf.x + 1) * T, (M.shelf.y + 1) * T);
    add('iplant', 'iplant', M.iplant.x * T + 8, (M.iplant.y + 1) * T);
    // smoke from the chimney once the power is back
    this.smoke = this.add.particles(M.cottage.x * T + 48, (M.cottage.y + 1) * T - 44, 'soft', {
      lifespan: 2600, speedY: { min: -14, max: -8 }, speedX: { min: 2, max: 8 }, scale: { start: 0.6, end: 2 }, alpha: { start: 0.5, end: 0 }, frequency: 400, tint: 0xdddddd,
    }).setDepth(9000);
    this.smoke.stop();

    const S = (id, tx, ty, r, label, run) => ({ id, x: tx * T + 8, y: ty * T + 8, r, label, run });
    const f = () => G.state.flags;
    const mine = (slot) => G.slot === slot;
    this.points = [
      S('wreck', M.wreck.x, M.wreck.y + 1, 36, () => (G.slot === 'p2' && !f().has_radio ? 'Lục khoang thuyền' : 'Xem con thuyền'), () => this.useWreck()),
      S('crate', M.crate.x, M.crate.y, 22, () => (f().has_tools ? 'Thùng gỗ (trống)' : 'Mở thùng gỗ'), () => this.useCrate()),
      S('bottle', M.bottle.x, M.bottle.y, 20, () => 'Nhặt chai thuỷ tinh', () => this.useBottle()),
      S('sign_beach', M.sign_beach.x, M.sign_beach.y, 20, () => 'Đọc biển báo', () => openReader('Biển báo', [
        { en: 'LIGHTHOUSE — this way!', vi: 'Hải đăng — lối này!' }, { en: "KEEPER'S HOUSE", vi: 'Nhà người gác đèn' }, { en: 'Go up the hill.', vi: 'Đi lên đồi.' },
      ], { seen: ['go_up'] })),
      S('log', M.log.x, M.log.y + 1, 30, () => (f().log_done ? null : 'Nhấc khúc gỗ'), () => this.useLog()),
      S('door', M.cottage.x + 1.5, M.cottage.y + 1, 14, () => 'Vào nhà', () => this.warpInside()),
      S('journal', M.journal.x + 0.5, M.journal.y + 1, 22, () => 'Đọc cuốn sổ', () => this.useJournal()),
      S('station', M.station.x + 0.5, M.station.y + 1, 22, () => (mine('p2') ? 'Dùng radio' : 'Xem radio'), () => this.useStation()),
      S('shed', M.shed.x + 1, M.shed.y + 1, 18, () => (f().power ? 'Máy phát (đang chạy)' : mine('p1') ? 'Vận hành máy phát' : 'Xem máy phát'), () => this.useShed()),
      S('tower', 22, 24, 18, () => (this.lookout ? 'Rời ống nhòm' : mine('p1') ? 'Nhìn bằng ống nhòm' : 'Leo tháp canh'), () => this.useTower()),
      S('sign_tower', M.sign_tower.x, M.sign_tower.y, 20, () => 'Đọc biển báo', () => openReader('Tháp canh', [
        { en: 'LOOKOUT TOWER', vi: 'Tháp canh' },
        { en: 'Use the spyglass to see the Fog Woods.', vi: 'Dùng ống nhòm để nhìn Rừng Sương.' },
        { en: 'Tell the walker: Go up. Go down. Go left. Go right.', vi: 'Bảo người đi: Đi lên. Đi xuống. Sang trái. Sang phải.' },
        { en: 'Stop! A little more. Go back. Keep going.', vi: 'Dừng lại! Thêm chút nữa. Quay lại. Cứ đi tiếp.' },
      ], { seen: ['go_up', 'go_down', 'go_left', 'go_right', 'stop', 'a_little_more', 'go_back', 'keep_going', 'youre_close'] })),
      S('sign_woods', M.sign_woods.x, M.sign_woods.y, 20, () => 'Đọc biển báo', () => openReader('Rừng Sương', [
        { en: 'FOG WOODS', vi: 'Rừng Sương' },
        { en: 'Do not walk alone.', vi: 'Đừng đi một mình.' },
        { en: 'Thorns hide in the grass. Watch out!', vi: 'Gai ẩn trong cỏ. Coi chừng!' },
        { en: 'Listen to the lookout.', vi: 'Hãy nghe người trên tháp canh.' },
      ], { seen: ['watch_out'] })),
      S('lens', M.lens.x, M.lens.y + 1, 20, () => (f().lens ? 'Rương (trống)' : 'Mở rương'), () => this.useChest()),
      S('lighthouse', M.lighthouse.x, M.lighthouse.y + 1, 18, () => this.doorLabel(), () => this.useDoor()),
    ];
  }

  // ------------------------------------------------------------ state
  applyState(s, first = false) {
    if (!s) return;
    const f = s.flags;
    this.objs.crate.setTexture(f.has_tools ? 'crate_open' : 'crate');
    this.objs.bottle.setVisible(!f.bottle);
    if (f.bottle) this.points = this.points.filter((p) => p.id !== 'bottle');
    if (f.log_done && this.objs.log.visible) {
      if (first) this.objs.log.setVisible(false);
      else {
        this.tweens.add({ targets: this.objs.log, x: '+=42', y: '+=6', angle: 90, alpha: 0, duration: 900, ease: 'Cubic.in', onComplete: () => this.objs.log.setVisible(false) });
      }
      for (let x = 30; x <= 32; x++) this.grid[40][x] = ':';
    }
    this.objs.cottage.setTexture(f.power ? 'cottage_lit' : 'cottage');
    this.objs.shed.setTexture(f.power ? 'shed_on' : 'shed');
    this.objs.station.setTexture(f.power ? 'station_on' : 'station');
    if (f.power && !this.smoke.emitting) this.smoke.start();
    this.objs.doorGlow.setVisible(!!f.power && !f.door_open);
    this.objs.lens.setTexture(f.lens ? 'chest_open' : 'chest');
    this.objs.lensGlow.setVisible(!f.lens);
    // Pip joins after the meeting scene starts
    const pipOn = f.pip_met || (s.scene && s.scene.id === 'pip_meet');
    if (pipOn && !this.pip.visible) {
      this.pip.setVisible(true);
      if (!first) { this.pip.setPosition(this.me.x + 120, this.me.y - 90); sfx('squawk'); }
    }
    // weather / time of day
    const raining = !f.pip_met && !this.inside;
    if (raining && !this.rain.emitting) this.rain.start();
    if (!raining && this.rain.emitting) this.rain.stop();
    let color = 0xb9c6dc;
    if (f.pip_met) color = 0xe4ecf2;
    if (f.log_done) color = 0xffffff;
    if (f.power || f.lens) color = 0xfff0dc;
    if (f.power && f.lens) color = 0xffd9b8;
    if (f.door_open) color = 0xe6b3b8;
    this.tint.fillColor = color;
    if (s.players[partner()]) this.nameOther.setText(nameOf(partner()));
    this.nameMe.setText(nameOf(G.slot));
  }

  // ------------------------------------------------------------ interactions
  doorLabel() {
    const f = G.state.flags;
    if (!f.power) return 'Xem cửa hải đăng';
    if (!f.door_open) return 'Mở khoá cửa';
    if (G.state.enter[G.slot]) return `Đang chờ ${nameOf(partner())}...`;
    return 'Cùng đi lên hải đăng';
  }

  useWreck() {
    const f = G.state.flags;
    if (G.slot === 'p2' && !f.has_radio) {
      act({ type: 'pickup', item: 'radio' });
      return;
    }
    if (!f.has_radio) {
      openReader('Con thuyền', [{ en: 'There is an old radio in the cabin.', vi: 'Có một chiếc radio cũ trong khoang thuyền.' }], {
        intro: `${nameOf('p2')} rành radio. Gọi bạn ấy lại: "Come here! Look at this!"`, seen: ['come_here', 'look_at_this'],
      });
      return;
    }
    openReader('Con thuyền', [{ en: 'Our little boat. It is broken.', vi: 'Chiếc thuyền nhỏ của chúng ta. Nó hỏng rồi.' }, { en: 'We need help.', vi: 'Chúng ta cần giúp đỡ.' }], { seen: ['look_at_this'] });
  }

  useCrate() {
    const f = G.state.flags;
    if (G.slot === 'p1' && !f.has_tools) { act({ type: 'pickup', item: 'tools' }); return; }
    if (!f.has_tools) {
      openReader('Thùng gỗ', [{ en: 'A toolbox and a lantern!', vi: 'Một hộp đồ nghề và một chiếc đèn lồng!' }], {
        intro: `${nameOf('p1')} giỏi máy móc. Gọi bạn ấy lại: "Come here! Look at this!"`, seen: ['come_here', 'look_at_this'],
      });
      return;
    }
    toast('Thùng trống rồi.');
  }

  useBottle() {
    act({ type: 'pickup', item: 'bottle' });
    sfx('pickup');
    openReader('Lá thư trong chai', [
      { en: 'To anyone who finds this:', vi: 'Gửi bất cứ ai tìm thấy lá thư này:' },
      { en: 'The light must never stay dark.', vi: 'Ngọn đèn không bao giờ được tắt.' },
      { en: 'Something out at sea is watching it.', vi: 'Có thứ gì đó ngoài biển đang dõi theo nó.' },
      { en: '— E.', vi: '— E.' },
    ], { paper: true, voice: 'keeper' });
  }

  useLog() {
    const f = G.state.flags;
    if (!f.radio_done) {
      openReader('Khúc gỗ', [{ en: 'A big log blocks the path.', vi: 'Một khúc gỗ lớn chắn lối đi.' }, { en: 'It is too heavy for one person.', vi: 'Nó quá nặng với một người.' }], {
        intro: f.pip_met ? 'Pip: "Radio first! Radio first!" — hãy làm xong mục tiêu Radio trước.' : 'Có lẽ cần hai người. Khám phá bãi biển trước đã.',
      });
      return;
    }
    act({ type: 'log_lift' });
    sfx('lift');
    this.tweens.add({ targets: this.me, y: '-=3', duration: 120, yoyo: true });
    this.tweens.add({ targets: this.objs.log, angle: 3, duration: 90, yoyo: true, repeat: 1 });
    toast(`💪 Nhấc! ${nameOf(partner())} cần nhấc cùng lúc (trong 1,5 giây).`);
  }

  useJournal() {
    if (!G.state.flags.journal) act({ type: 'read_journal' });
    else openJournal();
  }

  useStation() {
    if (G.slot === 'p2') { openStation(); return; }
    sfx('radio');
    openReader('Radio cũ', [{ en: 'Kshhhh... kshhh...', vi: 'Chỉ có tiếng rè rè.' }], { intro: `Bạn không biết chỉnh sóng radio này. ${nameOf('p2')} có tai nghe và rành radio.` });
  }

  useShed() {
    if (G.state.flags.power) { toast('Máy phát đang chạy êm ru.'); return; }
    if (G.slot === 'p1') { openGenerator(); return; }
    openReader('Máy phát điện', [{ en: 'So many wires and wheels...', vi: 'Toàn dây điện và bánh răng...' }], { intro: `${nameOf('p1')} có hộp đồ nghề và biết vận hành máy. Lời nhắn hướng dẫn có lẽ nằm trong radio ở nhà người gác đèn.` });
  }

  useTower() {
    if (G.slot !== 'p1') {
      openReader('Tháp canh', [{ en: 'The fog is too thick for my eyes.', vi: 'Sương quá dày, mắt mình không nhìn xa được.' }], { intro: `${nameOf('p1')} có ống nhòm. Bạn có thể là người đi vào rừng — hãy nghe chỉ đường.` });
      return;
    }
    this.setLookout(!this.lookout);
  }

  useChest() {
    if (G.state.flags.lens) { toast('Rương trống rồi.'); return; }
    act({ type: 'pickup', item: 'lens' });
    act({ type: 'pickup', item: 'page2' });
    this.time.delayedCall(200, () => {
      this.pendingPage = true;
    });
  }

  showPage2() {
    openReader('Trang sổ kẹp trong rương', [
      { en: 'Day thirty.', vi: 'Ngày thứ ba mươi.' },
      { en: 'The green light answered again tonight.', vi: 'Đêm nay đốm sáng xanh lại trả lời.' },
      { en: 'Three long, three short.', vi: 'Ba dài, ba ngắn.' },
      { en: 'There is no island out there. Who is calling?', vi: 'Ngoài đó không có hòn đảo nào. Ai đang gọi vậy?' },
    ], { paper: true, voice: 'keeper', intro: 'Dưới thấu kính có một trang sổ cũ:' });
  }

  useDoor() {
    const s = G.state;
    const f = s.flags;
    if (!f.power) {
      openReader('Cửa hải đăng', [{ en: 'The lock has a small dark screen.', vi: 'Ổ khoá có một màn hình nhỏ tối om.' }, { en: 'It needs power.', vi: 'Nó cần có điện.' }]);
      return;
    }
    if (!f.door_open) { openDoor(); return; }
    if (!f.lens) { toast('Cần có thấu kính pha lê trước đã — tìm trong Rừng Sương.'); return; }
    const on2 = !s.enter[G.slot];
    act({ type: 'enter', on: on2 });
    if (on2) toast(`Đang chờ ${nameOf(partner())} cùng vào... (bảo bạn ấy: "Come here!")`);
  }

  warpInside() {
    const [sx, sy] = this.mapData.areas.interior_spawn;
    this.fadeWarp(sx * T + 8, sy * T + 4);
    sfx('door');
  }

  warpOutside() {
    const [ex, ey] = this.mapData.areas.cottage_exit;
    this.fadeWarp(ex * T + 8, ey * T + 6);
    sfx('door');
  }

  fadeWarp(x, y) {
    if (this.warping) return;
    this.warping = true;
    this.cameras.main.fadeOut(220, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.me.setPosition(x, y);
      this.updateArea(true);
      this.cameras.main.fadeIn(260, 0, 0, 0);
      this.warping = false;
      this.sendPos(true);
    });
  }

  setLookout(on2) {
    this.lookout = on2;
    const cam = this.cameras.main;
    act({ type: 'lookout', on: on2 });
    if (on2) {
      sfx('whoosh');
      cam.stopFollow();
      cam.removeBounds();
      const padH = 150;
      const z = Math.max(1, Math.min((this.scale.width - 40) / this.woods.width, (this.scale.height - padH - 30) / this.woods.height));
      cam.pan(this.woods.centerX, this.woods.centerY + padH / 2 / z, 600, 'Sine.easeInOut');
      cam.zoomTo(z, 600);
      this.showPad(true);
    } else {
      cam.zoomTo(this.zoom, 400);
      const b = this.islandBounds;
      cam.setBounds(b.x, b.y, b.width, b.height);
      cam.startFollow(this.me, true, 0.12, 0.12);
      this.showPad(false);
    }
  }

  showPad(on2) {
    if (this.pad) { this.pad.remove(); this.pad = null; }
    if (!on2) return;
    const chips = ['Go up.', 'Go down.', 'Go left.', 'Go right.', 'Stop!', 'A little more.', 'Go back.', 'Keep going.', 'Watch out!', "You're close!"];
    this.pad = h('div', { id: 'lookoutpad', class: 'box' },
      h('div', { class: 'title' }, h('span', {}, `🔭 Bạn thấy cả mê cung. Gai đỏ = bẫy. Hãy chỉ đường cho ${nameOf('p2')} bằng giọng nói — hoặc bấm câu bên dưới để gửi qua radio.`), h('button', { class: 'btn small', onclick: () => this.setLookout(false) }, 'Rời ống nhòm (E)')),
      h('div', { class: 'chips' }, ...chips.map((t) => h('button', { class: 'chip', onclick: () => sendRadio(t) }, t))),
    );
    document.getElementById('ui').append(this.pad);
  }

  useChestCheck() {
    if (this.pendingPage && G.state.flags.lens && !G.state.scene) {
      this.pendingPage = false;
      this.showPage2();
    }
  }

  onInteractKey() {
    if (G.busy || dialogueOpen() || G.typing) return;
    if (this.lookout) { this.setLookout(false); return; }
    const p = this.nearest;
    if (p) { sfx('click'); p.run(); }
  }

  // ------------------------------------------------------------ movement
  tileAt(px, py) {
    const x = Math.floor(px / T);
    const y = Math.floor(py / T);
    if (x < 0 || y < 0 || x >= this.W || y >= this.H) return '~';
    return this.grid[y][x];
  }

  blockedAt(px, py) {
    return BLOCK.has(this.tileAt(px, py));
  }

  isWater(px, py) {
    const c = this.tileAt(px, py);
    return c === '~';
  }

  boxBlocked(x, y) {
    const hw = 4;
    return this.blockedAt(x - hw, y - 4) || this.blockedAt(x + hw, y - 4) || this.blockedAt(x - hw, y) || this.blockedAt(x + hw, y);
  }

  updateArea(force) {
    const inside = Phaser.Geom.Rectangle.Contains(this.interior, this.me.x, this.me.y);
    if (inside !== this.inside || force) {
      this.inside = inside;
      const b = inside ? this.interior : this.islandBounds;
      const cam = this.cameras.main;
      for (const r of this.interiorFrame) r.setVisible(inside);
      cam.setZoom(inside ? this.zoomInside : this.zoom);
      if (inside) {
        cam.removeBounds();
        cam.stopFollow();
        cam.centerOn(this.interior.centerX, this.interior.centerY);
      } else {
        cam.setBounds(b.x, b.y, b.width, b.height);
        if (!this.lookout) cam.startFollow(this.me, true, 0.12, 0.12);
      }
      ambience(inside ? 'indoor' : 'island');
      if (G.state) this.applyState(G.state);
    }
  }

  sendPos(force) {
    const now = this.time.now;
    const p = { x: Math.round(this.me.x), y: Math.round(this.me.y), dir: this.me.dir, moving: !!this.me.moving, area: this.inside ? 'in' : 'out' };
    const key = `${p.x},${p.y},${p.dir},${p.moving},${p.area}`;
    if (force || (key !== this.lastKey && now - this.lastSent > 90) || now - this.lastSent > 1500) {
      this.lastKey = key;
      this.lastSent = now;
      net.pos(p);
    }
  }

  update(time, dtMs) {
    const dt = Math.min(0.05, dtMs / 1000);
    const s = G.state;
    if (!s) return;
    const wv = this.cameras.main.worldView;
    this.rain.setPosition(wv.x, wv.y);
    this.water.tilePositionX += dt * 4;
    this.water.tilePositionY += dt * 1.5;
    this.water2.tilePositionX -= dt * 2.5;
    this.water2.tilePositionY += dt * 3;
    this.water2.alpha = 0.35 + Math.sin(time / 900) * 0.15;

    // --- my movement
    const k = this.keys;
    const frozen = G.busy || dialogueOpen() || this.lookout || this.warping || G.typing || time < this.invulnUntil - 600;
    let vx = 0;
    let vy = 0;
    if (!frozen) {
      if (k.A.isDown || k.LEFT.isDown) vx -= 1;
      if (k.D.isDown || k.RIGHT.isDown) vx += 1;
      if (k.W.isDown || k.UP.isDown) vy -= 1;
      if (k.S.isDown || k.DOWN.isDown) vy += 1;
    }
    const moving = vx !== 0 || vy !== 0;
    if (moving) {
      const len = Math.hypot(vx, vy);
      const nx = this.me.x + (vx / len) * SPEED * dt;
      const ny = this.me.y + (vy / len) * SPEED * dt;
      if (!this.boxBlocked(nx, this.me.y)) this.me.x = nx;
      if (!this.boxBlocked(this.me.x, ny)) this.me.y = ny;
      this.me.dir = Math.abs(vx) > Math.abs(vy) ? (vx < 0 ? 'left' : 'right') : vy < 0 ? 'up' : 'down';
      this.stepT -= dt;
      if (this.stepT <= 0) { sfx('step'); this.stepT = 0.28; }
    }
    this.animate(this.me, moving);
    this.me.moving = moving;
    this.me.setDepth(this.me.y);

    // traps in the fog woods
    const tx = Math.floor(this.me.x / T);
    const ty = Math.floor((this.me.y - 2) / T);
    if (time >= this.invulnUntil && this.trapSet.has(`${tx},${ty}`)) this.hitTrap(tx, ty);

    // exit the cottage through the doorway
    if (this.inside && this.me.y > (this.mapData.areas.interior[3]) * T - 2) this.warpOutside();

    this.updateArea(false);
    this.sendPos(false);

    // first time in the woods
    const inWoods = Phaser.Geom.Rectangle.Contains(this.woods, this.me.x, this.me.y);
    if (inWoods && !s.flags.fog_intro && !this.sentFog) { this.sentFog = true; act({ type: 'fog_enter' }); }
    if (inWoods !== this.wasInWoods) { this.wasInWoods = inWoods; music(inWoods ? 'woods' : 'island'); }

    // --- partner
    const o = this.other;
    const tgt = o.target;
    if (tgt) {
      const d = Phaser.Math.Distance.Between(o.x, o.y, tgt.x, tgt.y);
      if (d > 120) o.setPosition(tgt.x, tgt.y);
      else { o.x += (tgt.x - o.x) * Math.min(1, dt * 12); o.y += (tgt.y - o.y) * Math.min(1, dt * 12); }
      o.dir = tgt.dir || o.dir;
      this.animate(o, tgt.moving && d > 0.5);
      o.setDepth(o.y);
    }
    const otherHere = tgt ? (tgt.area === 'in') === this.inside : !this.inside;
    const online = s.players[partner()].connected;
    o.setVisible(otherHere);
    o.setAlpha(online ? 1 : 0.4);
    this.nameMe.setPosition(this.me.x, this.me.y - 19);
    this.nameOther.setPosition(o.x, o.y - 19).setVisible(otherHere);
    this.bubbleOther.setPosition(o.x, o.y - 27).setVisible(otherHere && this.bubbleOther.text !== '');

    // --- Pip follows me
    if (this.pip.visible) {
      const px = this.me.x + (this.me.dir === 'left' ? 12 : -12);
      const py = this.me.y - 20 + Math.sin(time / 300) * 2;
      const dx = px - this.pip.x;
      const dy = py - this.pip.y;
      this.pip.x += dx * Math.min(1, dt * 3);
      this.pip.y += dy * Math.min(1, dt * 3);
      this.pip.setFlipX(dx < -1);
      const far = Math.abs(dx) + Math.abs(dy) > 6;
      const anim = far ? 'pip_fly' : 'pip_idle';
      if (this.pip.anims.currentAnim?.key !== anim) this.pip.play(anim);
    }

    // gulls
    const bw = this.W * T;
    for (const g of this.gulls) {
      g.x += g.vx * dt;
      g.y += g.vy * dt;
      if (g.x < -30) g.x = bw + 20;
      if (g.x > bw + 30) g.x = -20;
    }

    // --- fog
    this.drawFog(inWoods);

    // --- interaction prompt
    this.useChestCheck();
    this.updatePrompt(frozen);
    this.updatePointer(otherHere, online);
  }

  animate(spr, moving) {
    const key = `${spr.slot}_walk_${spr.dir}`;
    if (moving) {
      if (spr.anims.currentAnim?.key !== key || !spr.anims.isPlaying) spr.play(key, true);
    } else {
      spr.anims.stop();
      const per = (this.cfg[spr.slot] && this.cfg[spr.slot].framesPerRow) || 4;
      spr.setFrame(DIRS.indexOf(spr.dir) * per);
    }
  }

  drawFog(inWoods) {
    const rt = this.fog;
    rt.clear();
    if (this.lookout) {
      rt.fill(0x1e3a2c, 0.12);
      for (const t of Object.values(this.thorns)) t.setVisible(true);
      return;
    }
    for (const [key, t] of Object.entries(this.thorns)) t.setVisible(this.revealedTraps.has(key));
    rt.fill(0x1e3a2c, inWoods ? 0.96 : 0.82);
    if (inWoods) rt.erase('hole', this.me.x - rt.x - 48, this.me.y - 6 - rt.y - 48);
  }

  hitTrap(tx, ty) {
    const key = `${tx},${ty}`;
    this.revealedTraps.add(key);
    this.invulnUntil = this.time.now + 1600;
    sfx('trap');
    this.cameras.main.shake(250, 0.01);
    this.me.setTint(0xff6666);
    act({ type: 'maze_trap' });
    toast('🌵 Ui da! Bẫy gai! Quay về cửa rừng...', 'bad');
    this.time.delayedCall(700, () => {
      this.me.clearTint();
      const [mx, my] = this.mapData.areas.maze_start;
      this.fadeWarp(mx * T + 8, my * T + 14);
    });
  }

  updatePrompt(frozen) {
    let best = null;
    let bestD = Infinity;
    if (!frozen) {
      for (const p of this.points) {
        const d = Phaser.Math.Distance.Between(this.me.x, this.me.y - 4, p.x, p.y);
        if (d < p.r && d < bestD) {
          const label = p.label();
          if (label) { best = { ...p, text: label }; bestD = d; }
        }
      }
    }
    if (this.lookout) best = { x: 0, y: 0, text: 'Rời ống nhòm', run: () => this.setLookout(false), hideIcon: true };
    this.nearest = best;
    setPrompt(best ? best.text : '');
    if (best && !best.hideIcon) {
      this.promptIcon.setVisible(true);
      this.promptIcon.x = best.x;
      if (!this.promptIcon._base || this.promptIcon._base !== best.id) { this.promptIcon._base = best.id; this.promptIcon.y = best.y - 26; }
    } else this.promptIcon.setVisible(false);
    // leaving the door zone cancels "ready to enter"
    const s = G.state;
    if (s.enter && s.enter[G.slot]) {
      const door = this.points.find((p) => p.id === 'lighthouse');
      if (Phaser.Math.Distance.Between(this.me.x, this.me.y, door.x, door.y) > 40 && !this.sentLeave) {
        this.sentLeave = true;
        act({ type: 'enter', on: false });
        this.time.delayedCall(500, () => { this.sentLeave = false; });
      }
    }
  }

  updatePointer(otherHere, online) {
    const cam = this.cameras.main;
    const o = this.other;
    if (!online || this.lookout) { setPointer(null); return; }
    if (!otherHere) {
      setPointer({ x: this.scale.width / 2, y: 64, arrow: '🏠', where: this.inside ? 'ở ngoài' : 'trong nhà gỗ' });
      return;
    }
    const sx = (o.x - cam.worldView.x) * cam.zoom;
    const sy = (o.y - cam.worldView.y) * cam.zoom;
    const W = this.scale.width;
    const H = this.scale.height;
    if (sx > 0 && sx < W && sy > 0 && sy < H) { setPointer(null); return; }
    const cx = W / 2;
    const cy = H / 2;
    const ang = Math.atan2(sy - cy, sx - cx);
    const r = Math.min((W / 2 - 90) / Math.abs(Math.cos(ang) || 1e-6), (H / 2 - 60) / Math.abs(Math.sin(ang) || 1e-6));
    const arrows = ['→', '↘', '↓', '↙', '←', '↖', '↑', '↗'];
    const idx = Math.round(((ang + Math.PI * 2) % (Math.PI * 2)) / (Math.PI / 4)) % 8;
    const dist = Math.round(Phaser.Math.Distance.Between(this.me.x, this.me.y, o.x, o.y) / T);
    setPointer({ x: cx + Math.cos(ang) * r, y: cy + Math.sin(ang) * r, arrow: arrows[idx], where: `${dist} bước` });
  }

  // ------------------------------------------------------------ events
  onEvent(e) {
    switch (e.e) {
      case 'got': {
        const names = { tools: '🔦 Đèn lồng & hộp đồ nghề', radio: '📻 Radio & tai nghe', lens: '💎 Thấu kính pha lê' };
        if (!names[e.item]) break;
        sfx('pickup');
        toast(`${e.by === G.slot ? 'Bạn' : nameOf(e.by)} nhặt được: ${names[e.item]}`, 'good');
        const who = e.by === G.slot ? this.me : this.other;
        this.sparkle(who.x, who.y - 20);
        break;
      }
      case 'trap':
        if (e.by !== G.slot) {
          toast(`🌵 ${nameOf(e.by)} dẫm phải bẫy gai! Quay về cửa rừng.`, 'bad');
          if (this.lookout) this.cameras.main.shake(200, 0.004);
          sfx('trap');
        }
        break;
      case 'lift':
        if (e.by !== G.slot) {
          this.say(`💪 Lift!`);
          toast(`💪 ${nameOf(e.by)} đang nhấc khúc gỗ! Bấm E cùng lúc!`);
        }
        break;
      case 'log_moved':
        sfx('thud');
        this.cameras.main.shake(350, 0.012);
        toast('Khúc gỗ lăn đi! Đường lên đồi đã mở.', 'good');
        break;
      case 'power_on':
        sfx('hum');
        toast('⚡ Có điện rồi!', 'good');
        this.cameras.main.flash(300, 255, 240, 200);
        break;
      case 'lookout':
        if (e.by !== G.slot) toast(e.on ? `🔭 ${nameOf(e.by)} đang quan sát Rừng Sương từ tháp canh.` : `🔭 ${nameOf(e.by)} đã rời ống nhòm.`);
        break;
      case 'station':
        if (e.by !== G.slot) toast(`📻 ${nameOf(e.by)} đang nghe lời nhắn của người gác đèn...`);
        break;
      case 'enter_wait':
        if (e.by !== G.slot && e.on) toast(`🚪 ${nameOf(e.by)} đang chờ bạn ở cửa hải đăng!`);
        break;
      case 'radio':
        if (e.by !== G.slot) this.say(e.text);
        break;
      default:
        break;
    }
  }

  say(text) {
    this.bubbleOther.setText(text.length > 28 ? text.slice(0, 27) + '…' : text);
    clearTimeout(this.bubbleTimer);
    this.bubbleTimer = setTimeout(() => this.bubbleOther.setText(''), 3500);
  }

  sparkle(x, y) {
    const em = this.add.particles(x, y, 'dot', { speed: { min: 20, max: 60 }, lifespan: 600, scale: { start: 0.8, end: 0 }, tint: [0xffe7a0, 0xffffff, 0x9fe8ff], quantity: 14, emitting: false }).setDepth(9600);
    em.explode(16);
    this.time.delayedCall(800, () => em.destroy());
  }
}
