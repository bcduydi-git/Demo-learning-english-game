// Chapter 3 — "The Sunken Light": dialogue, rooms and notes.
// Same line format as chapter 1 (see content.js), same room map engine as
// chapter 2 (see shared/ch2/index.js).

export const TITLE = { vi: 'CHƯƠNG 3 · NGỌN HẢI ĐĂNG CHÌM', en: 'The Sunken Light' };

export const CH3_SCENES = {
  c3_intro: [
    { s: 'narr', vi: 'Rạng sáng. Aurora hướng về phía bắc. Phía trước là Rạn Bắc: đá ngầm chỉ qua được khi thuỷ triều đủ cao.' },
    { s: 'captain', en: 'The North Reef is dangerous. We can only cross when the water is deep enough.', vi: 'Rạn Bắc rất nguy hiểm. Chúng ta chỉ qua được khi nước đủ sâu.' },
    { s: 'captain', en: 'One of you has the tide table, the other has the route card. Tell me the earliest time we can leave.', vi: 'Một bạn cầm bảng thuỷ triều, bạn kia cầm phiếu tuyến đường. Hãy cho tôi biết giờ sớm nhất mình có thể khởi hành.' },
    { s: 'pip', en: 'High water! High water!', vi: 'Nước lên! Nước lên!' },
    { s: 'narr', vi: 'Chương cuối. Mỗi thử thách vẫn chia đôi thông tin, nhưng cách chơi khác chương 2. Bấm vào thử thách trong phòng để bắt đầu.' },
  ],
  c3_tide_done: [
    { s: 'narr', vi: 'Aurora vượt qua rạn đá an toàn. Giữa sóng, ngọn hải đăng chìm hiện ra: nghiêng hẳn một bên, nửa dưới ngập trong nước.' },
    { s: 'p1', en: 'There it is. The Sunken Light!', vi: 'Kia rồi. Ngọn Hải Đăng Chìm!', say: true },
    { s: 'captain', en: "I can't bring the ship any closer. Take the small boat. I'll wait for you here.", vi: 'Tôi không đưa tàu vào gần hơn được. Các bạn đi xuồng nhỏ nhé. Tôi sẽ đợi ở đây.' },
    { s: 'pip', en: 'Pip knows the way! Follow Pip!', vi: 'Pip biết đường! Theo Pip!' },
  ],
  c3_diary_intro: [
    { s: 'p2', en: 'Look, there are pieces of paper all over the stairs.', vi: 'Nhìn kìa, có giấy vương khắp cầu thang.', say: true },
    { s: 'p1', en: "They're pages from a diary. Let's put them back in order.", vi: 'Đây là những trang nhật ký. Mình xếp lại cho đúng thứ tự đi.', say: true },
    { s: 'narr', vi: 'Mỗi người nhặt được một nửa số mảnh và chỉ đọc được mảnh của mình. Đọc to cho nhau nghe, rồi cùng xếp lên bảng.' },
  ],
  c3_diary_done: [
    { s: 'p2', en: "It's Eleanor's diary. She has been here all this time.", vi: 'Đây là nhật ký của bà Eleanor. Bà ấy đã ở đây suốt thời gian qua.', say: true },
    { s: 'pip', en: 'Up! Up! Eleanor is up!', vi: 'Lên! Lên! Eleanor ở trên kia!' },
  ],
  c3_gears_intro: [
    { s: 'p1', en: "The big lens is stuck. These gears turn it.", vi: 'Thấu kính lớn bị kẹt rồi. Mấy bánh răng này làm nó quay.', say: true },
    { s: 'p2', en: "There's a crank here, and an old maintenance tag.", vi: 'Ở đây có một tay quay, và một phiếu bảo trì cũ.', say: true },
    { s: 'narr', vi: 'Một người có bản thiết kế, một người đứng ở tay quay. Hai bánh răng chạm nhau thì quay ngược chiều nhau.' },
  ],
  c3_gears_done: [
    { s: 'narr', vi: 'Bánh răng ăn khớp, thấu kính khổng lồ xoay trở lại. Từ phòng đèn phía trên vọng xuống một giọng nói.' },
    { s: 'keeper', en: 'Is someone there? Come up, please. Mind the wet steps.', vi: 'Có ai ở đó không? Lên đây nào. Cẩn thận bậc thang ướt nhé.' },
  ],
  c3_beacon_intro: [
    { s: 'narr', vi: 'Trong phòng đèn, một bà cụ tóc bạc ngồi cạnh ngọn đèn lớn, tay cầm chiếc radio cũ.' },
    { s: 'keeper', en: 'So you are the ones who answered my signal. Thank you for coming.', vi: 'Vậy ra các cháu là những người đã trả lời tín hiệu của bà. Cảm ơn đã tới.' },
    { s: 'p1', en: 'Are you Eleanor? Your grandson is waiting on the ship!', vi: 'Bà là bà Eleanor phải không ạ? Cháu của bà đang đợi trên tàu!', say: true },
    { s: 'keeper', en: 'I know. And I will go with him. But first, look outside.', vi: 'Bà biết. Và bà sẽ đi cùng nó. Nhưng trước hết, nhìn ra ngoài kia.' },
    { s: 'narr', vi: 'Qua cửa kính, bão đang kéo tới. Nhiều con tàu đang hướng thẳng vào rạn đá.' },
    { s: 'keeper', en: "Those ships can't see the reef. One of you watches them, the other sends the light. Hurry!", vi: 'Những con tàu đó không thấy rạn đá. Một cháu quan sát tàu, cháu kia phát đèn. Nhanh lên!' },
  ],
  c3_ending: [
    { s: 'narr', vi: 'Con tàu cuối cùng đổi hướng, an toàn. Bão tan dần. Ngọn Hải Đăng Chìm toả ánh sáng xanh lá trên mặt biển.' },
    { s: 'keeper', en: 'You did it. For fifty years I did this alone. Tonight, I did not have to.', vi: 'Các cháu làm được rồi. Năm mươi năm nay bà làm việc này một mình. Đêm nay thì không.' },
    { s: 'captain', en: "Grandmother! I'm coming to get you.", vi: 'Bà ơi! Cháu đến đón bà đây.' },
    { s: 'keeper', en: "Then I'm ready to go home, my dear.", vi: 'Vậy thì bà sẵn sàng về nhà rồi, cháu yêu.' },
    { s: 'keeper', en: 'Take this key. The light can run by itself now, but it needs someone who cares about it. Will you come back sometimes?', vi: 'Cầm lấy chiếc chìa khoá này. Giờ ngọn đèn tự chạy được rồi, nhưng nó cần một người quan tâm đến nó. Thỉnh thoảng các cháu sẽ quay lại chứ?' },
    { s: 'p1', en: 'We promise.', vi: 'Chúng cháu hứa.', say: true },
    { s: 'p2', en: "We'll be back. See you soon.", vi: 'Chúng cháu sẽ quay lại. Hẹn sớm gặp lại.', say: true },
    { s: 'pip', en: 'Pip stays! Pip keeps the light!', vi: 'Pip ở lại! Pip giữ đèn!' },
    { s: 'narr', vi: 'Hết.' },
  ],
};

