# QUY CHUẨN KỸ NĂNG & QUY TRÌNH TỰ ĐỘNG HÓA (AUTOMATION SKILLS)

Phân hệ Tự động hóa (`/tudonghoa`) chịu trách nhiệm bóc tách, chuẩn hóa dữ liệu lớn và tự động phân bổ học viên, lộ trình đào tạo, bài giảng mẫu và giáo viên phụ trách vào Cơ sở dữ liệu SQL Server.

---

## 1. TỰ ĐỘNG HÓA TIẾP NHẬN BÁO CÁO 1 XML (`/tudonghoa/baocao1`)
- **Nguồn dữ liệu:** Tệp XML chuẩn định dạng Báo cáo 1 (`DANG_KY_KHOA_HOC`) từ Sở GTVT (ví dụ: `baocao1.xml`).
- **Quy trình xử lý:**
    1. **Tải lên tệp XML:** Quản trị viên tải tệp XML Báo cáo 1 lên hệ thống.
    2. **Bóc tách thông tin Khóa học:** Trích xuất tự động mã khóa học (`MA_KHOA_HOC`), tên khóa học (`TEN_KHOA_HOC`), hạng đào tạo (`HANG_GPLX`), ngày khai giảng và bế giảng.
    3. **Liên kết Khung bài giảng mẫu tương ứng:** Căn cứ vào hạng GPLX (B số sàn, B số tự động, C,...), hệ thống tự động gán Khung bài giảng chuẩn (ví dụ: Khung B số sàn gồm 8 chương, 32 bài giảng).
    4. **Tự động sinh tài khoản học viên (`STUDENT`):** Tạo tài khoản đăng nhập với Username là Số CCCD/CMND, mật khẩu mặc định được mã hóa bcrypt an toàn.
    5. **Khởi tạo lộ trình học tập (`TienDoHocTap`):** Sinh sẵn toàn bộ bản ghi bài giảng để học viên có thể đăng nhập vào không gian học trực tuyến LMS (`/hoc`) và tích lũy thời gian học ngay lập tức.
    6. **Thông báo kết quả:** Hiển thị thông báo thành công và chuyển hướng đến danh sách khóa học.

---

## 2. TỰ ĐỘNG HÓA PHÂN CÔNG GIÁO VIÊN QUA EXCEL (`/tudonghoa/phancong`)
- **Nguồn dữ liệu:** Tệp bảng tính Excel (`.xlsx`, `.xls`) điển hình như `PHAN_GIAO_VIEN.xlsx` ghi nhận danh sách học viên theo từng giáo viên phụ trách đào tạo (bao gồm các cột Họ tên, Số CMND/CCCD, Số điện thoại, Tên giáo viên phụ trách).
- **Quy trình xử lý chuẩn:**
    1. **Chọn lớp học cần áp dụng phân công:** Quản trị viên lựa chọn khóa / lớp học cần phân công từ danh sách các lớp đang đào tạo trên hệ thống.
    2. **Upload tệp Excel phân công:** Tải tệp Excel phân bổ giáo viên - học viên lên hệ thống.
    3. **Hệ thống tự động phân bổ và kiểm tra đối soát:**
        - Tự động bóc tách từng cặp Học viên - Giáo viên phụ trách trong file Excel.
        - Đối soát từng tên giáo viên với danh sách tài khoản giáo viên (`TEACHER`) trong cơ sở dữ liệu.
        - **Ràng buộc kiểm tra giáo viên bắt buộc:**
            - **Nếu giáo viên được phân cho học viên mà không thấy tài khoản giáo viên đó thì hệ thống sẽ báo lỗi không tìm thấy giáo viên phụ trách:**
                - Báo lỗi rõ ràng danh sách các giáo viên chưa có tài khoản: ví dụ `Không tìm thấy giáo viên phụ trách: "HOÀNG LỘC", "CÔNG VINH". Vui lòng tạo tài khoản giáo viên trước khi phân công!`.
                - Vô hiệu hóa nút lưu phân công và cảnh báo bằng hộp thoại màu đỏ nổi bật.
                - Cung cấp liên kết tắt dẫn sang trang **Quản lý Giáo viên (`/giaovien`)** hoặc **Quản lý Tài khoản (`/taikhoan/quanly`)** để Quản trị viên tiến hành khởi tạo tài khoản giáo viên trước.
    4. **Lưu phân bổ vào CSDL khi toàn bộ giáo viên đều hợp lệ:**
        - Tự động cập nhật giáo viên phụ trách cho từng học viên tương ứng trong lớp học (`HocVienLopHoc.MaGiaoVien`).
        - Cập nhật giáo viên phụ trách chính của lớp học (`LopHoc.MaGiaoVienPhuTrach`).
        - Ghi nhật ký hệ thống (`NhatKyHeThong`) bảo đảm tính minh bạch và truy vết nghiệp vụ.
    5. **Thông báo thành công:**
        - Hiển thị thông báo thành công kèm số lượng học viên đã được phân công và danh sách giáo viên phụ trách.
        - Cập nhật trực quan bảng xem trước (Live Preview) với nhãn xanh "Hợp lệ" và thông tin chi tiết.