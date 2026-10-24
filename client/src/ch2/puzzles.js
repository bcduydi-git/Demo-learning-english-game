// Screens of the four chapter 2 puzzles. Each render(ctx) returns the body
// for the player's own side only. ctx = { pz, d, role, send(op, extra),
// ui (local state kept across redraws), redraw() }.

import { h } from '../ui/dom.js';
import { line } from '../ui/enline.js';
import { speak, staticNoise, stopSpeech, sfx } from '../audio.js';
import { settings } from '../store.js';
import { nameOf, partner } from '../ctx.js';
import { fmtPos } from '../../../shared/ch2/coords.js';
import { levels, ROOMS as WROOMS, HATCH_WINDOW_MS } from '../../../shared/ch2/flood.js';
import { DAYS, full, LOCKERS } from '../../../shared/ch2/keycard.js';
import { viewOf } from '../../../shared/ch2/antenna.js';
import { recallOf, SEND_WINDOW_MS } from '../../../shared/ch2/finale.js';
import { fmt as fmtTime, DAY, SPRING } from '../../../shared/ch3/tide.js';
import { TURNS, DIRS } from '../../../shared/ch3/gears.js';
import { codeBook, RECOGNISE, COLOURS, dutyOf, LIGHT_WINDOW_MS } from '../../../shared/ch3/beacon.js';
import { TX_PHRASES } from '../../../shared/transmitter.js';
import { platePanel, moduleBox, wiresBody, valvesBody, keypadBody, wiresManual, valvesManual, keypadManual, glossaryPage, manualBook } from './machineui.js';

// sentences each side will need on the call
export const PHRASES = {
  nav: [
    ['What did you hear after "degrees"?', 'Bạn nghe được gì sau chữ "degrees"?'],
    ['Was it thirteen or thirty?', 'Là mười ba hay ba mươi?'],
    ['Which grid square did they say?', 'Họ nói ô lưới nào?'],
    ['I heard a correction at the end.', 'Mình nghe thấy một lời đính chính ở cuối.'],
  ],
  radio: [
    ['I heard "minutes north", but the number was unclear.', 'Mình nghe "minutes north" nhưng con số không rõ.'],
    ['The grid square is Bravo Seven.', 'Ô lưới là Bravo Seven.'],
    ['Can you check the chart for that square?', 'Bạn xem trên hải đồ ô đó giúp mình được không?'],
    ['Let me play it again.', 'Để mình bật lại lần nữa.'],
  ],
  west: [
    ['What are your water levels right now?', 'Mực nước bên bạn bây giờ là bao nhiêu?'],
    ['What numbers are on your hatch?', 'Trên cửa khoang bên bạn ghi số mấy?'],
    ['Turn valve two twice, please.', 'Bạn xoay van hai hai lần nhé.'],
    ["Ready? Open on three. One, two, three!", 'Sẵn sàng chưa? Mở khi đếm tới ba. Một, hai, ba!'],
  ],
  office: [
    ['What day does the door log show?', 'Nhật ký cửa ghi ngày nào?'],
    ['Who was on duty on Thursday night?', 'Ai trực ca đêm thứ Năm?'],
    ['They swapped shifts, so it was someone else.', 'Họ đã đổi ca, nên là người khác.'],
    ['Which lockers have no name tag?', 'Những tủ nào không có bảng tên?'],
  ],
  lockers: [
    ['The keycard was last used on Thursday at 23:48.', 'Thẻ từ được dùng lần cuối vào thứ Năm lúc 23:48.'],
    ['Lockers three and six have no name tag.', 'Tủ số ba và số sáu không có bảng tên.'],
    ["Locker four belongs to Ms. Moreau.", 'Tủ số bốn là của chị Moreau.'],
    ['Are you sure? Should I open it?', 'Bạn chắc chứ? Mình mở nhé?'],
  ],
  north: [
    ['Top row, second from MY left.', 'Hàng trên cùng, thứ hai tính từ bên trái CỦA MÌNH.'],
    ['From your side, that is the second from the right.', 'Nhìn từ phía bạn thì đó là thứ hai từ bên phải.'],
    ['Turn that one off. It should be dark.', 'Tắt cái đó đi. Nó phải tối.'],
    ['Perfect! Press "Align".', 'Hoàn hảo! Bấm "Align" đi.'],
  ],
};
PHRASES.east = PHRASES.west;
PHRASES.south = PHRASES.north;
PHRASES.tech = TX_PHRASES.tech;
PHRASES.reader = TX_PHRASES.reader;
PHRASES.a = [
  ['How many wires are there?', 'Có bao nhiêu dây?'],
  ["What's the pressure on your gauge?", 'Đồng hồ áp suất bên bạn chỉ bao nhiêu?'],
  ['Read me the clue, please.', 'Đọc gợi ý cho mình nghe với.'],
  ['On three: one, two, three, send!', 'Đếm đến ba: một, hai, ba, gửi!'],
];
PHRASES.b = PHRASES.a;
PHRASES.tables = [
  ['What is the earliest time we can leave?', 'Giờ sớm nhất mình có thể đi là mấy giờ?'],
  ['At two o\'clock the water is only two point four metres.', 'Lúc hai giờ nước chỉ cao hai phẩy bốn mét.'],
  ['How long does the crossing take?', 'Vượt rạn mất bao lâu?'],
  ['There is a notice: add zero point three metres.', 'Có thông báo: cộng thêm không phẩy ba mét.'],
];
PHRASES.chart = [
  ['We need at least three metres of water.', 'Mình cần nước sâu ít nhất ba mét.'],
  ["We can't leave before eleven.", 'Mình không thể đi trước mười một giờ.'],
  ['The crossing takes two hours.', 'Vượt rạn mất hai tiếng.'],
  ['Is the water deep enough the whole time?', 'Nước có đủ sâu suốt cả lúc đó không?'],
];
PHRASES.left = [
  ['My strip starts with "However".', 'Mảnh của mình bắt đầu bằng "However".'],
  ['I think this one comes first.', 'Mình nghĩ mảnh này đứng đầu.'],
  ['What does your strip say?', 'Mảnh của bạn viết gì?'],
  ['"It" must mean the signal, so it goes after that.', '"It" chắc là chỉ tín hiệu, nên nó đứng sau mảnh đó.'],
];
PHRASES.right = PHRASES.left;
PHRASES.diagram = [
  ['How many teeth does the crank gear have?', 'Bánh răng tay quay có bao nhiêu răng?'],
  ['The lens must turn once, clockwise.', 'Thấu kính phải quay một vòng, theo chiều kim đồng hồ.'],
  ['Turn the crank three times anticlockwise.', 'Quay tay quay ba vòng ngược chiều kim đồng hồ.'],
  ['Which gear was replaced?', 'Bánh răng nào đã được thay?'],
];
PHRASES.crank = [
  ['The crank gear has twelve teeth.', 'Bánh răng tay quay có mười hai răng.'],
  ['Gear D was replaced. It has thirty teeth now.', 'Bánh răng D đã được thay. Giờ nó có ba mươi răng.'],
  ['Which way should I turn it?', 'Mình nên quay chiều nào?'],
  ['How many turns?', 'Mấy vòng?'],
];
PHRASES.lookout = [
  ['I can see a long ship with containers.', 'Mình thấy một con tàu dài chở công-te-nơ.'],
  ['It is flying a blue flag.', 'Nó treo cờ xanh dương.'],
  ['It is zero point eight nautical miles away.', 'Nó cách đây không phẩy tám hải lý.'],
  ['Visibility is one point five kilometres.', 'Tầm nhìn là một phẩy năm ki-lô-mét.'],
];
PHRASES.keeper = [
  ['What kind of ship is it?', 'Đó là loại tàu gì?'],
  ['How far away is it?', 'Nó cách bao xa?'],
  ['What colour is its flag?', 'Cờ của nó màu gì?'],
  ['Sending: green, one long flash.', 'Đang phát: xanh lá, một chớp dài.'],
];

