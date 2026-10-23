# Chương 2 — "Ngọn đèn xanh": thiết kế đã duyệt

Tài liệu này không tiết lộ bí mật cốt truyện của chương 2 (phần đó sẽ ghi riêng trong `THIET_KE_CO_TIET_LO.md` khi viết).

## Mục tiêu

- Khó hơn và phối hợp nhiều hơn chương 1: **mỗi người thiếu một nửa thông tin**, việc của người này phụ thuộc người kia.
- Tiếng Anh mức **khoảng TOEIC 600 (B1)**, dạng hay gặp trong TOEIC: sổ tay kỹ thuật, lịch ca trực, email, thông báo, số giờ, số đo.
- Đáp án **ngẫu nhiên mỗi lần chơi**. Có 3 mức khó: Dễ / Vừa / Hack não. Nghĩa tiếng Việt vẫn bật/tắt theo cài đặt của từng người.
- Chương 1 giữ nguyên.

## Các thử thách (đã bỏ mã Morse theo yêu cầu)

| # | Thử thách | Phối hợp | Tiếng Anh |
|---|---|---|---|
| 1 | Giải mã toạ độ trên tàu | Một người nghe toạ độ đọc lẫn tiếng nhiễu (số, đánh vần kiểu *Bravo, Delta*), người kia có hải đồ | Số, đánh vần, hỏi lại lịch sự |
| 2 | Hai cánh trạm bị ngập | Van bên này đổi mực nước bên kia; đi luân phiên, hẹn thời điểm | *hold on until, after you, as soon as* |
| 3 | Ai giữ thẻ từ? | Một người có lịch trực + email, người kia thấy phòng tủ đồ; suy luận chéo | Giờ giấc, *no later than, unless, except*, phủ định |
| 4 | Căn chỉnh ăng-ten | Đứng hai phía mái vòm, trái/phải ngược nhau; tả hình và xếp lưới | Vị trí, hướng, hình dạng |
| 5 | **Máy phát tín hiệu** ✅ bản thử | Một người đứng máy, một người cầm sổ tay | Câu điều kiện, đọc hiểu kỹ thuật, đánh vần |
| 6 | Cao trào | Gỡ nhiều bộ phận cùng lúc, đổi vai giữa chừng, có luật cần nhớ câu đã học | Tự nhớ |

## Kế hoạch làm

1. **Đợt 1 (xong, chờ chơi thử):** thử thách 5 — Máy phát tín hiệu, chơi riêng được từ phòng chờ hoặc sau màn kết chương 1.
2. **Đợt 2:** thử thách 1–4, bản đồ trạm nghiên cứu, cốt truyện, danh sách hình cho ChatGPT vẽ.
3. **Đợt 3:** cao trào, kết chương, sổ từ của chương, chơi thử trọn chương.

## Thử thách 5 — Máy phát tín hiệu (bản thử)

- **Người đứng máy** thấy: bảng tên máy (số sê-ri, 3 đèn báo PWR/AUX/SYNC, đồng hồ của trạm và thứ trong tuần), và 3 bộ phận. Không có sổ tay.
- **Người cầm sổ tay** thấy: sổ tay tiếng Anh (luật cắt dây, bảng ca trực và luật mở van, bảng 6 cột từ) và Sổ từ. Không thấy máy, phải hỏi.
- Ba bộ phận:
  1. **Dây cáp** — 3 đến 6 dây màu. Dò danh sách luật theo số dây, làm theo luật *đầu tiên* khớp. Luật dùng *if / otherwise / unless / at least / exactly*, có luật phụ thuộc số sê-ri và đèn báo.
  2. **Van áp suất** — đọc đồng hồ của trạm để biết ca trực → khoảng áp suất bình thường → mở đúng van, đúng số vòng (mỗi vòng 5 bar, làm tròn lên). Mức Vừa có ngoại lệ đèn PWR; mức Hack não thêm luật cuối tuần.
  3. **Bàn phím chữ** — 3–4 phím có chữ. Tìm cột duy nhất chứa đủ các chữ, bấm theo thứ tự trong cột. Có nhiều cặp từ **đọc giống nhau, viết khác nhau** (SEA/SEE, WAIT/WEIGHT, RIGHT/WRITE…) nên phải hỏi đánh vần.
- Sai: mất một lượt sai và bị trừ 15 giây. Hết giờ hoặc hết lượt sai thì thua. Chơi lại là một cỗ máy mới; có thể đổi vai.
- Cuối lượt có phần **xem lại cỗ máy và đáp án** (luật nào áp dụng, vì sao) để học từ chỗ sai.

| Mức | Thời gian | Lượt sai tối đa | Số dây | Số phím |
|---|---|---|---|---|
| Dễ | 8:00 | 4 | 3–4 | 3 |
| Vừa | 6:00 | 2 | 3–5 | 4 (có ít nhất 1 từ đồng âm) |
| Hack não | 4:30 | 2 | 4–6 | 4 (có ít nhất 2 từ đồng âm), luật cuối tuần cho van |

Nơi sửa: luật, cột chữ, thời gian, câu mẫu, sổ từ — `shared/transmitter.js`; giao diện — `client/src/scenes/TransmitterScene.js`; kiểm thử — `tests/unit/transmitter.test.js`, `tests/e2e/transmitter.mjs`.
