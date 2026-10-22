# Beacon Isle

Game phiêu lưu – giải đố **co-op 2 người, 2 máy tính**, chơi bằng trình duyệt. Hai người mắc kẹt trên một hòn đảo sau cơn bão và phải thắp lại ngọn hải đăng. Tiếng Anh là công cụ để hành động: nghe lời nhắn, đọc manh mối, nói để chỉ đường cho nhau, gõ chữ để vượt thử thách.

Phong cách pixel art, góc nhìn từ trên xuống, chân dung lớn khi hội thoại.

## Bắt đầu nhanh

- **Chơi**: đọc [docs/HUONG_DAN_CHOI.md](docs/HUONG_DAN_CHOI.md)
- **Đưa lên mạng / chạy trên máy**: đọc [docs/TRIEN_KHAI.md](docs/TRIEN_KHAI.md) (Render miễn phí, hoặc nhấp đúp `CHOI_TREN_MAY_WINDOWS.bat`)
- **Thay hình hai nhân vật**: [docs/THAY_HINH_NHAN_VAT.md](docs/THAY_HINH_NHAN_VAT.md)
- **Tiến độ, phần đã kiểm tra, giới hạn**: [docs/TIEN_DO.md](docs/TIEN_DO.md)
- Giấy phép: [docs/BAN_QUYEN.md](docs/BAN_QUYEN.md)
- ⚠ Thiết kế chi tiết, có tiết lộ cốt truyện: [docs/THIET_KE_CO_TIET_LO.md](docs/THIET_KE_CO_TIET_LO.md)

## Cấu trúc

```
client/   giao diện game (Phaser 3 + HTML/CSS), chạy trong trình duyệt
server/   máy chủ Node.js: phát trang web + phòng chơi qua WebSocket
shared/   luật chơi, nội dung truyện, cụm từ (dùng chung cho cả hai bên)
tools/    script vẽ bản đồ và hình pixel tạm
tests/    kiểm thử luật chơi + chơi tự động bằng 2 trình duyệt
```

```
npm install && npm run build && npm start   # http://localhost:8080
```
