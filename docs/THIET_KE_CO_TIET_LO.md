# ⚠ Thiết kế chi tiết — CÓ TIẾT LỘ CỐT TRUYỆN

**Hãy chơi xong rồi mới đọc.** Tài liệu này dành để chỉnh sửa và mở rộng game.

## Tóm tắt trải nghiệm

Hai người dạt vào đảo sau bão → tìm đồ trên bãi biển → gặp vẹt **Pip** (vẹt của người gác đèn) → học dùng Radio → cùng nhấc khúc gỗ → đọc sổ của người gác đèn **Eleanor Marlow** → hai nhiệm vụ song song (thấu kính trong Rừng Sương, khôi phục điện) → mở cửa hải đăng bằng "lời của người gác đèn" → trận **The Storm** (gõ chữ) → gọi tàu cứu hộ **Aurora** (trả lời bằng lời của mình) → dẫn tàu qua vịnh tối → kết: thuyền trưởng là **cháu của Eleanor**; Eleanor mất tích 50 năm trước; ngoài khơi, nơi không có đảo, một **đốm sáng xanh** nháy "ba dài, ba ngắn" và Pip nói bằng giọng Eleanor: *"Eleanor says: come and find me."* → "To be continued: Chương 2 — Ngọn đèn xanh".

Chi tiết gợi tò mò được gài từ trước: lá thư trong chai ("Something out at sea is watching it") và trang sổ kẹp dưới thấu kính ("The green light answered again tonight. Three long, three short. There is no island out there.").

## Từng đoạn: ai làm gì, tiếng Anh dùng để làm gì

| Đoạn | Thợ máy (p1) | Điện đài viên (p2) | Tiếng Anh |
|---|---|---|---|
| Bãi biển | Chỉ mở được thùng đồ nghề | Chỉ lấy được radio trong khoang thuyền | Mỗi người tìm thấy đồ của người kia trước → phải gọi "Come here! Look at this!" |
| Radio | Gửi 1 câu | Gửi 1 câu | Dùng thử Radio. "Yes, I can hear you" được Pip dạy ngay trước đó |
| Khúc gỗ | Nhấc | Nhấc | Phải bấm cùng lúc trong 1,5 giây → đếm "Ready? One, two, three!" |
| Sổ gác đèn | Đọc chung | Đọc chung | Đọc hiểu: biết 3 thứ cần tìm |
| Rừng Sương | Đứng trên tháp, nhìn cả mê cung và **bẫy gai** | Đi trong sương, chỉ thấy quanh mình | p1 **nói** chỉ đường, p2 **nghe** rồi làm: Go up/left, Stop!, A little more, Go back, Watch out! |
| Máy phát | Chỉ p1 vận hành bảng điều khiển (bánh xe, 4 nút màu, cần gạt) | Chỉ p2 nghe được lời nhắn ghi âm (ngẫu nhiên theo phòng) | p2 **nghe** rồi **nói lại**; p1 **nghe**, **đọc** nhãn và làm. Sai thứ tự thì máy tóe lửa, làm lại. "Which one? Say that again, please." |
| Cửa hải đăng | Đèn lồng làm hiện chữ "HOLD ON," | Radio nghe thì thầm "...help is coming." | Ghép hai nửa → **gõ** cả câu. Sai thì thấy bao nhiêu từ đúng vị trí |
| The Storm | Làn trái | Làn phải | **Gõ**: đợt 1 từ đơn → đợt 2 cụm từ → đợt 3 **tự nhớ** (chỉ thấy nghĩa tiếng Việt). Đòn cuối: p1 gõ "hold on", p2 gõ "help is coming" |
| Cuộc gọi cứu hộ | Trả lời câu 1, 3 | Trả lời câu 2, 4 | **Tình huống mới, ít gợi ý**: tự trả lời bằng lời của mình. Chỉ kiểm tra ý chính (yes/hear, okay/fine, two/2, lighthouse) |
| Dẫn tàu | Cầm đèn (nửa đầu) rồi chỉ huy (nửa sau) | Chỉ huy (nửa đầu) rồi cầm đèn | Người cầm đèn thấy đá, **nói**; người chỉ huy **nghe** rồi **gõ/nói** lệnh: go left/right, stop, keep going, go back. Dùng lại cụm từ Rừng Sương trong ngữ cảnh mới |

## Vòng học: gặp → dùng → tự nhớ

