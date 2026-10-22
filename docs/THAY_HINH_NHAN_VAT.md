# Nhân vật chính: Lắc và Tím

Hai nhân vật lấy từ ảnh bạn gửi (`tools/source_art/lac_tim.webp`). Mỗi người chơi tự chọn mình là **Lắc** hay **Tím** ở màn hình tạo/vào phòng; việc này tách riêng với việc chọn vai (Thợ máy / Điện đài viên).

## Cách đưa vào game (đã làm sẵn)

- Ảnh gốc: 2 hàng (Lắc, Tím) × 4 tư thế đứng (xuống, trái, phải, lên).
- Script `python3 tools/import_characters.py` tạo:
  - `client/public/assets/characters/lac/walk.png` và `tim/walk.png`: khung **32×64**, người cao khoảng 46 điểm ảnh, giữ chi tiết của ảnh gốc.
  - `portrait.png`: chân dung cắt từ ảnh gốc (190×190).
- Trong game, nhân vật được vẽ **bằng một nửa** (`"scale": 0.5` trong `config.json`), tức cao khoảng 23 điểm ảnh của cảnh (≈1,5 ô), vừa với nhà cửa và cây của bộ Ninja Adventure. Độ phóng to của game luôn là số chẵn (×2, ×4, ×6) để hình không bị răng cưa.
- Dáng đi lấy từ 6 ảnh bước đi do ChatGPT vẽ (`tools/source_art/<lac|tim>_walk_<down|right|up>.png`, mỗi ảnh 4 khung xếp ngang). Hướng trái = hướng phải lật lại. Ở hướng xuống/lên, khung 4 dùng chân của khung 2 lật lại để hai bước đổi chân.

## Hình do ChatGPT vẽ (nhân vật phụ, đồ vật, bão)

Ảnh gốc khổ lớn nằm trong `tools/source_art/` (danh sách và lưu ý của ChatGPT: `DOC_TRUOC.md`). Script `python3 tools/import_gpt_art.py` thu nhỏ chúng về đúng kích thước trong game: tách khung theo khoảng trống, cắt mép mờ, gom về ít màu, kẻ viền tối 1 điểm ảnh, giữ tỉ lệ (không kéo giãn).

| Ảnh gốc | Thành file trong game |
|---|---|
| `lac_walk_*`, `tim_walk_*` | `characters/lac/walk.png`, `characters/tim/walk.png` |
| `captain_face`, `keeper_face`, `pip_face`, `storm_face` | `portraits/*.png` (190×190) |
| `lighthouse` (tắt/sáng) | `props/lighthouse.png`, `lighthouse_on.png` (64×144) |
| `watchtower`, `log`, `wreck`, `lens` | `props/tower.png`, `log.png`, `wreck.png`, `lens.png` |
| `radio_station` (tắt/sáng) | `props/station.png`, `station_on.png` |
| `lamp` (tắt/sáng), `rescue_boat`, `sea_rock`, `mast` | `boss/lamp0/1.png`, `boat.png`, `searock.png`, `mast.png` |
| `storm` (4 khung) | `boss/storm.png` (4 khung 128×96, chạy hoạt ảnh trong màn đánh trùm) |

Muốn thay một hình: thay ảnh gốc cùng tên trong `tools/source_art/` rồi chạy lại `python3 tools/import_gpt_art.py`. `npm run art` cũng tự chạy script này sau cùng, nên hình mới không bị hình tạm đè lên.

## Thay hình sau này

Giữ đúng bố cục ảnh gốc (2 hàng × 4 tư thế, nền trong suốt) rồi chạy lại `python3 tools/import_characters.py`. Nếu bố cục khác, sửa toạ độ `ROWS`/`COLS` ở đầu script hoặc gửi mình làm.

---

## (Tham khảo) Định dạng file hình

```
client/public/assets/characters/
├── config.json          ← kích thước khung hình, tỷ lệ hiển thị
├── lac/                 ← Lắc
│   ├── walk.png         ← hình nhỏ đi lại trên bản đồ
│   └── portrait.png     ← chân dung lớn khi hội thoại
└── tim/                 ← Tím
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
- Mỗi ô hiện là **32 × 64 px** (cả ảnh 128 × 256 px), hiển thị với `"scale": 0.5`. **Bàn chân chạm đáy ô.**
- Ảnh khung khác: sửa `frameWidth`, `frameHeight`, `scale` trong `config.json`.
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

Mọi hình khác nằm trong `client/public/assets/` (cây, nhà, vẹt Pip ngoài bản đồ, hải âu...). Mỗi hình là một file riêng. Thay bằng ảnh **cùng kích thước** là game nhận ngay. Lệnh `npm run art` dựng lại các hình này từ bộ Ninja Adventure nhưng **không** đụng tới hình nhân vật trong `characters/` (trừ khi chạy `python3 tools/build_art.py --characters`).
