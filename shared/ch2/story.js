// Chapter 2 — "The Green Light": dialogue, rooms and the notes players can
// read. Same line format as chapter 1 (see content.js).

export const CH2_SCENES = {
  c2_intro: [
    { s: 'narr', vi: 'Tàu Aurora rẽ sóng về phía đốm sáng xanh. Đã gần nửa đêm.' },
    { s: 'captain', en: "That light isn't on any chart. Whatever it is, we're going to find it.", vi: 'Ánh sáng đó không có trên bất kỳ hải đồ nào. Dù nó là gì, chúng ta sẽ tìm ra.' },
    { s: 'pip', en: 'Eleanor! Eleanor!', vi: 'Eleanor! Eleanor!' },
    { s: 'p2', en: 'Captain, the radio is picking something up.', vi: 'Thuyền trưởng, radio đang bắt được gì đó.', say: true },
    { s: 'captain', en: "Static... but there's a voice under it. Can you two work out the position?", vi: 'Toàn tiếng rè... nhưng có giọng người bên dưới. Hai bạn nghe ra được vị trí không?' },
    { s: 'captain', en: 'One of you takes the radio desk, the other takes the navigation console. Be careful: some numbers sound alike.', vi: 'Một người ngồi bàn radio, người kia ngồi bàn hải đồ. Cẩn thận: có những con số nghe rất giống nhau.' },
    { s: 'narr', vi: 'Từ chương này, mỗi thử thách đều chia đôi thông tin: không ai giải được một mình. Bấm vào thử thách trong phòng để bắt đầu, chọn mức khó và vai.' },
  ],
  c2_arrive: [
    { s: 'narr', vi: 'Aurora tới đúng toạ độ. Giữa biển, một công trình bằng thép đứng trên những cột cao: một trạm nghiên cứu cũ. Đèn xanh nhấp nháy trên mái vòm.' },
    { s: 'captain', en: 'Halcyon Station. It was closed forty years ago. Nobody should be here.', vi: 'Trạm Halcyon. Nó bị đóng cửa từ bốn mươi năm trước. Lẽ ra không còn ai ở đây.' },
    { s: 'p1', en: 'But someone turned that light on.', vi: 'Nhưng ai đó đã bật ngọn đèn kia.', say: true },
    { s: 'captain', en: "I'll stay with the ship. Take a radio and keep in touch.", vi: 'Tôi sẽ ở lại tàu. Mang theo radio và giữ liên lạc nhé.' },
    { s: 'pip', en: 'Pip goes too! Pip goes too!', vi: 'Pip đi nữa! Pip đi nữa!' },
    { s: 'narr', vi: 'Bấm vào tên phòng trên bản đồ để di chuyển. Trong mỗi phòng có giấy tờ, biển báo bằng tiếng Anh: đọc để hiểu chuyện gì đã xảy ra.' },
  ],
  c2_flood_intro: [
    { s: 'p2', en: "The corridor is flooded. I can't get through!", vi: 'Hành lang ngập nước rồi. Mình không qua được!', say: true },
    { s: 'pip', en: 'Two wings! Two hatches! One each!', vi: 'Hai cánh! Hai cửa! Mỗi người một bên!' },
    { s: 'narr', vi: 'Hai bạn bị tách ra: một người ở cánh Tây, một người ở cánh Đông. Van bên này điều khiển nước bên kia.' },
  ],
  c2_flood_done: [
    { s: 'p1', en: 'Both hatches are open. We did it!', vi: 'Cả hai cửa đều mở rồi. Làm được rồi!', say: true },
    { s: 'p2', en: "Good teamwork. Let's find the office.", vi: 'Phối hợp tốt lắm. Đi tìm văn phòng thôi.', say: true },
  ],
  c2_keycard_intro: [
    { s: 'p1', en: 'The control room is locked. We need the station keycard.', vi: 'Phòng điều khiển bị khoá. Chúng ta cần thẻ từ của trạm.', say: true },
    { s: 'pip', en: 'Night shift! Night shift! Who had the card?', vi: 'Ca đêm! Ca đêm! Ai giữ thẻ?' },
    { s: 'narr', vi: 'Một người ở văn phòng (lịch trực, email), một người ở phòng tủ đồ (bảng tên, nhật ký cửa).' },
  ],
  c2_keycard_done: [
    { s: 'narr', vi: 'Trong tủ có thẻ từ, và một xấp giấy cũ bị gió thổi tung ra: danh sách nhân viên của trạm từ nhiều năm trước.' },
    { s: 'p2', en: "Look at this old crew list. 'E. Marlow — Signals Officer.'", vi: "Nhìn danh sách nhân viên cũ này. 'E. Marlow — Sĩ quan tín hiệu.'", say: true },
    { s: 'p1', en: 'Eleanor? She worked here?', vi: 'Eleanor? Bà ấy từng làm ở đây sao?', say: true },
    { s: 'captain', en: 'My grandmother... on Halcyon? Nobody in my family ever knew.', vi: 'Bà tôi... ở Halcyon ư? Cả nhà tôi chưa ai từng biết chuyện này.' },
    { s: 'pip', en: 'Signals! Signals! Up, up, up!', vi: 'Tín hiệu! Tín hiệu! Lên, lên, lên!' },
  ],
  c2_antenna_intro: [
    { s: 'p1', en: 'The antenna is out of line. And the panel is made of glass.', vi: 'Ăng-ten bị lệch rồi. Mà bảng điều khiển lại làm bằng kính.', say: true },
    { s: 'p2', en: "So your left is my right. We'll have to be careful.", vi: 'Vậy bên trái của bạn là bên phải của mình. Phải cẩn thận đấy.', say: true },
    { s: 'narr', vi: 'Hai bạn đứng hai phía tấm kính. Một người cầm bản đồ sao, một người bật công tắc. Xong đĩa thứ nhất thì đổi phía.' },
  ],
  c2_antenna_done: [
    { s: 'narr', vi: 'Hai đĩa ăng-ten quay về đúng hướng. Loa trong trạm rè lên, rồi một giọng nói vang ra từ băng ghi âm cũ.' },
    { s: 'keeper', en: 'This is Eleanor Marlow, Halcyon Station. If anyone can hear this... I am not lost.', vi: 'Đây là Eleanor Marlow, trạm Halcyon. Nếu có ai nghe được... tôi không hề mất tích.' },
    { s: 'keeper', en: 'Repair the transmitter. Then you will know where I am.', vi: 'Hãy sửa máy phát. Khi đó các bạn sẽ biết tôi ở đâu.' },
    { s: 'captain', en: "That's her voice. That's really her voice.", vi: 'Đó là giọng bà ấy. Đúng là giọng bà ấy.' },
    { s: 'pip', en: 'Eleanor says: hurry!', vi: 'Eleanor nói: nhanh lên!', voice: 'keeper' },
  ],
};

