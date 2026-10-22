# Thay hình hai nhân vật chính

Hình hiện tại là **hình tạm** lấy từ bộ Ninja Adventure (CC0). Bạn chỉ cần thay 4 file ảnh. Không phải sửa code.

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
- Kích thước mặc định mỗi ô **16 × 16 px** (cả ảnh 64 × 64 px), đúng cỡ nhân vật của bộ Ninja Adventure nên đứng cạnh nhà, cây sẽ cân đối. **Bàn chân chạm đáy ô.**
- Ảnh khung khác (vd. 32×32): sửa `frameWidth`, `frameHeight` trong `config.json`. Nhân vật 32×32 sẽ cao gấp đôi so với cảnh; nếu muốn nhỏ lại đặt `"scale": 0.5`.
- Số khung mỗi hàng khác 4: sửa `framesPerRow`. Tốc độ bước chân: `fps`.

## 2. Chân dung (`portrait.png`)

- Ảnh **vuông**, kiểu pixel art, nền tối hoặc trong suốt (chân dung được đặt trong khung tối). Bản tạm là 38×38 px. Bạn có thể dùng 38×38, 76×76 hoặc 128×128 px; game phóng to sắc nét lên khoảng 190 px.
- Nên vẽ từ ngực trở lên, mặt nhìn hơi về bên phải.
- Ảnh này dùng ở hội thoại, sảnh chờ và thanh trạng thái.

## 3. Gợi ý câu lệnh cho AI tạo ảnh

Hình đi lại:

> pixel art sprite sheet, top-down RPG character in the style of "Ninja Adventure" by Pixel-boy, 4 rows (walking down, left, right, up) x 4 columns walk cycle, each frame 16x16 pixels, transparent background, chibi proportions, black 1px outline, [mô tả người: tóc, quần áo, phụ kiện], crisp pixels, no anti-aliasing

Chân dung:

> pixel art faceset portrait, 38x38 (or 76x76), bust shot, friendly expression, [mô tả người], dark background, black outline, warm palette, crisp pixels, matching the "Ninja Adventure" asset pack

AI thường tạo ảnh sai kích thước hoặc không thẳng lưới. Sau khi tạo, hãy cắt/chỉnh lại cho đúng lưới 4×4 bằng công cụ như Piskel, Aseprite hoặc LibreSprite. Nếu ảnh không đúng lưới, nhân vật sẽ bị "nhảy" khi đi.

## 4. Thử hình mới

- Chạy trên máy: thay file → chạy lại `CHOI_TREN_MAY_WINDOWS.bat` (hoặc `npm run build && npm start`) → tải lại trang.
- Trên Render: đưa file mới lên GitHub (trên trang GitHub vào thư mục `client/public/assets/characters/p1` → **Add file → Upload files**). Render tự cập nhật sau vài phút.

Tên vai trong giao diện có màu cam (Thợ máy) và xanh ngọc (Điện đài viên). Nhân vật mới không cần theo màu này.

## Các hình tạm khác

Mọi hình khác nằm trong `client/public/assets/` (cây, nhà, hải đăng, vẹt Pip, chân dung NPC...). Mỗi hình là một file riêng. Thay bằng ảnh **cùng kích thước** là game nhận ngay. Lệnh `npm run art` dựng lại các hình này từ bộ Ninja Adventure nhưng **không** đụng tới hình nhân vật trong `characters/` (trừ khi chạy `python3 tools/build_art.py --characters`).
