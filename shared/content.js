// All story text, objectives, puzzle content. Shared by server and client.
// {p1} and {p2} are replaced with the players' names on screen.
//
// Dialogue line fields:
//   s       speaker: 'narr' | 'p1' | 'p2' | 'pip' | 'keeper' | 'storm' | 'captain'
//   en      English line (spoken by the voice engine)
//   vi      Vietnamese meaning (shown according to each player's hint setting)
//   say     true = this is the player's own line: they are invited to say it
//           out loud to their partner (no scoring, honour system)
//   phrase  phrase ids that this line introduces (marked "seen")

export const SCENES = {
  intro: [
    { s: 'narr', vi: 'Đêm qua, một cơn bão lớn đánh vỡ thuyền của hai bạn. Sóng đẩy cả hai dạt vào một hòn đảo lạ...' },
    { s: 'p2', en: 'Are you okay?', vi: 'Bạn ổn chứ?', say: true, phrase: ['are_you_ok'] },
    { s: 'p1', en: "I'm okay. Where are we?", vi: 'Mình ổn. Chúng ta đang ở đâu?', say: true, phrase: ['im_ok', 'where_are_we'] },
    { s: 'p2', en: "I don't know. Our boat is broken.", vi: 'Mình không biết. Thuyền mình hỏng rồi.', say: true },
    { s: 'p1', en: 'Look! There is a lighthouse on the hill.', vi: 'Nhìn kìa! Có một ngọn hải đăng trên đồi.', say: true },
    { s: 'p2', en: 'Maybe we can use it to call for help.', vi: 'Có lẽ mình dùng nó để gọi cứu hộ được.', say: true },
    { s: 'narr', vi: 'Dòng có biểu tượng 🗣 là lời của bạn: hãy đọc to cho người kia nghe qua cuộc gọi. Không có chấm điểm — cứ thử nói tự nhiên.' },
    { s: 'narr', vi: 'Di chuyển: WASD hoặc phím mũi tên. Tương tác: E hoặc Space. Hãy cùng khám phá bãi biển.' },
  ],

  pip_meet: [
    { s: 'pip', en: 'Squawk! Hello! Hello!', vi: 'Quác! Xin chào! Xin chào!' },
    { s: 'p1', en: 'A parrot? Hi there!', vi: 'Một con vẹt? Chào bạn!', say: true },
    { s: 'pip', en: "I'm Pip! Pip! Are you okay?", vi: 'Tớ là Pip! Pip! Các cậu ổn chứ?', phrase: ['are_you_ok'] },
    { s: 'p2', en: "We're okay. Can you help us?", vi: 'Bọn mình ổn. Bạn giúp bọn mình được không?', say: true, phrase: ['can_you_help'] },
    { s: 'pip', en: 'The keeper is gone. The light is off. Fix the light! Fix the light!', vi: 'Người gác đèn đi mất rồi. Đèn tắt rồi. Sửa đèn đi! Sửa đèn đi!' },
    { s: 'pip', en: 'Pip loves the radio. Can you hear me? Say: Yes, I can hear you!', vi: 'Pip thích radio lắm. Các cậu nghe thấy tớ không? Nói: Vâng, tôi nghe thấy bạn!', phrase: ['i_can_hear_you'] },
    { s: 'narr', vi: 'Nhấn R (hoặc nút 📻) để mở Radio. Mỗi người hãy gửi một câu cho người kia — câu đó sẽ hiện trên màn hình và được đọc thành tiếng ở máy bạn kia.' },
  ],

  radio_done: [
    { s: 'pip', en: 'Good! Good! Now: the lighthouse! Go up! Go up!', vi: 'Giỏi! Giỏi! Giờ thì: ngọn hải đăng! Đi lên! Đi lên!', phrase: ['go_up'] },
  ],

  log_done: [
    { s: 'p1', en: 'Yes! It moved!', vi: 'Được rồi! Nó chuyển rồi!', say: true },
    { s: 'p2', en: "Let's go!", vi: 'Đi thôi!', say: true, phrase: ['lets_go'] },
  ],

  journal: [
    { s: 'keeper', en: 'Day twelve. The storm is coming again.', vi: 'Ngày thứ mười hai. Cơn bão lại sắp đến.' },
    { s: 'keeper', en: 'If the light goes out, it needs three things.', vi: 'Nếu đèn tắt, nó cần ba thứ.' },
    { s: 'keeper', en: 'The crystal lens. Power from the generator. And the keeper\'s words for the door.', vi: 'Thấu kính pha lê. Điện từ máy phát. Và lời của người gác đèn để mở cửa.' },
    { s: 'keeper', en: 'I hid the lens in the Fog Woods. Only a high place can show the way.', vi: 'Tôi giấu thấu kính trong Rừng Sương. Chỉ có chỗ cao mới nhìn ra đường.' },
    { s: 'keeper', en: 'The generator needs my radio message. Only a radio person can hear it.', vi: 'Máy phát cần lời nhắn radio của tôi. Chỉ người biết dùng radio mới nghe được.' },
    { s: 'narr', vi: 'Mục tiêu mới: tìm Thấu kính trong Rừng Sương (phía tây) và khôi phục Điện ở nhà máy phát (phía đông). Làm theo thứ tự nào cũng được.' },
  ],

  fog_intro: [
    { s: 'narr', vi: 'Rừng Sương: người đi trong rừng chỉ nhìn thấy quanh mình. Bẫy gai nằm giấu dưới cỏ.' },
    { s: 'narr', vi: '{p1} đứng trên tháp canh, dùng ống nhòm nhìn thấy cả mê cung và bẫy. Hãy chỉ đường bằng tiếng Anh: "Go up", "Go left", "Stop!", "A little more"...' },
    { s: 'pip', en: 'Watch out! Watch out! Thorns! Squawk!', vi: 'Coi chừng! Coi chừng! Gai! Quác!', phrase: ['watch_out'] },
  ],

  lens_found: [
    { s: 'p2', en: 'I found it!', vi: 'Mình tìm thấy rồi!', say: true, phrase: ['i_found_it'] },
    { s: 'p1', en: 'Great! Come back here.', vi: 'Tuyệt! Quay về đây đi.', say: true, phrase: ['come_here'] },
    { s: 'pip', en: 'Shiny! Shiny! The lens!', vi: 'Lấp lánh! Lấp lánh! Thấu kính!' },
  ],

  power_on: [
    { s: 'narr', vi: 'Máy phát rung lên rồi chạy đều. Đèn trong căn nhà gỗ bật sáng.' },
    { s: 'p1', en: 'It works! The generator is on!', vi: 'Được rồi! Máy phát chạy rồi!', say: true },
    { s: 'p2', en: 'Got it! Thank you!', vi: 'Hiểu rồi! Cảm ơn nhé!', say: true, phrase: ['got_it'] },
    { s: 'pip', en: 'Power! Power! The door wakes up! Squawk!', vi: 'Có điện! Có điện! Cánh cửa thức dậy rồi! Quác!' },
  ],

  door_open: [
    { s: 'narr', vi: 'Khóa cửa sáng lên màu xanh. Cánh cửa sắt nặng nề mở ra.' },
    { s: 'p1', en: 'Hold on, help is coming.', vi: 'Cố lên, sắp có người tới cứu.', say: true, phrase: ['hold_on', 'help_is_coming'] },
    { s: 'p2', en: "That's what the keeper said. Let's go up!", vi: 'Đó là lời người gác đèn. Lên thôi!', say: true },
  ],

  boss_intro: [
    { s: 'narr', vi: 'Hai bạn leo lên phòng đèn và gắn thấu kính vào. Đèn vừa lóe lên thì gió rít, mây đen cuộn lại...' },
    { s: 'storm', en: 'Who lights my sea? I will take your words away!', vi: 'Kẻ nào thắp sáng biển của ta? Ta sẽ cướp hết lời của các ngươi!' },
    { s: 'pip', en: 'Words are light! Type the words! Hold on!', vi: 'Lời nói là ánh sáng! Gõ chữ đi! Cố lên!', phrase: ['hold_on'] },
  ],

  boss_won: [
    { s: 'narr', vi: 'Tia sáng cuối cùng xuyên thủng mắt bão. Mây tan, sao hiện ra. Ngọn hải đăng quét ánh sáng khắp mặt biển.' },
    { s: 'p2', en: 'We did it!', vi: 'Chúng ta làm được rồi!', say: true, phrase: ['we_did_it'] },
    { s: 'p1', en: 'Look! The light is on!', vi: 'Nhìn kìa! Đèn sáng rồi!', say: true },
    { s: 'narr', vi: 'Radio trên bàn bỗng rè rè...' },
  ],

  boat_intro: [
    { s: 'captain', en: 'There are rocks in the bay. We cannot see them in the dark.', vi: 'Trong vịnh có đá ngầm. Chúng tôi không nhìn thấy trong bóng tối.' },
    { s: 'captain', en: 'Please guide us! Tell us: left, right, stop, keep going.', vi: 'Hãy dẫn đường cho chúng tôi! Bảo chúng tôi: trái, phải, dừng, cứ đi tiếp.' },
    { s: 'narr', vi: 'Một người xoay đèn (chuột hoặc ← →) để soi đá ngầm. Người kia gõ (hoặc nói) lệnh tiếng Anh cho thuyền. Nửa đường hai bạn sẽ đổi vai.' },
  ],

  ending: [
    { s: 'narr', vi: 'Con tàu Aurora cập bến an toàn. Thuyền trưởng bước xuống cầu tàu.' },
    { s: 'captain', en: "You did great. I'm Captain Marlow, of the ship Aurora.", vi: 'Hai bạn giỏi lắm. Tôi là Thuyền trưởng Marlow, tàu Aurora.' },
    { s: 'p2', en: 'Marlow? Like Eleanor Marlow, the keeper?', vi: 'Marlow? Giống Eleanor Marlow, người gác đèn sao?', say: true },
    { s: 'captain', en: 'Eleanor was my grandmother. She left this island fifty years ago. Nobody ever found her.', vi: 'Eleanor là bà tôi. Bà rời hòn đảo này năm mươi năm trước. Không ai tìm thấy bà nữa.' },
    { s: 'pip', en: 'Eleanor! Eleanor!', vi: 'Eleanor! Eleanor!' },
    { s: 'captain', en: 'Is that her parrot? After all these years?', vi: 'Đó là con vẹt của bà sao? Sau ngần ấy năm?' },
    { s: 'narr', vi: 'Tàu rời đảo. Phía xa, giữa biển đêm — nơi bản đồ không có hòn đảo nào — một đốm sáng xanh lục nhấp nháy: ba dài, ba ngắn.' },
    { s: 'pip', en: 'Eleanor says: come and find me.', vi: 'Eleanor nói: hãy đến tìm bà.', voice: 'keeper' },
  ],
};

