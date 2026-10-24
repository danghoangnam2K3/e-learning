# BACKEND SKILLS & DATABASE ARCHITECTURE GUIDE
# Dự án: Hệ thống Quản lý Đào tạo Lái xe & E-Learning (LMS)

## 1. Tech Stack & Architecture (Công nghệ & Kiến trúc cốt lõi)
* **Backend Framework:** NestJS / Node.js (TypeScript)
* **Database & ORM:** Microsoft SQL Server (MS SQL) 
* **Database Logic Execution Rule:** **BẮT BUỘC** sử dụng **Stored Procedures (Thủ tục lưu trữ)** trong SQL Server cho toàn bộ các thao tác ghi dữ liệu bao gồm: Thêm (Insert), Sửa/Cập nhật (Update), Xóa (Delete) và các truy vấn nghiệp vụ phức tạp. Không viết câu lệnh SQL thuần (Raw SQL/Query Builder trực tiếp) trong mã nguồn NestJS cho các thao tác này.
* **Database Naming Convention (Bắt buộc):** Toàn bộ tên Bảng (`Table`) và Cột (`Column`) trong CSDL Microsoft SQL Server **100% sử dụng tiếng Việt không dấu** theo định dạng PascalCase (Ví dụ Bảng: `VaiTro`, `NguoiDung`, `KhoaHoc`, `BaiGiang`, `LopHoc`, `HocVienLopHoc`, `TienDoHocTap`, `NhatKyHeThong`; Ví dụ Cột: `MaNguoiDung`, `TenDangNhap`, `MatKhauHash`, `HoVaTen`, `SoCCCD`, `TrangThai`...).
* **Authentication:** JWT (JSON Web Token) kết hợp Password Hashing (Bcrypt).
* **Architecture Style:** Clean Architecture / Modular Monolith (chia rõ các module: Auth, Automation, Users, Courses, Classes, LMS, Reports).

---

## 2. Coding Standards & Best Practices (Quy chuẩn mã nguồn & Stored Procedures)
* **TypeScript Strict Mode:** Bật chế độ kiểm tra kiểu nghiêm ngặt, hạn chế tối đa sử dụng kiểu `any`.
* **DTO & Validation:** Sử dụng `class-validator` và `class-transformer` cho mọi request body/query params để validate dữ liệu đầu vào trước khi gọi Stored Procedure.
* **Gọi Stored Procedure qua Prisma/TypeORM:** Sử dụng cú pháp gọi stored procedure của ORM (ví dụ: `prisma.$queryRaw` hoặc `dataSource.query('EXEC sp_Name @Param1 = ...')`).
* **Error Handling:** Sử dụng NestJS Exception Filters để bắt lỗi trả về từ SQL Server (Error/RAISERROR từ Stored Procedure) và phản hồi mã lỗi HTTP chuẩn (400, 401, 403, 404, 500) kèm thông điệp tiếng Việt rõ ràng.

---

## 3. Security & Data Principles (Quy chuẩn bảo mật)
* **Client-Side Data Minimization:** Tuyệt đối không lưu trữ các dữ liệu nhạy cảm (như số CCCD, thông tin tài chính cá nhân) vào Local Storage hoặc Session Storage trên trình duyệt ở tầng frontend.
* **RBAC (Role-Based Access Control):** Phân quyền chặt chẽ bằng NestJS Guards/Decorators cho 3 vai trò (`ADMIN`, `TEACHER`, `STUDENT`).

---

## 4. Core Modules & Stored Procedures Mapping (Ánh xạ Module và Thủ tục)
* **Auth Module:**
  * Gọi thủ tục xác thực đăng nhập (`EXEC sp_KiemTraDangNhap @TenDangNhap`).
* **Data Automation Module:**
  * Gọi thủ tục xử lý bóc tách và import dữ liệu hàng loạt từ file XML/Excel (`EXEC sp_NhapDuLieuHocVien @DuLieuJSON`).
* **User Management Module:**
  * Thêm nhân sự/giáo viên: `EXEC sp_ThemNguoiDung`
  * Cập nhật/Khóa tài khoản: `EXEC sp_CapNhatNguoiDung`, `EXEC sp_ChuyenTrangThaiTaiKhoan`
  * Xóa tài khoản: `EXEC sp_XoaNguoiDung`
* **Course & Curriculum Module:**
  * Thêm/Sửa/Xóa danh mục khóa học & bài giảng: `EXEC sp_QuanLyDanhMucKhoaHocVaBaiGiang`
* **Class & Student Management Module:**
  * Quản lý lớp học và phân công: `EXEC sp_QuanLyLopHocVaPhanCong`
* **LMS & Progress Tracking Module:**
  * Cập nhật tiến độ học tập của học viên: `EXEC sp_CapNhatTienDoHocTap`
  * Xem tiến độ học tập (Admin xem toàn cục, Giáo viên xem theo phân công): `EXEC sp_LayTienDoHocTap` (truyền tham số `VaiTro` và `MaNguoiDung` vào thủ tục để lọc dữ liệu ở tầng DB).
* **Reporting Module:**
  * Báo cáo tổng quan khóa học: `EXEC sp_BaoCaoTongQuanKhoaHoc`
  * Báo cáo chi tiết học viên: `EXEC sp_BaoCaoChiTietHocVien`