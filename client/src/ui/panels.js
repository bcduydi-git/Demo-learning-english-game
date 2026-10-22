// Puzzle and reading panels opened from the world.

import { h, clear, portraitUrl } from './dom.js';
import { openModal } from './modal.js';
import { G, nameOf, partner, act, settings, fill, hintKey, on } from '../ctx.js';
import { generatorMessage, generatorSequence, DOOR_HALVES, HINTS, SCENES } from '../../../shared/content.js';
import { speak, sfx, stopSpeech } from '../audio.js';
import { toast } from './hud.js';
import { sendRadio } from './radio.js';

// ---------------------------------------------------------------- reading
// A list of English sentences with audio + meaning (signs, notes, journal).
export function openReader(title, sentences, { paper = false, voice = 'narr', intro = '', seen = [] } = {}) {
  const m = openModal(title, { id: 'reader' });
  if (seen.length) act({ type: 'seen', ids: seen });
  if (intro) m.body.append(h('p', { class: 'small' }, fill(intro)));
  const wrap = h('div', { class: paper ? 'note-paper' : '' });
  for (const s of sentences) {
    const vi = h('div', { class: `vi ${settings.vi === 'always' ? '' : 'hidden'}` }, fill(s.vi || ''));
    wrap.append(h('div', { class: 'sentence', style: paper ? { background: 'transparent', border: 'none' } : null },
      h('div', { style: { flex: 1 } }, h('div', { class: 'en' }, s.en), s.vi ? vi : null),
      h('button', { class: 'btn small', onclick: () => speak(s.en, voice) }, '🔊'),
      s.vi && settings.vi !== 'off' && settings.vi !== 'always' ? h('button', { class: 'btn small', onclick: () => vi.classList.toggle('hidden') }, 'VI') : null,
    ));
  }
  m.body.append(wrap);
  return m;
}

export function showHint() {
  const s = G.state;
  if (!s || !s.flags.started) return;
  if (s.stage !== 'world') {
    toast(s.stage === 'boss' ? 'Pip: Gõ chữ trên đám mây trong làn của bạn! Đọc luật ở bảng trước trận.' : 'Pip: Trả lời thuyền trưởng bằng tiếng Anh. Bấm "Gợi ý" nếu bí nhé!');
    return;
  }
  const hint = HINTS[hintKey(s)];
  const m = openModal('💡 Pip gợi ý', { id: 'hint' });
  const vi = h('div', { class: `vi ${settings.vi === 'off' ? 'hidden' : ''}` }, hint.vi);
  m.body.append(h('div', { class: 'row', style: { alignItems: 'flex-start' } },
    h('img', { src: portraitUrl('pip'), style: { width: '120px', height: '120px', imageRendering: 'pixelated' } }),
    h('div', { style: { flex: 1 } },
      h('div', { class: 'en', style: { fontSize: '30px', lineHeight: 1.05 } }, hint.en),
      vi,
      h('div', { class: 'row', style: { marginTop: '10px' } }, h('button', { class: 'btn small', onclick: () => speak(hint.en, 'pip') }, '🔊 Nghe lại')),
    ),
  ));
  sfx('squawk');
  speak(hint.en, 'pip');
}

