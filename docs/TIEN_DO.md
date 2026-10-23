# Tiến độ & nhật ký phiên bản

Tài liệu này không tiết lộ cốt truyện.

## Phiên bản 0.5.0 — bản thử Chương 2: Máy phát tín hiệu (23/10/2026)

- Thiết kế Chương 2 đã duyệt (bỏ mã Morse): `docs/CHUONG_2_THIET_KE.md`.
- Đợt 1: thử thách **Máy phát tín hiệu**, chơi riêng từ phòng chờ hoặc sau màn kết chương 1. Một người đứng máy, một người cầm sổ tay tiếng Anh; 3 bộ phận (dây cáp, van áp suất, bàn phím chữ có từ đồng âm), 3 mức khó, máy ngẫu nhiên mỗi lần, đổi vai được, xem lại đáp án sau mỗi lượt.
- Kiểm thử: 21 bài luật chơi (thêm 8 bài cho máy phát, gồm kiểm tra 1.200 cỗ máy ngẫu nhiên đều có đúng một đáp án), chơi tự động máy phát bằng 2 trình duyệt qua giao diện thật, chơi tự động trọn chương 1, kiểm thử kết nối lại.
- Chưa có người thật chơi: thời gian và độ khó là ước lượng, cần bạn chơi thử rồi góp ý.

## Phiên bản 0.4.1 — tự đặt tên (23/10/2026)

- Tên người chơi không còn cố định là Lắc/Tím: mỗi người tự đặt tên khi tạo/vào phòng (tuỳ chọn), đổi lại được ở phòng chờ hoặc trong ⚙ Cài đặt. Để trống = tên nhân vật.
- Tên mới cập nhật ngay cho cả hai máy (trên đầu nhân vật, lời thoại, bảng mục tiêu, trận Bão...) và được giữ khi mất mạng/vào lại.
- Kiểm thử: 13/13 luật chơi (thêm bài đổi tên), thử đổi tên với 2 trình duyệt, chơi tự động trọn game, kiểm thử kết nối lại.

## Phiên bản 0.4.0 — hình do ChatGPT vẽ (22/10/2026)

- Lắc và Tím có dáng đi thật (4 khung mỗi hướng) thay cho dáng đi tạo tự động.
- Chân dung mới: thuyền trưởng, bà gác đèn, Pip, cơn bão.
- Hình mới: hải đăng (tắt/sáng), tháp canh, khúc gỗ, xác thuyền, radio (tắt/sáng), thấu kính, bóng đèn hải đăng, xuồng cứu hộ, đá ngầm, cột buồm trôi. Cơn bão có hoạt ảnh 4 khung trong màn đánh trùm.
- Script mới `tools/import_gpt_art.py` chuyển ảnh gốc khổ lớn thành hình đúng cỡ. Đã xử lý các lỗi ChatGPT tự ghi trong `tools/source_art/DOC_TRUOC.md` (dư màu, mép mờ, sai tỉ lệ khung, hai bước nhấc cùng chân).
- Kiểm thử: 12/12 luật chơi, chơi tự động trọn game với 2 trình duyệt, kiểm thử kết nối lại — đều đạt. Chưa thử trên 2 máy thật.

## Phiên bản 0.3.0 — Lắc và Tím (22/10/2026)

- Hai nhân vật chính lấy từ ảnh bạn gửi: **Lắc** và **Tím**. Mỗi người chơi tự chọn mình là ai, tách riêng với việc chọn vai. Nếu hai người chọn trùng, người vào sau nhận nhân vật còn lại.
- Hình đi lại: khung 32×64 giữ chi tiết ảnh gốc, vẽ bằng một nửa trong game (cao ≈ 23 điểm ảnh, 1,5 ô). Đã dựng thử 4 tỷ lệ cạnh cửa nhà, cây, NPC và chọn cách này.
- Thêm bóng mờ dưới chân. Độ phóng to luôn là số chẵn để hình sắc nét. Sửa lỗi độ phóng to khi vào trong nhà.
- Dáng đi được tạo tự động từ tư thế đứng (ảnh gốc chưa có khung bước đi).
- Code chuyển sang repo **Demo-learning-english-game**.
- Kiểm thử: 12/12 luật chơi, chơi tự động trọn game với 2 trình duyệt, kiểm thử kết nối lại — đều đạt.

## Phiên bản 0.2.0 — làm lại đồ hoạ và âm thanh (21/10/2026)

Bạn nhận xét đồ hoạ bản 0.1 xấu. Lý do: bản đó do mình tự vẽ bằng code. Bản này:

- Chuyển sang bộ **Ninja Adventure** của Pixel-boy, giấy phép **CC0**, lấy từ kho GitHub chính thức của Sparklin Labs. Bộ này gồm nền cỏ/cát/đất, vách đất, cây, nhà mái tranh, đá, nội thất, rương, nhân vật 16×16 có chân dung, nhạc và hiệu ứng âm thanh.
- Những thứ bộ không có (hải đăng, tháp canh, khúc gỗ, xác thuyền, radio, cơn bão, bờ biển) được vẽ lại theo bảng màu và nét viền đen của bộ để đồng bộ.
- Giao diện đổi theo hộp thoại của bộ: khung giấy sáng viền cam, chân dung trong khung tối, nút gỗ.
- Màn hình chính dùng cảnh hòn đảo làm nền.
- Trận Bão có khung cảnh mới: phòng đèn có cửa gỗ, biển đêm, sàn đá; các đám mây mang chữ trông như hộp thoại.
- Nhạc nền thật cho từng khu vực (đảo, rừng sương, trận Bão, đêm, chiến thắng, màn hình chính, màn kết). Nhạc tự tổng hợp vẫn là phương án dự phòng.
- Toàn bộ kiểm thử (luật chơi, chơi tự động trọn game với 2 trình duyệt, kết nối lại) chạy lại đều đạt.

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

- **Hình ảnh**: từ bộ Ninja Adventure (CC0), cộng một số hình mình vẽ theo phong cách bộ (xem `docs/BAN_QUYEN.md`). Hai nhân vật chính, nhân vật phụ và các đồ vật chính do bạn cung cấp (ảnh gốc + ChatGPT), xem `docs/THAY_HINH_NHAN_VAT.md`.
- **Nhạc và hiệu ứng chính**: từ bộ Ninja Adventure (CC0). Một số tiếng (bước chân, gõ phím, sấm, sóng) được tổng hợp bằng code.
- **Giọng đọc**: giọng máy của trình duyệt. Có thể thay bằng file thu âm: đặt file vào `client/public/assets/voice/` kèm `manifest.json` dạng `{ "câu tiếng Anh y hệt": "ten-file.mp3" }`.
- Mình chọn nhạc cho từng khu vực bằng cách phân tích nhịp độ và giọng trưởng/thứ, chưa nghe thử được. Nếu bài nào không hợp, đổi file trong `client/public/assets/audio/music/`.

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

- Code nằm trên GitHub, repo `bcduydi-git/Demo-learning-english-game`, nhánh `main` (bản đang chạy trên Render). Thay đổi mới làm trên nhánh riêng rồi gộp vào `main` qua pull request. Mỗi mốc là một commit có mô tả.
- Khi quay lại, chỉ cần nói "tiếp tục Beacon Isle" và gửi ghi chú chơi thử. Mình sẽ đọc `docs/TIEN_DO.md` này để nắm lại.
