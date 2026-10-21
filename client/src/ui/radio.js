// Radio: send English phrases (tap a chip or type) to the partner. The message
// shows on their screen and is read aloud there. Works without a microphone.

import { h, clear } from './dom.js';
import { openModal } from './modal.js';
import { G, nameOf, partner, act, settings } from '../ctx.js';
import { PHRASES, PHRASE_GROUPS, matchPhrase } from '../../../shared/phrases.js';
import { sfx, speechInputSupported, listenOnce } from '../audio.js';

// Always available on the radio (basic talk). Others unlock when met.
export const STARTER = ['are_you_ok', 'im_ok', 'come_here', 'look_at_this', 'lets_go', 'wait_for_me', 'ready', 'one_two_three', 'say_again', 'slowly', 'got_it', 'which_one', 'can_you_help', 'i_can_hear_you'];

export function availablePhrases() {
  const book = (G.state && G.state.learn[G.slot]) || {};
  return PHRASES.filter((p) => STARTER.includes(p.id) || (book[p.id] && book[p.id].s));
}

export function sendRadio(text, phraseId) {
  const t = String(text || '').trim();
  if (!t) return;
  act({ type: 'radio_msg', text: t, phraseId: phraseId || matchPhrase(t) || undefined });
  sfx('msg');
}

let tab = 'check';

export function openRadio(prefill = '') {
  const m = openModal('📻 Radio', { id: 'radio' });
  const input = h('input', { type: 'text', class: 'en-input', maxlength: 140, placeholder: 'Gõ câu tiếng Anh rồi Enter...', value: prefill, style: { flex: 1, minWidth: '200px' } });
  const send = () => {
    if (!input.value.trim()) return;
    sendRadio(input.value);
    input.value = '';
    input.focus();
  };
  input.addEventListener('keydown', (e) => {
    e.stopPropagation();
    if (e.key === 'Enter') send();
    if (e.key === 'Escape') m.close();
  });
  const micBtn = speechInputSupported() && settings.mic
    ? h('button', { class: 'btn', title: 'Nói tiếng Anh, máy chuyển thành chữ để bạn kiểm tra rồi gửi' }, '🎙 Nói')
    : null;
  const micNote = h('div', { class: 'small' });
  if (micBtn) {
    micBtn.addEventListener('click', async () => {
      micBtn.disabled = true;
      micNote.textContent = '🎙 Đang nghe... hãy nói một câu tiếng Anh.';
      try {
        const text = await listenOnce();
        input.value = text;
        micNote.textContent = 'Máy nghe được câu trên — sửa nếu cần rồi bấm Gửi. (Chỉ chuyển giọng thành chữ, không chấm điểm.)';
      } catch (e) {
        micNote.textContent = 'Không nghe rõ hoặc micro không dùng được — cứ gõ hoặc bấm cụm từ bên dưới nhé.';
      }
      micBtn.disabled = false;
      input.focus();
    });
  }

  const tabsEl = h('div', { class: 'tabs' });
  const chipsEl = h('div', { class: 'chips' });
  const draw = () => {
    const avail = availablePhrases();
    const groups = PHRASE_GROUPS.filter((g) => avail.some((p) => p.group === g.id));
    if (!groups.some((g) => g.id === tab)) tab = groups[0] ? groups[0].id : 'check';
    clear(tabsEl);
    for (const g of groups) {
      tabsEl.append(h('div', { class: `tab ${tab === g.id ? 'on' : ''}`, onclick: () => { tab = g.id; draw(); } }, `${g.vi}`));
    }
    clear(chipsEl);
    for (const p of avail.filter((x) => x.group === tab)) {
      chipsEl.append(h('button', {
        class: 'chip', title: p.vi,
        onclick: () => {
          // templates like "Turn the wheel to the left." go to the box so they can be edited
          if (p.note && p.group === 'fix') { input.value = p.en; input.focus(); return; }
          sendRadio(p.en, p.id);
        },
      }, p.en, settings.vi === 'always' ? h('span', { class: 'vi' }, p.vi) : null));
    }
  };
  draw();

  const log = h('div', { class: 'small', style: { maxHeight: '140px', overflow: 'auto', marginTop: '10px' } });
  const recent = (G.state.log || []).slice(-8).reverse();
  for (const msg of recent) log.append(h('div', {}, h('b', {}, nameOf(msg.by) + ': '), h('span', { class: 'en', style: { fontSize: '19px' } }, msg.text)));

  m.body.append(
    h('p', { class: 'small' }, `Tin nhắn sẽ hiện trên màn hình ${nameOf(partner())} và được đọc to bằng giọng máy. Dùng khi không tiện nói, hoặc để luyện câu.`),
    h('div', { class: 'row' }, input, micBtn, h('button', { class: 'btn gold', onclick: send }, 'Gửi')),
    micNote,
    h('div', { style: { height: '10px' } }),
    tabsEl,
    chipsEl,
    h('p', { class: 'small' }, 'Cụm từ mới sẽ xuất hiện ở đây khi bạn gặp chúng trong game. Cụm "Hướng dẫn thao tác" sẽ được đưa vào ô để bạn sửa từ (left/right, màu...) trước khi gửi.'),
    recent.length ? h('div', {}, h('b', { class: 'small' }, 'Gần đây'), log) : '',
  );
  setTimeout(() => input.focus(), 30);
}