// ------------------------------------------------------------ 1. coords
async function playBroadcast(ctx) {
  const { d, role, ui } = ctx;
  if (ui.playing) return;
  ui.playing = true;
  ui.heardOnce = false;
  ctx.redraw();
  const rate = ui.slow ? 0.8 : 1;
  for (let i = 0; i < d.parts.length; i++) {
    if (!ui.playing) break;
    ui.cur = i;
    ctx.redraw();
    const p = d.parts[i];
    if (p.hear.includes(role)) await speak(p.en, 'narr', { rate });
    else await staticNoise(Math.min(4200, 600 + p.en.length * 55));
    await new Promise((r) => setTimeout(r, 250));
  }
  ui.playing = false;
  ui.cur = -1;
  ui.heardOnce = true;
  ctx.redraw();
}

function coordsView(ctx) {
  const { d, role, ui, pz } = ctx;
  const subs = pz.level === 'easy' ? 'always' : pz.level === 'normal' ? 'after' : 'never';
  const showText = subs === 'always' || (subs === 'after' && ui.heardOnce && ui.showText);
  const parts = h('div', { class: 'c2-broadcast' }, ...d.parts.map((p, i) => {
    const mine = p.hear.includes(role);
    const text = !mine ? '▒▒▒ (tiếng rè)' : showText ? p.en : '• • •';
    return h('span', { class: `part ${mine ? 'clear' : 'noise'} ${ui.cur === i ? 'now' : ''}` }, text);
  }));
  const controls = h('div', { class: 'row' },
    h('button', { class: 'btn gold', disabled: ui.playing, onclick: () => playBroadcast(ctx) }, ui.playing ? '📻 Đang phát...' : '▶ Nghe bản tin'),
    h('button', { class: 'btn small', disabled: !ui.playing, onclick: () => { ui.playing = false; stopSpeech(); } }, '■ Dừng'),
    h('label', { class: 'small' }, h('input', { type: 'checkbox', checked: !!ui.slow, onchange: (e) => { ui.slow = e.target.checked; } }), ' đọc chậm'),
    subs === 'after' ? h('button', { class: 'btn small', disabled: !ui.heardOnce, onclick: () => { ui.showText = !ui.showText; ctx.redraw(); } }, ui.showText ? 'Ẩn chữ' : 'Hiện chữ phần bạn nghe') : null,
    h('span', { class: 'small' }, subs === 'never' ? 'Mức Hack não: không có phụ đề.' : subs === 'after' ? 'Nghe hết một lượt thì mới hiện được chữ.' : ''),
  );
  const notes = h('textarea', { class: 'c2-notes', 'data-k': 'notes', placeholder: 'Ghi chú của bạn (chỉ bạn thấy)...', oninput: (e) => { ui.notes = e.target.value; } });
  notes.value = ui.notes || '';
  const out = [
    h('div', { class: 'box c2-card' }, h('h4', {}, '📻 Bản tin của trạm'),
      h('p', { class: 'small' }, 'Hai bạn nghe cùng một bản tin, nhưng tiếng rè che những đoạn khác nhau. Đoạn xám là bạn không nghe được: hỏi người kia.'),
      controls, parts),
  ];
  if (role === 'nav') {
    const chart = h('table', { class: 'tx-table' },
      h('tr', {}, h('th', {}, 'Grid square'), h('th', {}, 'Latitude (N)'), h('th', {}, 'Longitude (W)')),
      ...d.chart.map((c) => h('tr', {}, h('td', { class: 'en' }, c.grid), h('td', { class: 'en' }, `${c.latDeg}° ${c.latMin[0]}′–${c.latMin[1]}′`), h('td', { class: 'en' }, `${c.lonDeg}° ${c.lonMin[0]}′–${c.lonMin[1]}′`))));
    const f = ui.form || (ui.form = { latDeg: '', latMin: '', lonDeg: '', lonMin: '' });
    const inp = (k, ph) => {
      const el = h('input', { type: 'text', class: 'en-input c2-num', inputmode: 'numeric', maxlength: 3, placeholder: ph, value: f[k], 'data-k': k });
      el.addEventListener('input', () => { f[k] = el.value.replace(/\D/g, ''); el.value = f[k]; });
      return el;
    };
    out.push(h('div', { class: 'box c2-card' }, h('h4', {}, '🧭 Hải đồ (chỉ bạn có)'),
      h('p', { class: 'small' }, 'Mỗi ô lưới ứng với một vùng toạ độ. Biết tên ô lưới thì biết con số nào mới đúng.'), chart));
    out.push(h('div', { class: 'box c2-card' }, h('h4', {}, '⌨ Nhập vị trí của trạm'),
      h('div', { class: 'row' }, inp('latDeg', 'độ'), '°', inp('latMin', 'phút'), '′ N   ', inp('lonDeg', 'độ'), '°', inp('lonMin', 'phút'), '′ W'),
      h('div', { class: 'row' }, h('button', { class: 'btn gold', onclick: () => ctx.send('submit', { value: { latDeg: Number(f.latDeg), latMin: Number(f.latMin), lonDeg: Number(f.lonDeg), lonMin: Number(f.lonMin) } }) }, 'Đặt hướng đi ▶')),
      d.tries.length ? h('div', { class: 'small' }, 'Đã thử (sai): ', d.tries.map(fmtPos).join(' · ')) : null));
  } else {
    out.push(h('div', { class: 'box c2-card' }, h('h4', {}, '📝 Bạn ở bàn radio'),
      h('p', {}, `${nameOf(partner())} có hải đồ và là người nhập toạ độ. Hãy đọc cho họ những gì bạn nghe được, kể cả tên ô lưới.`),
      d.tries.length ? h('div', { class: 'small' }, `${nameOf(partner())} đã thử (sai): `, d.tries.map(fmtPos).join(' · ')) : null));
  }
  out.push(h('div', { class: 'box c2-card' }, h('h4', {}, 'Ghi chú'), notes));
  return out;
}

