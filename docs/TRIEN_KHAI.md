# Đưa game lên mạng để hai máy cùng chơi

Game gồm **một máy chủ nhỏ (Node.js)** vừa phát trang web vừa nối hai người chơi. Hai máy chỉ cần mở **cùng một địa chỉ**. Có 3 cách, xếp theo mức khuyên dùng.

---

## Cách A — Render.com (khuyên dùng, miễn phí, chơi ở hai nơi khác nhau)

Bạn làm một lần, sau đó cả hai chỉ cần mở một đường link dạng `https://beacon-isle-xxxx.onrender.com`.

1. Đăng ký tài khoản tại **render.com** (có thể "Sign in with GitHub").
2. Trên Render: **New +** → **Blueprint**.
3. Kết nối GitHub và chọn repo `bcduydi-git/Demo-learning-english-game`, nhánh **`main`**. Ô **Blueprint Name** đặt gì cũng được (vd. `beacon-isle`).
4. Render đọc file `render.yaml` có sẵn → bấm **Deploy Blueprint** (hoặc **Apply**). Đợi khoảng 3–5 phút, vào dịch vụ **beacon-isle**, đến khi trạng thái là **Live**.
5. Mở link ở góc trên trang dịch vụ → màn hình **BEACON ISLE** hiện ra là xong. Gửi link cho người kia.

Nếu Render báo không tìm thấy `render.yaml`: kiểm tra đã chọn đúng repo và nhánh `main`, rồi vào **Blueprints** → chọn Blueprint đó → **Manual Sync**. Nếu bước build báo lỗi đỏ, mở tab **Logs** và chụp màn hình phần lỗi.

Điều cần biết về gói miễn phí của Render (theo tài liệu Render, có thể thay đổi):

- Không có ai dùng trong 15 phút thì máy chủ **"ngủ"**. Lần mở sau mất **khoảng 1 phút** để thức dậy. Trong lúc đang chơi, máy chủ không ngủ vì game liên tục gửi dữ liệu.
- Khi ngủ hoặc khởi động lại, ổ đĩa của máy chủ bị xoá. Game đã tính trước việc này: **trình duyệt của mỗi người giữ bản lưu** và tự dựng lại phòng khi vào lại. Hãy chơi tiếp trên cùng trình duyệt đã chơi.
- Mỗi tháng có 750 giờ miễn phí, thừa cho 2–5 người chơi.
- Mình chưa thể tự kiểm tra việc Render có đòi thẻ tín dụng khi đăng ký hay không. Nếu Render yêu cầu thẻ hoặc trả phí mà bạn không muốn, hãy dùng Cách B hoặc C.

Cập nhật game: mỗi khi có code mới được gộp vào nhánh `main`, Render tự build lại (`autoDeploy`). Mỗi lần build mất vài phút; trong lúc đó link vẫn chạy bản cũ.

---

## Cách B — Chạy trên máy của một người, chơi cùng Wi-Fi

Hợp khi hai người ngồi cùng nhà.

1. Cài **Node.js bản LTS** từ nodejs.org (Next → Next → Finish).
2. Tải code về máy: trên GitHub bấm **Code → Download ZIP**, giải nén.
3. Chạy file:
   - Windows: nhấp đúp **`CHOI_TREN_MAY_WINDOWS.bat`**.
   - Mac: nhấp chuột phải **`CHOI_TREN_MAY_MAC.command`** → Open.
   Lần đầu sẽ mất vài phút để cài đặt. Trình duyệt tự mở `http://localhost:8080`.
4. Cửa sổ đen hiện dòng `same Wi-Fi: http://192.168.x.x:8080`. Máy thứ hai mở **đúng địa chỉ đó**. Nếu Windows hỏi cho phép mạng, chọn **Allow**.
5. Giữ cửa sổ đen mở trong lúc chơi. Tiến độ được lưu trong thư mục `data/`.

## Cách C — Chạy trên máy của một người, chơi ở hai nơi khác nhau (không cần tài khoản)

Làm như Cách B. Khi game đã chạy, mở thêm một cửa sổ dòng lệnh trong thư mục game và gõ:

```
npx cloudflared tunnel --url http://localhost:8080
```

Sau vài giây sẽ hiện một link dạng `https://xxxx.trycloudflare.com`. Gửi link đó cho người kia; bạn cũng mở link đó. Link đổi mỗi lần chạy lại. Đây là dịch vụ thử nghiệm miễn phí của Cloudflare, không đảm bảo luôn hoạt động.

---

## Chi phí

- Code, đồ hoạ, âm thanh: không phụ thuộc dịch vụ trả phí nào.
- Giọng đọc tiếng Anh dùng **giọng có sẵn trong trình duyệt/hệ điều hành** (miễn phí, chạy trên máy người chơi). Nút 🎙 dùng tính năng nhận diện giọng nói có sẵn của Chrome/Edge (miễn phí, Google/Microsoft xử lý).
- Máy chủ: miễn phí với Render Free hoặc chạy trên máy nhà.

## Chạy cho người phát triển

```
npm install
npm run dev        # chế độ phát triển: http://localhost:5173 (tự tải lại khi sửa code)
npm run build      # đóng gói vào dist/
npm start          # máy chủ thật: http://localhost:8080
npm test           # kiểm thử luật chơi
npm run art        # vẽ lại đồ hoạ tạm (cần Python 3 + Pillow + numpy)
npm run e2e             # chơi tự động cả màn với 2 trình duyệt (cần npm start chạy sẵn)
npm run e2e:reconnect   # kiểm thử kết nối lại / máy chủ khởi động lại
```