// Hints given by Pip (H key), chosen by current progress.
export const HINTS = {
  beach: { en: 'Look around! The boat, the box, the sand. Call your friend: Come here!', vi: 'Nhìn quanh đi! Con thuyền, cái thùng, bãi cát. Gọi bạn: Come here!' },
  radio: { en: 'Press R. Send a message. Can you hear me?', vi: 'Nhấn R. Gửi một câu. Nghe thấy tớ không?' },
  log: { en: 'The log is heavy. Lift it together! Ready? One, two, three!', vi: 'Khúc gỗ nặng lắm. Cùng nhấc! Sẵn sàng chưa? Một, hai, ba!' },
  cottage: { en: "Find the keeper's house. Read the book!", vi: 'Tìm nhà người gác đèn. Đọc cuốn sổ!' },
  lens: { en: 'Fog Woods! One climbs the tower. One walks. Talk, talk!', vi: 'Rừng Sương! Một người leo tháp. Một người đi. Nói chuyện với nhau!' },
  power: { en: 'Radio in the house. Generator in the east. Say that again, please!', vi: 'Radio trong nhà. Máy phát ở phía đông. Nói lại lần nữa nhé!' },
  door: { en: 'The door needs words. One reads. One listens.', vi: 'Cánh cửa cần lời. Một người đọc. Một người nghe.' },
  enter: { en: 'Go in together! Wait for me!', vi: 'Cùng vào nhé! Đợi mình với!' },
};