// ------------------------------------------------------------ 2. flood
const SIDE_EN = { west: 'West', east: 'East' };
function floodView(ctx) {
  const { d, role, ui } = ctx;
  const other = role === 'west' ? 'east' : 'west';
  const me = d[role];
  const lv = levels(d, role);
  const gauges = h('div', { class: 'c2-gauges' }, ...WROOMS.map((r, i) => {
    const v = lv[i];
    const bad = v < 0 || v > 9;
    return h('div', { class: `c2-gauge ${bad ? 'bad' : ''}` },
      h('div', { class: 'tank' }, h('div', { class: 'water', style: { height: `${Math.max(0, Math.min(9, v)) / 9 * 100}%` } }),
        ...[1, 2, 3, 4, 5, 6, 7, 8, 9].map((k) => h('i', { style: { bottom: `${k / 9 * 100}%` } }))),
      h('div', { class: 'en big' }, bad ? (v < 0 ? 'CẠN' : 'TRÀN') : String(v)),
      h('div', { class: 'en' }, `${SIDE_EN[role]} ${r}`));
  }));
  const plate = h('div', { class: 'c2-hatch' }, h('div', { class: 'small' }, 'HATCH OPENS ONLY AT'),
    h('div', { class: 'en big' }, WROOMS.map((r, i) => `${r}: ${me.target[i]}`).join('   ')));
  const effect = (row, side) => row.map((v, k) => (v ? `${SIDE_EN[side]} ${WROOMS[k]} ${v > 0 ? '+' : '−'}${Math.abs(v)}` : null)).filter(Boolean).join(', ');
  const valves = h('div', { class: 'c2-valves' }, ...me.effect.map((row, i) => h('div', { class: 'c2-valve' },
    h('div', { class: 'en' }, `VALVE ${i + 1}`),
    h('div', { class: 'small' }, `mỗi vòng: ${effect(row, other)}${me.self && me.self[i].some(Boolean) ? ` · và ${effect(me.self[i], role)}` : ''}`),
    h('div', { class: 'row', style: { justifyContent: 'center' } },
      h('button', { class: 'btn small', disabled: me.turns[i] <= 0, onclick: () => ctx.send('turn', { valve: i, dir: -1 }) }, '−'),
      h('span', { class: 'en num' }, String(me.turns[i])),
      h('button', { class: 'btn small', disabled: me.turns[i] >= 6, onclick: () => ctx.send('turn', { valve: i, dir: 1 }) }, '+')),
    h('div', { class: 'small' }, 'vòng đã xoay'))));
  // the partner's hatch: timed from when this screen heard about it
  const wait = ui.partnerHatch && performance.now() - ui.partnerHatch < HATCH_WINDOW_MS;
  return [
    h('div', { class: 'box c2-card' }, h('h4', {}, `🌊 Cánh ${role === 'west' ? 'Tây' : 'Đông'} (bạn đang ở đây)`), gauges, plate,
      h('p', { class: 'small' }, `Bạn không thấy cánh ${other === 'west' ? 'Tây' : 'Đông'}. Mực nước bên này chỉ đổi khi ${nameOf(partner())} xoay van bên họ${me.self ? ' (và một chút khi bạn xoay van của mình)' : ''}.`)),
    h('div', { class: 'box c2-card' }, h('h4', {}, `🔧 Van của bạn → đổ nước sang cánh ${other === 'west' ? 'Tây' : 'Đông'}`), valves),
    h('div', { class: 'box c2-card' }, h('h4', {}, '🚪 Cửa khoang'),
      h('p', { class: 'small' }, `Hai cửa phải mở cách nhau không quá ${HATCH_WINDOW_MS / 1000} giây. Mở khi mực nước chưa đúng sẽ bị tính một lần sai.`),
      h('div', { class: 'row' },
        h('button', { class: 'btn teal', onclick: () => ctx.send('hatch') }, me.hatch ? '✓ Đã mở bên này — mở lại' : 'Mở cửa khoang ▶'),
        h('span', { class: 'small' }, wait ? `⏳ Cửa bên ${nameOf(partner())} vừa mở! Nhanh lên!` : `Cửa bên ${nameOf(partner())}: đang đóng`))),
  ];
}