// ---------------------------------------------------------------- keeper's radio station (p2)
export function openStation() {
  const g = G.state.gen;
  const lines = generatorMessage(g);
  const m = openModal('📻 Radio của người gác đèn', { id: 'station', onClose: stopSpeech });
  act({ type: 'station_play' });
  act({ type: 'seen', ids: lines.flatMap((l) => l.phrase || []) });
  const list = h('div');
  const rows = [];
  const showSub = () => settings.sub === 'always';
  let revealed = showSub();
  lines.forEach((l, i) => {
    const en = h('div', { class: 'en' }, revealed ? l.en : '▒▒▒▒▒ ▒▒▒ ▒▒▒▒▒▒');
    const vi = h('div', { class: `vi ${settings.vi === 'always' && revealed ? '' : 'hidden'}` }, l.vi);
    const row = h('div', { class: 'sentence' },
      h('div', { style: { flex: 1 } }, en, vi),
      h('button', { class: 'btn small', onclick: () => playOne(i) }, '🔊'),
      h('button', { class: 'btn small', onclick: () => playOne(i, 0.72) }, '🐢'),
      settings.vi !== 'off' ? h('button', { class: 'btn small', onclick: () => { en.textContent = l.en; vi.classList.toggle('hidden'); } }, 'VI') : null,
    );
    rows.push({ row, en, vi });
    list.append(row);
  });
  const reveal = () => {
    revealed = true;
    rows.forEach((r, i) => { r.en.textContent = lines[i].en; if (settings.vi === 'always') r.vi.classList.remove('hidden'); });
  };
  let playing = 0;
  const playOne = async (i, rate = 1) => {
    const id = ++playing;
    rows.forEach((r) => r.row.classList.remove('playing'));
    rows[i].row.classList.add('playing');
    await speak(lines[i].en, 'keeper', { rate });
    if (id === playing) rows[i].row.classList.remove('playing');
  };
  const playAll = async (rate = 1) => {
    const id = ++playing;
    sfx('radio');
    for (let i = 0; i < lines.length; i++) {
      if (id !== playing) return;
      rows.forEach((r) => r.row.classList.remove('playing'));
      rows[i].row.classList.add('playing');
      await speak(lines[i].en, 'keeper', { rate });
      await new Promise((r) => setTimeout(r, 250));
    }
    rows.forEach((r) => r.row.classList.remove('playing'));
    if (id === playing && settings.sub === 'after') reveal();
  };
  m.body.append(
    h('p', { class: 'small' }, `Chỉ bạn nghe được lời nhắn này. ${nameOf('p1')} đang ở máy phát cần thông tin từ bạn — hãy nói lại bằng tiếng Anh (hoặc dùng Radio). Có thể nghe lại bao nhiêu lần cũng được.`),
    h('div', { class: 'row' },
      h('button', { class: 'btn gold', onclick: () => playAll(1) }, '▶ Phát lời nhắn'),
      h('button', { class: 'btn', onclick: () => playAll(0.75) }, '🐢 Phát chậm'),
      settings.sub !== 'always' ? h('button', { class: 'btn', onclick: reveal }, 'Hiện chữ') : null,
      h('span', { class: 'spacer' }),
      h('button', { class: 'btn teal small', onclick: () => import('./radio.js').then((r) => r.openRadio()) }, '📻 Mở Radio'),
    ),
    h('div', { style: { height: '8px' } }),
    list,
    h('p', { class: 'small' }, 'Mẹo: "First..., then..., finally..." (Đầu tiên..., sau đó..., cuối cùng...). Nếu bạn kia nói "Say that again, please" — hãy đọc lại chậm hơn.'),
  );
  if (!G.state.flags.power) setTimeout(() => playAll(1), 300);
}

// ---------------------------------------------------------------- generator (p1)
let genModal = null;
export function openGenerator() {
  const s = G.state;
  const m = openModal('⚙ Máy phát điện', { id: 'gen', onClose: () => { genModal = null; } });
  genModal = m;
  const total = generatorSequence(s.gen).length;
  const lamps = h('div', { class: 'lamps' });
  const drawLamps = () => {
    clear(lamps);
    for (let i = 0; i < total; i++) lamps.append(h('div', { class: `lamp ${i < G.state.genProgress ? 'on' : ''}` }));
  };
  drawLamps();
  const wheel = h('div', { class: 'wheel' });
  let rot = 0;
  const lever = h('div', { class: 'lever' }, h('div', { class: 'knob' }));
  const send = (k, v) => { act({ type: 'gen_input', k, v }); sfx('click'); };
  const panel = h('div', { class: 'gen' },
    h('div', { class: 'part' }, h('div', { class: 'label' }, 'WHEEL'), wheel,
      h('div', { class: 'row', style: { justifyContent: 'center' } },
        h('button', { class: 'btn small', onclick: () => { rot -= 90; wheel.style.transform = `rotate(${rot}deg)`; send('wheel', 'left'); } }, '⟲ LEFT'),
        h('button', { class: 'btn small', onclick: () => { rot += 90; wheel.style.transform = `rotate(${rot}deg)`; send('wheel', 'right'); } }, 'RIGHT ⟳'),
      )),
    h('div', { class: 'part' }, h('div', { class: 'label' }, 'BUTTONS'),
      h('div', {},
        ...[['red', '#e0574b'], ['blue', '#3b82f6'], ['green', '#4caf50'], ['yellow', '#facc15']].map(([c, col]) => h('button', { class: 'gbtn', style: { background: col }, onclick: () => send('button', c) }, c.toUpperCase())),
      )),
    h('div', { class: 'part' }, h('div', { class: 'label' }, 'LEVER'), lever,
      h('div', { class: 'row', style: { justifyContent: 'center' } },
        h('button', { class: 'btn small', onclick: () => { lever.className = 'lever up'; send('lever', 'up'); } }, '▲ UP'),
        h('button', { class: 'btn small', onclick: () => { lever.className = 'lever down'; send('lever', 'down'); } }, 'DOWN ▼'),
      )),
  );
  m.body.append(
    h('p', { class: 'small' }, `Bạn không biết thứ tự đúng. ${nameOf('p2')} có thể nghe lời nhắn của người gác đèn qua radio trong căn nhà gỗ. Hỏi bằng tiếng Anh: "Which one?", "Say that again, please." Làm sai thì máy sẽ tóe lửa và phải làm lại từ đầu.`),
    lamps, panel,
    h('div', { class: 'row', style: { marginTop: '10px' } },
      h('span', { class: 'small' }, 'Hỏi nhanh qua radio:'),
      ...['Which one?', 'Say that again, please.', 'Slowly, please.', 'Got it!'].map((t) => h('button', { class: 'chip', onclick: () => sendRadio(t) }, t)),
    ),
  );
  m.drawLamps = drawLamps;
  m.panel = panel;
}