export const DOOR_HALVES = {
  p1: { en: 'HOLD ON,', vi: 'Dòng chữ phát sáng dưới đèn lồng: "HOLD ON," — phần còn lại đã mờ mất.' },
  p2: { en: '...help is coming.', vi: 'Radio bắt được tiếng thì thầm ở cửa: "...help is coming."' },
  answer: 'hold on help is coming',
};

// ---- Generator puzzle --------------------------------------------------
// Randomised once per room so the message must really be listened to.

const NUM_WORDS = { 1: 'one time', 2: 'two times', 3: 'three times' };
const NUM_VI = { 1: 'một lần', 2: 'hai lần', 3: 'ba lần' };
const COLOR_VI = { blue: 'xanh dương', green: 'xanh lá', yellow: 'vàng', red: 'đỏ' };
const DIR_VI = { left: 'trái', right: 'phải', up: 'lên', down: 'xuống' };

export function makeGenerator(rand = Math.random) {
  const pick = (arr) => arr[Math.floor(rand() * arr.length)];
  return {
    wheel: pick(['left', 'right']),
    color: pick(['blue', 'green', 'yellow']),
    times: pick([2, 3]),
    lever: pick(['up', 'down']),
  };
}

// The sequence of panel inputs the server expects.
export function generatorSequence(g) {
  const seq = [{ k: 'wheel', v: g.wheel }];
  for (let i = 0; i < g.times; i++) seq.push({ k: 'button', v: g.color });
  seq.push({ k: 'lever', v: g.lever });
  return seq;
}

