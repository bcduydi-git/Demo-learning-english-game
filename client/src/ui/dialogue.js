// Shared story dialogue. Both players see the same line; it moves on when
// everyone connected has pressed "next", so nobody is left behind.

import { h, root, clear, portraitUrl } from './dom.js';
import { G, nameOf, partner, fill, act, settings, on } from '../ctx.js';
import { SCENES } from '../../../shared/content.js';
import { speak, sfx, stopSpeech } from '../audio.js';

const SPEAKER = {
  narr: { name: '', portrait: null },
  pip: { name: 'Pip', portrait: 'pip' },
  keeper: { name: 'Eleanor (radio)', portrait: 'keeper' },
  storm: { name: 'The Storm', portrait: 'storm' },
  captain: { name: 'Captain Marlow', portrait: 'captain' },
};

let el = null;
let shownKey = null;
let typing = null;
let fullText = '';
let lineEl = null;
let revealSub = false;

export function dialogueOpen() {
  return !!(G.state && G.state.scene);
}

function ensureEl() {
  if (!el) {
    el = h('div', { id: 'dialogue', class: 'hidden' });
    root().append(el);
  }
  return el;
}

export function renderDialogue(state) {
  ensureEl();
  const sc = state && state.scene;
  if (!sc) {
    if (shownKey) {
      el.classList.add('hidden');
      shownKey = null;
      clearInterval(typing);
    }
    return;
  }
  const key = `${sc.id}:${sc.idx}`;
  if (key !== shownKey) {
    shownKey = key;
    revealSub = false;
    showLine(SCENES[sc.id][sc.idx], sc, true);
  } else {
    updateWait(sc);
  }
}

function speakerInfo(line) {
  if (line.s === 'p1' || line.s === 'p2') return { name: nameOf(line.s), portrait: line.s };
  return SPEAKER[line.s] || SPEAKER.narr;
}

function voiceStyle(line) {
  return line.voice || line.s;
}

function typeText(target, text) {
  clearInterval(typing);
  fullText = text;
  lineEl = target;
  let i = 0;
  target.textContent = '';
  typing = setInterval(() => {
    i += 1;
    target.textContent = text.slice(0, i);
    if (i % 3 === 0) sfx('blip');
    if (i >= text.length) clearInterval(typing), (typing = null);
  }, 22);
}

function finishTyping() {
  if (typing) {
    clearInterval(typing);
    typing = null;
    if (lineEl) lineEl.textContent = fullText;
    return true;
  }
  return false;
}

