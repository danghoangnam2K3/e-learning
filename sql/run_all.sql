-- =========================================================================================
-- DỰ ÁN: HỆ THỐNG QUẢN LÝ VÀ HỌC TRỰC TUYẾN TỰ ĐỘNG HÓA CHO TRUNG TÂM ĐÀO TẠO LÁI XE (LMS)
-- TẬP TIN: run_all.sql
-- HƯỚNG DẪN THỰC THI TOÀN BỘ CƠ SỞ DỮ LIỆU
-- =========================================================================================
-- Thứ tự chạy các tập tin SQL trên Microsoft SQL Server Management Studio (SSMS) hoặc sqlcmd:
--
-- 1. [01_schema.sql]            : Tạo CSDL QL_DaoTaoLaiXe, 8 bảng tiếng Việt, PK, FK và Indexes
-- 2. [02_stored_procedures.sql]  : Tạo 100% Stored Procedures nghiệp vụ có Try-Catch và Transaction
-- 3. [03_seed_data.sql]          : Nạp dữ liệu hạt giống: Admin, Giáo viên, Khóa học, Bài giảng mẫu
--
-- LỆNH CHẠY BẰNG SQLCMD TRÊN POWERSHELL / CMD (Lưu ý cờ -I để bật Quoted Identifiers):
--   sqlcmd -S localhost\SQL2019 -U sa -P "Nam@07112003" -I -i "01_schema.sql"
--   sqlcmd -S localhost\SQL2019 -U sa -P "Nam@07112003" -I -i "02_stored_procedures.sql"
--   sqlcmd -S localhost\SQL2019 -U sa -P "Nam@07112003" -I -i "03_seed_data.sql"
-- =========================================================================================

PRINT N'Vui lòng thực thi lần lượt 3 tệp tin: 01_schema.sql, 02_stored_procedures.sql, 03_seed_data.sql theo đúng thứ tự.';
GO
