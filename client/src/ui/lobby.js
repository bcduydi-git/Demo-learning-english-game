// Title screen and session lobby (create / join / continue / wait for partner).

import { h, root, clear, portraitUrl } from './dom.js';
import { G, ROLE, CHARACTERS, nameOf, act } from '../ctx.js';
import { settings, saveSettings, lastSession, loadSave, clearLastSession } from '../store.js';
import { progressOf } from '../../../shared/logic.js';
import { unlockAudio, sfx, music } from '../audio.js';
import { openSettings } from './settings.js';
import { openHelp } from './help.js';

let el = null;
let view = 'home';
let selRole = 'p1';
let error = '';
let takeover = null;

export function showLobby() {
  if (!el) {
    el = h('div', { id: 'lobby' });
    root().append(el);
  }
  el.classList.remove('hidden');
  const startMusic = () => { unlockAudio(); if (lobbyVisible()) music('title'); };
  window.addEventListener('pointerdown', startMusic, { once: true });
  window.addEventListener('keydown', startMusic, { once: true });
  const params = new URLSearchParams(location.search);
  if (params.get('room') && view === 'home' && !G.net.room) view = 'join';
  render();
}

export function hideLobby() {
  if (el) el.classList.add('hidden');
}

export function lobbyVisible() {
  return el && !el.classList.contains('hidden');
}

function go(v) {
  view = v;
  error = '';
  takeover = null;
  sfx('ui');
  render();
}

// "Who are you?" — Lắc or Tím. Separate from the role choice.
function whoPicker(onPick) {
  const card = (look) => h('div', {
    class: `role who-card ${settings.look === look ? 'sel' : ''}`,
    onclick: () => { settings.look = look; saveSettings(); sfx('click'); onPick(); },
  },
  h('img', { src: portraitUrl(look), class: 'face' }),
  h('div', {}, h('h3', { class: 'en', style: { fontSize: '30px', margin: 0 } }, CHARACTERS[look].name)));
  return h('div', { class: 'roles' }, card('lac'), card('tim'));
}

export function lobbyError(m) {
  error = m.msg || 'Có lỗi kết nối.';
  if (m.code === 'takeover') takeover = m;
  if (m.code === 'no_room' || m.code === 'full') view = view === 'wait' ? 'join' : view;
  render();
}

export function renderLobby() {
  if (lobbyVisible()) render();
}

function render() {
  if (!el) return;
  clear(el);
  el.append(h('div', { class: 'stars' }), h('div', { class: 'sea' }), h('div', { class: 'isle' }), h('div', { class: 'tower' }), h('div', { class: 'beam' }));
  const card = h('div', { class: 'box lobby-card' });
  el.append(card);
  card.append(
    h('h1', { class: 'logo' }, 'BEACON ISLE'),
    h('p', { class: 'tagline' }, 'Phiêu lưu giải đố co-op tiếng Anh cho 2 người · hai máy tính, một hòn đảo'),
  );
  if (view === 'home') card.append(homeView());
  if (view === 'create') card.append(createView());
  if (view === 'join') card.append(joinView());
  if (view === 'wait') card.append(waitView());
  card.append(h('div', { class: 'err' }, error));
  if (takeover) {
    card.append(h('div', { class: 'row' },
      h('button', { class: 'btn gold', onclick: () => { unlockAudio(); G.net.connect('join', { room: G.net.hello.room, takeover: true, slot: takeover.slot, save: G.net.withSave(G.net.hello.room) }); takeover = null; error = 'Đang vào...'; render(); } }, `Vào chỗ của "${takeover.name || takeover.slot}"`),
    ));
  }
}