function showLine(line, sc, fresh) {
  clear(el);
  el.classList.remove('hidden');
  const info = speakerInfo(line);
  const mine = line.s === G.slot;
  const theirs = line.s === partner();
  const isSay = !!line.say;
  const voiced = line.en && !(isSay && (mine || theirs));

  if (info.portrait) {
    const img = h('img', { class: `portrait ${line.s === 'p2' ? 'right' : ''}`, src: portraitUrl(info.portrait) });
    el.append(img);
  }
  const body = h('div', { class: 'box body' });
  el.append(body);

  if (line.s === 'narr') {
    body.append(h('div', { class: 'narr' }, fill(line.vi)));
  } else {
    const nameRow = h('div', { class: 'name' }, info.name);
    if (isSay && mine) nameRow.append(h('span', { class: 'tag say' }, `🗣 Lượt bạn nói — đọc to cho ${nameOf(partner())} nghe`));
    if (isSay && theirs) nameRow.append(h('span', { class: 'tag' }, `🗣 ${nameOf(line.s)} đang nói — hãy nghe`));
    body.append(nameRow);

    const lineDiv = h('div', { class: 'line en' });
    body.append(lineDiv);
    const listenFirst = (voiced || (isSay && theirs)) && settings.sub !== 'always' && !revealSub;
    if (listenFirst) {
      lineDiv.classList.add('hiddenline');
      lineDiv.textContent = settings.sub === 'after' ? '🎧 Hãy nghe... (chữ sẽ hiện sau)' : '🎧 Hãy nghe. Bấm "Hiện chữ" nếu cần.';
    } else if (fresh) {
      typeText(lineDiv, line.en);
    } else {
      lineDiv.textContent = line.en;
    }

    // Vietnamese meaning
    const viDiv = h('div', { class: 'vi' }, line.vi ? 'Nghĩa: ' + fill(line.vi) : '');
    if (settings.vi !== 'always' || !line.vi) viDiv.classList.add('hidden');
    body.append(viDiv);

    const controls = h('div', { class: 'controls' });
    const play = (slow) => speak(line.en, voiceStyle(line), { rate: slow ? 0.75 : 1 }).then(() => {
      if (listenFirst && settings.sub === 'after' && !revealSub) { revealSub = true; showLine(line, G.state.scene, true); }
    });
    if (isSay && mine) {
      controls.append(
        h('button', { class: 'btn small', onclick: () => speak(line.en, voiceStyle(line)) }, '🔊 Nghe mẫu'),
        h('button', { class: 'btn small', title: 'Khi bạn không tiện nói: máy sẽ đọc câu này ở cả hai máy', onclick: () => act({ type: 'scene_voice', id: sc.id, idx: sc.idx }) }, '📢 Nhờ máy đọc cho cả hai'),
      );
    } else {
      controls.append(
        h('button', { class: 'btn small', onclick: () => play(false) }, '🔊 Nghe lại'),
        h('button', { class: 'btn small', onclick: () => play(true) }, '🐢 Chậm'),
      );
      if (listenFirst) controls.append(h('button', { class: 'btn small', onclick: () => { revealSub = true; showLine(line, G.state.scene, true); } }, 'Hiện chữ'));
    }
    if (line.vi && settings.vi === 'tap') {
      controls.append(h('button', { class: 'btn small', onclick: () => { viDiv.classList.toggle('hidden'); } }, 'VI'));
    }
    body.append(controls);
    if (fresh && voiced) play(false);
    if (fresh && isSay && mine) sfx('msg');
  }

  const foot = h('div', { class: 'controls' });
  foot.append(h('span', { class: 'wait' }), h('span', { class: 'spacer' }));
  const nextLabel = isSay && mine ? 'Mình đã nói ▶' : 'Tiếp ▶';
  const next = h('button', { class: 'btn gold small next' }, nextLabel, ' ', h('span', { class: 'kbd' }, 'Space'));
  next.addEventListener('click', () => advance());
  foot.append(next);
  body.append(foot);
  updateWait(sc);
}

function updateWait(sc) {
  if (!el) return;
  const wait = el.querySelector('.wait');
  const next = el.querySelector('.next');
  if (!wait || !next) return;
  const meReady = !!sc.ready[G.slot];
  const p = partner();
  const pOn = G.state.players[p].connected;
  const pReady = !!sc.ready[p];
  if (meReady && pOn && !pReady) {
    wait.textContent = `⏳ Đang chờ ${nameOf(p)}...`;
    next.disabled = true;
  } else {
    wait.textContent = pOn && pReady ? `✓ ${nameOf(p)} đã sẵn sàng` : '';
    next.disabled = meReady;
  }
}

export function advance() {
  const sc = G.state && G.state.scene;
  if (!sc) return;
  if (finishTyping()) return;
  if (sc.ready[G.slot]) return;
  stopSpeech();
  sfx('click');
  act({ type: 'scene_next', id: sc.id, idx: sc.idx });
}

// someone asked the game to voice their line for both players
on('ev:voice', (e) => {
  const sc = G.state && G.state.scene;
  if (!sc || sc.id !== e.id || sc.idx !== e.idx) return;
  const line = SCENES[e.id][e.idx];
  speak(line.en, line.s).then(() => {
    if (e.by !== G.slot && settings.sub === 'after' && !revealSub) { revealSub = true; showLine(line, G.state.scene, true); }
  });
});
