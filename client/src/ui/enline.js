// An English sentence with a 🔊 button and its Vietnamese meaning, shown the
// way this player chose in Settings (always / tap to show / off).

import { h } from './dom.js';
import { settings } from '../store.js';
import { speak } from '../audio.js';

export function line(en, vi, cls = '') {
  const viEl = vi && settings.vi !== 'off' ? h('div', { class: `vi ${settings.vi === 'always' ? '' : 'hidden'}` }, vi) : null;
  const tools = h('span', { class: 'tools' },
    h('button', { class: 'btn small', title: 'Nghe', onclick: () => speak(en, 'narr') }, '🔊'),
    viEl && settings.vi === 'tap' ? h('button', { class: 'btn small', onclick: () => viEl.classList.toggle('hidden') }, 'VI') : null,
  );
  return h('div', { class: `tx-line ${cls}` }, h('div', { class: 'en-line' }, h('span', {}, en), tools), viEl);
}
