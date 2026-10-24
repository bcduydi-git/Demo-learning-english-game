// Chapter 2 — "The Green Light": dialogue, rooms and the notes players can
// read. Same line format as chapter 1 (see content.js).

export const TITLE = { vi: 'CHƯƠNG 2 · NGỌN ĐÈN XANH', en: 'The Green Light', map: 'Bản đồ trạm' };

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
    { s: 'narr', vi: 'Cửa phòng máy phát đã mở khoá. Hãy tới đó.' },
  ],
  c2_machine_intro: [
    { s: 'p2', en: "The transmitter is in here. It's covered in warning lights.", vi: 'Máy phát ở đây rồi. Đèn cảnh báo sáng khắp nơi.', say: true },
    { s: 'p1', en: "There's a manual on the desk. One of us reads, and the other one works.", vi: 'Có một cuốn sổ tay trên bàn. Một người đọc, người kia làm.', say: true },
    { s: 'narr', vi: 'Người đứng máy thấy máy nhưng không có sổ tay. Người cầm sổ tay không thấy máy. Có đồng hồ đếm ngược; làm sai bị trừ giờ.' },
  ],
  c2_machine_done: [
    { s: 'narr', vi: 'Máy phát rung lên. Trên màn hình hiện ra những dòng chữ xanh: một lời nhắn chưa phát xong.' },
    { s: 'keeper', en: 'If you are hearing this, the transmitter works again. Send my last signal, and I will answer.', vi: 'Nếu các bạn nghe được điều này, máy phát đã chạy lại. Hãy gửi tín hiệu cuối cùng của tôi, và tôi sẽ trả lời.' },
    { s: 'captain', en: "A storm is coming in fast. You'll have to send it now, before it hits the station!", vi: 'Một cơn bão đang ập tới rất nhanh. Các bạn phải gửi ngay, trước khi nó đánh vào trạm!' },
    { s: 'pip', en: 'Hurry! Hurry!', vi: 'Nhanh lên! Nhanh lên!' },
  ],
  c2_finale_intro: [
    { s: 'narr', vi: 'Bão kéo tới. Điện chập chờn. Cả máy chính và máy dự phòng đều phải chạy thì tín hiệu mới đi được.' },
    { s: 'p1', en: "You take the backup unit. I'll take the main one.", vi: 'Bạn lo máy dự phòng. Mình lo máy chính.', say: true },
    { s: 'p2', en: "And we read each other's manuals. Keep talking to me!", vi: 'Và mình đọc sổ tay cho nhau. Cứ nói chuyện với mình nhé!', say: true },
    { s: 'narr', vi: 'Mỗi người làm một máy và cầm sổ tay của máy bên kia. Lượt 1: máy chính. Lượt 2: đổi, máy dự phòng. Lượt 3: cả hai cùng lúc. Cuối cùng: cùng bấm SEND.' },
  ],
  c2_ending: [
    { s: 'narr', vi: 'Tín hiệu vút lên bầu trời giông bão. Ngoài khơi, đốm sáng xanh nháy đáp lại. Rồi radio lên tiếng: lần này không phải băng ghi âm.' },
    { s: 'keeper', en: 'I hear you. I hear you both. Thank you.', vi: 'Tôi nghe thấy rồi. Tôi nghe thấy cả hai bạn. Cảm ơn.' },
    { s: 'captain', en: 'Grandmother? Is that really you?', vi: 'Bà ơi? Có thật là bà không?' },
    { s: 'keeper', en: "Hello, my dear. I'm sorry I made you wait so long. I'm at the Sunken Light, to the north. Come before the tide turns.", vi: 'Chào cháu yêu. Bà xin lỗi vì đã để cháu chờ lâu như vậy. Bà đang ở Ngọn Hải Đăng Chìm, phía bắc. Hãy tới trước khi thuỷ triều đổi chiều.' },
    { s: 'p1', en: "We're coming. Hold on!", vi: 'Chúng cháu đang tới. Cố lên bà nhé!', say: true },
    { s: 'p2', en: 'Help is coming.', vi: 'Sắp có người tới cứu rồi.', say: true },
    { s: 'pip', en: 'Eleanor! Home! Home!', vi: 'Eleanor! Về nhà! Về nhà!' },
    { s: 'narr', vi: 'Còn tiếp: Chương 3 — Ngọn Hải Đăng Chìm.' },
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
  transmitter: { name: 'Transmitter room', vi: 'Phòng máy phát', x: 78, y: 4, notes: [
    { title: 'Last log entry', en: 'Transmitter repaired, mostly. If it fails again, read the manual out loud to someone. It is much faster with two people. — E.M.', vi: 'Máy phát đã sửa, gần xong. Nếu nó hỏng lần nữa, hãy đọc to sổ tay cho một người khác nghe. Hai người làm nhanh hơn nhiều. — E.M.' },
  ] },
};

export const LINKS = [['dock', 'hub'], ['hub', 'west'], ['hub', 'east'], ['hub', 'office'], ['hub', 'lockers'], ['office', 'dome'], ['lockers', 'dome'], ['dome', 'transmitter']];