export const ROOMS = {
  deck: { name: 'Aurora — Deck', vi: 'Boong tàu Aurora', x: 6, y: 74, notes: [
    { title: 'Harbour bulletin', en: 'Due to strong winds, small boats must stay within two nautical miles of the coast until further notice.', vi: 'Do gió mạnh, thuyền nhỏ phải ở trong phạm vi hai hải lý tính từ bờ cho đến khi có thông báo mới.' },
  ] },
  landing: { name: 'Rocky landing', vi: 'Bãi đá chân tháp', x: 28, y: 74, notes: [
    { title: 'Old sign', en: 'DANGER: slippery rocks. Visitors must not land without the keeper\'s permission.', vi: 'NGUY HIỂM: đá trơn. Khách không được lên bờ khi chưa có sự cho phép của người gác đèn.' },
  ] },
  stairs: { name: 'Spiral stairs', vi: 'Cầu thang xoắn', x: 46, y: 50, notes: [
    { title: 'Notice', en: 'No more than two people on the stairs at the same time, please.', vi: 'Vui lòng không quá hai người trên cầu thang cùng lúc.' },
  ] },
  keeperroom: { name: "Keeper's room", vi: 'Phòng người gác đèn', x: 72, y: 56, notes: [
    { title: 'Calendar', en: 'A calendar from this year. Every day has a small cross on it, and a note: "light OK".', vi: 'Một cuốn lịch năm nay. Ngày nào cũng có một dấu gạch chéo nhỏ, kèm ghi chú: "đèn ổn".' },
    { title: 'Photograph', en: 'An old photo of a young woman holding a red parrot. On the back: "Me and Pip, Beacon Isle".', vi: 'Một tấm ảnh cũ chụp một cô gái trẻ ôm một con vẹt đỏ. Mặt sau ghi: "Tôi và Pip, đảo Beacon".' },
  ] },
  gearroom: { name: 'Gear room', vi: 'Phòng bánh răng', x: 30, y: 26, notes: [
    { title: 'Maintenance schedule', en: 'Oil the gears every Sunday. Last done: three days ago. Next time, check the gear that was replaced.', vi: 'Tra dầu bánh răng mỗi Chủ nhật. Lần gần nhất: ba ngày trước. Lần sau nhớ kiểm tra bánh răng đã được thay.' },
  ] },
  lantern: { name: 'Lantern room', vi: 'Phòng đèn', x: 54, y: 6, notes: [
    { title: 'Log book', en: 'Ships guided past the reef this year: 47. Ships lost: 0.', vi: 'Số tàu được dẫn qua rạn đá năm nay: 47. Số tàu bị nạn: 0.' },
  ] },
};

