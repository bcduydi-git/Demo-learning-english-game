// Per-player settings: language support level, voice, volumes, boss speed.

import { h } from './dom.js';
import { openModal } from './modal.js';
import { settings, saveSettings } from '../store.js';
import { applyVolumes, englishVoices, speak, hasSpeech, speechInputSupported, voiceCast, resetVoiceCast } from '../audio.js';
import { CAST } from '../voices.js';
import { BOSS_SPEED } from '../../../shared/content.js';
import { emit, G, CHARACTERS, lookOf, setMyName } from '../ctx.js';

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
  const look = G.slot ? lookOf(G.slot) : settings.look;
  const nameInp = h('input', { type: 'text', class: 'name-input', maxlength: 16, value: settings.name, placeholder: `Để trống = ${CHARACTERS[look].name}` });
  const nameMsg = h('span', { class: 'small' });
  const saveName = () => { const n = setMyName(nameInp.value); nameInp.value = n; nameMsg.textContent = `✓ Đã đổi thành "${n || CHARACTERS[look].name}"`; };
  nameInp.addEventListener('keydown', (e) => { if (e.key === 'Enter') saveName(); });
  m.body.append(
    h('h3', {}, 'Tên của bạn'),
    h('div', { class: 'row' }, nameInp, h('button', { class: 'btn small', onclick: saveName }, 'Đổi tên'), nameMsg),
    h('p', { class: 'small' }, 'Tên hiện trên đầu nhân vật, trong lời thoại và ở máy người kia. Để trống thì dùng tên nhân vật.'),
    h('p', { class: 'small' }, 'Các cài đặt dưới đây chỉ áp dụng cho máy của bạn — hai người có thể chọn mức hỗ trợ khác nhau.'),
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
    ),
    h('h3', {}, 'Giọng nhân vật'),
    hasSpeech() ? castSection() : h('p', { class: 'small' }, 'Trình duyệt không có giọng đọc. Phụ đề sẽ luôn hiện.'),
    h('p', { class: 'small' }, 'Phím tắt: M = tắt/bật tiếng · Esc = đóng bảng · H = gợi ý.'),
  );
}

const SAMPLE = {
  lac: "Hi, I'm Lac. Let's fix this together!",
  tim: "Hi, I'm Tim. Can you read the code to me?",
  keeper: 'Keep the light burning, whatever happens.',
  captain: 'This is the captain speaking. Do you copy?',
  pip: 'Squawk! Hello! Hello!',
  narr: 'Welcome to Beacon Isle.',
  storm: 'You cannot stop me.',
};

// one row per character: voice select (automatic or a fixed voice) + test
function castSection() {
  const wrap = h('div');
  const draw = () => {
    wrap.innerHTML = '';
    const voices = englishVoices();
    const cast = voiceCast();
    const names = new Set(Object.values(cast).map((c) => c.voice && c.voice.name).filter(Boolean));
    const grid = h('div', { class: 'form-grid' });
    for (const [who, c] of Object.entries(CAST)) {
      const now = cast[who];
      const chosen = (settings.voices || {})[who] || (who === 'narr' && settings.voiceName) || '';
      const sel = h('select', { style: { width: '300px', maxWidth: '100%' } },
        h('option', { value: '' }, `Tự động${!chosen && now.voice ? ` — ${short(now.voice.name)}` : ''}`),
        ...voices.map((v) => h('option', { value: v.name, selected: chosen === v.name }, `${short(v.name)} (${v.lang})`)),
      );
      sel.addEventListener('change', () => {
        settings.voices = { ...(settings.voices || {}), [who]: sel.value };
        if (who === 'narr') settings.voiceName = '';
        saveSettings();
        resetVoiceCast();
        draw();
        speak(SAMPLE[who], who);
      });
      grid.append(
        h('div', {}, c.label, now.shared ? h('div', { class: 'small' }, 'dùng chung giọng, đã đổi cao độ') : null),
        h('div', { class: 'row' }, sel, h('button', { class: 'btn small', onclick: () => speak(SAMPLE[who], who) }, '🔊 Thử')),
      );
    }
    wrap.append(
      h('p', { class: 'small' }, `Máy này có ${voices.length} giọng tiếng Anh, đang dùng ${names.size} giọng khác nhau. `
        + (voices.length < 7 ? 'Ít giọng quá thì vài nhân vật phải dùng chung (đã đổi cao độ cho khác). Mở game bằng Microsoft Edge sẽ có nhiều giọng "Natural" hay hơn.' : '')),
      grid,
      h('div', { class: 'row', style: { marginTop: '6px' } },
        h('button', { class: 'btn small', onclick: () => { settings.voices = {}; settings.voiceName = ''; saveSettings(); resetVoiceCast(); draw(); } }, '↺ Chia lại tự động')),
    );
  };
  draw();
  return wrap;
}

const short = (name) => name.replace(/^Microsoft\s+/i, '').replace(/\s*-\s*English.*$/i, '').replace(/\s*Online\s*\(Natural\)/i, ' (Natural)');
