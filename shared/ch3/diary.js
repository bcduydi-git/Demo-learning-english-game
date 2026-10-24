// Chapter 3, puzzle 2 — "The torn diary".
// Pages of the keeper's diary were torn into strips. Each player holds
// half of them and can only read their own strips. Together they put
// every strip in order on one shared board, using the linking words
// (At first, However, As a result, Finally...) and pronouns (it, that)
// as clues, like a TOEIC text-completion question. "Check" tells how many
// strips are in the right place, and costs a strike if any is wrong.

export const DIARIES = [
  {
    title: 'Halcyon, 1974',
    easy: [0, 1, 2, 3, 6, 7],
    lines: [
      ['I arrived at Halcyon Station on a grey Monday morning in 1974.', 'Tôi đến trạm Halcyon vào một sáng thứ Hai u ám năm 1974.'],
      ['At first, the work was simple: I listened to the radio and wrote down the weather.', 'Lúc đầu, công việc rất đơn giản: tôi nghe radio và ghi lại thời tiết.'],
      ['However, after a few weeks, I began to hear a strange signal every night.', 'Tuy nhiên, sau vài tuần, tôi bắt đầu nghe thấy một tín hiệu lạ mỗi đêm.'],
      ['It always came at exactly the same time: three long notes, then three short ones.', 'Nó luôn đến đúng vào một giờ: ba tiếng dài, rồi ba tiếng ngắn.'],
      ['I reported it to the station manager, but he told me to forget about it.', 'Tôi báo cho quản lý trạm, nhưng ông ấy bảo tôi quên chuyện đó đi.'],
      ['Instead, I decided to find out where it came from.', 'Thay vào đó, tôi quyết định tìm xem nó đến từ đâu.'],
      ['As a result, I spent many long nights alone in the radio room.', 'Vì vậy, tôi đã trải qua nhiều đêm dài một mình trong phòng radio.'],
      ['Finally, I understood: the signal came from the old lighthouse on the reef.', 'Cuối cùng, tôi đã hiểu: tín hiệu đến từ ngọn hải đăng cũ trên rạn đá.'],
    ],
  },
  {
    title: 'The Sunken Light',
    easy: [0, 1, 2, 3, 4, 5],
    lines: [
      ['The Sunken Light was built in 1902 to warn ships about the North Reef.', 'Ngọn Hải Đăng Chìm được xây năm 1902 để cảnh báo tàu thuyền về Rạn Bắc.'],
      ['For sixty years, it saved hundreds of sailors from the rocks.', 'Suốt sáu mươi năm, nó đã cứu hàng trăm thuỷ thủ khỏi đá ngầm.'],
      ['Then, in 1962, a terrible storm moved the sand under its base.', 'Rồi năm 1962, một cơn bão khủng khiếp làm dịch chuyển lớp cát dưới chân nó.'],
      ['Since then, the tower has leaned to one side, and its lower half is under water at high tide.', 'Từ đó, ngọn tháp nghiêng hẳn sang một bên, và nửa dưới ngập nước khi thuỷ triều lên.'],
      ['Most people believe it was abandoned long ago.', 'Phần lớn mọi người tin rằng nó đã bị bỏ hoang từ lâu.'],
      ['In fact, someone has kept its light working all this time.', 'Thật ra, có một người đã giữ cho đèn của nó sáng suốt thời gian qua.'],
      ['That someone, as you may have guessed, is me.', 'Người đó, chắc bạn cũng đoán ra rồi, chính là tôi.'],
      ['I will explain everything when you get here.', 'Tôi sẽ giải thích mọi chuyện khi các bạn tới đây.'],
    ],
  },
  {
    title: 'A letter',
    easy: [0, 1, 2, 3, 4, 5],
    lines: [
      ['My dear grandson, I am sorry I left without saying goodbye.', 'Cháu yêu của bà, bà xin lỗi vì đã ra đi mà không chào tạm biệt.'],
      ['When the station closed, I was supposed to go home like everyone else.', 'Khi trạm đóng cửa, lẽ ra bà phải về nhà như mọi người.'],
      ['But that night, I saw a fishing boat heading straight for the reef.', 'Nhưng đêm đó, bà thấy một chiếc thuyền đánh cá đang lao thẳng về phía rạn đá.'],
      ['Nobody else was there to warn it, so I rowed out to the old lighthouse and lit the lamp.', 'Không có ai khác ở đó để cảnh báo, nên bà chèo thuyền ra ngọn hải đăng cũ và thắp đèn.'],
      ['The boat turned just in time.', 'Chiếc thuyền quay đầu vừa kịp lúc.'],
      ['After that, I could not leave the light alone again.', 'Sau chuyện đó, bà không thể bỏ ngọn đèn một mình được nữa.'],
      ['Every year I told myself it would be my last.', 'Năm nào bà cũng tự nhủ đó sẽ là năm cuối cùng.'],
      ['Now I am old, and I need someone to carry on.', 'Giờ bà đã già, và bà cần một người tiếp tục công việc này.'],
    ],
  },
];

const shuffle = (r, l) => [...l].sort(() => r() - 0.5);

function create(level, r) {
  const di = Math.floor(r() * DIARIES.length);
  const D = DIARIES[di];
  const idx = level === 'easy' ? D.easy : D.lines.map((_, i) => i);
  for (;;) {
    const owners = shuffle(r, idx.map((_, i) => (i % 2 ? 'left' : 'right')));
    // neither player should hold a long run of the story in order
    if (owners.some((o, i) => i > 1 && o === owners[i - 1] && o === owners[i - 2])) continue;
    const strips = idx.map((li, i) => ({ id: `s${li}`, en: D.lines[li][0], vi: D.lines[li][1], owner: owners[i] }));
    return {
      diary: di,
      title: D.title,
      order: strips.map((s) => s.id),
      strips: shuffle(r, strips),
      slots: strips.map(() => null),
      lastRight: null,
      checks: 0,
    };
  }
}

function act(d, role, a) {
  const strip = d.strips.find((s) => s.id === a.strip);
  if (a.op === 'place') {
    const slot = Number(a.slot);
    if (!strip || strip.owner !== role || !(slot >= 0 && slot < d.slots.length)) return undefined;
    const there = d.slots[slot];
    if (there && there !== strip.id && d.strips.find((s) => s.id === there).owner !== role) return undefined;
    // moving between slots swaps two of your own strips; from your hand, the
    // strip that was there goes back to your hand
    const from = d.slots.indexOf(strip.id);
    if (from >= 0) d.slots[from] = there && there !== strip.id ? there : null;
    d.slots[slot] = strip.id;
    d.lastRight = null;
    return 'ok';
  }
  if (a.op === 'remove') {
    if (!strip || strip.owner !== role) return undefined;
    const at = d.slots.indexOf(strip.id);
    if (at >= 0) d.slots[at] = null;
    d.lastRight = null;
    return 'ok';
  }
  if (a.op === 'check') {
    if (d.slots.some((s) => !s)) return undefined;
    d.checks += 1;
    d.lastRight = d.slots.filter((s, i) => s === d.order[i]).length;
    if (d.lastRight === d.order.length) return 'solved';
    a.what = `mới đúng ${d.lastRight}/${d.order.length} vị trí`;
    return 'strike';
  }
  return undefined;
}

export const diary = {
  roles: ['left', 'right'],
  strikes: { easy: 5, normal: 4, hard: 3 },
  create,
  act,
};