// The order of the chapter: each step is a puzzle in a room.
export const STEPS = [
  { id: 'coords', room: 'bridge', title: 'Position in the static', vi: 'Toạ độ trong tiếng nhiễu', intro: null, done: 'c2_arrive', open: ['bridge'] },
  { id: 'flood', room: 'hub', title: 'Two flooded wings', vi: 'Hai cánh trạm ngập nước', intro: 'c2_flood_intro', done: 'c2_flood_done', open: ['dock', 'hub'], spawn: 'dock' },
  { id: 'keycard', room: 'office', title: 'Who has the keycard?', vi: 'Ai giữ thẻ từ?', intro: 'c2_keycard_intro', done: 'c2_keycard_done', open: ['dock', 'hub', 'west', 'east', 'office', 'lockers'] },
  { id: 'antenna', room: 'dome', title: 'Aligning the antenna', vi: 'Căn chỉnh ăng-ten', intro: 'c2_antenna_intro', done: 'c2_antenna_done', open: ['dock', 'hub', 'west', 'east', 'office', 'lockers', 'dome'] },
  { id: 'machine', room: 'transmitter', title: 'The signal transmitter', vi: 'Máy phát tín hiệu', intro: 'c2_machine_intro', done: 'c2_machine_done', open: ['dock', 'hub', 'west', 'east', 'office', 'lockers', 'dome', 'transmitter'] },
  { id: 'finale', room: 'transmitter', title: 'The last signal', vi: 'Tín hiệu cuối cùng', intro: 'c2_finale_intro', done: 'c2_ending', open: ['dock', 'hub', 'west', 'east', 'office', 'lockers', 'dome', 'transmitter'] },
  { id: 'end', room: 'transmitter', title: 'The end of chapter 2', vi: 'Hết chương 2', open: ['dock', 'hub', 'west', 'east', 'office', 'lockers', 'dome', 'transmitter'] },
];

// Where each side of a puzzle stands while it runs.
export const ROLE_ROOM = {
  coords: { nav: 'bridge', radio: 'bridge' },
  flood: { west: 'west', east: 'east' },
  keycard: { office: 'office', lockers: 'lockers' },
  antenna: { north: 'dome', south: 'dome' },
  machine: { tech: 'transmitter', reader: 'transmitter' },
  finale: { a: 'transmitter', b: 'transmitter' },
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
  tech: { icon: '🔧', vi: 'Đứng máy', desc: 'Thấy cỗ máy và thao tác, nhưng không có sổ tay. Tả thật rõ những gì bạn thấy.' },
  reader: { icon: '📘', vi: 'Cầm sổ tay', desc: 'Có sổ tay tiếng Anh, nhưng không thấy máy. Hỏi, đọc luật, rồi bảo người kia làm gì.' },
  a: { icon: '🅰', vi: 'Máy chính', desc: 'Làm máy chính (dây cáp, rồi khoá giọng nói). Cầm sổ tay của máy dự phòng (van, bàn phím).' },
  b: { icon: '🅱', vi: 'Máy dự phòng', desc: 'Làm máy dự phòng (van, rồi bàn phím). Cầm sổ tay của máy chính (dây cáp, gợi ý khoá giọng nói).' },
};

// Words worth keeping from chapter 2, by puzzle (shown in the chapter's word book)
export const WORDS = {
  coords: [['latitude', 'vĩ độ'], ['longitude', 'kinh độ'], ['grid square', 'ô lưới'], ['correction', 'lời đính chính'], ['vessel', 'tàu thuyền'], ['approach', 'tiến lại gần']],
  flood: [['valve', 'van'], ['hatch', 'cửa khoang'], ['water level', 'mực nước'], ['twice', 'hai lần'], ['overflow', 'tràn'], ['at the same time', 'cùng một lúc']],
  keycard: [['shift', 'ca làm việc'], ['swap', 'đổi cho nhau'], ['cover (a shift)', 'làm thay (ca)'], ['on duty', 'đang trực'], ['reminder', 'lời nhắc'], ['after all', 'rốt cuộc thì (không như dự định)'], ["I'm afraid...", 'e rằng... (từ chối lịch sự)'], ['name tag', 'bảng tên']],
  antenna: [['align', 'căn cho thẳng hàng'], ['opposite', 'đối diện'], ['from my side', 'từ phía tôi'], ['top row', 'hàng trên cùng'], ['column', 'cột'], ['mirror image', 'ảnh trong gương (ngược trái phải)']],
  machine: [['unless', 'trừ khi'], ['otherwise', 'nếu không thì'], ['exception', 'ngoại lệ'], ['instead of', 'thay vì'], ['pressure', 'áp suất'], ['spell', 'đánh vần']],
  finale: [['main unit', 'máy chính'], ['backup', 'dự phòng'], ['send', 'gửi'], ['signal', 'tín hiệu'], ['storm', 'cơn bão'], ['tide', 'thuỷ triều']],
};