// ------------------------------------------------------------ 3. keycard
function keycardView(ctx) {
  const { d, role, ui } = ctx;
  if (role === 'office') {
    const roster = h('table', { class: 'tx-table' }, h('tr', {}, h('th', {}, 'Night shift'), h('th', {}, 'Staff on duty (default roster)')),
      ...DAYS.map((day, i) => h('tr', {}, h('td', {}, day), h('td', {}, full(d.staff[d.roster[i]])))));
    const sel = ui.mail ?? -1;
    const inbox = h('div', { class: 'c2-inbox' }, ...d.emails.map((m, i) => h('div', {
      class: `mail ${sel === i ? 'sel' : ''} ${ui.read && ui.read[i] ? 'read' : ''}`,
      onclick: () => { ui.mail = i; ui.read = { ...(ui.read || {}), [i]: true }; sfx('click'); ctx.redraw(); },
    }, h('b', {}, m.subject), h('span', { class: 'small' }, ` — ${m.from} · ${m.sent}`))));
    const m = d.emails[sel];
    const reader = m ? h('div', { class: 'c2-mail' },
      h('div', { class: 'small' }, `From: ${m.from}`, h('br'), `To: ${m.to}`, h('br'), `Sent: ${m.sent}`),
      h('h4', {}, m.subject), line(m.body, m.vi)) : h('p', { class: 'small' }, 'Chọn một email để đọc.');
    return [
      h('div', { class: 'box c2-card' }, h('h4', {}, '📅 Lịch trực ca đêm'), roster),
      h('div', { class: 'box c2-card' }, h('h4', {}, '📧 Hộp thư nhân viên'), inbox, reader),
      h('div', { class: 'box c2-card' }, h('p', { class: 'small' }, `${nameOf(partner())} đang ở phòng tủ đồ: họ thấy bảng tên, nhật ký cửa và là người mở tủ.`)),
    ];
  }
  const lockers = h('div', { class: 'c2-lockers' }, ...d.lockers.map((l, i) => {
    const opened = d.opened.includes(i);
    return h('div', { class: `locker ${opened ? 'open' : ''} ${ui.pick === i ? 'sel' : ''}`, onclick: () => { if (!opened) { ui.pick = ui.pick === i ? null : i; sfx('click'); ctx.redraw(); } } },
      h('div', { class: 'en num' }, String(i + 1)),
      h('div', { class: `tag ${l.tag ? '' : 'none'}` }, l.tag || '(no tag)'),
      opened ? h('div', { class: 'small' }, 'empty') : null);
  }));
  return [
    h('div', { class: 'box c2-card' }, h('h4', {}, '🔐 Nhật ký cửa phòng tủ đồ'),
      h('div', { class: 'c2-log en' }, `LAST KEYCARD ENTRY: ${d.doorLog}`)),
    h('div', { class: 'box c2-card' }, h('h4', {}, `🗄 ${LOCKERS} tủ đồ (bạn đang đứng nhìn vào dãy tủ: số 1 ở bên trái)`), lockers,
      h('div', { class: 'row' },
        h('button', { class: 'btn red small', disabled: ui.pick == null, onclick: () => { ctx.send('open', { locker: ui.pick }); ui.pick = null; } }, ui.pick == null ? 'Chọn một tủ' : `Mở tủ số ${ui.pick + 1}`),
        h('span', { class: 'small' }, 'Mở sai tủ là chuông báo động kêu (một lần sai).'))),
    h('div', { class: 'box c2-card' }, h('p', { class: 'small' }, `${nameOf(partner())} đang ở văn phòng: họ có lịch trực và email.`)),
  ];
}

// ------------------------------------------------------------ 4. antenna
function grid(rd, side, cells, { click, target } = {}) {
  const lit = viewOf(cells, rd.n, side);
  const tg = target ? viewOf(target, rd.n, side) : null;
  const g = h('div', { class: 'c2-grid', style: { gridTemplateColumns: `repeat(${rd.n}, 1fr)` } });
  for (let r = 0; r < rd.n; r++) {
    for (let c = 0; c < rd.n; c++) {
      const k = `${r},${c}`;
      g.append(h('div', {
        class: `cell ${lit.includes(k) ? 'on' : ''} ${tg && tg.includes(k) ? 'star' : ''} ${click ? 'click' : ''}`,
        onclick: click ? () => click(r, c) : null,
      }));
    }
  }
  return g;
}
function antennaView(ctx) {
  const { d, role } = ctx;
  const rd = d.rounds[Math.min(d.cur, d.rounds.length - 1)];
  const iAmController = rd.controller === role;
  const sideVi = role === 'north' ? 'phía Bắc' : 'phía Nam';
  const compass = h('div', { class: 'c2-compass small' }, h('span', {}, '← trái của BẠN'), h('span', {}, `bạn đứng ${sideVi} · người kia đứng đối diện`), h('span', {}, 'phải của BẠN →'));
  const head = h('div', { class: 'small' }, `Đĩa ${d.cur + 1}/2 · ${iAmController ? 'Bạn bật công tắc' : 'Bạn cầm bản đồ sao'}`);
  if (iAmController) {
    return [
      h('div', { class: 'box c2-card' }, h('h4', {}, '🎛 Bảng đèn (bạn bấm được)'), head, compass,
        grid(rd, role, rd.lit, { click: (r, c) => ctx.send('toggle', { row: r, col: c }) }),
        rd.link ? h('p', { class: 'c2-warn' }, '⚠ Mỗi công tắc còn đảo luôn đèn NGAY PHÍA TRÊN nó. Người kia không biết điều này.') : null,
        h('div', { class: 'row' }, h('button', { class: 'btn gold', onclick: () => ctx.send('align') }, 'Align ▶'),
          h('span', { class: 'small' }, `Bạn không có bản đồ sao: nghe ${nameOf(partner())} tả rồi bật đúng đèn. Bấm Align khi họ nói đúng rồi.`))),
    ];
  }
  return [
    h('div', { class: 'box c2-card' }, h('h4', {}, '✨ Bản đồ sao (chỉ bạn có) — vẽ như nhìn từ phía của bạn'), head, compass,
      grid(rd, role, rd.target),
      h('p', { class: 'small' }, 'Những ô sáng ở đây là những đèn phải bật. Mọi đèn khác phải tắt.')),
    h('div', { class: 'box c2-card' }, h('h4', {}, '👀 Tấm kính (bạn nhìn qua, không bấm được)'), compass,
      grid(rd, role, rd.lit, { target: rd.target }),
      h('p', { class: 'small' }, `Bạn thấy đèn ${nameOf(partner())} đang bật, nhưng từ phía bạn: trái phải ngược với họ. Ô viền vàng là chỗ cần sáng.`)),
  ];
}

