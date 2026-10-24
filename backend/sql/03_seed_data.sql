-- =========================================================================================
-- DỰ ÁN: HỆ THỐNG QUẢN LÝ VÀ HỌC TRỰC TUYẾN TỰ ĐỘNG HÓA CHO TRUNG TÂM ĐÀO TẠO LÁI XE (LMS)
-- TẬP TIN: 03_seed_data.sql
-- MỤC ĐÍCH: Dữ liệu hạt giống khởi tạo ban đầu (Seed Data)
-- GỒM CÓ:
--   1. Danh mục VaiTro (ADMIN, TEACHER, STUDENT)
--   2. Tài khoản Quản trị viên mặc định (Mật khẩu: Admin@123456)
--   3. Tài khoản Giáo viên mẫu
--   4. Danh mục Khóa học theo hạng GPLX (B1, B2, C)
--   5. Khung chương trình và danh mục bài giảng mẫu theo chuẩn Bộ GTVT
--   6. Lớp học mẫu và phân công giáo viên
--   7. Học viên mẫu và tiến độ học tập thử nghiệm
-- =========================================================================================

USE QL_DaoTaoLaiXe;
GO

SET NOCOUNT ON;
BEGIN TRY
    BEGIN TRANSACTION;

    -- =====================================================================================
    -- 1. SEED DỮ LIỆU: VaiTro
    -- =====================================================================================
    IF NOT EXISTS (SELECT 1 FROM dbo.VaiTro WHERE MaVaiTro = N'ADMIN')
        INSERT INTO dbo.VaiTro (MaVaiTro, TenVaiTro, MoTa) VALUES (N'ADMIN', N'Quản trị viên', N'Toàn quyền quản trị hệ thống, người dùng, đào tạo và báo cáo');

    IF NOT EXISTS (SELECT 1 FROM dbo.VaiTro WHERE MaVaiTro = N'TEACHER')
        INSERT INTO dbo.VaiTro (MaVaiTro, TenVaiTro, MoTa) VALUES (N'TEACHER', N'Giáo viên đào tạo', N'Giảng viên phụ trách lớp học, giám sát học viên và theo dõi tiến độ đào tạo');

    IF NOT EXISTS (SELECT 1 FROM dbo.VaiTro WHERE MaVaiTro = N'STUDENT')
        INSERT INTO dbo.VaiTro (MaVaiTro, TenVaiTro, MoTa) VALUES (N'STUDENT', N'Học viên', N'Học viên tham gia học trực tuyến, xem video bài giảng và theo dõi tiến độ cá nhân');

    -- =====================================================================================
    -- 2. SEED DỮ LIỆU: NguoiDung (Admin & Giáo viên mẫu)
    -- Mật khẩu mặc định: 'Admin@123456' (Hash bcrypt chuẩn: $2a$10$lBAe1XuyxO3.F0SlnADFEuW/xhUnlVHDCIL6z0.2ol7UhQShybBQ6)
    -- =====================================================================================
    DECLARE @BcryptHashDefault NVARCHAR(255) = N'$2a$10$lBAe1XuyxO3.F0SlnADFEuW/xhUnlVHDCIL6z0.2ol7UhQShybBQ6';

    -- Super Admin
    IF NOT EXISTS (SELECT 1 FROM dbo.NguoiDung WHERE TenDangNhap = N'admin')
    BEGIN
        INSERT INTO dbo.NguoiDung (TenDangNhap, MatKhauHash, HoVaTen, SoCCCD, SoDienThoai, Email, MaVaiTro, TrangThai, DaXoa)
        VALUES (N'admin', @BcryptHashDefault, N'Quản Trị Viên Hệ Thống', N'001090000001', N'0901234567', N'admin@laixepro.edu.vn', N'ADMIN', 1, 0);
    END

    -- Giáo viên 1: Thầy Nguyễn Văn An
    IF NOT EXISTS (SELECT 1 FROM dbo.NguoiDung WHERE TenDangNhap = N'gv_nguyenvana')
    BEGIN
        INSERT INTO dbo.NguoiDung (TenDangNhap, MatKhauHash, HoVaTen, SoCCCD, SoDienThoai, Email, MaVaiTro, TrangThai, DaXoa)
        VALUES (N'gv_nguyenvana', @BcryptHashDefault, N'Nguyễn Văn An', N'001085012345', N'0912345678', N'nguyenvanan@laixepro.edu.vn', N'TEACHER', 1, 0);
    END

    -- Giáo viên 2: Cô Trần Thị Bình
    IF NOT EXISTS (SELECT 1 FROM dbo.NguoiDung WHERE TenDangNhap = N'gv_tranthib')
    BEGIN
        INSERT INTO dbo.NguoiDung (TenDangNhap, MatKhauHash, HoVaTen, SoCCCD, SoDienThoai, Email, MaVaiTro, TrangThai, DaXoa)
        VALUES (N'gv_tranthib', @BcryptHashDefault, N'Trần Thị Bình', N'001088054321', N'0987654321', N'tranthibinh@laixepro.edu.vn', N'TEACHER', 1, 0);
    END

    -- =====================================================================================
    -- 3. SEED DỮ LIỆU: KhoaHoc (Các hạng bằng đào tạo chuẩn)
    -- =====================================================================================
    IF NOT EXISTS (SELECT 1 FROM dbo.KhoaHoc WHERE MaHangGPLX = N'B11')
    BEGIN
        INSERT INTO dbo.KhoaHoc (MaHangGPLX, TenKhoaHoc, MoTa, TongSoGioLyThuyet, TrangThai, DaXoa)
        VALUES (N'B11', N'Đào tạo Lái xe Hạng B1 (Số tự động)', N'Dành cho người lái xe số tự động chở người đến 9 chỗ, không hành nghề lái xe', 136.00, 1, 0);
    END

    IF NOT EXISTS (SELECT 1 FROM dbo.KhoaHoc WHERE MaHangGPLX = N'B2')
    BEGIN
        INSERT INTO dbo.KhoaHoc (MaHangGPLX, TenKhoaHoc, MoTa, TongSoGioLyThuyet, TrangThai, DaXoa)
        VALUES (N'B2', N'Đào tạo Lái xe Hạng B2 (Số sàn & Số tự động)', N'Dành cho người lái xe chở người đến 9 chỗ, xe tải dưới 3.5 tấn, được phép hành nghề lái xe', 168.00, 1, 0);
    END

    IF NOT EXISTS (SELECT 1 FROM dbo.KhoaHoc WHERE MaHangGPLX = N'C')
    BEGIN
        INSERT INTO dbo.KhoaHoc (MaHangGPLX, TenKhoaHoc, MoTa, TongSoGioLyThuyet, TrangThai, DaXoa)
        VALUES (N'C', N'Đào tạo Lái xe Hạng C (Xe tải hạng nặng)', N'Dành cho người lái xe tải trên 3.5 tấn, máy kéo một rơ moóc', 252.00, 1, 0);
    END

    -- =====================================================================================
    -- 4. SEED DỮ LIỆU: BaiGiang (Khung bài giảng mẫu chuẩn quy định cho Hạng B2)
    -- =====================================================================================
    DECLARE @MaKhoaHocB2 INT;
    SELECT @MaKhoaHocB2 = MaKhoaHoc FROM dbo.KhoaHoc WHERE MaHangGPLX = N'B2';

    IF @MaKhoaHocB2 IS NOT NULL AND NOT EXISTS (SELECT 1 FROM dbo.BaiGiang WHERE MaKhoaHoc = @MaKhoaHocB2)
    BEGIN
        -- Môn 1: Pháp luật giao thông đường bộ
        INSERT INTO dbo.BaiGiang (MaKhoaHoc, MonHoc, TenBaiGiang, SoThuTu, DuongDanVideo, ThoiLuongPhut, TrangThai, DaXoa)
        VALUES 
        (@MaKhoaHocB2, N'Pháp luật giao thông đường bộ', N'Bài 1: Khái niệm và quy tắc giao thông đường bộ cơ bản', 1, N'/videos/b2_phapluat_bai1.mp4', 45, 1, 0),
        (@MaKhoaHocB2, N'Pháp luật giao thông đường bộ', N'Bài 2: Tốc độ xe chạy và khoảng cách an toàn trên đường', 2, N'/videos/b2_phapluat_bai2.mp4', 45, 1, 0),
        (@MaKhoaHocB2, N'Pháp luật giao thông đường bộ', N'Bài 3: Quy tắc nhường đường tại nơi giao nhau và đường dốc', 3, N'/videos/b2_phapluat_bai3.mp4', 45, 1, 0),
        (@MaKhoaHocB2, N'Pháp luật giao thông đường bộ', N'Bài 4: Hệ thống biển báo hiệu đường bộ và vạch kẻ đường', 4, N'/videos/b2_phapluat_bai4.mp4', 60, 1, 0);

        -- Môn 2: Đạo đức người lái xe và văn hóa giao thông
        INSERT INTO dbo.BaiGiang (MaKhoaHoc, MonHoc, TenBaiGiang, SoThuTu, DuongDanVideo, ThoiLuongPhut, TrangThai, DaXoa)
        VALUES 
        (@MaKhoaHocB2, N'Đạo đức người lái xe & Văn hóa giao thông', N'Bài 1: Đạo đức, trách nhiệm và tâm lý của người lái xe', 1, N'/videos/b2_daoduc_bai1.mp4', 40, 1, 0),
        (@MaKhoaHocB2, N'Đạo đức người lái xe & Văn hóa giao thông', N'Bài 2: Văn hóa ứng xử văn minh và phòng chống nồng độ cồn', 2, N'/videos/b2_daoduc_bai2.mp4', 40, 1, 0);

        -- Môn 3: Kỹ thuật lái xe ô tô
        INSERT INTO dbo.BaiGiang (MaKhoaHoc, MonHoc, TenBaiGiang, SoThuTu, DuongDanVideo, ThoiLuongPhut, TrangThai, DaXoa)
        VALUES 
        (@MaKhoaHocB2, N'Kỹ thuật lái xe', N'Bài 1: Vị trí ngồi, cách cầm vô lăng và phương pháp phanh', 1, N'/videos/b2_kythuat_bai1.mp4', 50, 1, 0),
        (@MaKhoaHocB2, N'Kỹ thuật lái xe', N'Bài 2: Kỹ thuật lùi xe, ghép xe vào nơi đỗ dọc và ngang', 2, N'/videos/b2_kythuat_bai2.mp4', 60, 1, 0),
        (@MaKhoaHocB2, N'Kỹ thuật lái xe', N'Bài 3: Xử lý tình huống nguy hiểm trên đường đèo dốc và sương mù', 3, N'/videos/b2_kythuat_bai3.mp4', 45, 1, 0);

        -- Môn 4: Cấu tạo và sửa chữa thông thường
        INSERT INTO dbo.BaiGiang (MaKhoaHoc, MonHoc, TenBaiGiang, SoThuTu, DuongDanVideo, ThoiLuongPhut, TrangThai, DaXoa)
        VALUES 
        (@MaKhoaHocB2, N'Cấu tạo và sửa chữa', N'Bài 1: Cấu tạo tổng thể ô tô và nguyên lý hoạt động của động cơ', 1, N'/videos/b2_cautao_bai1.mp4', 45, 1, 0),
        (@MaKhoaHocB2, N'Cấu tạo và sửa chữa', N'Bài 2: Nhận biết hư hỏng thông thường, thay lốp dự phòng và kiểm tra ắc quy', 2, N'/videos/b2_cautao_bai2.mp4', 45, 1, 0);

        -- Môn 5: Giải các thế sa hình
        INSERT INTO dbo.BaiGiang (MaKhoaHoc, MonHoc, TenBaiGiang, SoThuTu, DuongDanVideo, ThoiLuongPhut, TrangThai, DaXoa)
        VALUES 
        (@MaKhoaHocB2, N'Giải các thế sa hình', N'Bài 1: Nguyên tắc quyền ưu tiên và thứ tự xe đi trong sa hình', 1, N'/videos/b2_sahin_bai1.mp4', 60, 1, 0),
        (@MaKhoaHocB2, N'Giải các thế sa hình', N'Bài 2: Hướng dẫn phân tích 11 bài thi sát hạch sa hình thực tế', 2, N'/videos/b2_sahin_bai2.mp4', 60, 1, 0);
    END

    -- =====================================================================================
    -- 5. SEED DỮ LIỆU: LopHoc (Lớp mẫu Khóa 45 Hạng B2)
    -- =====================================================================================
    DECLARE @MaGVAn INT;
    SELECT @MaGVAn = MaNguoiDung FROM dbo.NguoiDung WHERE TenDangNhap = N'gv_nguyenvana';

    IF @MaKhoaHocB2 IS NOT NULL AND NOT EXISTS (SELECT 1 FROM dbo.LopHoc WHERE MaLopHocCode = N'K45-B2-01')
    BEGIN
        INSERT INTO dbo.LopHoc (MaLopHocCode, TenLopHoc, MaKhoaHoc, MaGiaoVienPhuTrach, NgayKhaiGiang, NgayBeGiang, TrangThai, DaXoa)
        VALUES (N'K45-B2-01', N'Lớp Đào tạo B2 - Khóa 45 (Nhóm 01)', @MaKhoaHocB2, @MaGVAn, '2026-10-01', '2026-12-31', N'Đang đào tạo', 0);
    END

    -- =====================================================================================
    -- 6. SEED DỮ LIỆU: Học viên mẫu và Ghi danh vào lớp
    -- =====================================================================================
    DECLARE @MaLopHocB2 INT;
    SELECT @MaLopHocB2 = MaLopHoc FROM dbo.LopHoc WHERE MaLopHocCode = N'K45-B2-01';

    -- Học viên 1: Lê Quang Cường
    IF NOT EXISTS (SELECT 1 FROM dbo.NguoiDung WHERE TenDangNhap = N'hv_lequangc')
    BEGIN
        INSERT INTO dbo.NguoiDung (TenDangNhap, MatKhauHash, HoVaTen, SoCCCD, SoDienThoai, Email, MaVaiTro, TrangThai, DaXoa)
        VALUES (N'hv_lequangc', @BcryptHashDefault, N'Lê Quang Cường', N'079099001122', N'0933112233', N'cuong.le@gmail.com', N'STUDENT', 1, 0);

        DECLARE @MaHVC INT = SCOPE_IDENTITY();
        IF @MaLopHocB2 IS NOT NULL
        BEGIN
            INSERT INTO dbo.HocVienLopHoc (MaHocVien, MaLopHoc, NgayGhiDanh, TrangThaiHocTap, DaXoa)
            VALUES (@MaHVC, @MaLopHocB2, '2026-10-01', N'Đang học', 0);

            -- Tạo tiến độ học tập mẫu: đã học hoàn thành một số bài
            INSERT INTO dbo.TienDoHocTap (MaHocVien, MaBaiGiang, ThoiGianHocGiay, DaHoanThanh, LanHocCuoi, NgayCapNhat)
            SELECT 
                @MaHVC,
                b.MaBaiGiang,
                CASE WHEN b.SoThuTu <= 2 THEN b.ThoiLuongPhut * 60 ELSE 1200 END,
                CASE WHEN b.SoThuTu <= 2 THEN 1 ELSE 0 END,
                GETDATE(),
                GETDATE()
            FROM dbo.BaiGiang b
            WHERE b.MaKhoaHoc = @MaKhoaHocB2;
        END
    END

    -- Học viên 2: Phạm Thị Dung
    IF NOT EXISTS (SELECT 1 FROM dbo.NguoiDung WHERE TenDangNhap = N'hv_phamthid')
    BEGIN
        INSERT INTO dbo.NguoiDung (TenDangNhap, MatKhauHash, HoVaTen, SoCCCD, SoDienThoai, Email, MaVaiTro, TrangThai, DaXoa)
        VALUES (N'hv_phamthid', @BcryptHashDefault, N'Phạm Thị Dung', N'079099003344', N'0944556677', N'dung.pham@gmail.com', N'STUDENT', 1, 0);

        DECLARE @MaHVD INT = SCOPE_IDENTITY();
        IF @MaLopHocB2 IS NOT NULL
        BEGIN
            INSERT INTO dbo.HocVienLopHoc (MaHocVien, MaLopHoc, NgayGhiDanh, TrangThaiHocTap, DaXoa)
            VALUES (@MaHVD, @MaLopHocB2, '2026-10-01', N'Đang học', 0);

            -- Tạo tiến độ học tập mẫu khởi đầu
            INSERT INTO dbo.TienDoHocTap (MaHocVien, MaBaiGiang, ThoiGianHocGiay, DaHoanThanh, LanHocCuoi, NgayCapNhat)
            SELECT 
                @MaHVD,
                b.MaBaiGiang,
                CASE WHEN b.SoThuTu = 1 AND b.MonHoc = N'Pháp luật giao thông đường bộ' THEN 2700 ELSE 0 END,
                CASE WHEN b.SoThuTu = 1 AND b.MonHoc = N'Pháp luật giao thông đường bộ' THEN 1 ELSE 0 END,
                GETDATE(),
                GETDATE()
            FROM dbo.BaiGiang b
            WHERE b.MaKhoaHoc = @MaKhoaHocB2;
        END
    END

    COMMIT TRANSACTION;
    PRINT N'>>> HOÀN THÀNH KHỞI TẠO DỮ LIỆU HẠT GIỐNG BAN ĐẦU (SEED DATA) <<<';
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
    DECLARE @ErrMsg NVARCHAR(4000) = ERROR_MESSAGE();
    RAISERROR(@ErrMsg, 16, 1);
END CATCH;
GO
