# Thay hình hai nhân vật chính

Hình hiện tại là **hình tạm** do script vẽ. Bạn chỉ cần thay 4 file ảnh. Không phải sửa code.

```
client/public/assets/characters/
├── config.json          ← kích thước khung hình (sửa nếu ảnh mới khác 32x32)
├── p1/                  ← vai 🔦 Thợ máy
│   ├── walk.png         ← hình nhỏ đi lại trên bản đồ
│   └── portrait.png     ← chân dung lớn khi hội thoại
└── p2/                  ← vai 📻 Điện đài viên
    ├── walk.png
    └── portrait.png
```

## 1. Hình đi lại (`walk.png`)

Một tấm ảnh **lưới 4 hàng × 4 cột**. Mỗi ô là một khung hình, nền **trong suốt** (PNG).

| Hàng | Hướng |
|---|---|
| 1 | đi **xuống** (mặt nhìn ra màn hình) |
| 2 | đi sang **trái** |
| 3 | đi sang **phải** |
| 4 | đi **lên** (quay lưng) |

- Cột 1 cũng là tư thế **đứng yên**. Cột 2 → 4 là các bước chân.
- Kích thước mặc định mỗi ô **32 × 32 px**, tức cả ảnh 128 × 128 px. Nhân vật cao khoảng 26–28 px, **bàn chân chạm đáy ô** (chừa 2–3 px).
- Ảnh khung khác (vd. 48×48 hoặc 64×64): sửa `frameWidth`, `frameHeight` trong `config.json`. Nếu nhân vật trông quá to, đặt `"scale": 0.5` (với ảnh 64×64).
- Số khung mỗi hàng khác 4: sửa `framesPerRow`. Tốc độ bước chân: `fps`.

## 2. Chân dung (`portrait.png`)

- Ảnh **vuông**, nền trong suốt, kiểu pixel art. Khuyên dùng 96×96 hoặc 128×128 px. Game phóng to sắc nét lên khoảng 192 px.
- Nên vẽ từ ngực trở lên, mặt nhìn hơi về bên phải.
- Ảnh này dùng ở hội thoại, sảnh chờ và thanh trạng thái.

## 3. Gợi ý câu lệnh cho AI tạo ảnh

Hình đi lại:

> pixel art sprite sheet, top-down RPG character, 4 rows (walking down, left, right, up) x 4 columns walk cycle, each frame 32x32 pixels, transparent background, chibi proportions, [mô tả người: tóc, quần áo, phụ kiện], limited palette, crisp pixels, no anti-aliasing

Chân dung:

> pixel art portrait, 128x128, bust shot, friendly expression, [mô tả người], transparent background, crisp pixels, matching a cozy island adventure game

AI thường tạo ảnh sai kích thước hoặc không thẳng lưới. Sau khi tạo, hãy cắt/chỉnh lại cho đúng lưới 4×4 bằng công cụ như Piskel, Aseprite hoặc LibreSprite. Nếu ảnh không đúng lưới, nhân vật sẽ bị "nhảy" khi đi.

## 4. Thử hình mới

- Chạy trên máy: thay file → chạy lại `CHOI_TREN_MAY_WINDOWS.bat` (hoặc `npm run build && npm start`) → tải lại trang.
- Trên Render: đưa file mới lên GitHub (trên trang GitHub vào thư mục `client/public/assets/characters/p1` → **Add file → Upload files**). Render tự cập nhật sau vài phút.

Màu áo của hai vai (cam và xanh ngọc) đang dùng trong giao diện. Giữ hai màu chủ đạo này thì giao diện vẫn khớp, nhưng không bắt buộc.

## Các hình tạm khác

Mọi hình tạm khác nằm trong `client/public/assets/` (cây, nhà, hải đăng, vẹt Pip, chân dung NPC...). Mỗi hình là một file riêng. Thay bằng ảnh **cùng kích thước** là game nhận ngay. Lệnh `npm run art` vẽ lại các hình tạm này nhưng **không** đụng tới hình nhân vật trong `characters/` (trừ khi chạy `python3 tools/gen_art.py --characters`).
