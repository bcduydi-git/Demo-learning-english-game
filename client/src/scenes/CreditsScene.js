// End of the demo: results, what was learned, and a hook for chapter 2.

import Phaser from 'phaser';
import { G, nameOf, act } from '../ctx.js';
import { PHRASES } from '../../../shared/phrases.js';
import { music, ambience, sfx } from '../audio.js';
import { h, clear } from '../ui/dom.js';
import { stars } from '../ui/phrasebook.js';
import { openPhrasebook } from '../ui/phrasebook.js';
import { clearLastSession } from '../store.js';

export class CreditsScene extends Phaser.Scene {
  constructor() {
    super('Credits');
  }

  create() {
    const W = this.scale.width;
    const H = this.scale.height;
    const g = this.add.graphics();
    g.fillGradientStyle(0x050817, 0x050817, 0x162447, 0x162447, 1);
    g.fillRect(0, 0, W, H);
    for (let i = 0; i < 90; i++) this.add.rectangle(Math.random() * W, Math.random() * H * 0.7, 2, 2, 0xffffff, Math.random() * 0.8 + 0.2);
    g.fillStyle(0x0d1a33, 1);
    g.fillRect(0, H * 0.72, W, H * 0.28);
    // the green light: three long, three short
    const light = this.add.circle(W * 0.82, H * 0.72 - 4, 5, 0x6dff8a, 0);
    this.add.circle(W * 0.82, H * 0.72 - 4, 18, 0x6dff8a, 0.08);
    const pattern = [900, 900, 900, 260, 260, 260];
    let i = 0;
    const blink = () => {
      const on = pattern[i % pattern.length];
      light.setFillStyle(0x6dff8a, 1);
      this.time.delayedCall(on, () => {
        light.setFillStyle(0x6dff8a, 0);
        i++;
        this.time.delayedCall(i % 6 === 0 ? 1800 : 350, blink);
      });
    };
    blink();
    // boat leaving
    const boat = this.add.image(W * 0.3, H * 0.72 + 30, 'boat').setAngle(90).setScale(2);
    this.tweens.add({ targets: boat, x: W * 0.6, duration: 20000 });
    music('credits');
    ambience('island');
    sfx('success');
    this.cameras.main.fadeIn(1200, 0, 0, 0);

    const s = G.state;
    const ui = h('div', { class: 'center-overlay', style: { background: 'transparent', alignItems: 'flex-start', paddingTop: '6vh' } });
    const box = h('div', { class: 'box', style: { width: 'min(680px, 94vw)', background: 'rgba(28,34,56,.92)' } });
    ui.append(box);
    const row = (slot) => {
      const book = s.learn[slot] || {};
      const c = [0, 0, 0, 0];
      for (const p of PHRASES) c[stars(book[p.id])]++;
      return h('div', { class: 'card' }, h('b', { style: { flex: 1 } }, nameOf(slot)),
        h('span', { class: 'small' }, `gặp ${c[1] + c[2] + c[3]} · dùng ${c[2] + c[3]} · tự nhớ ${c[3]}`),
        h('span', { class: 'stars' }, `★★★ × ${c[3]}`));
    };
    box.append(
      h('div', { class: 'logo', style: { fontSize: '52px' } }, 'RESCUED!'),
      h('p', {}, `${nameOf('p1')} và ${nameOf('p2')} đã thắp lại ngọn hải đăng và được tàu Aurora cứu.`),
      h('h3', { style: { margin: '10px 0 6px' } }, 'Tiếng Anh hai bạn đã dùng'),
      row('p1'), row('p2'),
      h('p', { class: 'small' }, '★ gặp trong truyện · ★★ tự dùng · ★★★ tự nhớ ra khi ít gợi ý.'),
      h('div', { style: { margin: '14px 0', padding: '10px', border: '2px dashed #4fc1bc', borderRadius: '4px' } },
        h('div', { class: 'en', style: { fontSize: '30px', color: '#6dff8a' } }, 'To be continued...'),
        h('div', {}, 'Chương 2 — Ngọn đèn xanh. Ai đang gọi từ nơi không có hòn đảo nào?'),
        h('div', { class: 'row', style: { marginTop: '8px' } },
          h('span', { class: 'small', style: { flex: 1, color: '#cfd8e8' } }, 'Chương 2 đang làm. Chơi thử trước một thử thách: máy phát tín hiệu.'),
          h('button', { class: 'btn teal small', onclick: () => act({ type: 'tx_open' }) }, '🧪 Chơi thử ▶')),
      ),
      h('div', { class: 'row' },
        h('button', { class: 'btn', onclick: () => openPhrasebook() }, '📖 Xem Sổ cụm từ'),
        h('span', { class: 'spacer' }),
        h('button', { class: 'btn gold', onclick: () => { clearLastSession(); G.net.close(); location.href = location.pathname; } }, 'Về màn hình chính'),
      ),
      h('p', { class: 'small' }, 'Cảm ơn đã chơi bản demo Beacon Isle!'),
    );
    document.getElementById('ui').append(ui);
    this.events.once('shutdown', () => ui.remove());
  }
}
