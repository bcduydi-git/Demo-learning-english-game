// Per-player settings: language support level, voice, volumes, boss speed.

import { h } from './dom.js';
import { openModal } from './modal.js';
import { settings, saveSettings } from '../store.js';
import { applyVolumes, englishVoices, speak, hasSpeech, speechInputSupported } from '../audio.js';
import { BOSS_SPEED } from '../../../shared/content.js';
import { emit } from '../ctx.js';

function seg(options, get, set) {
  const wrap = h('div', { class: 'seg' });
  const draw = () => {
    wrap.innerHTML = '';
    for (const [val, label] of options) {
      wrap.append(h('button', { class: get() === val ? 'on' : '', onclick: () => { set(val); saveSettings(); draw(); emit('settings'); } }, label));
    }
  };
  draw();
  return wrap;
}

function slider(key) {
  const inp = h('input', { type: 'range', min: 0, max: 1, step: 0.05, value: settings.vol[key] });
  inp.addEventListener('input', () => { settings.vol[key] = Number(inp.value); saveSettings(); applyVolumes(); });
  return inp;
}

export function openSettings() {
  const m = openModal('Cài đặt', { id: 'settings' });
  const voices = englishVoices();
  const vsel = h('select', {},
    h('option', { value: '' }, 'Tự chọn giọng hay nhất'),
    ...voices.map((v) => h('option', { value: v.name, selected: settings.voiceName === v.name }, `${v.name} (${v.lang})`)),
  );
  vsel.addEventListener('change', () => { settings.voiceName = vsel.value; saveSettings(); });
  m.body.append(
    h('p', { class: 'small' }, 'Cài đặt này chỉ áp dụng cho máy của bạn — hai người có thể chọn mức hỗ trợ khác nhau.'),
    h('h3', {}, 'Hỗ trợ tiếng Anh'),
    h('div', { class: 'form-grid' },
      h('div', {}, 'Phụ đề tiếng Anh', h('div', { class: 'small' }, 'cho lời thoại có giọng đọc')),
      seg([['always', 'Luôn hiện'], ['after', 'Hiện sau khi nghe'], ['tap', 'Ẩn — bấm để xem']], () => settings.sub, (v) => { settings.sub = v; }),
      h('div', {}, 'Nghĩa tiếng Việt'),
      seg([['always', 'Luôn hiện'], ['tap', 'Bấm để xem'], ['off', 'Tắt']], () => settings.vi, (v) => { settings.vi = v; }),
      h('div', {}, 'Tốc độ giọng đọc'),
      seg([[1, 'Bình thường'], [0.9, 'Hơi chậm'], [0.75, 'Chậm']], () => settings.rate, (v) => { settings.rate = v; }),
      h('div', {}, 'Tốc độ trận Bão', h('div', { class: 'small' }, 'thời gian chữ rơi trong làn của bạn')),
      seg(Object.entries(BOSS_SPEED).map(([k, v]) => [k, v.label]), () => settings.boss, (v) => { settings.boss = v; }),
      h('div', {}, 'Nút nói (micro)', h('div', { class: 'small' }, speechInputSupported() ? 'chuyển lời nói thành chữ để bạn kiểm tra rồi gửi' : 'trình duyệt này không hỗ trợ — dùng Chrome/Edge nếu muốn')),
      seg([[true, 'Hiện'], [false, 'Ẩn']], () => settings.mic, (v) => { settings.mic = v; }),
    ),
    h('h3', {}, 'Âm thanh'),
    h('div', { class: 'form-grid' },
      h('div', {}, 'Tổng'), slider('master'),
      h('div', {}, 'Nhạc nền'), slider('music'),
      h('div', {}, 'Hiệu ứng'), slider('sfx'),
      h('div', {}, 'Môi trường (sóng, gió)'), slider('amb'),
      h('div', {}, 'Giọng đọc tiếng Anh'), slider('voice'),
      h('div', {}, 'Giọng tiếng Anh'),
      hasSpeech()
        ? h('div', { class: 'row' }, vsel, h('button', { class: 'btn small', onclick: () => speak('Hello! Can you hear me?', 'narr') }, '🔊 Thử'))
        : h('div', { class: 'small' }, 'Trình duyệt không có giọng đọc. Phụ đề sẽ luôn hiện.'),
    ),
    h('p', { class: 'small' }, 'Phím tắt: M = tắt/bật tiếng · Esc = đóng bảng · H = gợi ý.'),
  );
}
