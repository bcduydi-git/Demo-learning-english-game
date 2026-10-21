# Tiến độ & nhật ký phiên bản

Tài liệu này không tiết lộ cốt truyện.

## Phiên bản 0.1.0 — bản demo chơi được đầu tiên (21/10/2026)

### Nền tảng đã chọn và lý do

Đã tải về và xem trực tiếp hai repo ứng viên (giấy phép, cấu trúc, trạng thái):

- **RPG-JS**: code MIT. Bản đang phát triển là v5 *beta*. Đây là bộ khung RPG/MMORPG lớn (đồng bộ máy chủ, chiến đấu, kho đồ...). Muốn làm câu đố hai người thấy thông tin khác nhau và trận gõ chữ thì phải đi vòng qua nhiều lớp của nó, và API beta còn thay đổi.
- **Source of Mana**: MMORPG viết bằng **Godot 4**. Code MIT nhưng **hình ảnh/âm thanh theo CC BY-SA 4.0** (dùng lại thì phải ghi công và chia sẻ cùng giấy phép). Phải cài hoặc xuất bản bằng Godot, và rất nặng tính MMO (đánh quái, cấp độ).

→ **Tự xây mới** bằng **Phaser 3** (thư viện game 2D cho trình duyệt, MIT) và một **máy chủ Node.js nhỏ** (thư viện `ws`, MIT). Lý do: nhẹ, chạy ngay trên trình duyệt, dễ đưa lên mạng miễn phí, và toàn bộ luật chơi nằm gọn trong `shared/` để dễ sửa sau này.

### Đã hoạt động và đã kiểm tra

Kiểm thử tự động mở **2 trình duyệt Chromium độc lập** (hai hồ sơ riêng, không chung bộ nhớ). Hai trình duyệt nói chuyện với máy chủ thật qua WebSocket và chơi hết game từ sảnh tới màn kết.

| Hạng mục | Trạng thái |
|---|---|
| Tạo phòng / vào phòng bằng mã hoặc link, chọn vai | ✔ đã kiểm tra tự động |
| Co-op thật qua mạng (2 trình duyệt riêng ↔ máy chủ) | ✔ đã kiểm tra trên cùng một máy (localhost) |
| Hội thoại chung, chỉ chuyển dòng khi cả hai bấm | ✔ |
| Khám phá, va chạm, tương tác, nhặt đồ theo vai | ✔ |
| Radio gửi câu (bấm cụm từ / gõ), hiện và đọc ở máy kia | ✔ (phần đọc to chưa nghe thử được, xem dưới) |
| Toàn bộ chuỗi câu đố tới cuối game | ✔ `tests/e2e/playthrough.mjs` |
| Thử thách gõ chữ: thắng, thua, chơi lại | ✔ |
| Thoát tab rồi vào lại → đúng vai, đúng tiến độ | ✔ `tests/e2e/reconnect.mjs` |
| Máy chủ khởi động lại với ổ đĩa trống → phòng được dựng lại từ bản lưu của người chơi | ✔ |
| Người thứ 3 vào phòng đầy bị từ chối; đổi máy thì "vào chỗ" đang trống | ✔ |
| Luật chơi (đồ theo vai, máy phát, cửa, trận Boss, cuộc gọi, thuyền đi qua được vịnh) | ✔ `npm test` (11 bài) |

### Chưa kiểm tra được trong môi trường của mình

- **Hai máy tính thật ở hai nơi qua Internet** và **bản trên Render**: mình không có tài khoản để triển khai. Code đã có `render.yaml`; bạn làm theo `docs/TRIEN_KHAI.md`.
- **Nghe thật**: môi trường kiểm thử không có loa và không có giọng đọc. Code âm thanh có chạy nhưng chưa ai nghe thử. Giọng tiếng Anh phụ thuộc trình duyệt và hệ điều hành của bạn.
- **Nút 🎙 (nhận diện giọng nói)** chỉ có trên Chrome/Edge và chưa được thử với micro thật. Lỗi của nút này không chặn tiến trình: luôn có ô gõ chữ, và cuộc gọi cứu hộ có nút "Gửi câu mẫu" sau 3 lần chưa đúng.
- **Độ khó và thời lượng** mới được ước lượng, chưa có người thật chơi thử. Hãy ghi lại chỗ nào quá dễ/khó/dài.
- Hiệu năng mới thử ở chế độ máy ảo không có card đồ hoạ (rất chậm). Trên máy thật dự kiến mượt.

### Tài nguyên tạm (cần/được phép thay)

- **Toàn bộ hình ảnh** do script `tools/gen_art.py` tự vẽ (pixel art gốc, không lấy của ai). Hai nhân vật chính là hình tạm, xem `docs/THAY_HINH_NHAN_VAT.md`.
- **Nhạc và hiệu ứng** được tổng hợp bằng code lúc chạy (Web Audio), không có file âm thanh ngoài.
- **Giọng đọc**: giọng máy của trình duyệt. Có thể thay bằng file thu âm: đặt file vào `client/public/assets/voice/` kèm `manifest.json` dạng `{ "câu tiếng Anh y hệt": "ten-file.mp3" }`.
- Môi trường làm việc của mình chặn các trang tài nguyên ngoài (Kenney, OpenGameArt...). Vì vậy chưa dùng bộ hình/âm thanh CC0 nào.

### Giới hạn hiện tại

- Mỗi phòng tối đa **2 người**. Nhiều phòng chạy cùng lúc được, nên 2–3 người khác có thể chơi phòng riêng.
- Chỉ hỗ trợ máy tính có bàn phím, chưa hỗ trợ điện thoại/cảm ứng.
- Mê cung Rừng Sương cố định. Lời nhắn ở máy phát điện thì ngẫu nhiên theo từng phòng.
- Giao diện tiếng Việt, nội dung trong game tiếng Anh. Chưa có bản giao diện tiếng Anh.
- Gói miễn phí của Render ngủ sau 15 phút không dùng. Lần mở đầu tiên chờ khoảng 1 phút.

### Gợi ý cho buổi sau

1. Hai bạn chơi thử, ghi lại: đoạn nào vui, đoạn nào bối rối, đã dùng tiếng Anh bao nhiêu, mức hỗ trợ đã chọn.
2. Thay hình hai nhân vật.
3. Tinh chỉnh độ khó và thời gian dựa trên lần chơi thử.
4. (Tuỳ chọn) Thu âm hoặc tạo giọng đọc cho các câu thoại chính bằng `manifest.json`.
5. Mở rộng: chương 2, thêm câu đố, chế độ ôn tập cụm từ.

### Cách tiếp tục làm việc ở phiên sau

- Code nằm trên GitHub, nhánh `claude/adoring-lovelace-kk6mrk`. Mỗi mốc là một commit có mô tả.
- Khi quay lại, chỉ cần nói "tiếp tục Beacon Isle" và gửi ghi chú chơi thử. Mình sẽ đọc `docs/TIEN_DO.md` này để nắm lại.