export const LINKS = [['deck', 'landing'], ['landing', 'stairs'], ['stairs', 'keeperroom'], ['stairs', 'gearroom'], ['gearroom', 'lantern']];

const ALL = ['landing', 'stairs', 'keeperroom', 'gearroom', 'lantern'];
export const STEPS = [
  { id: 'tide', room: 'deck', title: 'The tide window', vi: 'Cửa sổ thuỷ triều', intro: null, done: 'c3_tide_done', open: ['deck'] },
  { id: 'diary', room: 'stairs', title: 'The torn diary', vi: 'Nhật ký rách', intro: 'c3_diary_intro', done: 'c3_diary_done', open: ['landing', 'stairs', 'keeperroom'], spawn: 'landing' },
  { id: 'gears', room: 'gearroom', title: 'The lens gears', vi: 'Bánh răng thấu kính', intro: 'c3_gears_intro', done: 'c3_gears_done', open: ['landing', 'stairs', 'keeperroom', 'gearroom'] },
  { id: 'beacon', room: 'lantern', title: 'Light for the ships', vi: 'Đèn hiệu cho tàu', intro: 'c3_beacon_intro', done: 'c3_ending', open: ALL },
  { id: 'end', room: 'lantern', title: 'The end', vi: 'Hết', open: ALL },
];

export const ROLE_ROOM = {
  tide: { tables: 'deck', chart: 'deck' },
  diary: { left: 'stairs', right: 'stairs' },
  gears: { diagram: 'gearroom', crank: 'gearroom' },
  beacon: { lookout: 'lantern', keeper: 'lantern' },
};

export const ROLE_INFO = {
  tables: { icon: '🌊', vi: 'Bảng thuỷ triều', desc: 'Có bảng mực nước theo giờ trong ngày (và thông báo của cảng nếu có).' },
  chart: { icon: '🗺', vi: 'Phiếu tuyến đường', desc: 'Biết tàu cần nước sâu bao nhiêu, vượt rạn mất bao lâu, giờ được rời bến và giờ phải tới nơi. Là người chọn giờ khởi hành.' },
  left: { icon: '📜', vi: 'Nửa nhật ký thứ nhất', desc: 'Giữ một nửa số mảnh nhật ký, chỉ đọc được mảnh của mình.' },
  right: { icon: '📜', vi: 'Nửa nhật ký thứ hai', desc: 'Giữ nửa còn lại, chỉ đọc được mảnh của mình.' },
  diagram: { icon: '📐', vi: 'Bản thiết kế', desc: 'Có sơ đồ chuỗi bánh răng và yêu cầu thấu kính phải quay bao nhiêu. Bản thiết kế có thể đã cũ.' },
  crank: { icon: '⚙', vi: 'Tay quay', desc: 'Đứng ở tay quay, có phiếu bảo trì (cỡ bánh răng tay quay, bánh răng đã được thay). Là người quay.' },
  lookout: { icon: '🔭', vi: 'Quan sát', desc: 'Nhìn tàu qua ống nhòm: tả tàu, cờ, khoảng cách, tầm nhìn. Sau tàu thứ hai thì đổi vai.' },
  keeper: { icon: '💡', vi: 'Người phát đèn', desc: 'Có sổ quy tắc đèn và điều khiển đèn, nhưng không thấy tàu. Sau tàu thứ hai thì đổi vai.' },
};

export const WORDS = {
  tide: [['tide table', 'bảng thuỷ triều'], ['high tide / low tide', 'triều lên / triều xuống'], ['at least', 'ít nhất'], ['no earlier than', 'không sớm hơn'], ['no later than', 'không muộn hơn'], ['throughout', 'suốt (cả quá trình)'], ['the earliest', 'sớm nhất']],
  diary: [['at first', 'lúc đầu'], ['however', 'tuy nhiên'], ['instead', 'thay vào đó'], ['as a result', 'vì vậy, kết quả là'], ['finally', 'cuối cùng'], ['since then', 'kể từ đó'], ['in fact', 'thật ra']],
  gears: [['clockwise', 'theo chiều kim đồng hồ'], ['anticlockwise', 'ngược chiều kim đồng hồ'], ['gear', 'bánh răng'], ['teeth', 'răng (của bánh răng)'], ['crank', 'tay quay'], ['replaced', 'đã được thay'], ['blueprint', 'bản thiết kế']],
  beacon: [['visibility', 'tầm nhìn'], ['nautical mile', 'hải lý'], ['flag', 'cờ'], ['pilot', 'hoa tiêu'], ['flash', 'chớp (đèn)'], ['reef', 'rạn đá ngầm'], ['heading for', 'đang hướng tới']],
};