function homeView() {
  const wrap = h('div', { class: 'col' });
  const last = lastSession();
  const save = last && loadSave(last.room);
  if (save && save.state && !(save.state.flags && save.state.flags.complete && Date.now() - save.savedAt > 864e5)) {
    const st = save.state;
    const nm = (slot) => st.players[slot].name || (CHARACTERS[st.players[slot].look] || {}).name || slot;
    const names = `${nm('p1')} & ${nm('p2')}`;
    const when = new Date(save.savedAt).toLocaleString('vi-VN');
    wrap.append(h('div', { class: 'card' },
      h('img', { src: portraitUrl(st.players[last.slot].look || last.slot), class: 'face', style: { width: '56px', height: '56px' } }),
      h('div', { style: { flex: 1 } },
        h('div', { style: { fontWeight: 700 } }, `Tiếp tục phòng ${last.room}`),
        h('div', { class: 'small' }, `${names} · tiến độ ${progressOf(st)}% · lưu lúc ${when}`),
      ),
      h('button', { class: 'btn gold', onclick: () => {
        unlockAudio();
        error = 'Đang kết nối...';
        view = 'wait';
        G.net.connect('join', { room: last.room, slot: last.slot, save: st });
        render();
      } }, 'Tiếp tục ▶'),
    ));
  }
  wrap.append(h('div', { class: 'row' },
    h('button', { class: 'btn gold', onclick: () => go('create') }, '✚ Tạo phòng mới'),
    h('button', { class: 'btn teal', onclick: () => go('join') }, '⇢ Vào phòng của bạn kia'),
    h('span', { class: 'spacer' }),
    h('button', { class: 'btn', onclick: () => openSettings() }, '⚙ Cài đặt'),
    h('button', { class: 'btn', onclick: () => openHelp() }, '? Cách chơi'),
  ));
  wrap.append(h('div', { class: 'lobby-help' },
    h('p', {}, h('b', {}, '1.'), ' Một người bấm ', h('b', {}, 'Tạo phòng mới'), ', chọn mình là Lắc hay Tím và chọn vai, rồi gửi ', h('b', {}, 'mã phòng 4 chữ'), ' (hoặc đường link) cho người kia.'),
    h('p', {}, h('b', {}, '2.'), ' Người kia mở cùng địa chỉ trang này trên máy của mình, bấm ', h('b', {}, 'Vào phòng'), ' và nhập mã.'),
    h('p', {}, h('b', {}, '3.'), ' Gọi thoại cho nhau bằng ứng dụng quen thuộc (Zalo, Messenger, Discord...). Game tự lưu; mất mạng thì tự kết nối lại.'),
  ));
  return wrap;
}

function roleCard(slot, taken) {
  const r = ROLE[slot];
  return h('div', {
    class: `role ${selRole === slot ? 'sel' : ''} ${taken ? 'taken' : ''}`,
    onclick: () => { if (!taken) { selRole = slot; sfx('click'); render(); } },
  },
  h('div', { class: 'role-icon' }, r.icon),
  h('div', {}, h('h3', {}, `${r.title} `, h('span', { class: 'en', style: { fontSize: '20px', color: 'var(--muted)' } }, r.en)), h('p', {}, r.desc)));
}

function createView() {
  return h('div', { class: 'col' },
    h('div', {}, h('b', {}, 'Bạn là ai?')),
    whoPicker(render),
    h('div', {}, h('b', {}, 'Chọn vai'), h('span', { class: 'small' }, ' — hai vai ngang nhau, mỗi người giữ thông tin và khả năng người kia không có.')),
    h('div', { class: 'roles' }, roleCard('p1'), roleCard('p2')),
    h('div', { class: 'row' },
      h('button', { class: 'btn ghost', onclick: () => go('home') }, '← Quay lại'),
      h('span', { class: 'spacer' }),
      h('button', { class: 'btn gold', onclick: () => {
        unlockAudio();
        error = 'Đang tạo phòng...';
        view = 'wait';
        G.net.connect('create', { slot: selRole, look: settings.look });
        render();
      } }, 'Tạo phòng ▶'),
    ),
  );
}

