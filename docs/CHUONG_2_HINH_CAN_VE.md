# Chương 2 — hình cần vẽ (gửi ChatGPT)

Hiện các phòng của chương 2 dùng hình nền tạm vẽ bằng code (nền tối, cửa sổ, ánh đèn xanh). Muốn đẹp hơn, nhờ ChatGPT vẽ 9 hình nền dưới đây. Không cần vẽ nhân vật mới: chương 2 dùng lại chân dung đã có (Lắc, Tím, thuyền trưởng, bà gác đèn, Pip).

## Prompt dán cho ChatGPT

```
Bạn là họa sĩ pixel art cho game "Beacon Isle" (phong cách bộ Ninja Adventure của Pixel-boy: pixel art, viền tối, màu ấm, mảng màu phẳng).
Vẽ HÌNH NỀN cho các phòng của một trạm nghiên cứu bỏ hoang giữa biển, xây năm 1968, bằng thép và kính, đứng trên các cột cao. Đang là ban đêm; trong mỗi phòng có thể thấy thấp thoáng một ánh đèn xanh lá nhấp nháy (qua cửa sổ hoặc phản chiếu).

QUY TẮC:
1. Khung ngang 16:9 (vd. 1536×864), nhìn ngang hơi chếch từ trên xuống (như cảnh trong game phiêu lưu), KHÔNG có người, KHÔNG có chữ đọc được (biển báo chỉ là mảng màu), không khung viền, không watermark.
2. Pixel art thật: mảng màu phẳng, cạnh sắc, không làm mờ, không chuyển màu mềm, ít màu.
3. Góc dưới bên trái và một dải bên phải nên bớt chi tiết (game đặt bảng chữ ở đó).
4. Mỗi phòng một file, đúng tên, lưu vào tools/source_art/ch2/.

DANH SÁCH:
- bridge.png — buồng lái tàu cứu hộ Aurora: bánh lái, bàn radio, bàn hải đồ, cửa kính lớn nhìn ra biển đêm, xa xa một đốm sáng xanh.
- dock.png — cầu cập tàu bằng thép của trạm, sóng biển, cầu thang lên trạm, đèn xanh trên mái vòm phía trên.
- hub.png — sảnh trung tâm: bảng thông báo, quầy lễ tân cũ, ghế, cốc cà phê, hai cửa dẫn sang hai cánh.
- west.png — cánh Tây bị ngập: hành lang và phòng máy bơm, nước ngập đến gối, ba bồn nước có vạch đo, bảng van.
- east.png — cánh Đông bị ngập: phòng thí nghiệm cũ, bàn thí nghiệm, ba bồn nước có vạch đo, cửa khoang tròn.
- office.png — văn phòng: bàn làm việc, tủ hồ sơ, máy tính đời cũ, bảng lịch trực trên tường.
- lockers.png — phòng tủ đồ: một dãy 8 tủ kim loại, ghế băng, hộp đồ thất lạc.
- dome.png — mái vòm ăng-ten: trần kính lộ trời sao, tấm kính lớn đặt đứng giữa phòng có lưới đèn tròn, hai đĩa ăng-ten.
- transmitter.png — phòng máy phát: cỗ máy lớn nhiều dây cáp màu, đồng hồ áp suất, bàn phím, đèn báo.

Làm xong mỗi hình thì đưa file PNG, rồi làm tiếp đến hết. Cuối cùng liệt kê lại tên các file.
```

## Sau khi có hình

Đưa các file vào `tools/source_art/ch2/` trên nhánh đang làm (hoặc gửi trong chat). Mình sẽ thu nhỏ về đúng cỡ, đặt vào `client/public/assets/ch2/rooms/` và thêm tên phòng vào `manifest.json` trong thư mục đó; phòng nào có hình thì game tự dùng hình đó thay hình tạm.