// ------------------------------------------------------------ 5. machine
function machineView(ctx) {
  const { d, role, ui, pz } = ctx;
  if (role === 'tech') {
    return [
      h('div', { class: 'c2-wide' }, platePanel(d.plate)),
      moduleBox('1 · Wires', d.solved.wires, wiresBody({ wires: d.wires, solved: d.solved.wires, ui, redraw: ctx.redraw, onCut: (index) => ctx.send('cut', { index }) })),
      moduleBox('2 · Valves', d.solved.valves, valvesBody({ pressure: d.valves.pressure, solved: d.solved.valves, ui, redraw: ctx.redraw, onConfirm: (set) => ctx.send('valves', { set }) })),
      moduleBox('3 · Keypad', d.solved.keypad, keypadBody({ words: d.keypad.words, pressed: d.keypad.pressed, solved: d.solved.keypad, onKey: (word) => ctx.send('key', { word }) })),
    ];
  }
  return [h('div', { class: 'c2-wide' }, manualBook([
    ['wires', '1 · Wires', () => wiresManual(pz.level)],
    ['valves', '2 · Valves', () => valvesManual(pz.level)],
    ['keypad', '3 · Keypad', () => keypadManual()],
    ['words', '📖 Sổ từ', () => glossaryPage()],
  ], ui, ctx.redraw, d.solved))];
}

// ------------------------------------------------------------ 6. finale
const PHASES = [
  'Lượt 1 · Máy chính: dây cáp',
  'Lượt 2 · Đổi vai — Máy dự phòng: van',
  'Lượt 3 · Cả hai cùng lúc: khoá giọng nói + bàn phím',
  'Cuối cùng · Cùng bấm SEND',
];
function recallClue(rc, level) {
  if (level === 'hard') return [line(rc.en, null), h('p', { class: 'small' }, 'Mức Hack não: chỉ có định nghĩa tiếng Anh.')];
  const out = [h('div', { class: 'c2-clue' }, rc.vi)];
  if (level === 'easy') out.push(h('div', { class: 'c2-clue en' }, rc.hint));
  out.push(h('p', { class: 'small' }, 'Đọc gợi ý cho người kia. Họ phải tự nhớ ra câu tiếng Anh và gõ vào khoá.'));
  return out;
}
function finaleView(ctx) {
  const { d, role, ui, pz } = ctx;
  const phaseBar = h('div', { class: 'c2-wide c2-phases' }, ...PHASES.map((t, i) => h('span', { class: `ph ${d.phase === i + 1 ? 'now' : ''} ${d.phase > i + 1 ? 'ok' : ''}` }, (d.phase > i + 1 ? '✓ ' : '') + t)));
  const wait = (txt) => h('p', { class: 'c2-waiting' }, txt);
  let mine;
  let book;
  if (role === 'a') {
    const recall = (() => {
      if (d.solved.recall) return h('p', {}, '✓ Khoá giọng nói đã mở.');
      if (d.phase < 3) return wait('Khoá giọng nói mở ở lượt 3.');
      const inp = h('input', { type: 'text', class: 'en-input', 'data-k': 'recall', placeholder: 'Gõ câu tiếng Anh...', value: ui.recall || '', style: { width: '100%' } });
      inp.addEventListener('input', () => { ui.recall = inp.value; });
      const go = () => { if (inp.value.trim()) { ctx.send('recall', { text: inp.value }); ui.recall = ''; } };
      inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') go(); });
      return h('div', {}, h('p', { class: 'small' }, `Khoá chỉ mở khi gõ đúng một câu tiếng Anh hai bạn đã gặp. ${nameOf(partner())} có gợi ý.`), inp,
        h('div', { class: 'row' }, h('button', { class: 'btn gold small', onclick: go }, 'Mở khoá ▶')),
        d.recall.tries.length ? h('div', { class: 'small' }, 'Đã thử: ', d.recall.tries.join(' · ')) : null);
    })();
    mine = [h('h4', {}, '🅰 Máy chính (bạn làm)'), platePanel(d.main.plate),
      moduleBox('Wires', d.solved.wires, d.phase === 1 || d.solved.wires ? wiresBody({ wires: d.main.wires, solved: d.solved.wires || d.phase !== 1, ui, redraw: ctx.redraw, onCut: (index) => ctx.send('cut', { index }) }) : wait('')),
      moduleBox('Voice lock', d.solved.recall, recall)];
    book = [h('h4', {}, `📘 Sổ tay máy dự phòng (${nameOf(partner())} làm)`),
      d.phase === 1 ? wait(`Lượt 1: ${nameOf(partner())} đang đọc sổ tay cho bạn. Sổ tay của bạn dùng từ lượt 2.`) : null,
      d.phase === 2 ? valvesManual(pz.level) : null,
      d.phase >= 3 ? keypadManual() : null];
  } else {
    mine = [h('h4', {}, '🅱 Máy dự phòng (bạn làm)'), platePanel(d.backup.plate),
      moduleBox('Valves', d.solved.valves, d.phase >= 2 ? valvesBody({ pressure: d.backup.valves.pressure, solved: d.solved.valves, ui, redraw: ctx.redraw, onConfirm: (set) => ctx.send('valves', { set }) }) : wait('Mở ở lượt 2.')),
      moduleBox('Keypad', d.solved.keypad, d.phase >= 3 ? keypadBody({ words: d.backup.keypad.words, pressed: d.backup.keypad.pressed, solved: d.solved.keypad, onKey: (word) => ctx.send('key', { word }) }) : wait('Mở ở lượt 3.'))];
    book = [h('h4', {}, `📘 Sổ tay máy chính (${nameOf(partner())} làm)`),
      d.phase === 1 ? wiresManual(pz.level) : null,
      d.phase === 2 ? wait(`Lượt 2: ${nameOf(partner())} đang đọc sổ tay cho bạn. Sổ tay của bạn dùng lại ở lượt 3.`) : null,
      d.phase >= 3 ? h('div', {}, h('h4', {}, '🔑 Gợi ý khoá giọng nói'), ...(d.solved.recall ? [h('p', {}, '✓ Đã mở.')] : recallClue(recallOf(d), pz.level))) : null];
  }
  const out = [phaseBar, h('div', { class: 'box c2-card' }, ...mine), h('div', { class: 'box c2-card' }, ...book)];
  if (d.phase === 4) {
    const waitP = ui.partnerSend && performance.now() - ui.partnerSend < SEND_WINDOW_MS;
    out.splice(1, 0, h('div', { class: 'box c2-card c2-wide c2-send' },
      h('p', {}, `Cả hai máy đã sẵn sàng. Hai bạn phải bấm SEND cách nhau không quá ${SEND_WINDOW_MS / 1000} giây: đếm "one, two, three" rồi cùng bấm!`),
      h('button', { class: 'btn red c2-sendbtn', onclick: () => ctx.send('send') }, d.send[role] ? 'SEND lại' : 'SEND ▶'),
      h('div', { class: 'small' }, waitP ? `⏳ ${nameOf(partner())} vừa bấm SEND! Bấm ngay!` : `${nameOf(partner())}: chưa bấm`)));
  }
  return out;
}

