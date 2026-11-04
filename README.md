# Ứng Dụng Quản Lý Giải Cầu Lông (Badminton Tournament Manager)

Web app quản lý giải cầu lông hoạt động trên **GitHub Pages**, tích hợp đồng bộ thời gian thực qua **Firebase Realtime Database**.

---

## 🏸 Tính Năng Chính

- **Đa Nội Dung**: Đôi nam, Đôi nam nữ, Đôi nữ, Đơn nam, Đơn nữ... (tùy biến linh hoạt).
- **Vòng Bảng Đánh Vòng Tròn**:
  - Tạo bảng, thêm đội, quản lý danh sách VĐV và CLB.
  - **Nút bấm bốc thăm xếp trận ngẫu nhiên (Random)** tự động sinh toàn bộ lịch đấu cho bảng.
  - Chỉnh sửa đối thủ, đổi sân, dời giờ thi đấu thủ công trực quan.
- **Tùy Biến Thể Thức Toàn Diện**:
  - Chỉnh sửa được thể thức cho từng vòng: Vòng bảng đánh 1c (31đ) hoặc 3c (21đ), vòng loại, tứ kết, bán kết, chung kết, tranh 3-4...
  - Tùy chỉnh điểm chạm, điểm trần tối đa và luật Deuce.
- **Bàn Nhập Điểm Trực Tiếp (Live Scoring)**:
  - Tự động xác định đội chiến thắng theo thể thức.
  - Hiệu ứng pháo hoa mừng chiến thắng.
  - Đồng bộ tỉ số Realtime ngay lập tức đến mọi thiết bị của khán giả.
- **Vòng Loại Trực Tiếp (Knockout)**:
  - Nhập thủ công các đội xuất sắc nhất (Nhất A, Nhì B...) vào Bán kết / Chung kết.
  - Tự động đẩy đội thắng bán kết vào Chung kết, đội thua vào Tranh 3-4.
  - Sơ đồ cây nhánh đấu và bục vinh danh vô địch trực quan.
- **Dành Cho Khán Giả**:
  - Tìm kiếm tức thời theo tên VĐV, tên đội, tên bảng, sân đấu.
  - Xem bảng xếp hạng chuẩn BWF (Thắng > Hiệu số Set > Hiệu số Điểm > Đối đầu).
  - Lọc trận đấu theo sân hoặc trạng thái.
- **Bảo Mật & Phân Quyền**:
  - Đăng nhập quyền Quản trị bằng **Mã PIN / Secret Key** (mặc định ban đầu: `123456`, mã hóa SHA-256 an toàn).
  - Khán giả xem ở chế độ Read-only.
- **Serverless & Không Hard-code**:
  - Lập trình theo hướng đối tượng (OOP) chặt chẽ (`Tournament`, `Category`, `Group`, `Team`, `Player`, `Match`, `MatchRule`).
  - Hoạt động mượt mà trên **GitHub Pages**.

---

## 🚀 Hướng Dẫn Cài Đặt & Chạy

```bash
# Cài đặt thư viện
npm install

# Chạy môi trường phát triển (Dev)
npm run dev

# Chạy kiểm thử các model OOP và thuật toán
npm test

# Build mã nguồn sản phẩm
npm run build

# Xuất bản lên GitHub Pages thủ công
npm run deploy
```

---

## 📖 Tài Liệu Tham Khảo

- [Kế Hoạch Triển Khai Chi Tiết Theo Phase](file:///c:/Users/Duong/Desktop/caulongchithao/KE_HOACH_TRIEN_KHAI.md)
- [Hướng Dẫn Sử Dụng & Kết Nối Firebase](file:///c:/Users/Duong/Desktop/caulongchithao/HUONG_DAN_SU_DUNG.md)
