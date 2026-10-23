// Puzzle 3 — "Who has the keycard?"
// The office player has the night-shift roster and the staff emails (shift
// swaps, a reminder, a note about a missing name tag). The locker-room
// player sees the eight lockers, their name tags and the door log (when
// the keycard was last used). Put it together: who was really on duty that
// night, and which locker is theirs? Opening a wrong locker sets off the
// alarm (a strike).

export const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const SHORT = { Monday: 'MON', Tuesday: 'TUE', Wednesday: 'WED', Thursday: 'THU', Friday: 'FRI', Saturday: 'SAT', Sunday: 'SUN' };
export const STAFF_POOL = [
  { first: 'Mei', last: 'Tanaka', title: 'Dr.' }, { first: 'Olu', last: 'Okafor', title: 'Dr.' },
  { first: 'Lars', last: 'Lindqvist', title: 'Mr.' }, { first: 'Claire', last: 'Moreau', title: 'Ms.' },
  { first: 'Ravi', last: 'Patel', title: 'Mr.' }, { first: 'Anna', last: 'Kowalski', title: 'Ms.' },
  { first: 'Sam', last: 'Reyes', title: 'Mr.' }, { first: 'Ingrid', last: 'Holm', title: 'Dr.' },
  { first: 'Tom', last: 'Becker', title: 'Mr.' },
];
export const LOCKERS = 8;
const int = (r, lo, hi) => lo + Math.floor(r() * (hi - lo + 1));
const shuffle = (r, l) => [...l].sort(() => r() - 0.5);
export const full = (p) => `${p.title} ${p.first} ${p.last}`;
const formal = (p) => `${p.title} ${p.last}`;
export const tag = (p) => `${p.first[0]}. ${p.last.toUpperCase()}`;

