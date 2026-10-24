# QUY CHUẨN KỸ NĂNG & QUYỀN HẠN QUẢN TRỊ VIÊN (ADMIN SKILLS)

Tài khoản **Admin** là cấp quản trị cao nhất của Hệ thống Đào tạo & E-Learning Lái xe, nắm giữ toàn quyền **Thêm, Sửa, Xóa, Cập nhật** và điều phối toàn bộ dữ liệu trên hệ thống.

---

## 1. PHÂN HỆ HỌC VIÊN (`/hocvien`)

Quản trị viên có toàn quyền kiểm soát vòng đời của học viên từ lúc nhập học đến khi hoàn thành khóa đào tạo:

### 1.1. Thêm Học Viên Mới
- **Thêm thủ công:** Admin có quyền tạo tài khoản học viên mới với đầy đủ thông tin:
  - Họ và tên học viên
  - Tên đăng nhập (Username duy nhất)
  - Mật khẩu khởi tạo ban đầu (Mặc định mã hóa an toàn bcrypt)
  - Số CCCD / CMND (Dùng để định danh và tra cứu GPLX)
  - Số điện thoại liên hệ
  - Email nhận thông báo
- **Nạp tự động hàng loạt:** Nạp trực tiếp danh sách học viên qua tính năng đọc và bóc tách tệp **Báo cáo 1 (.XML)** từ Sở GTVT, hệ thống tự động sinh tài khoản và lộ trình học tập.

### 1.2. Sửa & Cập Nhật Thông Tin Học Viên
- Cập nhật thông tin cá nhân: Họ và tên,tên đăng nhập, Số CCCD, Số điện thoại, Email, Mật khẩu, Trạng thái học tập.
- Thay đổi trạng thái học tập: **Đang học (Hoạt động)** hoặc **Tạm khóa tài khoản**.
- Reset/Khôi phục hoặch đổi mật khẩu đăng nhập cho học viên khi có yêu cầu.

### 1.3. Xóa Học Viên
- Hỗ trợ xóa học viên với cơ chế **Xóa mềm (Soft Delete - `DaXoa = 1`)**:
  - Ẩn học viên khỏi danh sách hiển thị lớp học.
  - Bảo lưu toàn bộ lịch sử điểm danh, thời gian tích lũy e-learning và bài thi trong cơ sở dữ liệu phục vụ đối soát, thanh tra.
- Hộp thoại cảnh báo xác nhận trước khi thực hiện xóa.