function joinView() {
  const params = new URLSearchParams(location.search);
  const code = h('input', { type: 'text', class: 'en-input', maxlength: 6, placeholder: 'MÃ', value: params.get('room') || '', style: { width: '160px', textTransform: 'uppercase', letterSpacing: '.3em' } });
  const go2 = () => {
    unlockAudio();
    const room = code.value.trim().toUpperCase();
    if (!room) { error = 'Nhập mã phòng mà người kia gửi cho bạn.'; render(); return; }
    error = 'Đang vào phòng...';
    view = 'wait';
    G.net.connect('join', { room, look: settings.look, save: G.net.withSave(room) });
    render();
  };
  code.addEventListener('keydown', (e) => { if (e.key === 'Enter') go2(); });
  const keep = code.value;
  return h('div', { class: 'col' },
    h('div', { class: 'row' }, h('b', {}, 'Mã phòng:'), code),
    h('div', {}, h('b', {}, 'Bạn là ai?')),
    whoPicker(() => { const v = code.value || keep; render(); const c = el.querySelector('input.en-input'); if (c) c.value = v; }),
    h('p', { class: 'small' }, 'Bạn sẽ nhận vai còn trống trong phòng. Nếu người kia đã chọn nhân vật này, bạn sẽ là nhân vật còn lại.'),
    h('div', { class: 'row' },
      h('button', { class: 'btn ghost', onclick: () => go('home') }, '← Quay lại'),
      h('span', { class: 'spacer' }),
      h('button', { class: 'btn teal', onclick: go2 }, 'Vào phòng ▶'),
    ),
  );
}

function waitView() {
  const s = G.state;
  const wrap = h('div', { class: 'col' });
  if (!s || !G.net.room) {
    wrap.append(h('p', {}, G.net.status === 'offline' ? 'Không kết nối được tới máy chủ. Đang thử lại...' : 'Đang kết nối...'));
    wrap.append(h('div', { class: 'row' }, h('button', { class: 'btn ghost', onclick: () => { G.net.close(); go('home'); } }, '← Huỷ')));
    return wrap;
  }
  error = '';
  const link = `${location.origin}${location.pathname}?room=${G.net.room}`;
  wrap.append(
    h('div', { class: 'row' },
      h('div', {}, h('div', { class: 'small' }, 'Mã phòng — gửi cho người kia'), h('div', { class: 'code' }, G.net.room)),
      h('span', { class: 'spacer' }),
      h('button', { class: 'btn', onclick: (e) => {
        navigator.clipboard && navigator.clipboard.writeText(link).then(() => { e.target.textContent = '✓ Đã chép link'; }).catch(() => { prompt('Chép đường link này:', link); });
      } }, '📋 Chép link mời'),
    ),
  );
  const slotView = (slot) => {
    const p = s.players[slot];
    const me = slot === G.slot;
    return h('div', { class: 'player-slot' },
      h('img', { src: portraitUrl(slot) }),
      h('div', { style: { flex: 1 } },
        h('div', {}, h('b', {}, p.connected ? nameOf(slot) : '— trống —'), me ? ' (bạn)' : ''),
        h('div', { class: 'small' }, `${ROLE[slot].icon} ${ROLE[slot].title}`),
      ),
      h('span', { class: `dot ${p.connected ? 'on' : ''}` }),
    );
  };
  wrap.append(h('div', { class: 'row' }, slotView('p1'), slotView('p2')));
  const both = s.players.p1.connected && s.players.p2.connected;
  const started = s.flags && s.flags.started;
  wrap.append(h('div', { class: 'row' },
    h('button', { class: 'btn ghost', onclick: () => { G.net.close(); clearLastSession(); location.search = ''; } }, '← Rời phòng'),
    h('span', { class: 'spacer' }),
    !both && !started ? h('span', { class: 'small' }, `Đang chờ ${nameOf(G.slot === 'p1' ? 'p2' : 'p1')} vào phòng...`) : null,
    h('button', { class: 'btn gold', disabled: !both, onclick: () => { unlockAudio(); act({ type: 'start' }); } }, 'Bắt đầu ▶'),
  ));
  if (!both) {
    wrap.append(h('details', { class: 'small' },
      h('summary', {}, 'Chỉ muốn thử một mình?'),
      h('p', {}, 'Mở thêm một tab (hoặc trình duyệt khác) trên cùng máy, vào phòng bằng mã ở trên. Đó vẫn là multiplayer thật qua máy chủ, chỉ là hai người chơi trên cùng một máy.'),
      h('button', { class: 'btn small', onclick: () => { unlockAudio(); act({ type: 'start' }); } }, 'Bắt đầu khi chưa có người kia (một số câu đố cần đủ 2 người)'),
    ));
  }
  return wrap;
}