// ------------------------------------------------------------ ch3 · tide
function tideView(ctx) {
  const { d, role, ui } = ctx;
  if (role === 'tables') {
    const max = Math.max(...d.table.map((x) => x.h));
    const rows = d.table.map((x) => h('tr', {}, h('td', { class: 'en' }, fmtTime(x.t)), h('td', { class: 'en' }, `${x.h.toFixed(1)} m`),
      h('td', {}, h('div', { class: 'c3-bar', style: { width: `${(x.h / max) * 100}%` } }))));
    return [
      h('div', { class: 'box c2-card' }, h('h4', {}, '🌊 Tide table — North Reef (today)'),
        h('p', { class: 'small' }, 'Water height above the reef, measured every ' + (d.step === 30 ? '30 minutes' : 'hour') + '.'),
        h('table', { class: 'tx-table c3-tide' }, h('tr', {}, h('th', {}, 'Time'), h('th', {}, 'Height'), h('th', {}, '')), ...rows)),
      h('div', { class: 'box c2-card' },
        d.notice ? h('div', { class: 'c2-warn' }, line(`HARBOUR NOTICE: Spring tide today. Add ${SPRING} m to every height in the table.`, `THÔNG BÁO CẢNG: Hôm nay triều cường. Cộng thêm ${SPRING} m vào mọi mực nước trong bảng.`)) : null,
        h('p', {}, `${nameOf(partner())} có phiếu tuyến đường và là người chọn giờ khởi hành. Hỏi họ tàu cần nước sâu bao nhiêu và vượt rạn mất bao lâu.`),
        d.tries.length ? h('div', { class: 'small' }, 'Đã thử (sai): ', d.tries.map(fmtTime).join(' · ')) : null),
    ];
  }
  const r = d.route;
  const opts = [];
  for (let t = DAY[0]; t <= DAY[1]; t += d.step) opts.push(t);
  const sel = ui.time ?? r.leave;
  const select = h('select', { onchange: (e) => { ui.time = Number(e.target.value); } }, ...opts.map((t) => h('option', { value: t, selected: t === sel }, fmtTime(t))));
  return [
    h('div', { class: 'box c2-card' }, h('h4', {}, '🗺 Route card — Aurora'),
      line(`The Aurora needs at least ${r.min.toFixed(1)} m of water to cross the reef safely.`, `Aurora cần nước sâu ít nhất ${r.min.toFixed(1)} m để vượt rạn an toàn.`),
      line(`The crossing takes ${r.cross === 60 ? 'one hour' : r.cross === 90 ? 'an hour and a half' : 'two hours'}, and the water must stay deep enough throughout.`, `Vượt rạn mất ${r.cross / 60} giờ, và nước phải đủ sâu suốt cả thời gian đó.`),
      line(`The ship can leave no earlier than ${fmtTime(r.leave)}.`, `Tàu không thể rời đi sớm hơn ${fmtTime(r.leave)}.`),
      line(`It must reach the far side no later than ${fmtTime(r.arrive)} (before dark).`, `Tàu phải tới bờ bên kia không muộn hơn ${fmtTime(r.arrive)} (trước khi trời tối).`)),
    h('div', { class: 'box c2-card' }, h('h4', {}, '⏱ Giờ khởi hành'),
      h('p', { class: 'small' }, `Chọn giờ SỚM NHẤT có thể. ${nameOf(partner())} có bảng thuỷ triều.`),
      h('div', { class: 'row' }, select, h('button', { class: 'btn gold', onclick: () => ctx.send('depart', { time: ui.time ?? r.leave }) }, 'Khởi hành ▶')),
      d.tries.length ? h('div', { class: 'small' }, 'Đã thử (sai): ', d.tries.map(fmtTime).join(' · ')) : null),
  ];
}

// ------------------------------------------------------------ ch3 · diary
function diaryView(ctx) {
  const { d, role, ui, pz } = ctx;
  const own = (st) => st.owner === role;
  const reveal = (st) => {
    if (own(st)) return st.en;
    if (pz.level === 'easy') return st.en;
    if (pz.level === 'normal') return `${st.en.split(' ')[0]} …`;
    return '▒▒▒ (mảnh của bạn kia)';
  };
  const hand = d.strips.filter((st) => own(st) && !d.slots.includes(st.id));
  const pick = ui.pick && d.strips.find((x) => x.id === ui.pick && own(x)) ? ui.pick : null;
  const board = h('div', { class: 'c3-board' }, ...d.slots.map((id, i) => {
    const st = id && d.strips.find((x) => x.id === id);
    return h('div', {
      class: `c3-slot ${st ? (own(st) ? 'mine' : 'theirs') : 'empty'} ${pick && st && st.id === pick ? 'sel' : ''}`,
      onclick: () => {
        if (pick) { ctx.send('place', { strip: pick, slot: i }); ui.pick = null; return; }
        if (st && own(st)) { ui.pick = st.id; sfx('click'); ctx.redraw(); }
      },
    }, h('span', { class: 'n en' }, String(i + 1)), h('span', { class: 'txt' }, st ? reveal(st) : 'trống — chọn một mảnh của bạn rồi bấm vào đây'),
    st && own(st) ? h('button', { class: 'btn small', onclick: (e) => { e.stopPropagation(); ctx.send('remove', { strip: st.id }); } }, '↩') : null);
  }));
  const handEl = h('div', { class: 'c3-hand' }, ...hand.map((st) => h('div', { class: `c3-strip ${pick === st.id ? 'sel' : ''}`, onclick: () => { ui.pick = pick === st.id ? null : st.id; sfx('click'); ctx.redraw(); } },
    line(st.en, st.vi))));
  return [
    h('div', { class: 'box c2-card c2-wide' }, h('h4', {}, `📜 ${d.title} — bảng chung (${d.slots.filter(Boolean).length}/${d.slots.length})`),
      h('p', { class: 'small' }, pz.level === 'hard' ? 'Mức Hack não: bạn không thấy chữ trên mảnh của người kia. Hãy đọc to mảnh của mình.' : pz.level === 'normal' ? 'Bạn chỉ thấy chữ đầu tiên trên mảnh của người kia. Hãy đọc to mảnh của mình.' : 'Đọc to mảnh của mình cho người kia nghe.'),
      board,
      h('div', { class: 'row' },
        h('button', { class: 'btn gold', disabled: d.slots.some((x) => !x), onclick: () => ctx.send('check') }, 'Kiểm tra thứ tự ▶'),
        d.lastRight != null ? h('span', { class: 'small' }, `Lần kiểm tra trước: đúng ${d.lastRight}/${d.slots.length} vị trí`) : null)),
    h('div', { class: 'box c2-card c2-wide' }, h('h4', {}, `✋ Mảnh của bạn chưa xếp (${hand.length})`),
      hand.length ? handEl : h('p', { class: 'small' }, 'Bạn đã xếp hết mảnh của mình. Muốn đổi chỗ: bấm một mảnh trên bảng rồi bấm ô khác.')),
  ];
}