// The keeper's recorded radio message, sentence by sentence.
export function generatorMessage(g) {
  return [
    { en: 'Hello. This is Eleanor, the lighthouse keeper.', vi: 'Xin chào. Tôi là Eleanor, người gác đèn.' },
    { en: 'If you can hear this, the power is out.', vi: 'Nếu bạn nghe được lời này, nghĩa là mất điện rồi.' },
    { en: 'Go to the generator.', vi: 'Hãy đến chỗ máy phát điện.' },
    { en: `First, turn the wheel to the ${g.wheel}.`, vi: `Đầu tiên, xoay bánh xe sang ${DIR_VI[g.wheel]}.`, phrase: ['turn_the_wheel', 'first_then'] },
    { en: `Then press the ${g.color} button ${NUM_WORDS[g.times]}.`, vi: `Sau đó bấm nút màu ${COLOR_VI[g.color]} ${NUM_VI[g.times]}.`, phrase: ['press_the_button', 'two_times'] },
    { en: "Don't touch the red one!", vi: 'Đừng chạm vào nút màu đỏ!', phrase: ['dont_touch'] },
    { en: `Finally, pull the lever ${g.lever}.`, vi: `Cuối cùng, kéo cần gạt ${DIR_VI[g.lever]}.`, phrase: ['pull_the_lever'] },
    { en: 'Good luck.', vi: 'Chúc may mắn.' },
  ];
}

// ---- Boss: The Storm ---------------------------------------------------
// Words come from what the players met before the fight.

export const BOSS = {
  maxHp: 100,
  lampHearts: 5,
  phases: [
    {
      id: 'words', title: 'Wave 1 — Words', vi: 'Đợt 1 — Từ đơn',
      until: 70, // boss hp at which the next phase starts
      items: ['left', 'right', 'stop', 'help', 'wait', 'wheel', 'lever', 'button', 'green', 'blue', 'okay', 'lens', 'light', 'radio', 'come'],
    },
    {
      id: 'phrases', title: 'Wave 2 — Phrases', vi: 'Đợt 2 — Cụm từ',
      until: 35,
      items: ['go left', 'go up', 'go back', 'watch out', "let's go", 'come here', 'got it', "i'm okay", 'which one', 'a little more', 'hold on', 'i found it', 'two times'],
    },
    {
      id: 'recall', title: 'Wave 3 — Remember!', vi: 'Đợt 3 — Tự nhớ: thấy nghĩa tiếng Việt, gõ tiếng Anh',
      until: 12,
      // Only the meaning is shown; the player recalls the English.
      items: [
        { en: 'stop', vi: 'Dừng lại!' },
        { en: 'watch out', vi: 'Coi chừng!' },
        { en: 'go left', vi: 'Sang trái.' },
        { en: 'go right', vi: 'Sang phải.' },
        { en: 'come here', vi: 'Lại đây!' },
        { en: 'got it', vi: 'Hiểu rồi!' },
        { en: "let's go", vi: 'Đi thôi!' },
        { en: 'go back', vi: 'Quay lại.' },
        { en: 'hold on', vi: 'Cố lên!' },
        { en: 'are you okay', vi: 'Bạn ổn chứ?' },
        { en: 'i found it', vi: 'Mình tìm thấy rồi!' },
        { en: 'which one', vi: 'Cái nào?' },
      ],
    },
  ],
  // Final strike: each player types their half of the keeper's words.
  final: { p1: 'hold on', p2: 'help is coming', seconds: 25 },
};