- **Gặp** (★): cụm từ xuất hiện trong lời thoại, biển báo, lời nhắn. Có nghe lại, đọc chậm, nghĩa tiếng Việt.
- **Dùng** (★★): người chơi tự gửi qua Radio, tự gõ (cửa), tự nói (honour system, không chấm).
- **Tự nhớ** (★★★): đợt 3 trận Boss (chỉ có nghĩa tiếng Việt), cuộc gọi cứu hộ không bấm gợi ý, ra lệnh cho thuyền.
- Không chấm phát âm. Nút 🎙 chỉ chuyển giọng thành chữ để người chơi tự kiểm tra.

## Nơi sửa nội dung

- Lời thoại, gợi ý, lời nhắn máy phát, từ trong trận Boss, câu hỏi cứu hộ, bố cục vịnh: `shared/content.js`
- Danh sách cụm từ và nghĩa: `shared/phrases.js`
- Luật chơi (điều kiện, máu, thời gian): `shared/logic.js`
- Biển báo, thư trong chai, trang sổ: `client/src/scenes/WorldScene.js`
- Bản đồ: `tools/map_gen.py` → `npm run art`
- Tốc độ trận Boss theo từng mức: `BOSS_SPEED` trong `shared/content.js`. Tốc độ thuyền: `BOAT_SPEED` trong `shared/logic.js`.

---

# Chương 2 — Ngọn đèn xanh (CÓ TIẾT LỘ)

## Cốt truyện đến hết Đợt 2

Tàu Aurora đi theo đốm sáng xanh → thử thách **toạ độ** cho ra vị trí trạm nghiên cứu bỏ hoang **Halcyon** (mở 1968, đóng 1984 sau bão làm hỏng ăng-ten) → trong trạm có dấu vết người mới ở gần đây (sổ khách ghi bằng mực xanh lá ba hôm trước, cốc cà phê còn ấm) → **hai cánh ngập nước** → **thẻ từ**: trong tủ có danh sách nhân viên cũ ghi **"E. Marlow — Signals Officer"**: Eleanor đã làm sĩ quan tín hiệu ở Halcyon sau khi rời đảo; thuyền trưởng (cháu bà) chưa từng biết → **căn chỉnh ăng-ten** → băng ghi âm giọng Eleanor: *"I am not lost... Repair the transmitter. Then you will know where I am."*

Chi tiết gài sẵn: hộp đồ thất lạc có bưu thiếp "Greetings from Beacon Isle" và khăn đỏ; nhật ký thuyền trưởng ghi đèn xanh "ba dài, ba ngắn" (không có giải mã Morse theo yêu cầu).

## Đợt 3 (dự kiến)

Phòng máy phát (thử thách Máy phát tín hiệu đã có bản thử) → cao trào: gỡ nhiều bộ phận cùng lúc, đổi vai giữa chừng, có luật cần nhớ câu đã học → máy phát cho ra vị trí của Eleanor → móc nối chương 3.

## Ai thấy gì (chương 2)

| Thử thách | Vai A | Vai B | Bẫy "hack não" |
|---|---|---|---|
| Toạ độ | Bàn hải đồ: hải đồ ô lưới, nhập toạ độ, nghe một nửa bản tin | Bàn radio: nghe nửa còn lại, gồm tên ô lưới | Số -teen/-ty; lời đính chính ở cuối bản tin; tên ô lưới là chìa khoá tra hải đồ |
| Hai cánh ngập | Cánh Tây: mực nước + số trên cửa của mình, van đổ nước sang cánh Đông | Cánh Đông: ngược lại | Phải hỏi số liệu bên kia rồi tính; mức Hack não có van ảnh hưởng cả bên mình; hai cửa mở trong 4 giây |
| Thẻ từ | Văn phòng: lịch trực mặc định + email (đổi ca, nhắc quy định, bảng tên rơi) | Phòng tủ đồ: 8 tủ, bảng tên, nhật ký cửa | Email đề nghị đổi ca bị từ chối; mức Hack não có email đính chính sau, gọi bằng tên riêng, vị trí "cách hai tủ" |
| Ăng-ten | Phía Bắc: đĩa 1 cầm bản đồ sao, đĩa 2 bật công tắc | Phía Nam: ngược lại | Trái/phải ngược nhau; mức Hack não mỗi công tắc đảo cả đèn phía trên (chỉ người bật biết) |
