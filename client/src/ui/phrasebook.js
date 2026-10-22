// Phrasebook: every phrase met so far, with audio, meaning and progress stars.
// ★ met in the story · ★★ used it yourself · ★★★ recalled it with fewer hints

import { h, clear } from './dom.js';
import { openModal } from './modal.js';
import { G, settings } from '../ctx.js';
import { PHRASES, PHRASE_GROUPS } from '../../../shared/phrases.js';
import { speak } from '../audio.js';

let tab = 'check';

export function stars(e) {
  if (!e || !e.s) return 0;
  if (e.r > 0) return 3;
  if (e.u > 0) return 2;
  return 1;
}

export function openPhrasebook() {
  const m = openModal('📖 Sổ cụm từ', { id: 'book' });
  const book = G.state.learn[G.slot] || {};
  const total = PHRASES.length;
  const met = PHRASES.filter((p) => stars(book[p.id]) >= 1).length;
  const used = PHRASES.filter((p) => stars(book[p.id]) >= 2).length;
  const rec = PHRASES.filter((p) => stars(book[p.id]) >= 3).length;
  const tabsEl = h('div', { class: 'tabs' });
  const list = h('div');
  const draw = () => {
    clear(tabsEl);
    for (const g of PHRASE_GROUPS) tabsEl.append(h('div', { class: `tab ${tab === g.id ? 'on' : ''}`, onclick: () => { tab = g.id; draw(); } }, g.vi));
    clear(list);
    for (const p of PHRASES.filter((x) => x.group === tab)) {
      const st = stars(book[p.id]);
      if (!st) {
        list.append(h('div', { class: 'card locked' }, h('div', { class: 'en', style: { flex: 1 } }, '? ? ?'), h('div', { class: 'small' }, 'chưa gặp')));
        continue;
      }
      const vi = h('div', { class: `small ${settings.vi === 'always' ? '' : 'hidden'}` }, p.vi, p.note ? ` — ${p.note}` : '');
      list.append(h('div', { class: 'card' },
        h('div', { style: { flex: 1 } }, h('div', { class: 'en' }, p.en), vi),
        h('span', { class: 'stars', title: '★ đã gặp · ★★ đã dùng · ★★★ tự nhớ' }, '★'.repeat(st) + '☆'.repeat(3 - st)),
        h('button', { class: 'btn small', onclick: () => speak(p.en, 'narr') }, '🔊'),
        h('button', { class: 'btn small', onclick: () => speak(p.en, 'narr', { rate: 0.7 }) }, '🐢'),
        settings.vi !== 'always' ? h('button', { class: 'btn small', onclick: () => vi.classList.toggle('hidden') }, 'VI') : null,
      ));
    }
  };
  draw();
  m.body.append(
    h('p', { class: 'small' }, `Đã gặp ${met}/${total} · đã dùng ${used} · tự nhớ ${rec}. ★ gặp trong truyện · ★★ tự dùng (radio, gõ) · ★★★ nhớ ra khi ít gợi ý (trận Bão, cuộc gọi cứu hộ).`),
    tabsEl, list,
  );
}
