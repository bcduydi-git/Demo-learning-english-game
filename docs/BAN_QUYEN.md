# Giấy phép & nguồn tài nguyên

| Thành phần | Nguồn | Giấy phép |
|---|---|---|
| Code game (`client/`, `server/`, `shared/`, `tools/`, `tests/`) | Viết mới cho dự án này | Thuộc chủ repo. Chưa gắn giấy phép công khai, bạn tự quyết. |
| Phaser 3.90 | npm `phaser` | MIT |
| ws | npm `ws` | MIT |
| Vite | npm `vite` (chỉ dùng khi build) | MIT |
| Phông VT323 | npm `@fontsource/vt323` | SIL Open Font License 1.1 |
| Phông Be Vietnam Pro | npm `@fontsource/be-vietnam-pro` | SIL Open Font License 1.1 |
| Phần lớn hình ảnh: nền cỏ/cát/đất, vách đất, cây, đá, nhà, đồ nội thất, rương, vẹt Pip ngoài bản đồ, hải âu | Bộ **Ninja Adventure** của **Pixel-boy**, do Sparklin Labs phát hành tại [github.com/sparklinlabs/superpowers-asset-packs](https://github.com/sparklinlabs/superpowers-asset-packs) (bản gốc: pixel-boy.itch.io/ninja-adventure-asset-pack) | **CC0 1.0** (tặng vào miền công cộng, dùng tự do kể cả thương mại, không bắt buộc ghi công). File gốc + giấy phép: `tools/vendor/ninja-adventure/` |
| Nhạc nền (7 bài) và hiệu ứng âm thanh chính | Cùng bộ Ninja Adventure ở trên, chuyển sang MP3 | CC0 1.0 |
| Lắc, Tím (ảnh gốc và dáng đi), chân dung thuyền trưởng/bà gác đèn/Pip/cơn bão, hải đăng, tháp canh, khúc gỗ, xác thuyền, radio, thấu kính, bóng đèn hải đăng, xuồng cứu hộ, đá ngầm, cột buồm, cơn bão | Chủ repo cung cấp; phần lớn tạo bằng ChatGPT (công cụ tạo ảnh), ảnh gốc trong `tools/source_art/`, thu nhỏ bằng `tools/import_gpt_art.py` | Theo điều khoản sử dụng của OpenAI cho ảnh do người dùng tạo. Hãy tự kiểm tra trước khi chia sẻ công khai hoặc kinh doanh. |
| Hình nền 15 phòng chương 2 (trạm Halcyon) và chương 3 (Ngọn Hải Đăng Chìm) | Chủ repo cung cấp, tạo bằng ChatGPT; ảnh gốc trong `tools/source_art/ch2/` và `ch3/`, đưa về đúng cỡ điểm ảnh bằng `tools/import_room_art.py` | Theo điều khoản sử dụng của OpenAI cho ảnh do người dùng tạo. |
| Bờ biển, sóng nước | Vẽ bằng script (`tools/build_art.py`, `tools/gen_art.py`) theo bảng màu của bộ trên | Thuộc chủ repo |
| Âm thanh phụ (bước chân, gõ phím, sấm, sóng, gió) | Tổng hợp bằng code (Web Audio) lúc chạy | Thuộc chủ repo |
| Giọng đọc tiếng Anh | Giọng có sẵn của trình duyệt/hệ điều hành người chơi (Web Speech API) | Theo điều khoản của trình duyệt/HĐH. Game không lưu hay phát tán âm thanh này. |
| Nhận diện giọng nói (nút 🎙, tuỳ chọn) | Web Speech API của Chrome/Edge | Theo điều khoản của trình duyệt. Âm thanh do Google/Microsoft xử lý. |
| playwright-core (chỉ để kiểm thử) | npm | Apache-2.0 |

Không có tài nguyên nào lấy từ RPG-JS hay Source of Mana.

Khi bạn thay bằng hình do AI tạo, hãy kiểm tra điều khoản của công cụ AI đó về quyền sử dụng ảnh (đặc biệt nếu sau này chia sẻ công khai hoặc kinh doanh).