function create(level, r) {
  for (let k = 0; k < 400; k++) {
    const staff = shuffle(r, STAFF_POOL).slice(0, 6);
    // default night roster: six people, one of them twice
    const roster = shuffle(r, [0, 1, 2, 3, 4, 5, int(r, 0, 5)]);
    const day = int(r, 0, 6); // the night the keycard was last used
    const X = roster[day];
    const otherDays = [0, 1, 2, 3, 4, 5, 6].filter((d) => roster[d] !== X);
    const dayY = otherDays[int(r, 0, otherDays.length - 1)];
    const Y = roster[dayY];
    let T = Y; // who really worked that night
    let Z = null;
    if (level === 'hard') {
      const zs = [0, 1, 2, 3, 4, 5].filter((i) => i !== X && i !== Y);
      Z = zs[int(r, 0, zs.length - 1)];
      T = Z;
    }

    // lockers: six staff + VISITOR + SPARE; T's tag and one other tag are missing
    const owners = shuffle(r, [0, 1, 2, 3, 4, 5, 'VISITOR', 'SPARE']);
    const tIdx = owners.indexOf(T);
    const others = owners.map((o, i) => i).filter((i) => i !== tIdx && typeof owners[i] === 'number');
    const missIdx = others[int(r, 0, others.length - 1)];
    const missing = new Set([tIdx, missIdx]);
    const tagged = (i) => i >= 0 && i < LOCKERS && !missing.has(i);
    const name = (i) => (typeof owners[i] === 'number' ? formal(staff[owners[i]]) : null);
    // a description that only T's locker fits
    const rels = [];
    const L = (i) => name(i);
    if (tagged(tIdx - 1) && L(tIdx - 1)) rels.push({ en: `directly to the right of ${L(tIdx - 1)}'s`, vi: `ngay bên phải tủ của ${L(tIdx - 1)}` });
    if (tagged(tIdx + 1) && L(tIdx + 1)) rels.push({ en: `directly to the left of ${L(tIdx + 1)}'s`, vi: `ngay bên trái tủ của ${L(tIdx + 1)}` });
    if (tagged(tIdx - 1) && tagged(tIdx + 1) && L(tIdx - 1) && L(tIdx + 1)) rels.push({ en: `between ${L(tIdx - 1)}'s and ${L(tIdx + 1)}'s`, vi: `nằm giữa tủ của ${L(tIdx - 1)} và tủ của ${L(tIdx + 1)}` });
    if (level === 'hard') {
      if (tagged(tIdx - 2) && L(tIdx - 2)) rels.push({ en: `two lockers to the right of ${L(tIdx - 2)}'s`, vi: `cách tủ của ${L(tIdx - 2)} hai tủ về bên phải`, hard: true });
      if (tagged(tIdx + 2) && L(tIdx + 2)) rels.push({ en: `two lockers to the left of ${L(tIdx + 2)}'s`, vi: `cách tủ của ${L(tIdx + 2)} hai tủ về bên trái`, hard: true });
    }
    const usable = level === 'hard' && rels.some((x) => x.hard) ? rels.filter((x) => x.hard) : rels;
    if (!usable.length) continue;
    const rel = usable[int(r, 0, usable.length - 1)];

    const p = (i) => staff[i];
    const callT = level === 'hard' ? p(T).first : formal(p(T));
    const emails = [];
    emails.push({
      from: full(p(X)), to: 'Night staff', sent: 'Monday 09:12', subject: 'Shift swap this week',
      body: `Hi all, just to let you know that ${level === 'hard' ? p(Y).first : formal(p(Y))} and I have agreed to swap shifts this week. I will work on ${DAYS[dayY]} night, and ${level === 'hard' ? p(Y).first : formal(p(Y))} will cover my ${DAYS[day]} night shift.`,
      vi: `Chào mọi người, xin báo là ${formal(p(Y))} và tôi đã thống nhất đổi ca tuần này. Tôi sẽ làm đêm ${DAYS[dayY]}, còn ${formal(p(Y))} sẽ trực thay ca đêm ${DAYS[day]} của tôi.`,
    });
    if (level === 'hard') {
      emails.push({
        from: full(p(Y)), to: 'Night staff', sent: 'Monday 16:40', subject: 'Re: Shift swap this week',
        body: `Sorry, everyone. Because of a medical appointment, I can't cover the ${DAYS[day]} night shift after all. ${p(Z).first} has kindly agreed to take it instead. Everything else stays the same.`,
        vi: `Xin lỗi mọi người. Vì có lịch khám bệnh nên cuối cùng tôi không trực thay ca đêm ${DAYS[day]} được. ${formal(p(Z))} đã vui lòng nhận ca đó thay tôi. Mọi thứ khác giữ nguyên.`,
      });
    }
    emails.push({
      from: 'Station Manager', to: 'All staff', sent: 'Monday 08:00', subject: 'Reminder: keycard',
      body: 'At the end of every night shift, the person on duty must lock the station keycard in their own locker. Never leave it at the front desk.',
      vi: 'Cuối mỗi ca đêm, người đang trực phải khoá thẻ từ của trạm trong tủ đồ của chính mình. Tuyệt đối không để ở quầy lễ tân.',
    });
    emails.push({
      from: 'Facilities', to: full(p(T)), sent: 'Monday 11:05', subject: 'Your name tag',
      body: `Hi ${callT}, your name tag fell off again, sorry. Your locker is the one ${rel.en} (when you face the lockers). We will print a new tag next week.`,
      vi: `Chào ${formal(p(T))}, bảng tên của anh/chị lại rơi mất, xin lỗi nhé. Tủ của anh/chị là tủ ${rel.vi} (khi đứng nhìn vào dãy tủ). Tuần sau chúng tôi sẽ in bảng tên mới.`,
    });
    if (level !== 'easy') {
      // an offer that was turned down: not who was on duty
      const B = [0, 1, 2, 3, 4, 5].find((q) => q !== X && q !== Y && q !== T);
      emails.push({
        from: full(p(B)), to: full(p(X)), sent: 'Monday 13:30', subject: `Your ${DAYS[day]} night`,
        body: `Hi ${p(X).first}, I could cover your ${DAYS[day]} night shift if you need a break. — Reply from ${p(X).first}: Thanks, that's kind of you, but I'm afraid it's too late. It has already been arranged.`,
        vi: `Chào ${p(X).first}, mình có thể trực thay ca đêm ${DAYS[day]} của bạn nếu bạn cần nghỉ. — ${p(X).first} trả lời: Cảm ơn bạn, nhưng e là muộn rồi. Việc đó đã được sắp xếp xong.`,
      });
      emails.push({
        from: 'Cafeteria', to: 'All staff', sent: 'Monday 10:20', subject: 'Early closing',
        body: 'Please note that the cafeteria will close at 8 p.m. on Friday for cleaning. Hot drinks will still be available in the lounge.',
        vi: 'Xin lưu ý căng tin sẽ đóng cửa lúc 8 giờ tối thứ Sáu để dọn dẹp. Đồ uống nóng vẫn có ở phòng nghỉ.',
      });
    }
    return {
      staff,
      roster: roster.map((i) => i),
      doorLog: `${SHORT[DAYS[day]]} 23:${String(int(r, 10, 59)).padStart(2, '0')}`,
      lockers: owners.map((o, i) => ({ tag: missing.has(i) ? null : typeof o === 'number' ? tag(staff[o]) : o })),
      emails: shuffle(r, emails),
      answer: tIdx,
      opened: [],
    };
  }
  throw new Error('keycard: no puzzle');
}

function act(d, role, a) {
  if (role !== 'lockers' || a.op !== 'open') return undefined;
  const i = Number(a.locker);
  if (!(i >= 0 && i < LOCKERS) || d.opened.includes(i)) return undefined;
  d.opened.push(i);
  a.what = `tủ số ${i + 1}`;
  return i === d.answer ? 'solved' : 'strike';
}

export const keycard = {
  roles: ['office', 'lockers'],
  strikes: { easy: 4, normal: 3, hard: 3 },
  create,
  act,
};
