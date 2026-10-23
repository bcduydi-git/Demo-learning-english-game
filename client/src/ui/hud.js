// In-game HUD: objectives, partner status, buttons, prompts, toasts, radio feed.

import { h, root, clear, portraitUrl } from './dom.js';
import { G, nameOf, partner, objectives, settings, ROLE } from '../ctx.js';
import { PHRASE_BY_ID } from '../../../shared/phrases.js';
import { toggleMute, speak, sfx } from '../audio.js';
import { openRadio } from './radio.js';
import { openPhrasebook } from './phrasebook.js';
import { openSettings } from './settings.js';
import { showHint } from './panels.js';

let el = null;
let objEl, whoEl, promptEl, bannerEl, toastsEl, feedEl, pointerEl, muteBtn;

export function initHud() {
  if (el) return;
  objEl = h('div', { class: 'box obj hidden' });
  whoEl = h('div', { class: 'box who' });
  muteBtn = h('button', { class: 'btn', title: 'Tắt/bật tiếng (M)', onclick: () => { toggleMute(); drawMute(); } });
  const tr = h('div', { class: 'tr' },
    h('button', { class: 'btn', title: 'Radio (R)', onclick: () => openRadio() }, '📻'),
    h('button', { class: 'btn', title: 'Sổ cụm từ (B)', onclick: () => openPhrasebook() }, '📖'),
    h('button', { class: 'btn', title: 'Gợi ý từ Pip (H)', onclick: () => showHint() }, '💡'),
    muteBtn,
    h('button', { class: 'btn', title: 'Cài đặt (Esc)', onclick: () => openSettings() }, '⚙'),
  );
  promptEl = h('div', { class: 'box prompt hidden' });
  bannerEl = h('div', { class: 'box banner hidden' });
  toastsEl = h('div', { class: 'toasts' });
  feedEl = h('div', { class: 'feed' });
  pointerEl = h('div', { class: 'box pointer hidden' });
  el = h('div', { id: 'hud', class: 'hidden' },
    h('div', { class: 'tl' }, whoEl, objEl),
    tr, promptEl, bannerEl, toastsEl, feedEl, pointerEl,
  );
  root().append(el);
  drawMute();
}

function drawMute() {
  muteBtn.textContent = settings.mute ? '🔇' : '🔊';
}

export function showHud(v) {
  initHud();
  el.classList.toggle('hidden', !v);
}

let lastObjKey = '';
export function renderHud(state) {
  if (!el) return;
  // partner status
  const p = partner();
  const online = state.players[p].connected;
  clear(whoEl);
  // in the chapter 2 prototype the roles are "at the machine" / "with the manual"
  const icon = (slot) => (state.stage === 'tx' && state.tx ? (state.tx.tech === slot ? '🔧' : '📘') : ROLE[slot].icon);
  whoEl.append(
    h('img', { src: portraitUrl(G.slot) }),
    h('span', {}, h('b', {}, nameOf(G.slot)), ` ${icon(G.slot)}`),
    h('span', { class: 'small' }, ' · '),
    h('img', { src: portraitUrl(p) }),
    h('span', {}, h('b', {}, nameOf(p)), ` ${icon(p)} `),
    h('span', { class: `dot ${online ? 'on' : ''}`, title: online ? 'đang online' : 'mất kết nối' }),
  );
  // banner
  let banner = '';
  if (G.net.status !== 'online') banner = '⚠ Mất kết nối tới máy chủ — đang thử kết nối lại...';
  else if (!online && state.flags.started) banner = `⚠ ${nameOf(p)} đang mất kết nối. Bạn vẫn chơi tiếp được; mọi thứ sẽ đồng bộ khi họ quay lại.`;
  bannerEl.textContent = banner;
  bannerEl.classList.toggle('hidden', !banner);
  // objectives
  const objs = objectives(state);
  const key = JSON.stringify(objs);
  if (key !== lastObjKey) {
    const changed = lastObjKey !== '';
    lastObjKey = key;
    clear(objEl);
    objEl.classList.toggle('hidden', !objs.length);
    if (objs.length) {
      objEl.append(h('h4', {}, 'Objective'));
      for (const o of objs) {
        objEl.append(h('div', { class: `item ${o.done ? 'done' : ''}` }, h('span', {}, o.done ? '✔' : '◆'), h('div', {}, h('div', { class: 'en' }, o.en), h('div', {}, o.vi))));
        if (o.sub) for (const s of o.sub) objEl.append(h('div', { class: `sub ${s.done ? 'done' : ''}` }, `${s.done ? '✔' : '○'} ${s.vi}`));
      }
      if (changed) {
        objEl.classList.remove('shake');
        void objEl.offsetWidth;
        objEl.classList.add('shake');
      }
    }
  }
}

export function setPrompt(text) {
  if (!promptEl) return;
  if (!text) { promptEl.classList.add('hidden'); return; }
  promptEl.classList.remove('hidden');
  if (promptEl._t !== text) {
    promptEl._t = text;
    clear(promptEl);
    promptEl.append(h('span', { class: 'kbd' }, 'E'), ' ', text);
  }
}

export function toast(text, kind = '') {
  initHud();
  const t = h('div', { class: `box toast ${kind}` }, text);
  toastsEl.append(t);
  setTimeout(() => t.remove(), 4200);
  while (toastsEl.children.length > 4) toastsEl.firstChild.remove();
}

// radio messages appear here; the partner's ones are read aloud
export function feedMessage(msg) {
  initHud();
  const mine = msg.by === G.slot;
  const ph = msg.pid && PHRASE_BY_ID[msg.pid];
  const viText = ph && settings.vi !== 'off' ? ph.vi : '';
  const viEl = h('div', { class: `small ${settings.vi === 'always' ? '' : 'hidden'}` }, viText);
  const item = h('div', { class: `box msg ${mine ? 'mine' : ''}` },
    h('div', { class: 'meta' }, h('span', {}, `📻 ${nameOf(msg.by)}`),
      h('span', {},
        h('button', { class: 'btn small ghost', onclick: () => speak(msg.text, msg.by) }, '🔊'),
        viText && settings.vi === 'tap' ? h('button', { class: 'btn small ghost', onclick: () => viEl.classList.toggle('hidden') }, 'VI') : null,
      )),
    h('div', { class: 'en' }, msg.text),
    viEl,
  );
  feedEl.append(item);
  while (feedEl.children.length > 5) feedEl.firstChild.remove();
  setTimeout(() => { item.style.transition = 'opacity .6s'; item.style.opacity = '0'; setTimeout(() => item.remove(), 700); }, 16000);
  if (!mine) {
    sfx('radio');
    setTimeout(() => speak(msg.text, msg.by), 250);
  }
}

// arrow toward the partner when they are off screen (x, y in screen px)
export function setPointer(info) {
  if (!pointerEl) return;
  if (!info) { pointerEl.classList.add('hidden'); return; }
  pointerEl.classList.remove('hidden');
  pointerEl.style.left = `${info.x}px`;
  pointerEl.style.top = `${info.y}px`;
  pointerEl.textContent = `${info.arrow} ${nameOf(partner())}${info.where ? ' · ' + info.where : ''}`;
}