// The station map. Rooms open up as the story goes on.
export const ROOMS = {
  bridge: { name: 'Aurora — Bridge', vi: 'Buồng lái tàu Aurora', x: 6, y: 50, notes: [
    { title: 'Captain\'s log', en: 'Day 3. The green light flashes every night at the same time. Three long, three short. It does not move.', vi: 'Ngày 3. Đèn xanh nhấp nháy mỗi đêm vào cùng một giờ. Ba dài, ba ngắn. Nó không hề di chuyển.' },
  ] },
  dock: { name: 'Landing dock', vi: 'Cầu cập tàu', x: 26, y: 78, notes: [
    { title: 'Safety notice', en: 'All visitors must sign in at the front desk. Life jackets must be worn on the platform at all times.', vi: 'Mọi khách phải ký tên ở quầy lễ tân. Luôn phải mặc áo phao khi ở trên sàn trạm.' },
    { title: 'Visitor book', en: 'The last name in the book is written in green ink. The date is only three days ago. The name has been crossed out.', vi: 'Cái tên cuối cùng trong sổ được viết bằng mực xanh lá. Ngày ghi chỉ mới ba hôm trước. Cái tên đã bị gạch đi.' },
  ] },
  hub: { name: 'Central hub', vi: 'Sảnh trung tâm', x: 46, y: 60, notes: [
    { title: 'Notice board', en: 'The east and west wings are connected only through the service corridor. In case of flooding, use the hatch controls in each wing.', vi: 'Cánh Đông và cánh Tây chỉ nối với nhau qua hành lang kỹ thuật. Khi ngập nước, dùng bảng điều khiển cửa khoang ở mỗi cánh.' },
    { title: 'Coffee mug', en: "WORLD'S OKAYEST SCIENTIST. It is still warm.", vi: 'NHÀ KHOA HỌC TẠM ỔN NHẤT THẾ GIỚI. Cái cốc vẫn còn ấm.' },
  ] },
  west: { name: 'West wing', vi: 'Cánh Tây', x: 22, y: 40, notes: [
    { title: 'Pump room log', en: 'Pump 3 is out of order. Do not use it until further notice. — Maintenance', vi: 'Máy bơm số 3 bị hỏng. Không sử dụng cho đến khi có thông báo mới. — Bảo trì' },
  ] },
  east: { name: 'East wing', vi: 'Cánh Đông', x: 70, y: 40, notes: [
    { title: 'Lab sign', en: 'Authorised staff only. Please wash your hands before leaving the laboratory.', vi: 'Chỉ nhân viên được phép. Vui lòng rửa tay trước khi rời phòng thí nghiệm.' },
  ] },
  office: { name: 'Office', vi: 'Văn phòng', x: 30, y: 18, notes: [
    { title: 'Station history', en: 'Halcyon Station opened in 1968 to study ocean currents. It closed in 1984, after a storm damaged the main antenna.', vi: 'Trạm Halcyon mở năm 1968 để nghiên cứu dòng hải lưu. Trạm đóng cửa năm 1984, sau khi một cơn bão làm hỏng ăng-ten chính.' },
  ] },
  lockers: { name: 'Locker room', vi: 'Phòng tủ đồ', x: 62, y: 18, notes: [
    { title: 'Lost property box', en: "A red scarf, a pair of reading glasses, and a postcard. On the postcard: 'Greetings from Beacon Isle'.", vi: "Một chiếc khăn đỏ, một cặp kính đọc sách, và một tấm bưu thiếp. Trên bưu thiếp: 'Lời chào từ đảo Beacon'." },
  ] },
  dome: { name: 'Antenna dome', vi: 'Mái vòm ăng-ten', x: 46, y: 4, notes: [
    { title: 'Warning', en: 'Do not look directly at the alignment lights for more than a few seconds.', vi: 'Không nhìn thẳng vào đèn căn chỉnh quá vài giây.' },
  ] },
  transmitter: { name: 'Transmitter room', vi: 'Phòng máy phát', x: 80, y: 8, locked: 'Đợt 3 — sắp có', notes: [] },
};

