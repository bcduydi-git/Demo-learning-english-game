import { h, root } from './dom.js';
import { G } from '../ctx.js';
import { sfx } from '../audio.js';

// Opens a modal panel. Returns { el, body, close }.
// While open, keyboard input goes to the panel, not to the game.
export function openModal(title, { onClose, wide = false, id } = {}) {
  if (id) {
    const old = document.getElementById(id);
    if (old) old._close();
  }
  const body = h('div');
  const closeBtn = h('button', { class: 'btn small close', title: 'Đóng (Esc)' }, '✕');
  const box = h('div', { class: 'box modal', style: wide ? { width: 'min(960px, 96vw)' } : null },
    h('h2', {}, title, h('span', { class: 'spacer' }), closeBtn),
    body,
  );
  const back = h('div', { class: 'modal-back', id }, box);
  let closed = false;
  const close = () => {
    if (closed) return;
    closed = true;
    G.busy = Math.max(0, G.busy - 1);
    back.remove();
    document.removeEventListener('keydown', onKey, true);
    sfx('close');
    if (onClose) onClose();
  };
  const onKey = (e) => {
    if (e.key === 'Escape') { e.stopPropagation(); e.preventDefault(); close(); }
  };
  back._close = close;
  closeBtn.addEventListener('click', close);
  back.addEventListener('mousedown', (e) => { if (e.target === back) close(); });
  document.addEventListener('keydown', onKey, true);
  G.busy += 1;
  root().append(back);
  sfx('open');
  return { el: back, body, close };
}