// ------------------------------------------------------------ ch3 · gears
function gearsView(ctx) {
  const { d, role, ui } = ctx;
  if (role === 'diagram') {
    const g = d.gears.map((x, i) => {
      const isIn = i === 0;
      const isLens = i === d.gears.length - 1;
      const rep = d.replaced && d.replaced.gear === i ? d.replaced : null;
      let teeth;
      if (isIn) teeth = '?';
      else if (x.compound) teeth = `big ${x.big} · small ${rep && rep.part === 'small' ? rep.old : x.small}`;
      else teeth = String(rep ? rep.old : x.teeth);
      return h('div', { class: `c3-gear ${x.compound ? 'compound' : ''}` },
        h('div', { class: 'en big' }, x.name), h('div', { class: 'small' }, isIn ? 'CRANK GEAR (size: see tag)' : isLens ? 'LENS GEAR' : x.compound ? 'COMPOUND (two wheels, one axle)' : 'gear'),
        h('div', { class: 'en' }, `${teeth} teeth`));
    });
    const chain = [];
    g.forEach((el, i) => { chain.push(el); if (i < g.length - 1) chain.push(h('span', { class: 'c3-mesh' }, '⟷')); });
    return [
      h('div', { class: 'box c2-card c2-wide' }, h('h4', {}, '📐 Blueprint (drawn in 1962)'), h('div', { class: 'c3-chain' }, ...chain),
        line('Gears that touch turn in opposite directions.', 'Hai bánh răng chạm nhau thì quay ngược chiều nhau.'),
        line('When a gear with more teeth is turned by a smaller one, it turns fewer times.', 'Khi bánh răng nhiều răng được bánh nhỏ hơn kéo, nó quay ít vòng hơn.'),
        d.gears.some((x) => x.compound) ? line('A compound gear has two wheels on one axle: the big wheel is driven, the small wheel drives the next gear. Both wheels turn together.', 'Bánh răng kép có hai bánh trên cùng một trục: bánh lớn bị kéo, bánh nhỏ kéo bánh tiếp theo. Cả hai quay cùng nhau.') : null),
      h('div', { class: 'box c2-card' }, h('h4', {}, '🎯 Lens target'),
        h('div', { class: 'c2-clue en' }, `The lens must turn ${d.target.turns === 0.5 ? 'half a turn' : d.target.turns === 1 ? 'one full turn' : d.target.turns === 1.5 ? 'one and a half turns' : `${d.target.turns} full turns`}, ${DIRS[d.target.dir]} (seen from the front).`),
        h('p', { class: 'small' }, `${nameOf(partner())} đứng ở tay quay và có phiếu bảo trì: hỏi họ cỡ bánh răng tay quay và bánh răng nào đã được thay.`)),
    ];
  }
  const rep = d.replaced;
  const g0 = d.gears[0];
  const tag = [line(`Crank gear (A): ${g0.teeth} teeth.`, `Bánh răng tay quay (A): ${g0.teeth} răng.`)];
  if (rep) {
    const real = d.gears[rep.gear][rep.part];
    tag.push(line(`Gear ${d.gears[rep.gear].name}${rep.part === 'small' ? ' (small wheel)' : ''} was replaced last year: it now has ${real} teeth, not ${rep.old}.`, `Bánh răng ${d.gears[rep.gear].name}${rep.part === 'small' ? ' (bánh nhỏ)' : ''} đã được thay năm ngoái: giờ có ${real} răng, không phải ${rep.old}.`));
  }
  return [
    h('div', { class: 'box c2-card' }, h('h4', {}, '🏷 Maintenance tag'), ...tag,
      h('p', { class: 'small' }, `${nameOf(partner())} có bản thiết kế và biết thấu kính phải quay thế nào.`)),
    h('div', { class: 'box c2-card' }, h('h4', {}, '⚙ The crank'),
      h('div', { class: 'seg' }, ...Object.entries(DIRS).map(([k, v]) => h('button', { class: (ui.dir || 'cw') === k ? 'on' : '', onclick: () => { ui.dir = k; ctx.redraw(); } }, `${k === 'cw' ? '↻' : '↺'} ${v}`))),
      h('div', { class: 'seg', style: { marginTop: '6px' } }, ...TURNS.map((t) => h('button', { class: ui.turns === t ? 'on' : '', onclick: () => { ui.turns = t; ctx.redraw(); } }, `${t} turn${t === 1 ? '' : 's'}`))),
      h('div', { class: 'row', style: { marginTop: '8px' } }, h('button', { class: 'btn gold', disabled: ui.turns == null, onclick: () => ctx.send('crank', { turns: ui.turns, dir: ui.dir || 'cw' }) }, 'Quay ▶'),
        d.tries.length ? h('span', { class: 'small' }, 'Đã thử (sai): ', d.tries.map((x) => `${x.turns} ${x.dir === 'cw' ? '↻' : '↺'}`).join(' · ')) : null)),
  ];
}

