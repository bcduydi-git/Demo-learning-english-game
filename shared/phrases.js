// Phrase bank: the short, useful English expressions the demo teaches.
// Each phrase is met in a situation (seen), used by the player (used),
// then recalled later with fewer hints (recalled).
//
// id        stable key (used in saves)
// en        the phrase as shown
// vi        Vietnamese meaning
// group     which phrasebook tab it lives in
// accept    extra spellings accepted when typed (normalised, see normalize())
// note      short usage tip in Vietnamese

export const PHRASE_GROUPS = [
  { id: 'check', en: 'Checking in', vi: 'Hỏi han & gọi nhau' },
  { id: 'dir', en: 'Directions', vi: 'Chỉ đường' },
  { id: 'fix', en: 'Instructions', vi: 'Hướng dẫn thao tác' },
  { id: 'talk', en: 'Keeping the talk going', vi: 'Giữ cuộc nói chuyện' },
  { id: 'radio', en: 'On the radio', vi: 'Gọi qua radio' },
];

export const PHRASES = [
  // --- checking in (beach) ---
  { id: 'are_you_ok', group: 'check', en: 'Are you okay?', vi: 'Bạn ổn chứ?', accept: ['are you ok'] },
  { id: 'im_ok', group: 'check', en: "I'm okay.", vi: 'Mình ổn.', accept: ['i am okay', 'im ok', 'i am ok'] },
  { id: 'where_are_we', group: 'check', en: 'Where are we?', vi: 'Chúng ta đang ở đâu?' },
  { id: 'look_at_this', group: 'check', en: 'Look at this!', vi: 'Nhìn này!' },
  { id: 'come_here', group: 'check', en: 'Come here!', vi: 'Lại đây!' },
  { id: 'i_found_it', group: 'check', en: 'I found it!', vi: 'Mình tìm thấy rồi!', accept: ['found it'] },
  { id: 'can_you_help', group: 'check', en: 'Can you help me?', vi: 'Bạn giúp mình được không?' },
  { id: 'ready', group: 'check', en: 'Ready?', vi: 'Sẵn sàng chưa?', accept: ['are you ready'] },
  { id: 'one_two_three', group: 'check', en: 'One, two, three!', vi: 'Một, hai, ba!', accept: ['1 2 3'] },
  { id: 'lets_go', group: 'check', en: "Let's go!", vi: 'Đi thôi!', accept: ['let us go', 'lets go'] },
  { id: 'wait_for_me', group: 'check', en: 'Wait for me!', vi: 'Đợi mình với!' },

  // --- directions (fog woods, rescue boat) ---
  { id: 'go_up', group: 'dir', en: 'Go up.', vi: 'Đi lên.', note: 'Trên bản đồ: lên = về phía bắc.' },
  { id: 'go_down', group: 'dir', en: 'Go down.', vi: 'Đi xuống.' },
  { id: 'go_left', group: 'dir', en: 'Go left.', vi: 'Sang trái.', accept: ['turn left', 'left'] },
  { id: 'go_right', group: 'dir', en: 'Go right.', vi: 'Sang phải.', accept: ['turn right', 'right'] },
  { id: 'stop', group: 'dir', en: 'Stop!', vi: 'Dừng lại!' },
  { id: 'a_little_more', group: 'dir', en: 'A little more.', vi: 'Thêm chút nữa.', accept: ['little more', 'a bit more'] },
  { id: 'go_back', group: 'dir', en: 'Go back.', vi: 'Quay lại.' },
  { id: 'watch_out', group: 'dir', en: 'Watch out!', vi: 'Coi chừng!', accept: ['look out'] },
  { id: 'youre_close', group: 'dir', en: "You're close!", vi: 'Gần lắm rồi!', accept: ['you are close'] },
  { id: 'keep_going', group: 'dir', en: 'Keep going.', vi: 'Cứ đi tiếp.', accept: ['go straight', 'go on'] },

  // --- instructions (generator) ---
  { id: 'turn_the_wheel', group: 'fix', en: 'Turn the wheel to the left.', vi: 'Xoay bánh xe sang trái.', note: 'Đổi "left" thành "right" khi cần.' },
  { id: 'press_the_button', group: 'fix', en: 'Press the green button.', vi: 'Bấm nút màu xanh lá.', note: 'Đổi màu: red, blue, green, yellow.' },
  { id: 'two_times', group: 'fix', en: 'Two times.', vi: 'Hai lần.', accept: ['twice', '2 times'] },
  { id: 'pull_the_lever', group: 'fix', en: 'Pull the lever down.', vi: 'Kéo cần gạt xuống.', note: 'Đổi "down" thành "up" khi cần.' },
  { id: 'dont_touch', group: 'fix', en: "Don't touch the red one!", vi: 'Đừng chạm vào cái màu đỏ!', accept: ['do not touch the red one'] },
  { id: 'which_one', group: 'fix', en: 'Which one?', vi: 'Cái nào?' },
  { id: 'first_then', group: 'fix', en: 'First..., then...', vi: 'Đầu tiên..., sau đó...' },

  // --- keeping the talk going ---
  { id: 'say_again', group: 'talk', en: 'Say that again, please.', vi: 'Nói lại lần nữa nhé.', accept: ['say it again', 'again please', 'say that again'] },
  { id: 'slowly', group: 'talk', en: 'Slowly, please.', vi: 'Nói chậm thôi.', accept: ['slower please', 'slow down'] },
  { id: 'got_it', group: 'talk', en: 'Got it!', vi: 'Hiểu rồi!', accept: ['i got it'] },
  { id: 'hold_on', group: 'talk', en: 'Hold on!', vi: 'Cố lên! / Bám chắc!' },
  { id: 'help_is_coming', group: 'talk', en: 'Help is coming.', vi: 'Sắp có người tới cứu.' },
  { id: 'we_did_it', group: 'talk', en: 'We did it!', vi: 'Chúng ta làm được rồi!' },

  // --- on the radio (finale) ---
  { id: 'i_can_hear_you', group: 'radio', en: 'Yes, I can hear you.', vi: 'Vâng, tôi nghe thấy bạn.', accept: ['i can hear you', 'yes i can'] },
  { id: 'two_of_us', group: 'radio', en: 'There are two of us.', vi: 'Chúng tôi có hai người.', accept: ['two people', 'we are two'] },
  { id: 'were_okay', group: 'radio', en: "We're okay.", vi: 'Chúng tôi ổn.', accept: ['we are okay', 'we are ok', 'were ok'] },
  { id: 'at_the_lighthouse', group: 'radio', en: "We're at the lighthouse.", vi: 'Chúng tôi ở ngọn hải đăng.', accept: ['we are at the lighthouse', 'at the lighthouse'] },
  { id: 'we_need_help', group: 'radio', en: 'We need help.', vi: 'Chúng tôi cần giúp đỡ.', accept: ['we need help', 'help us', 'i need help'] },
];

export const PHRASE_BY_ID = Object.fromEntries(PHRASES.map((p) => [p.id, p]));

// Normalise typed text so the rules are forgiving about things that are not
// the point of the exercise: case, punctuation, extra spaces, apostrophes.
export function normalize(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/[’‘`´]/g, "'")
    .replace(/'/g, '')
    .replace(/[^a-z0-9 ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Does a typed message match a phrase (exactly, after normalising)?
export function matchPhrase(text) {
  const n = normalize(text);
  if (!n) return null;
  for (const p of PHRASES) {
    if (normalize(p.en) === n) return p.id;
    if (p.accept && p.accept.some((a) => normalize(a) === n)) return p.id;
  }
  return null;
}