// Seconds a cloud takes to fall, by each player's own difficulty choice.
export const BOSS_SPEED = {
  relaxed: { base: 9, perChar: 0.55, gap: 3.4, label: 'Thư thả' },
  normal: { base: 6.5, perChar: 0.4, gap: 2.6, label: 'Vừa' },
  hard: { base: 4.5, perChar: 0.28, gap: 1.9, label: 'Thử thách' },
};

// ---- Finale: radio call with the rescue ship ---------------------------
// Answers are checked only for the key information (not grammar).

export const CALL = [
  {
    to: 'p1',
    q: { en: 'This is the ship Aurora. We can see your light! Can you hear me?', vi: 'Đây là tàu Aurora. Chúng tôi thấy đèn của các bạn! Các bạn có nghe tôi không?' },
    keys: [['yes', 'hear', 'yeah', 'can']],
    model: 'Yes, I can hear you.',
    phrase: 'i_can_hear_you',
    understood: 'Captain: Great, I can hear you too.',
  },
  {
    to: 'p2',
    q: { en: 'Are you okay? Is anyone hurt?', vi: 'Các bạn ổn chứ? Có ai bị thương không?' },
    keys: [['okay', 'ok', 'fine', 'good', 'alright', 'no']],
    model: "We're okay.",
    phrase: 'were_okay',
    understood: "Captain: Good. You're okay.",
  },
  {
    to: 'p1',
    q: { en: 'How many people are with you?', vi: 'Có bao nhiêu người ở đó?' },
    keys: [['two', '2']],
    model: 'There are two of us.',
    phrase: 'two_of_us',
    understood: 'Captain: Two people. Got it.',
  },
  {
    to: 'p2',
    q: { en: 'Where are you exactly?', vi: 'Chính xác các bạn đang ở đâu?' },
    keys: [['lighthouse', 'light house', 'tower']],
    model: "We're at the lighthouse.",
    phrase: 'at_the_lighthouse',
    understood: 'Captain: At the lighthouse. We are coming!',
  },
];

// Commands the rescue boat understands (typed or spoken).
export const BOAT_COMMANDS = [
  { cmd: 'left', words: ['go left', 'turn left', 'left', 'to the left', 'a little left'], reply: 'Left, aye!' },
  { cmd: 'right', words: ['go right', 'turn right', 'right', 'to the right', 'a little right'], reply: 'Right, aye!' },
  { cmd: 'stop', words: ['stop', 'wait', 'hold on', 'stop the boat'], reply: 'Stopping!' },
  { cmd: 'go', words: ['keep going', 'go', 'go up', 'go straight', 'go on', 'go ahead', 'lets go', 'move', 'forward', 'go forward'], reply: 'Full ahead!' },
  { cmd: 'back', words: ['go back', 'back', 'go down', 'back up'], reply: 'Going back!' },
];

export function parseBoatCommand(normalizedText) {
  const t = normalizedText;
  if (!t) return null;
  // Longest phrase first so "go left" beats "go".
  const all = [];
  for (const c of BOAT_COMMANDS) for (const w of c.words) all.push({ w, c });
  all.sort((a, b) => b.w.length - a.w.length);
  for (const { w, c } of all) {
    if (t === w || t.startsWith(w + ' ') || t.endsWith(' ' + w) || t.includes(' ' + w + ' ')) return c;
  }
  return null;
}

// Bay layout for the boat (lanes 0..4, rows going up from the start).
// 'R' = rock, '~' = open water, 'M' = drifting mast (moves; stop & wait).
export const BAY = {
  lanes: 5,
  startLane: 2,
  rows: [
    '~~~~~', '~~~~~', 'RR~~~', '~R~~~', '~~~RR', '~~~R~', 'R~~~~',
    '~~R~~', '~RR~~', '~~~~R', 'MMMMM', '~~~~~', 'R~~RR', '~~~R~',
    'RR~~~', '~R~~R', '~~~~R', '~RRR~', '~~~~~', 'R~~~R', '~~~~~',
  ],
  swapAtRow: 10, // roles swap when the boat reaches this row
};