### 1.4. Tra Cứu & Theo Dõi Tiến Độ
- Tìm kiếm nhanh học viên theo Họ tên, Mã học viên (#ID), CCCD, Tên đăng nhập, Số điện thoại.
- Lọc theo khóa học, phân trang linh hoạt (10/20/50 học viên/trang).
- Xem báo cáo chi tiết tiến độ học tập: Tổng số giờ đã học, số bài giảng đã hoàn thành, tỷ lệ đạt điều kiện thi sát hạch.

### 1.5. Xem Chi Tiết Bài Học & Thời Gian Học Khi Nhấp Vào Ảnh Hoặc Tên Học Viên
- **Thao tác tương tác nhanh:** Khi Quản trị viên nhấp (click) trực tiếp vào **ảnh đại diện (Avatar)** hoặc **Họ và tên** của học viên trong danh sách:
  - Hệ thống sẽ lập tức mở **Cửa sổ chi tiết tiến độ học tập (Student Detail Modal)** của học viên đó mà không cần chuyển trang.
  - **Nội dung hiển thị chi tiết gồm:**
    - Thông tin định danh: Họ tên, Mã số học viên (#ID), CCCD, Số điện thoại, Lớp đào tạo, Khóa học và Hạng GPLX.
    - 3 Thẻ chỉ số tổng hợp: Tổng số bài giảng đã hoàn thành / Tổng số bài trong khung, Tổng thời gian đã học thực tế (tính theo giờ, phút, giây) so với thời lượng chuẩn của trung tâm, Tỷ lệ tiến độ tích lũy (%).
    - **Bảng chi tiết từng bài giảng đã học:**
      - Tên bài giảng và số thứ tự bài học trong chương trình.
      - Môn học lý thuyết (Pháp luật GTĐB, Đạo đức người lái xe, Kỹ thuật lái xe, Cấu tạo & Sửa chữa, Nghiệp vụ vận tải,...).
      - Thời lượng quy định chuẩn của bài giảng (phút).
      - **Thời gian học viên đã học thực tế (tính chính xác đến phút và giây)**.
      - Tình trạng học: *Đã hoàn thành* (xanh lá), *Đang học* (vàng kèm % thời lượng đã xem), hoặc *Chưa học*.
      - Lần học cuối cùng ghi nhận trên hệ thống LMS.
    - Thanh tìm kiếm bài học nhanh theo tên bài hoặc môn học.

---

## 2. PHÂN HỆ GIÁO VIÊN (`/giaovien`)

Quản trị viên quản lý toàn bộ đội ngũ cán bộ, giáo viên phụ trách đào tạo:

### 2.1. Thêm Giáo Viên Mới
- Tạo tài khoản giáo viên giảng dạy mới vào hệ thống:
  - Họ và tên giáo viên
  - Tên đăng nhập
  - Mật khẩu khởi tạo
  - Số CCCD / Thẻ căn cước
  - Số điện thoại
  - Email liên hệ
- *(Lưu ý: Đã lược bỏ trường "Chuyên môn phụ trách - Lý thuyết/Thực hành" để đảm bảo tính linh hoạt khi điều phối giáo viên).*

### 2.2. Sửa & Cập Nhật Thông Tin Giáo Viên
- Chỉnh sửa hồ sơ, Họ và tên,tên đăng nhập, Số CCCD, Số điện thoại, Email, mật khẩu.
- Khóa / Mở khóa tài khoản giáo viên (**Đang giảng dạy** / **Tạm dừng hoạt động**).
- Đổi hoặc thiết lập lại mật khẩu tài khoản giáo viên.

### 2.3. Xóa Giáo Viên
- Thực hiện xóa mềm tài khoản giáo viên (`DaXoa = 1`).
- Kiểm tra ràng buộc an toàn: Nếu giáo viên đang phụ trách khóa đào tạo, hệ thống sẽ cảnh báo để Admin chuyển giao hoặc chỉ định giáo viên thay thế trước khi xóa.

### 2.4. Phân Công & Giám Sát Giảng Dạy
- Phân công giáo viên phụ trách khóa học / lớp học đào tạo thực tế.
- Hỗ trợ tự động hóa phân công giáo viên hàng loạt thông qua việc tải lên tệp **Excel phân công**.
- Theo dõi danh sách các lớp và số lượng học viên dưới quyền quản lý của từng giáo viên.

### 2.5. Xem Khóa Học & Học Viên Phụ Trách Khi Nhấp Vào Ảnh Hoặc Tên Giáo Viên
- **Thao tác tương tác nhanh:** Khi Quản trị viên nhấp (click) trực tiếp vào **ảnh đại diện (Avatar)** hoặc **Họ và tên** của giáo viên trong danh sách:
  - Hệ thống sẽ lập tức mở **Cửa sổ chi tiết phân công giáo viên (Teacher Detail Modal)** hiển thị toàn diện khối lượng công tác giảng dạy của giáo viên đó.
  - **Nội dung hiển thị chi tiết gồm:**
    - Thông tin giáo viên: Họ tên, Mã số (#ID), Tên đăng nhập (@username), CCCD, Số điện thoại, Email và Trạng thái giảng dạy.
    - 2 Thẻ chỉ số tổng hợp: Tổng số khóa/lớp học phụ trách, Tổng số lượng học viên đang trực tiếp hướng dẫn.
    - **Tab 1 - Danh sách Khóa / Lớp học đang phụ trách:**
      - Tên lớp học, Mã lớp học (Code), Tên khóa học, Hạng GPLX.
      - Sĩ số toàn lớp và số lượng học viên do giáo viên này trực tiếp phụ trách trong lớp.
      - Thời gian đào tạo: Ngày khai giảng và Ngày bế giảng dự kiến.
      - Phân định rõ vai trò: Giáo viên chủ nhiệm lớp hay Giáo viên được phân công nhóm học viên qua Excel.
    - **Tab 2 - Danh sách Học viên đang trực tiếp phụ trách:**
      - Liệt kê toàn bộ học viên được phân công cho giáo viên (qua phân công tự động Excel hoặc gán thủ công).
      - Hiển thị Họ tên học viên, Mã số, CCCD, Số điện thoại, Lớp học đang tham gia.
      - Trạng thái học tập của học viên, số lượng bài học đã tham gia và tổng thời gian học viên đã tích lũy.
      - Thanh tìm kiếm học viên trực tiếp theo tên, CCCD hoặc lớp học.

---

## 3. PHÂN HỆ QUẢN LÝ TÀI KHOẢN & PHÂN QUYỀN (`/taikhoan/quanly`)

Nằm trong mục **Tài khoản > Quản lý tài khoản** trên thanh điều hướng, đây là trung tâm kiểm soát an ninh và phân quyền tài khoản tập trung của hệ thống:

### 3.1. Danh Sách & Thống Kê Toàn Bộ Tài Khoản
- Liệt kê toàn bộ các tài khoản đã tạo trên hệ thống từ tất cả các vai trò: **ADMIN** (Quản trị viên), **TEACHER** (Giáo viên), **STUDENT** (Học viên).
- Thanh thống kê nhanh (KPI Cards):
  - Tổng số lượng tài khoản trong cơ sở dữ liệu.
  - Số lượng Quản trị viên (ADMIN).
  - Số lượng Giáo viên (TEACHER).
  - Số lượng Học viên (STUDENT).
- **Tương tác xem nhanh:** Nhấp vào ảnh hoặc tên của tài khoản **Học viên** để mở ngay chi tiết các bài học và thời gian học; nhấp vào tài khoản **Giáo viên** để xem ngay danh sách các khóa học và học viên đang phụ trách.

### 3.2. Phân Quyền Vai Trò (Role Assignment)
- Toàn quyền nâng quyền, hạ quyền hoặc chuyển đổi vai trò cho bất kỳ tài khoản nào:
  - **ADMIN:** Toàn quyền truy cập mọi phân hệ quản trị, tự động hóa, báo cáo, và quản lý người dùng.
  - **TEACHER:** Quyền truy cập các lớp học được phân công, giám sát tiến độ học tập của học viên trực thuộc.
  - **STUDENT:** Quyền truy cập không gian học trực tuyến E-Learning LMS (`/hoc`), xem bài giảng video, làm bài kiểm tra.

### 3.3. Thêm Mới Tài Khoản Đa Vai Trò
- Tạo tài khoản mới trực tiếp với bất kỳ vai trò nào (`ADMIN`, `TEACHER`, `STUDENT`) gồm:
  - Họ và tên người dùng
  - Tên đăng nhập (Username duy nhất)
  - Mật khẩu khởi tạo (Mã hóa bcrypt tự động)
  - Phân quyền vai trò hệ thống
  - Số CCCD/CMND, Số điện thoại, Email liên hệ.

### 3.4. Chỉnh Sửa Thông Tin & Đổi Mật Khẩu Nhanh
- Cho phép sửa đồng thời Họ tên, Tên đăng nhập, Phân quyền vai trò, CCCD, Điện thoại, Email.
- Tùy chọn đặt mật khẩu mới trong form chỉnh sửa (để trống nếu giữ nguyên mật khẩu cũ).
- Nút tác vụ nhanh **Cấp lại mật khẩu (KeyRound)**: Cho phép Admin gán nhanh mật khẩu mới cho người dùng chỉ với 1 click.

### 3.5. Kiểm Soát Đăng Nhập & Xóa Mềm
- **Khóa / Mở khóa tài khoản:** Vô hiệu hóa quyền đăng nhập tức thời (Optimistic update 0ms phản hồi).
- **Xóa mềm (Soft Delete):** Xóa tài khoản khỏi danh sách thao tác nhưng vẫn bảo toàn dữ liệu trong SQL Server phục vụ hậu kiểm.

---

## 4. CÁC PHÂN HỆ LIÊN QUAN KHÁC (THAM CHIẾU)

- **Khóa học (`/khoahoc`):** Thêm, sửa, xóa khóa học thực tế; liên kết khóa học với Khung bài giảng mẫu tương ứng; nạp khóa học tự động từ Báo cáo 1.
- **Bài giảng (`/baigiang`):** Toàn quyền cấu hình Khung chương trình chuẩn (B1, B2, C1,...), thêm sửa xóa Chương, Bài giảng mẫu, video, tài liệu và chỉ tiêu giờ hoàn thành.
- **Tự động hóa (`/tudonghoa`):** Nạp Báo cáo 1 XML và Excel phân công.
- **Báo cáo (`/baocao`):** Xem và xuất thống kê đào tạo theo khóa và theo từng học viên.