export const LINKS = [['dock', 'hub'], ['hub', 'west'], ['hub', 'east'], ['hub', 'office'], ['hub', 'lockers'], ['office', 'dome'], ['lockers', 'dome'], ['dome', 'transmitter']];

// The order of the chapter: each step is a puzzle in a room.
export const STEPS = [
  { id: 'coords', room: 'bridge', title: 'Position in the static', vi: 'Toạ độ trong tiếng nhiễu', intro: null, done: 'c2_arrive', open: ['bridge'] },
  { id: 'flood', room: 'hub', title: 'Two flooded wings', vi: 'Hai cánh trạm ngập nước', intro: 'c2_flood_intro', done: 'c2_flood_done', open: ['dock', 'hub'] },
  { id: 'keycard', room: 'office', title: 'Who has the keycard?', vi: 'Ai giữ thẻ từ?', intro: 'c2_keycard_intro', done: 'c2_keycard_done', open: ['dock', 'hub', 'west', 'east', 'office', 'lockers'] },
  { id: 'antenna', room: 'dome', title: 'Aligning the antenna', vi: 'Căn chỉnh ăng-ten', intro: 'c2_antenna_intro', done: 'c2_antenna_done', open: ['dock', 'hub', 'west', 'east', 'office', 'lockers', 'dome'] },
  { id: 'end', room: 'dome', title: 'To be continued', vi: 'Còn tiếp', open: ['dock', 'hub', 'west', 'east', 'office', 'lockers', 'dome', 'transmitter'] },
];

// Where each side of a puzzle stands while it runs.
export const ROLE_ROOM = {
  coords: { nav: 'bridge', radio: 'bridge' },
  flood: { west: 'west', east: 'east' },
  keycard: { office: 'office', lockers: 'lockers' },
  antenna: { north: 'dome', south: 'dome' },
};

export const ROLE_INFO = {
  nav: { icon: '🧭', vi: 'Bàn hải đồ', desc: 'Có hải đồ các ô lưới. Nghe được một phần bản tin. Là người nhập toạ độ.' },
  radio: { icon: '📻', vi: 'Bàn radio', desc: 'Nghe được phần bản tin mà người kia không nghe rõ, kể cả tên ô lưới.' },
  west: { icon: '⬅', vi: 'Cánh Tây', desc: 'Thấy mực nước và cửa khoang cánh Tây. Van của bạn đổ nước sang cánh Đông.' },
  east: { icon: '➡', vi: 'Cánh Đông', desc: 'Thấy mực nước và cửa khoang cánh Đông. Van của bạn đổ nước sang cánh Tây.' },
  office: { icon: '🗂', vi: 'Văn phòng', desc: 'Có lịch trực ca đêm và hộp thư email của nhân viên.' },
  lockers: { icon: '🔐', vi: 'Phòng tủ đồ', desc: 'Thấy 8 tủ đồ, bảng tên và nhật ký cửa. Là người mở tủ.' },
  north: { icon: '⬆', vi: 'Phía Bắc tấm kính', desc: 'Đĩa 1: cầm bản đồ sao, chỉ cho người kia. Đĩa 2: bật công tắc.' },
  south: { icon: '⬇', vi: 'Phía Nam tấm kính', desc: 'Đĩa 1: bật công tắc. Đĩa 2: cầm bản đồ sao, chỉ cho người kia.' },
};
