// Shared client context: who am I, the latest state, small helpers.

import { settings } from './store.js';
import { net } from './net.js';
import { other } from '../../shared/logic.js';

export const G = {
  net,
  settings,
  slot: null,
  state: null,
  game: null, // Phaser.Game
  busy: 0, // >0 while a DOM panel captures the keyboard
  bus: new EventTarget(),
};

export const ROLE = {
  p1: { icon: '🔦', title: 'Thợ máy', en: 'The Fixer', desc: 'Có đèn lồng (đọc chữ phát sáng), hộp đồ nghề (vận hành máy móc) và ống nhòm (quan sát từ trên cao).' },
  p2: { icon: '📻', title: 'Điện đài viên', en: 'The Radio Operator', desc: 'Có radio và tai nghe: nghe được sóng radio, lời nhắn ghi âm và tiếng thì thầm mà người kia không nghe được.' },
};

export const DEFAULT_NAMES = { p1: 'Sky', p2: 'River' };

export function nameOf(slot) {
  const s = G.state;
  return (s && s.players[slot] && s.players[slot].name) || DEFAULT_NAMES[slot];
}

export function partner() {
  return other(G.slot);
}

export function fill(text) {
  return String(text || '').replace(/\{p1\}/g, nameOf('p1')).replace(/\{p2\}/g, nameOf('p2'));
}

export function emit(name, detail) {
  G.bus.dispatchEvent(new CustomEvent(name, { detail }));
}
export function on(name, fn) {
  G.bus.addEventListener(name, (e) => fn(e.detail));
}

export function act(a) {
  return net.act(a);
}

export { settings };

// Objectives shown in the tracker, derived from shared flags.
export function objectives(s) {
  const f = (s && s.flags) || {};
  if (!f.started || !f.intro_done || (s.stage && s.stage !== 'world')) return [];
  if (!f.pip_called) {
    return [
      { en: 'Search the beach', vi: 'Khám phá bãi biển, tìm đồ dùng được', sub: [
        { vi: `${ROLE.p1.icon} Hộp đồ nghề cho ${nameOf('p1')}`, done: !!f.has_tools },
        { vi: `${ROLE.p2.icon} Radio cho ${nameOf('p2')}`, done: !!f.has_radio },
      ] },
    ];
  }
  if (!f.pip_met) return [{ en: 'Who is that?', vi: 'Ai vậy nhỉ?' }];
  if (!f.radio_done) {
    return [{ en: 'Talk by radio', vi: 'Mỗi người gửi 1 câu qua Radio (phím R)', sub: [
      { vi: nameOf('p1'), done: !!s.radioSent.p1 },
      { vi: nameOf('p2'), done: !!s.radioSent.p2 },
    ] }];
  }
  if (!f.log_done) return [{ en: 'Move the log together', vi: 'Cùng nhấc khúc gỗ chắn đường lên đồi: đếm "Ready? One, two, three!" rồi cả hai cùng bấm E' }];
  if (!f.journal) return [{ en: "Find the keeper's house", vi: 'Tìm nhà người gác đèn và đọc cuốn sổ trên bàn' }];
  if (s.stage === 'world') {
    const list = [
      { en: 'Find the crystal lens', vi: 'Tìm thấu kính trong Rừng Sương (phía tây). Tháp canh ở cửa rừng.', done: !!f.lens },
      { en: 'Restore the power', vi: `Khôi phục điện: ${nameOf('p2')} nghe radio trong nhà, ${nameOf('p1')} vận hành máy phát (phía đông).`, done: !!f.power },
    ];
    if (f.power && !f.door_open) list.push({ en: 'Open the lighthouse door', vi: 'Mở cửa hải đăng bằng "lời của người gác đèn". Một người đọc, một người nghe.' });
    if (f.door_open) list.push({ en: 'Enter together', vi: 'Cả hai đứng ở cửa hải đăng và bấm E để cùng đi lên' });
    return list;
  }
  return [];
}

export function hintKey(s) {
  const f = (s && s.flags) || {};
  if (!f.pip_met) return 'beach';
  if (!f.radio_done) return 'radio';
  if (!f.log_done) return 'log';
  if (!f.journal) return 'cottage';
  if (!f.lens && !f.power) return Math.random() < 0.5 ? 'lens' : 'power';
  if (!f.lens) return 'lens';
  if (!f.power) return 'power';
  if (!f.door_open) return 'door';
  return 'enter';
}
