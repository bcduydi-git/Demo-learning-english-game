# Beacon Isle — 21 ảnh PNG đã tạo

Tạo bằng công cụ imagegen tích hợp. Không sửa repo hoặc code. Các PNG là bản gen gốc được sao chép và đặt đúng tên, chưa thu nhỏ, lượng tử hóa màu hoặc chỉnh từng pixel.

## Những điểm đã kiểm tra
- Có đủ 21 tên file bắt buộc, mở được bằng bộ đọc PNG.
- Mỗi file có kênh alpha và pixel nền alpha=0 thực sự.
- 6 ảnh bước đi có 4 hình ngang; các vật hai trạng thái có 2 hình ngang; storm.png có 4 hình ngang. Số khung xác định qua bố cục trực quan; các ô chưa được căn chỉnh tuyệt đối.
- Không tạo file đi trái riêng: không thêm túi, kẹp tóc hoặc phụ kiện lệch bên; tóc có thể được lật cùng hướng theo cách người dùng đã cho phép.

## Chưa đạt yêu cầu kỹ thuật, cần xử lý trước khi tích hợp
- Đây chưa phải sprite sheet production-ready. Nhân vật còn tỷ lệ đầu lớn hơn yêu cầu người thật và có dao động vị trí/kích thước giữa các khung.
- Đặc biệt lac_walk_down.png, tim_walk_down.png, tim_walk_up.png: khung 2 và 4 còn quá giống nhau, chưa thể hiện rõ hai chân đổi bên. Các hướng khác cũng cần duyệt bằng phát hoạt ảnh.
- Màu không bị giới hạn chính xác ở 16–24. Một số vùng có chuyển sắc và khử răng cưa; alpha bên trong thường 252–254, mép có pixel alpha thấp. Có alpha thật nhưng không thể khẳng định không có quầng viền.
- mast.png xuất ở tỷ lệ 3:1 thay vì 4:1.
- storm.png xuất ở tỷ lệ 3:1 thay vì 16:3; chia 4 thì ô không đúng tỷ lệ 128:96. Cần căn lại từng khung vào ô 4:3, không kéo giãn nhân vật để ép tỷ lệ.
- Các tỷ lệ khác có sai số làm tròn; sheet bước đi rộng 1774 không chia hết cho 4, radio rộng 1891 không chia hết cho 2.
- Cảnh vật có độ chi tiết/mật độ pixel cao hơn Ninja Adventure gốc; cần kiểm tra khi thu nhỏ.
- Đèn Fresnel đã được tạo lại đúng dạng cụm thấu kính; giữ phiên bản cuối.

KIEM_TRA.json ghi kích thước thực, tỷ lệ và thống kê alpha/màu từng file. PROMPTS.json chứa các prompt đã dùng, không chứa nội dung bí mật của truyện.

Không có file bắt buộc nào chưa được tạo. Những điểm trên là các yêu cầu chưa đạt, không phải file còn thiếu.