// ------------------------------------------------------------ ch3 · beacon
function beaconView(ctx) {
  const { d, role, ui, pz } = ctx;
  const duty = dutyOf(d, role);
  const n = d.ships.length;
  const progress = h('div', { class: 'c2-wide c2-phases' }, ...d.ships.map((_, i) => h('span', { class: `ph ${d.cur === i ? 'now' : ''} ${d.cur > i ? 'ok' : ''}` }, `${d.cur > i ? '✓ ' : ''}Tàu ${i + 1}${i === d.swapAt ? ' (đổi vai)' : ''}`)),
    h('span', { class: `ph ${d.cur >= n ? 'now' : ''}` }, 'Cùng bấm LIGHT'));
  if (d.cur >= n) {
    const waitP = ui.partnerLight && performance.now() - ui.partnerLight < LIGHT_WINDOW_MS;
    return [progress, h('div', { class: 'box c2-card c2-wide c2-send' },
      h('p', {}, `Mọi con tàu đã an toàn! Hai bạn cùng bấm LIGHT (cách nhau không quá ${LIGHT_WINDOW_MS / 1000} giây) để thắp sáng ngọn hải đăng.`),
      h('button', { class: 'btn gold c2-sendbtn', onclick: () => ctx.send('light') }, d.light[role] ? 'LIGHT lại' : 'LIGHT ▶'),
      h('div', { class: 'small' }, waitP ? `⏳ ${nameOf(partner())} vừa bấm LIGHT! Bấm ngay!` : `${nameOf(partner())}: chưa bấm`))];
  }
  const ship = d.ships[d.cur];
  const swapNote = d.cur === d.swapAt ? h('div', { class: 'c2-warn' }, '🔄 Đã đổi vai! Giờ bạn ' + (duty === 'lookout' ? 'quan sát tàu.' : 'phát đèn.')) : null;
  if (duty === 'lookout') {
    return [progress, h('div', { class: 'box c2-card' }, h('h4', {}, `🔭 Ống nhòm — tàu ${d.cur + 1}/${n}`), swapNote,
      h('div', { class: 'c2-clue' }, line(ship.desc, null)),
      h('table', { class: 'tx-table' },
        h('tr', {}, h('th', {}, 'Flag'), h('td', { class: 'en' }, ship.flag)),
        h('tr', {}, h('th', {}, 'Distance'), h('td', { class: 'en' }, `${ship.distance} nautical miles`)),
        h('tr', {}, h('th', {}, 'Visibility'), h('td', { class: 'en' }, `${ship.visibility} km`))),
      h('p', { class: 'small' }, `Bạn không có sổ quy tắc. Tả cho ${nameOf(partner())} nghe bằng tiếng Anh: con tàu trông thế nào, cờ màu gì, cách bao xa, tầm nhìn bao nhiêu.`))];
  }
  const seq = ui.seq || (ui.seq = []);
  return [progress,
    h('div', { class: 'box c2-card' }, h('h4', {}, '📕 Light code book'), swapNote,
      ...codeBook(pz.level).map((r) => line(r.en, r.vi, 'rule')),
      h('h4', {}, 'How to recognise ships'), ...RECOGNISE.map((r) => line(r.en, r.vi))),
    h('div', { class: 'box c2-card' }, h('h4', {}, `💡 The lamp — tàu ${d.cur + 1}/${n}`),
      h('p', { class: 'small' }, `Bạn không thấy tàu: hỏi ${nameOf(partner())}.`),
      h('div', { class: 'seg' }, ...COLOURS.map((c) => h('button', { class: `${(ui.colour || 'white') === c ? 'on' : ''}`, onclick: () => { ui.colour = c; ctx.redraw(); } }, c))),
      h('div', { class: 'c3-seq en' }, seq.length ? seq.map((f) => (f === 'L' ? '▬' : '•')).join(' ') : '(chưa có chớp)'),
      h('div', { class: 'row' },
        h('button', { class: 'btn small', onclick: () => { seq.push('S'); ctx.redraw(); } }, '• short'),
        h('button', { class: 'btn small', onclick: () => { seq.push('L'); ctx.redraw(); } }, '▬ long'),
        h('button', { class: 'btn small', onclick: () => { seq.pop(); ctx.redraw(); } }, '↩ undo'),
        h('button', { class: 'btn small', onclick: () => { ui.seq = []; ctx.redraw(); } }, 'clear')),
      h('div', { class: 'row', style: { marginTop: '8px' } }, h('button', { class: 'btn gold', onclick: () => { ctx.send('signal', { colour: ui.colour || 'white', flashes: [...seq] }); ui.seq = []; } }, 'Phát đèn ▶'))),
  ];
}

export const VIEWS = { coords: coordsView, flood: floodView, keycard: keycardView, antenna: antennaView, machine: machineView, finale: finaleView, tide: tideView, diary: diaryView, gears: gearsView, beacon: beaconView };

// Pip's hint (H key) for each step
export const C2_HINT = {
  coords: 'Pip: Mỗi người nghe một nửa! Đọc cho nhau nghe. Mười ba hay ba mươi? Hỏi tên ô lưới rồi tra hải đồ!',
  flood: 'Pip: Hỏi mực nước và số trên cửa bên kia trước! Rồi tính xem van nào cần xoay mấy vòng.',
  keycard: 'Pip: Đêm nào? Hỏi nhật ký cửa! Ai đổi ca? Đọc kỹ email cuối cùng!',
  antenna: 'Pip: Trái của bạn là phải của người kia! Đếm từ một phía thống nhất!',
  end: 'Pip: Giỏi lắm! Giỏi lắm!',
  tide: 'Pip: Nước phải đủ sâu SUỐT lúc vượt rạn! Không chỉ lúc đi!',
  diary: 'Pip: Tìm mảnh mở đầu trước! However, As a result, Finally: đọc từ nối!',
  gears: 'Pip: Chạm nhau là quay ngược chiều! Phiếu bảo trì mới hơn bản thiết kế!',
  beacon: 'Pip: Tả tàu trước! Rồi cờ, khoảng cách, tầm nhìn!',
};
