# HƯỚNG DẪN SỬ DỤNG & XUẤT BẢN WEB APP QUẢN LÝ GIẢI CẦU LÔNG

Ứng dụng web được xây dựng hoàn toàn không cần server riêng (Serverless), chạy trực tiếp trên **GitHub Pages** và đồng bộ tỉ số thời gian thực qua **Firebase Realtime Database**.

---

## 1. HƯỚNG DẪN CHẠY THỬ TRÊN MÁY (LOCAL DEVELOPMENT)

### 1.1. Chạy môi trường phát triển (Dev Server)
Mở PowerShell hoặc Command Prompt tại thư mục dự án và chạy:
```bash
cmd /c "npm run dev"
```
Mở trình duyệt truy cập: `http://localhost:5173`

### 1.2. Chạy bản kiểm thử (Preview Build)
```bash
cmd /c "npm run build"
cmd /c "npm run preview"
```

---

## 2. HƯỚNG DẪN KẾT NỐI FIREBASE REALTIME DATABASE (MIỄN PHÍ)

Ứng dụng có thể chạy ngoại tuyến (Offline qua LocalStorage), nhưng để khán giả có thể xem tỉ số nhảy trực tiếp từ nhiều thiết bị khác nhau, bạn hãy kết nối Firebase Realtime Database theo các bước đơn giản sau:

1. Truy cập [Firebase Console](https://console.firebase.google.com/) và đăng nhập bằng tài khoản Google.
2. Nhấn **"Add project"** (Thêm dự án) &gt; Đặt tên cho giải đấu (ví dụ: `giai-cau-long-2026`).
3. Sau khi tạo xong, ở menu bên trái chọn **Build** &gt; **Realtime Database** &gt; Nhấn **Create Database**.
4. Chọn vị trí máy chủ (khuyên dùng `Singapore` hoặc `United States`) &gt; Chọn chế độ **Start in test mode**.
5. Chuyển sang tab **Rules** của Realtime Database, đảm bảo cấu hình cho phép đọc và ghi như sau:
   ```json
   {
     "rules": {
       ".read": true,
       ".write": true
     }
   }
   ```
   Nhấn **Publish** để lưu.
6. Lấy đường link Database: Copy đường link có đuôi `https://<ten-du-an>-default-rtdb.firebaseio.com/`.
7. **Kết nối vào Web**:
   - Mở ứng dụng web &gt; Ở góc trên bên phải thanh Header, nhấn vào biểu tượng **Database** (nút *Offline*).
   - Dán URL Database vừa copy vào ô **Database URL** &gt; Nhấn **"Lưu & Kết Nối Database"**.
   - Ngay lập tức trạng thái trên Header sẽ chuyển thành **Realtime** màu xanh lá!

---

## 3. HƯỚNG DẪN XUẤT BẢN LÊN GITHUB PAGES

Dự án đã được thiết lập sẵn 2 phương thức triển khai lên GitHub Pages:

### Cách 1: Tự Động Hóa Qua GitHub Actions (Khuyên Dùng)
1. Đẩy toàn bộ mã nguồn lên repository GitHub của bạn:
   ```bash
   git init
   git add .
   git commit -m "Khoi tao web app quan ly giai cau long"
   git branch -M main
   git remote add origin https://github.com/<tai-khoan-cua-ban>/<ten-repository>.git
   git push -u origin main
   ```
2. Trên trang GitHub của Repository:
   - Vào mục **Settings** &gt; **Pages** (ở cột bên trái).
   - Tại mục **Build and deployment** &gt; **Source**: Chọn **GitHub Actions**.
3. Mỗi khi bạn đẩy code mới lên nhánh `main`, file workflow `.github/workflows/deploy.yml` sẽ tự động build và xuất bản trang web của bạn sau khoảng 1-2 phút.
4. Đường link trang web của bạn sẽ có dạng: `https://<tai-khoan-cua-ban>.github.io/<ten-repository>/`

### Cách 2: Triển Khai Thủ Công 1-Click Bằng Lệnh
Chỉ cần chạy lệnh:
```bash
cmd /c "npm run deploy"
```
Hệ thống sẽ tự động build thư mục `dist` và đẩy thẳng lên nhánh `gh-pages` trên GitHub.

---

## 4. HƯỚNG DẪN DÀNH CHO BAN TỔ CHỨC / QUẢN TRỊ VIÊN (ADMIN)

### 4.1. Đăng Nhập Quản Trị Bằng Mã PIN
- Nhấn vào nút **"Đăng Nhập Admin"** trên thanh Header.
- Nhập mã PIN mặc định ban đầu: `123456`.
- Sau khi đăng nhập thành công, bạn sẽ được cấp toàn quyền quản trị và các tab quản lý sẽ xuất hiện.
- Bạn có thể nhấn vào nút **"Quản Trị Viên"** &gt; chọn **"Đổi Mã PIN Quản Trị"** để thay đổi mã bảo mật bất cứ lúc nào.

### 4.2. Quản Lý Nội Dung Thi Đấu
- Hệ thống đã tạo sẵn 3 nội dung mặc định: **Đôi nam**, **Đôi nam nữ**, **Đôi nữ**.
- Bạn có thể bấm nút **"Thêm Nội Dung"** để tạo thêm các nội dung khác (Đơn nam, Đơn nữ...).
- Có thể đổi tên hoặc xóa nội dung bằng biểu tượng bút chì/thùng rác.

### 4.3. Cấu Hình Thể Thức Linh Hoạt (Rules Configurator)
- Bên cạnh mỗi nội dung, nhấn vào biểu tượng **Thanh Gạt (Sliders)** để mở bảng thể thức.
- Bạn có thể tùy biến linh hoạt cho từng giai đoạn:
  - **Vòng bảng**: Đánh 1 hiệp chạm 31 điểm (hoặc 3 hiệp 21 điểm).
  - **Vòng loại / Tứ kết**: Tùy chỉnh số hiệp và số điểm.
  - **Bán kết / Chung kết / Tranh hạng 3**: Tùy chỉnh số hiệp và số điểm.
  - Tùy chọn bật/tắt luật **Deuce** (cách 2 điểm, trần tối đa 30 điểm).

### 4.4. Thêm Bảng & Nhập Đội Thi Đấu
- Chuyển sang tab **"Quản Lý Đội & Bảng"**:
  - Chọn bảng đấu (ví dụ: Bảng A, Bảng B) hoặc bấm **"Thêm Bảng Mới"**.
  - Bấm **"Thêm Đội Vào Bảng"**:
    - Nhập họ tên VĐV 1, họ tên VĐV 2 (nếu đánh đôi).
    - Nhập Tên đội / Tên cặp đôi (nếu để trống hệ thống sẽ tự ghép tên 2 VĐV).
    - Nhập CLB / Đơn vị.
  - Có thể chỉnh sửa thông tin thành viên hoặc xóa đội bất kỳ lúc nào.

### 4.5. Xếp Trận Random Tự Động & Chỉnh Sửa Lịch Đấu
- Chuyển sang tab **"Bốc Thăm & Sắp Lịch"**:
  - Nhấn nút **"Xếp Trận Random Tự Động"**: Hệ thống sẽ tự động áp dụng thuật toán xoay vòng tròn và xáo trộn ngẫu nhiên toàn bộ các cặp đấu, tự sinh mã trận, phân bổ sân và giờ thi đấu.
  - **Chỉnh sửa cặp đấu theo ý muốn**:
    - Nhấn nút **Mũi tên 2 chiều** để đổi chỗ vị trí 2 đội.
    - Nhấn biểu tượng **Bút chì** để đổi đội A hoặc đội B qua menu chọn, đổi sân đấu hoặc dời giờ thi đấu.
    - Có thể thêm trận đấu bổ sung bằng nút **"Thêm Trận Thủ Công"**.

### 4.6. Bàn Nhập Điểm Trực Tiếp (Live Scoring)
- Nhấn nút **"Nhập Điểm"** tại bất kỳ trận đấu nào:
  - Bấm nút `+` hoặc `-` để tăng giảm điểm số nhanh chóng.
  - Hoặc gõ trực tiếp số điểm vào ô hiển thị.
  - Hệ thống tự động kiểm tra điều kiện kết thúc set/trận theo đúng thể thức đã cấu hình (ví dụ: chạm 31 điểm là thắng).
  - Khi trận đấu có kết quả, hệ thống tự động bắn **pháo hoa chúc mừng** và đổi trạng thái thành *Hoàn thành*.
  - Nhấn **"Lưu Điểm Số & Cập Nhật Realtime"** để đồng bộ kết quả tức thì đến tất cả người xem!

### 4.7. Nhập Thủ Công Các Đội Vô Vòng Trong (Knockout)
- Sau khi vòng bảng hoàn thành, chuyển sang tab **"Cài Đặt Vòng Trong"**:
  - Nhấn **"Thiết Lập Nhánh Bán Kết & Chung Kết"**:
    - Bán kết 1: Chọn đội Nhất bảng A vs Nhì bảng B.
    - Bán kết 2: Chọn đội Nhất bảng B vs Nhì bảng A.
  - Nhấn **"Khởi Tạo Nhánh Knockout"**.
  - **Cơ chế tự động chuyển nhánh**: Khi bạn nhập điểm xong cho 2 trận Bán kết, hệ thống sẽ **tự động điền 2 đội thắng vào trận Chung Kết** và **2 đội thua vào trận Tranh Hạng 3-4**!

---

## 5. HƯỚNG DẪN DÀNH CHO NGƯỜI DÙNG & KHÁN GIẢ

1. **Tra cứu & Tìm kiếm thông minh**:
   - Gõ tên Vận động viên, tên Đội, tên Bảng, mã trận hoặc tên Sân vào thanh tìm kiếm ở Header để lọc kết quả tức thời.
2. **Xem Bảng Xếp Hạng Vòng Bảng**:
   - Chuyển sang tab **"Bảng Xếp Hạng Vòng Bảng"** để xem thứ hạng, hiệu số set, hiệu số điểm và các đội xuất sắc giành quyền vào vòng trong.
3. **Xem Lịch & Tỉ Số Trực Tiếp**:
   - Chuyển sang tab **"Lịch & Tỉ Số"**: Theo dõi các trận đấu đang diễn ra, lọc theo từng sân đấu cụ thể. Tỉ số sẽ tự động cập nhật ngay trên màn hình khi ban tổ chức ghi điểm.
4. **Xem Sơ Đồ Cây Nhánh Đấu Vòng Trong**:
   - Chuyển sang tab **"Sơ Đồ Nhánh Knockout"** để theo dõi lộ trình thi đấu từ Bán kết đến Chung kết, đồng thời xem lễ vinh danh nhà Vô địch sau giải đấu.
