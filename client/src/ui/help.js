import { h } from './dom.js';
import { openModal } from './modal.js';

export function openHelp() {
  const m = openModal('Cách chơi', { id: 'help' });
  const k = (t) => h('span', { class: 'kbd' }, t);
  m.body.append(
    h('div', { class: 'lobby-help' },
      h('p', {}, h('b', {}, 'Mục tiêu: '), 'hai bạn mắc kẹt trên đảo sau cơn bão. Hãy khôi phục ngọn hải đăng để gọi cứu hộ. Mỗi người có khả năng riêng — nhiều chỗ chỉ một người thấy/nghe được thông tin, nên phải trao đổi với nhau.'),
      h('p', {}, h('b', {}, 'Điều khiển: '), k('W'), k('A'), k('S'), k('D'), ' / phím mũi tên để đi · ', k('E'), ' hoặc ', k('Space'), ' để tương tác / tiếp lời thoại · ', k('R'), ' Radio · ', k('B'), ' Sổ cụm từ · ', k('H'), ' Gợi ý · ', k('M'), ' Tắt tiếng · ', k('Esc'), ' Cài đặt.'),
      h('p', {}, h('b', {}, 'Nói chuyện: '), 'gọi thoại cho nhau bằng ứng dụng riêng. Dòng thoại có 🗣 là lời của bạn — hãy thử đọc to bằng tiếng Anh. Không có chấm điểm phát âm.'),
      h('p', {}, h('b', {}, 'Không tiện nói? '), 'Dùng Radio (', k('R'), '): bấm cụm từ có sẵn hoặc gõ câu tiếng Anh — câu sẽ hiện và được đọc thành tiếng trên máy người kia.'),
      h('p', {}, h('b', {}, 'Học: '), 'cụm từ bạn gặp được lưu trong Sổ cụm từ (', k('B'), '). ★ đã gặp · ★★ đã dùng · ★★★ tự nhớ ra không cần gợi ý. Trận cuối và cuộc gọi cứu hộ sẽ cho bạn dùng lại chúng với ít gợi ý hơn.'),
      h('p', {}, h('b', {}, 'Lưu game: '), 'tự động. Mở lại trang và bấm "Tiếp tục". Nếu mất mạng, game tự nối lại; người kia vẫn chơi tiếp được.'),
    ),
  );
}
