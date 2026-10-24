# Beacon Isle

Game phiêu lưu – giải đố **co-op 2 người, 2 máy tính**, chơi bằng trình duyệt. Tiếng Anh là công cụ để hành động: nghe lời nhắn, đọc manh mối, nói để chỉ đường cho nhau, gõ chữ để vượt thử thách.

Câu chuyện trọn vẹn gồm 3 chương:

1. **Đảo Beacon** — mắc kẹt trên đảo sau bão, thắp lại ngọn hải đăng (đi lại tự do, đánh trùm Bão, dẫn tàu cứu hộ).
2. **Ngọn đèn xanh** — trạm nghiên cứu Halcyon giữa biển, 6 thử thách phối hợp (mỗi người một nửa thông tin, ~TOEIC 600).
3. **Ngọn Hải Đăng Chìm** — chương cuối, 4 thử thách, kết thúc câu chuyện.

Phong cách pixel art, chân dung lớn khi hội thoại. Chương 2–3 có 3 mức khó (Dễ / Vừa / Hack não), đề ngẫu nhiên mỗi lần, đổi vai được, và sổ từ của từng chương.

## Bắt đầu nhanh

- **Chơi**: đọc [docs/HUONG_DAN_CHOI.md](docs/HUONG_DAN_CHOI.md)
- **Đưa lên mạng / chạy trên máy**: đọc [docs/TRIEN_KHAI.md](docs/TRIEN_KHAI.md) (Render miễn phí, hoặc nhấp đúp `CHOI_TREN_MAY_WINDOWS.bat`)
- **Thay hình hai nhân vật**: [docs/THAY_HINH_NHAN_VAT.md](docs/THAY_HINH_NHAN_VAT.md)
- **Thiết kế chương 2 và 3** (không tiết lộ truyện): [docs/CHUONG_2_THIET_KE.md](docs/CHUONG_2_THIET_KE.md), [docs/CHUONG_3_THIET_KE.md](docs/CHUONG_3_THIET_KE.md); hình nền phòng: [docs/CHUONG_2_HINH_CAN_VE.md](docs/CHUONG_2_HINH_CAN_VE.md)
- **Tiến độ, phần đã kiểm tra, giới hạn**: [docs/TIEN_DO.md](docs/TIEN_DO.md)
- Giấy phép: [docs/BAN_QUYEN.md](docs/BAN_QUYEN.md)
- ⚠ Thiết kế chi tiết, có tiết lộ cốt truyện: [docs/THIET_KE_CO_TIET_LO.md](docs/THIET_KE_CO_TIET_LO.md)

## Cấu trúc

```
client/   giao diện game (Phaser 3 + HTML/CSS), chạy trong trình duyệt
server/   máy chủ Node.js: phát trang web + phòng chơi qua WebSocket
shared/   luật chơi, nội dung truyện, cụm từ (dùng chung cho cả hai bên)
tools/    script dựng bản đồ, chuyển hình gốc (tools/source_art/) thành hình trong game
tests/    kiểm thử luật chơi + chơi tự động bằng 2 trình duyệt (npm test, npm run e2e, e2e:ch2, e2e:ch3, e2e:tx, e2e:reconnect)
```

```
npm install && npm run build && npm start   # http://localhost:8080
```
