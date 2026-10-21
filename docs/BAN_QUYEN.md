# Giấy phép & nguồn tài nguyên

| Thành phần | Nguồn | Giấy phép |
|---|---|---|
| Code game (`client/`, `server/`, `shared/`, `tools/`, `tests/`) | Viết mới cho dự án này | Thuộc chủ repo. Chưa gắn giấy phép công khai, bạn tự quyết. |
| Phaser 3.90 | npm `phaser` | MIT |
| ws | npm `ws` | MIT |
| Vite | npm `vite` (chỉ dùng khi build) | MIT |
| Phông VT323 | npm `@fontsource/vt323` | SIL Open Font License 1.1 |
| Phông Be Vietnam Pro | npm `@fontsource/be-vietnam-pro` | SIL Open Font License 1.1 |
| Hình ảnh pixel (đảo, nhà, nhân vật tạm, chân dung...) | Vẽ bằng script `tools/gen_art.py` cho dự án này | Thuộc chủ repo |
| Nhạc, hiệu ứng âm thanh | Tổng hợp bằng code (Web Audio) lúc chạy | Thuộc chủ repo |
| Giọng đọc tiếng Anh | Giọng có sẵn của trình duyệt/hệ điều hành người chơi (Web Speech API) | Theo điều khoản của trình duyệt/HĐH. Game không lưu hay phát tán âm thanh này. |
| Nhận diện giọng nói (nút 🎙, tuỳ chọn) | Web Speech API của Chrome/Edge | Theo điều khoản của trình duyệt. Âm thanh do Google/Microsoft xử lý. |
| playwright-core (chỉ để kiểm thử) | npm | Apache-2.0 |

Không có tài nguyên nào lấy từ RPG-JS hay Source of Mana.

Khi bạn thay bằng hình do AI tạo, hãy kiểm tra điều khoản của công cụ AI đó về quyền sử dụng ảnh (đặc biệt nếu sau này chia sẻ công khai hoặc kinh doanh).
