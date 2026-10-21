import Phaser from 'phaser';
import { emit } from '../ctx.js';

const PROPS = ['tree0', 'tree1', 'boulder', 'bush', 'plant0', 'plant1', 'iplant', 'rock0', 'rock1', 'hedge0', 'hedge1', 'thorns', 'crate', 'crate_open', 'wreck', 'bottle', 'log',
  'cottage', 'cottage_lit', 'shed', 'shed_on', 'lighthouse', 'lighthouse_on', 'door_glow', 'tower', 'sign', 'chest', 'chest_open', 'lens',
  'desk', 'station', 'station_on', 'bed', 'shelf', 'rug'];

export class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  preload() {
    const { width, height } = this.scale;
    const bar = this.add.rectangle(width / 2 - 150, height / 2, 0, 10, 0xf2c14e).setOrigin(0, 0.5);
    this.add.rectangle(width / 2, height / 2, 304, 14).setStrokeStyle(2, 0x5a6690);
    this.load.on('progress', (p) => { bar.width = 300 * p; });

    this.load.setPath('assets/');
    this.load.json('map', 'map.json');
    this.load.json('charcfg', 'characters/config.json');
    this.load.image('ground', 'ground.png');
    this.load.image('water0', 'water0.png');
    this.load.image('water1', 'water1.png');
    for (const p of PROPS) this.load.image(p, `props/${p}.png`);
    this.load.spritesheet('pip', 'npc/pip.png', { frameWidth: 16, frameHeight: 16 });
    this.load.spritesheet('gull', 'npc/gull.png', { frameWidth: 16, frameHeight: 16 });
    this.load.image('prompt', 'ui/prompt.png');
    this.load.image('dot', 'ui/dot.png');
    this.load.image('soft', 'ui/soft.png');
    this.load.image('storm', 'boss/storm.png');
    this.load.image('lamp0', 'boss/lamp0.png');
    this.load.image('lamp1', 'boss/lamp1.png');
    this.load.image('boat', 'boss/boat.png');
    this.load.image('searock', 'boss/searock.png');
    this.load.image('mast', 'boss/mast.png');
  }

  create() {
    const cfg = this.cache.json.get('charcfg') || {};
    for (const slot of ['p1', 'p2']) {
      const c = cfg[slot] || {};
      this.load.spritesheet(`char_${slot}`, `characters/${slot}/walk.png`, { frameWidth: c.frameWidth || 32, frameHeight: c.frameHeight || 32 });
    }
    this.load.once('complete', () => {
      for (const slot of ['p1', 'p2']) {
        const c = cfg[slot] || {};
        const per = c.framesPerRow || 4;
        const fps = c.fps || 8;
        ['down', 'left', 'right', 'up'].forEach((dir, row) => {
          this.anims.create({ key: `${slot}_walk_${dir}`, frames: this.anims.generateFrameNumbers(`char_${slot}`, { start: row * per, end: row * per + per - 1 }), frameRate: fps, repeat: -1 });
        });
      }
      this.anims.create({ key: 'pip_idle', frames: this.anims.generateFrameNumbers('pip', { start: 0, end: 1 }), frameRate: 2, repeat: -1 });
      this.anims.create({ key: 'pip_fly', frames: this.anims.generateFrameNumbers('pip', { start: 2, end: 3 }), frameRate: 8, repeat: -1 });
      this.anims.create({ key: 'gull_fly', frames: this.anims.generateFrameNumbers('gull', { start: 0, end: 1 }), frameRate: 4, repeat: -1 });
      this.makeFogHole();
      this.children.removeAll(true);
      this.registry.set('charcfg', cfg);
      this.registry.set('ready', true);
      emit('assets-ready');
    });
    this.load.start();
  }

  // soft round brush used to cut visibility holes in fog / darkness
  makeFogHole() {
    for (const [key, r] of [['hole', 48], ['holeBig', 90]]) {
      const tex = this.textures.createCanvas(key, r * 2, r * 2);
      const c = tex.getContext();
      const g = c.createRadialGradient(r, r, r * 0.25, r, r, r);
      g.addColorStop(0, 'rgba(255,255,255,1)');
      g.addColorStop(0.6, 'rgba(255,255,255,0.8)');
      g.addColorStop(1, 'rgba(255,255,255,0)');
      c.fillStyle = g;
      c.fillRect(0, 0, r * 2, r * 2);
      tex.refresh();
    }
  }
}