on('ev:gen_ok', () => { sfx('click'); if (genModal) genModal.drawLamps(); });
on('ev:gen_fail', () => {
  sfx('spark');
  if (genModal) {
    genModal.drawLamps();
    genModal.panel.classList.remove('shake');
    void genModal.panel.offsetWidth;
    genModal.panel.classList.add('shake');
  }
  toast(`⚡ Máy phát tóe lửa! Sai thứ tự — làm lại từ đầu.`, 'bad');
});
on('ev:power_on', () => { if (genModal) genModal.close(); });

// ---------------------------------------------------------------- lighthouse door
let doorModal = null;
export function openDoor() {
  const s = G.state;
  const mine = DOOR_HALVES[G.slot];
  const m = openModal('🚪 Cửa hải đăng', { id: 'door', onClose: () => { doorModal = null; stopSpeech(); } });
  doorModal = m;
  const clue = G.slot === 'p1'
    ? h('div', { class: 'col dark-panel', style: { alignItems: 'center', padding: '10px' } },
      h('div', { class: 'small' }, '🔦 Đèn lồng của bạn làm hiện ra dòng chữ phát sáng:'),
      h('div', { class: 'glow-text' }, mine.en),
      h('div', { class: 'small' }, 'Phần sau đã mờ hết. Có lẽ ai đó biết phần còn lại?'))
    : h('div', { class: 'col dark-panel', style: { alignItems: 'center', padding: '10px' } },
      h('div', { class: 'small' }, '📻 Radio của bạn bắt được tiếng thì thầm ở cửa:'),
      h('div', { class: 'row' },
        h('button', { class: 'btn gold', onclick: () => speak('...help is coming.', 'keeper', { rate: 0.85 }) }, '▶ Nghe'),
        h('button', { class: 'btn', onclick: () => speak('...help is coming.', 'keeper', { rate: 0.65 }) }, '🐢 Chậm'),
      ),
      settings.sub === 'always' ? h('div', { class: 'glow-text', style: { fontSize: '32px' } }, mine.en) : h('button', { class: 'btn small', onclick: (e) => { e.target.replaceWith(h('div', { class: 'glow-text', style: { fontSize: '32px' } }, mine.en)); } }, 'Hiện chữ'),
      h('div', { class: 'small' }, 'Đây chỉ là phần cuối của câu.'));
  const input = h('input', { type: 'text', class: 'en-input', maxlength: 60, placeholder: 'Gõ toàn bộ câu...', style: { flex: 1 } });
  const result = h('div', { class: 'row', style: { minHeight: '34px' } });
  const submit = () => { if (input.value.trim()) act({ type: 'door_try', text: input.value }); };
  input.addEventListener('keydown', (e) => { e.stopPropagation(); if (e.key === 'Enter') submit(); if (e.key === 'Escape') m.close(); });
  m.body.append(
    h('p', { class: 'small' }, 'Trên ổ khoá: "SPEAK THE KEEPER\'S WORDS" — hãy gõ cả câu (2 phần ghép lại). Không phân biệt hoa/thường, dấu câu không bắt buộc. Ai gõ cũng được.'),
    clue,
    h('div', { style: { height: '10px' } }),
    h('div', { class: 'row' }, input, h('button', { class: 'btn gold', onclick: submit }, 'Mở khoá')),
    result,
  );
  m.result = result;
  if (G.slot === 'p2') setTimeout(() => speak('...help is coming.', 'keeper', { rate: 0.85 }), 300);
  setTimeout(() => input.focus(), 30);
  if (s.flags.door_open) m.close();
}

on('ev:door_result', (e) => {
  if (e.ok) {
    sfx('success');
    if (doorModal) doorModal.close();
    return;
  }
  sfx('wrong');
  const who = e.by === G.slot ? 'Bạn' : nameOf(e.by);
  const correct = e.words.filter((w) => w.ok).length;
  if (doorModal) {
    clear(doorModal.result);
    doorModal.result.append(h('span', { class: 'small' }, `Khoá kêu "cạch" — chưa đúng. ${correct}/${e.count} từ đúng vị trí: `), ...e.words.map((w) => h('span', { class: 'chip', style: { background: w.ok ? '#bfe8a8' : '#ffd2c8', cursor: 'default' } }, w.ok ? w.w : '___')));
  } else if (e.by !== G.slot) {
    toast(`🚪 ${who} thử mở cửa: "${e.text}" — chưa đúng (${correct}/${e.count} từ).`);
  }
});

// ---------------------------------------------------------------- journal re-read
export function openJournal() {
  const lines = SCENES.journal.filter((l) => l.en);
  openReader('📓 Sổ của người gác đèn', lines, { paper: true, voice: 'keeper' });
}
