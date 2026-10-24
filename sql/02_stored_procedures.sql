-- =========================================================================================
-- DỰ ÁN: HỆ THỐNG QUẢN LÝ VÀ HỌC TRỰC TUYẾN TỰ ĐỘNG HÓA CHO TRUNG TÂM ĐÀO TẠO LÁI XE (LMS)
-- TẬP TIN: 02_stored_procedures.sql
-- MỤC ĐÍCH: Khởi tạo toàn bộ Hệ thống Thủ tục Lưu trữ (Stored Procedures) nghiệp vụ
-- NGUYÊN TẮC: 
--   1. 100% Thao tác dữ liệu thông qua Stored Procedure.
--   2. Bọc toàn bộ logic trong khối TRY...CATCH.
--   3. Sử dụng BEGIN TRANSACTION / COMMIT / ROLLBACK trong các thao tác sửa đổi/nhiều bảng.
--   4. Hỗ trợ đầy đủ phân trang (10, 20, 50, -1/Tất cả), Sắp xếp, Lọc, Tìm kiếm.
-- =========================================================================================

USE QL_DaoTaoLaiXe;
GO

-- =========================================================================================
-- MODULE 1: AUTHENTICATION & PHÂN QUYỀN (AUTH_MOD)
-- =========================================================================================

-- 1.1 Thủ tục: sp_KiemTraDangNhap
-- Chức năng: Tìm kiếm người dùng theo tên đăng nhập để xác thực thông tin và kiểm tra trạng thái khóa
IF OBJECT_ID(N'dbo.sp_KiemTraDangNhap', N'P') IS NOT NULL DROP PROCEDURE dbo.sp_KiemTraDangNhap;
GO
CREATE PROCEDURE dbo.sp_KiemTraDangNhap
    @TenDangNhap NVARCHAR(100)
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        -- Kiểm tra người dùng có tồn tại không
        IF NOT EXISTS (SELECT 1 FROM dbo.NguoiDung WHERE TenDangNhap = @TenDangNhap AND DaXoa = 0)
        BEGIN
            RAISERROR(N'Tài khoản không tồn tại trên hệ thống.', 16, 1);
            RETURN;
        END;

        -- Kiểm tra người dùng có bị khóa tài khoản không
        IF EXISTS (SELECT 1 FROM dbo.NguoiDung WHERE TenDangNhap = @TenDangNhap AND DaXoa = 0 AND TrangThai = 0)
        BEGIN
            RAISERROR(N'Tài khoản của bạn hiện đang bị tạm khóa. Vui lòng liên hệ Quản trị viên.', 16, 1);
            RETURN;
        END;

        -- Trả về thông tin người dùng hợp lệ để Backend kiểm tra mật khẩu hash (bcrypt)
        SELECT 
            u.MaNguoiDung,
            u.TenDangNhap,
            u.MatKhauHash,
            u.HoVaTen,
            u.SoCCCD,
            u.SoDienThoai,
            u.Email,
            u.MaVaiTro,
            r.TenVaiTro,
            u.TrangThai,
            u.NgayTao
        FROM dbo.NguoiDung u
        INNER JOIN dbo.VaiTro r ON u.MaVaiTro = r.MaVaiTro
        WHERE u.TenDangNhap = @TenDangNhap AND u.DaXoa = 0;

    END TRY
    BEGIN CATCH
        DECLARE @ErrMsg NVARCHAR(4000) = ERROR_MESSAGE();
        RAISERROR(@ErrMsg, 16, 1);
    END CATCH
END;
GO


-- =========================================================================================
-- MODULE 2: QUẢN LÝ NGƯỜI DÙNG & NHÂN SỰ (USER_MOD)
-- =========================================================================================

-- 2.1 Thủ tục: sp_ThemNguoiDung
IF OBJECT_ID(N'dbo.sp_ThemNguoiDung', N'P') IS NOT NULL DROP PROCEDURE dbo.sp_ThemNguoiDung;
GO
CREATE PROCEDURE dbo.sp_ThemNguoiDung
    @TenDangNhap    NVARCHAR(100),
    @MatKhauHash    NVARCHAR(255),
    @HoVaTen        NVARCHAR(150),
    @SoCCCD         NVARCHAR(20) = NULL,
    @SoDienThoai    NVARCHAR(20) = NULL,
    @Email          NVARCHAR(100) = NULL,
    @MaVaiTro       NVARCHAR(20),
    @NguoiThucHien  INT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        BEGIN TRANSACTION;

        -- Kiểm tra trùng tên đăng nhập
        IF EXISTS (SELECT 1 FROM dbo.NguoiDung WHERE TenDangNhap = @TenDangNhap AND DaXoa = 0)
        BEGIN
            RAISERROR(N'Tên đăng nhập đã tồn tại trong hệ thống.', 16, 1);
            ROLLBACK TRANSACTION;
            RETURN;
        END;

        -- Kiểm tra trùng số CCCD nếu có nhập
        IF @SoCCCD IS NOT NULL AND EXISTS (SELECT 1 FROM dbo.NguoiDung WHERE SoCCCD = @SoCCCD AND DaXoa = 0)
        BEGIN
            RAISERROR(N'Số CCCD này đã được đăng ký bởi tài khoản khác.', 16, 1);
            ROLLBACK TRANSACTION;
            RETURN;
        END;

        -- Kiểm tra vai trò hợp lệ
        IF NOT EXISTS (SELECT 1 FROM dbo.VaiTro WHERE MaVaiTro = @MaVaiTro)
        BEGIN
            RAISERROR(N'Mã vai trò không hợp lệ trong hệ thống.', 16, 1);
            ROLLBACK TRANSACTION;
            RETURN;
        END;

        -- Thêm mới người dùng
        INSERT INTO dbo.NguoiDung (
            TenDangNhap, MatKhauHash, HoVaTen, SoCCCD, SoDienThoai, Email, MaVaiTro, TrangThai, DaXoa, NgayTao, NgayCapNhat
        )
        VALUES (
            @TenDangNhap, @MatKhauHash, @HoVaTen, @SoCCCD, @SoDienThoai, @Email, @MaVaiTro, 1, 0, GETDATE(), GETDATE()
        );

        DECLARE @MaNguoiDungMoi INT = SCOPE_IDENTITY();

        -- Ghi nhật ký hệ thống
        INSERT INTO dbo.NhatKyHeThong (MaNguoiDung, HanhDong, DoiTuong, ChiTiet, NgayTao)
        VALUES (@NguoiThucHien, N'THEM_NGUOI_DUNG', N'NguoiDung', N'Thêm mới người dùng ID: ' + CAST(@MaNguoiDungMoi AS NVARCHAR(20)) + N', Tên: ' + @HoVaTen, GETDATE());

        COMMIT TRANSACTION;

        -- Trả về ID vừa tạo
        SELECT @MaNguoiDungMoi AS MaNguoiDung;

    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        DECLARE @ErrMsg NVARCHAR(4000) = ERROR_MESSAGE();
        RAISERROR(@ErrMsg, 16, 1);
    END CATCH
END;
GO

-- 2.2 Thủ tục: sp_CapNhatNguoiDung
IF OBJECT_ID(N'dbo.sp_CapNhatNguoiDung', N'P') IS NOT NULL DROP PROCEDURE dbo.sp_CapNhatNguoiDung;
GO
CREATE PROCEDURE dbo.sp_CapNhatNguoiDung
    @MaNguoiDung    INT,
    @HoVaTen        NVARCHAR(150),
    @SoCCCD         NVARCHAR(20) = NULL,
    @SoDienThoai    NVARCHAR(20) = NULL,
    @Email          NVARCHAR(100) = NULL,
    @MaVaiTro       NVARCHAR(20),
    @NguoiThucHien  INT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        BEGIN TRANSACTION;

        IF NOT EXISTS (SELECT 1 FROM dbo.NguoiDung WHERE MaNguoiDung = @MaNguoiDung AND DaXoa = 0)
        BEGIN
            RAISERROR(N'Không tìm thấy thông tin người dùng cần cập nhật.', 16, 1);
            ROLLBACK TRANSACTION;
            RETURN;
        END;

        -- Kiểm tra trùng CCCD với người khác
        IF @SoCCCD IS NOT NULL AND EXISTS (SELECT 1 FROM dbo.NguoiDung WHERE SoCCCD = @SoCCCD AND MaNguoiDung <> @MaNguoiDung AND DaXoa = 0)
        BEGIN
            RAISERROR(N'Số CCCD này đã trùng với một tài khoản khác trong hệ thống.', 16, 1);
            ROLLBACK TRANSACTION;
            RETURN;
        END;

        UPDATE dbo.NguoiDung
        SET HoVaTen = @HoVaTen,
            SoCCCD = @SoCCCD,
            SoDienThoai = @SoDienThoai,
            Email = @Email,
            MaVaiTro = @MaVaiTro,
            NgayCapNhat = GETDATE()
        WHERE MaNguoiDung = @MaNguoiDung;

        -- Ghi nhật ký
        INSERT INTO dbo.NhatKyHeThong (MaNguoiDung, HanhDong, DoiTuong, ChiTiet, NgayTao)
        VALUES (@NguoiThucHien, N'CAP_NHAT_NGUOI_DUNG', N'NguoiDung', N'Cập nhật người dùng ID: ' + CAST(@MaNguoiDung AS NVARCHAR(20)), GETDATE());

        COMMIT TRANSACTION;

        SELECT @MaNguoiDung AS MaNguoiDung;

    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        DECLARE @ErrMsg NVARCHAR(4000) = ERROR_MESSAGE();
        RAISERROR(@ErrMsg, 16, 1);
    END CATCH
END;
GO

-- 2.3 Thủ tục: sp_ChuyenTrangThaiTaiKhoan (Khóa hoặc Mở khóa)
IF OBJECT_ID(N'dbo.sp_ChuyenTrangThaiTaiKhoan', N'P') IS NOT NULL DROP PROCEDURE dbo.sp_ChuyenTrangThaiTaiKhoan;
GO
CREATE PROCEDURE dbo.sp_ChuyenTrangThaiTaiKhoan
    @MaNguoiDung    INT,
    @TrangThaiMoi   BIT,
    @NguoiThucHien  INT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        BEGIN TRANSACTION;

        IF NOT EXISTS (SELECT 1 FROM dbo.NguoiDung WHERE MaNguoiDung = @MaNguoiDung AND DaXoa = 0)
        BEGIN
            RAISERROR(N'Người dùng không tồn tại.', 16, 1);
            ROLLBACK TRANSACTION;
            RETURN;
        END;

        UPDATE dbo.NguoiDung
        SET TrangThai = @TrangThaiMoi,
            NgayCapNhat = GETDATE()
        WHERE MaNguoiDung = @MaNguoiDung;

        DECLARE @HanhDong NVARCHAR(100) = CASE WHEN @TrangThaiMoi = 1 THEN N'MO_KHOA_TAI_KHOAN' ELSE N'KHOA_TAI_KHOAN' END;

        INSERT INTO dbo.NhatKyHeThong (MaNguoiDung, HanhDong, DoiTuong, ChiTiet, NgayTao)
        VALUES (@NguoiThucHien, @HanhDong, N'NguoiDung', N'Chuyển trạng thái người dùng ID: ' + CAST(@MaNguoiDung AS NVARCHAR(20)) + N' sang ' + CAST(@TrangThaiMoi AS NVARCHAR(1)), GETDATE());

        COMMIT TRANSACTION;

        SELECT @MaNguoiDung AS MaNguoiDung, @TrangThaiMoi AS TrangThai;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        DECLARE @ErrMsg NVARCHAR(4000) = ERROR_MESSAGE();
        RAISERROR(@ErrMsg, 16, 1);
    END CATCH
END;
GO

-- 2.4 Thủ tục: sp_XoaNguoiDung (Xóa mềm - Soft Delete)
IF OBJECT_ID(N'dbo.sp_XoaNguoiDung', N'P') IS NOT NULL DROP PROCEDURE dbo.sp_XoaNguoiDung;
GO
CREATE PROCEDURE dbo.sp_XoaNguoiDung
    @MaNguoiDung    INT,
    @NguoiThucHien  INT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        BEGIN TRANSACTION;

        IF NOT EXISTS (SELECT 1 FROM dbo.NguoiDung WHERE MaNguoiDung = @MaNguoiDung AND DaXoa = 0)
        BEGIN
            RAISERROR(N'Tài khoản không tồn tại hoặc đã bị xóa.', 16, 1);
            ROLLBACK TRANSACTION;
            RETURN;
        END;

        -- Thực hiện xóa mềm
        UPDATE dbo.NguoiDung
        SET DaXoa = 1,
            TrangThai = 0,
            NgayCapNhat = GETDATE()
        WHERE MaNguoiDung = @MaNguoiDung;

        INSERT INTO dbo.NhatKyHeThong (MaNguoiDung, HanhDong, DoiTuong, ChiTiet, NgayTao)
        VALUES (@NguoiThucHien, N'XOA_NGUOI_DUNG', N'NguoiDung', N'Xóa mềm người dùng ID: ' + CAST(@MaNguoiDung AS NVARCHAR(20)), GETDATE());

        COMMIT TRANSACTION;

        SELECT @MaNguoiDung AS MaNguoiDung;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        DECLARE @ErrMsg NVARCHAR(4000) = ERROR_MESSAGE();
        RAISERROR(@ErrMsg, 16, 1);
    END CATCH
END;
GO

-- 2.5 Thủ tục: sp_LayDanhSachNguoiDungPhanTrang
-- Quy chuẩn skill.md: Phân trang (10, 20, 50, Tất cả/ -1), Lọc theo vai trò/trạng thái, Tìm kiếm theo tên/tài khoản/CCCD, Sắp xếp
IF OBJECT_ID(N'dbo.sp_LayDanhSachNguoiDungPhanTrang', N'P') IS NOT NULL DROP PROCEDURE dbo.sp_LayDanhSachNguoiDungPhanTrang;
GO
CREATE PROCEDURE dbo.sp_LayDanhSachNguoiDungPhanTrang
    @TuKhoa             NVARCHAR(100) = NULL,
    @MaVaiTro           NVARCHAR(20) = NULL,
    @TrangThai          BIT = NULL,
    @TrangHienTai       INT = 1,
    @SoBanGhiMoiTrang   INT = 10,   -- 10, 20, 50, hoặc -1 (Tất cả)
    @SapXepTheo         NVARCHAR(50) = N'NgayTao',
    @HuongSapXep        NVARCHAR(4) = N'DESC'
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        SET @TrangHienTai = ISNULL(@TrangHienTai, 1);
        IF @TrangHienTai < 1 SET @TrangHienTai = 1;

        -- Tính tổng số bản ghi thỏa điều kiện lọc
        DECLARE @TongSoBanGhi INT;
        SELECT @TongSoBanGhi = COUNT(1)
        FROM dbo.NguoiDung u
        WHERE u.DaXoa = 0
          AND (@MaVaiTro IS NULL OR u.MaVaiTro = @MaVaiTro)
          AND (@TrangThai IS NULL OR u.TrangThai = @TrangThai)
          AND (
              @TuKhoa IS NULL 
              OR u.TenDangNhap LIKE N'%' + @TuKhoa + N'%'
              OR u.HoVaTen LIKE N'%' + @TuKhoa + N'%'
              OR u.SoCCCD LIKE N'%' + @TuKhoa + N'%'
              OR u.SoDienThoai LIKE N'%' + @TuKhoa + N'%'
              OR u.Email LIKE N'%' + @TuKhoa + N'%'
          );

        -- Xác định phân trang
        DECLARE @Offset INT = 0;
        DECLARE @Limit INT = @TongSoBanGhi;

        IF @SoBanGhiMoiTrang > 0
        BEGIN
            SET @Limit = @SoBanGhiMoiTrang;
            SET @Offset = (@TrangHienTai - 1) * @SoBanGhiMoiTrang;
        END

        -- Truy vấn danh sách bản ghi
        SELECT 
            u.MaNguoiDung,
            u.TenDangNhap,
            u.HoVaTen,
            u.SoCCCD,
            u.SoDienThoai,
            u.Email,
            u.MaVaiTro,
            r.TenVaiTro,
            u.TrangThai,
            u.NgayTao,
            u.NgayCapNhat,
            @TongSoBanGhi AS TongSoBanGhi
        FROM dbo.NguoiDung u
        INNER JOIN dbo.VaiTro r ON u.MaVaiTro = r.MaVaiTro
        WHERE u.DaXoa = 0
          AND (@MaVaiTro IS NULL OR u.MaVaiTro = @MaVaiTro)
          AND (@TrangThai IS NULL OR u.TrangThai = @TrangThai)
          AND (
              @TuKhoa IS NULL 
              OR u.TenDangNhap LIKE N'%' + @TuKhoa + N'%'
              OR u.HoVaTen LIKE N'%' + @TuKhoa + N'%'
              OR u.SoCCCD LIKE N'%' + @TuKhoa + N'%'
              OR u.SoDienThoai LIKE N'%' + @TuKhoa + N'%'
              OR u.Email LIKE N'%' + @TuKhoa + N'%'
          )
        ORDER BY 
            CASE WHEN @SapXepTheo = N'HoVaTen' AND @HuongSapXep = N'ASC' THEN u.HoVaTen END ASC,
            CASE WHEN @SapXepTheo = N'HoVaTen' AND @HuongSapXep = N'DESC' THEN u.HoVaTen END DESC,
            CASE WHEN @SapXepTheo = N'TenDangNhap' AND @HuongSapXep = N'ASC' THEN u.TenDangNhap END ASC,
            CASE WHEN @SapXepTheo = N'TenDangNhap' AND @HuongSapXep = N'DESC' THEN u.TenDangNhap END DESC,
            CASE WHEN @SapXepTheo = N'NgayTao' AND @HuongSapXep = N'ASC' THEN u.NgayTao END ASC,
            CASE WHEN @SapXepTheo = N'NgayTao' AND @HuongSapXep = N'DESC' THEN u.NgayTao END DESC
        OFFSET @Offset ROWS
        FETCH NEXT @Limit ROWS ONLY;

        -- Trả về bảng thông tin phân trang (Metadata)
        SELECT 
            @TongSoBanGhi AS TongSoBanGhi,
            @TrangHienTai AS TrangHienTai,
            @SoBanGhiMoiTrang AS SoBanGhiMoiTrang,
            CASE 
                WHEN @SoBanGhiMoiTrang <= 0 THEN 1
                ELSE CEILING(CAST(@TongSoBanGhi AS FLOAT) / @SoBanGhiMoiTrang)
            END AS TongSoTrang;

    END TRY
    BEGIN CATCH
        DECLARE @ErrMsg NVARCHAR(4000) = ERROR_MESSAGE();
        RAISERROR(@ErrMsg, 16, 1);
    END CATCH
END;
GO


-- =========================================================================================
-- MODULE 3: QUẢN LÝ ĐÀO TẠO & BÀI GIẢNG MẪU (COURSE_MOD)
-- =========================================================================================

-- 3.1 Thủ tục: sp_QuanLyDanhMucKhoaHocVaBaiGiang
IF OBJECT_ID(N'dbo.sp_QuanLyDanhMucKhoaHocVaBaiGiang', N'P') IS NOT NULL DROP PROCEDURE dbo.sp_QuanLyDanhMucKhoaHocVaBaiGiang;
GO
CREATE PROCEDURE dbo.sp_QuanLyDanhMucKhoaHocVaBaiGiang
    @ThaoTac            NVARCHAR(50), -- 'LAY_DS_KHOA_HOC', 'THEM_KHOA_HOC', 'SUA_KHOA_HOC', 'XOA_KHOA_HOC', 'LAY_DS_BAI_GIANG', 'THEM_BAI_GIANG', 'SUA_BAI_GIANG', 'XOA_BAI_GIANG'
    @MaKhoaHoc          INT = NULL,
    @MaHangGPLX         NVARCHAR(20) = NULL,
    @TenKhoaHoc         NVARCHAR(255) = NULL,
    @MoTa               NVARCHAR(MAX) = NULL,
    @TongSoGioLyThuyet  DECIMAL(6,2) = 100.00,
    @MaBaiGiang         INT = NULL,
    @TenBaiGiang        NVARCHAR(255) = NULL,
    @MonHoc             NVARCHAR(150) = NULL,
    @SoThuTu            INT = 1,
    @DuongDanVideo      NVARCHAR(500) = NULL,
    @ThoiLuongPhut      INT = 45,
    @TaiLieuDinhKem     NVARCHAR(500) = NULL,
    @NguoiThucHien      INT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        -- 1. Lấy danh sách khóa học
        IF @ThaoTac = N'LAY_DS_KHOA_HOC'
        BEGIN
            SELECT 
                k.MaKhoaHoc,
                k.MaHangGPLX,
                k.TenKhoaHoc,
                k.MoTa,
                k.TongSoGioLyThuyet,
                k.TrangThai,
                COUNT(b.MaBaiGiang) AS TongSoBaiGiang,
                k.NgayTao
            FROM dbo.KhoaHoc k
            LEFT JOIN dbo.BaiGiang b ON k.MaKhoaHoc = b.MaKhoaHoc AND b.DaXoa = 0
            WHERE k.DaXoa = 0
            GROUP BY k.MaKhoaHoc, k.MaHangGPLX, k.TenKhoaHoc, k.MoTa, k.TongSoGioLyThuyet, k.TrangThai, k.NgayTao
            ORDER BY k.MaKhoaHoc ASC;
            RETURN;
        END

        -- 2. Thêm mới khóa học
        IF @ThaoTac = N'THEM_KHOA_HOC'
        BEGIN
            BEGIN TRANSACTION;
            IF EXISTS (SELECT 1 FROM dbo.KhoaHoc WHERE MaHangGPLX = @MaHangGPLX AND DaXoa = 0)
            BEGIN
                RAISERROR(N'Hạng GPLX này đã được cấu hình trong hệ thống.', 16, 1);
                ROLLBACK TRANSACTION;
                RETURN;
            END;

            INSERT INTO dbo.KhoaHoc (MaHangGPLX, TenKhoaHoc, MoTa, TongSoGioLyThuyet, TrangThai, DaXoa, NgayTao, NgayCapNhat)
            VALUES (@MaHangGPLX, @TenKhoaHoc, @MoTa, @TongSoGioLyThuyet, 1, 0, GETDATE(), GETDATE());

            DECLARE @NewKhoaHocID INT = SCOPE_IDENTITY();
            COMMIT TRANSACTION;

            SELECT @NewKhoaHocID AS MaKhoaHoc;
            RETURN;
        END

        -- 3. Sửa khóa học
        IF @ThaoTac = N'SUA_KHOA_HOC'
        BEGIN
            BEGIN TRANSACTION;
            UPDATE dbo.KhoaHoc
            SET TenKhoaHoc = @TenKhoaHoc,
                MoTa = @MoTa,
                TongSoGioLyThuyet = @TongSoGioLyThuyet,
                NgayCapNhat = GETDATE()
            WHERE MaKhoaHoc = @MaKhoaHoc AND DaXoa = 0;
            COMMIT TRANSACTION;

            SELECT @MaKhoaHoc AS MaKhoaHoc;
            RETURN;
        END

        -- 4. Xóa khóa học (Soft delete)
        IF @ThaoTac = N'XOA_KHOA_HOC'
        BEGIN
            BEGIN TRANSACTION;
            UPDATE dbo.KhoaHoc SET DaXoa = 1, TrangThai = 0, NgayCapNhat = GETDATE() WHERE MaKhoaHoc = @MaKhoaHoc;
            UPDATE dbo.BaiGiang SET DaXoa = 1 WHERE MaKhoaHoc = @MaKhoaHoc;
            COMMIT TRANSACTION;

            SELECT @MaKhoaHoc AS MaKhoaHoc;
            RETURN;
        END

        -- 5. Lấy danh sách bài giảng theo khóa học
        IF @ThaoTac = N'LAY_DS_BAI_GIANG'
        BEGIN
            SELECT 
                b.MaBaiGiang,
                b.MaKhoaHoc,
                b.TenBaiGiang,
                b.MonHoc,
                b.SoThuTu,
                b.DuongDanVideo,
                b.ThoiLuongPhut,
                b.TaiLieuDinhKem,
                b.TrangThai
            FROM dbo.BaiGiang b
            WHERE b.MaKhoaHoc = @MaKhoaHoc AND b.DaXoa = 0
            ORDER BY b.MonHoc ASC, b.SoThuTu ASC;
            RETURN;
        END

        -- 6. Thêm bài giảng mẫu
        IF @ThaoTac = N'THEM_BAI_GIANG'
        BEGIN
            BEGIN TRANSACTION;
            INSERT INTO dbo.BaiGiang (
                MaKhoaHoc, TenBaiGiang, MonHoc, SoThuTu, DuongDanVideo, ThoiLuongPhut, TaiLieuDinhKem, TrangThai, DaXoa, NgayTao, NgayCapNhat
            )
            VALUES (
                @MaKhoaHoc, @TenBaiGiang, @MonHoc, @SoThuTu, @DuongDanVideo, @ThoiLuongPhut, @TaiLieuDinhKem, 1, 0, GETDATE(), GETDATE()
            );

            DECLARE @NewBaiGiangID INT = SCOPE_IDENTITY();
            COMMIT TRANSACTION;

            SELECT @NewBaiGiangID AS MaBaiGiang;
            RETURN;
        END

        -- 7. Sửa bài giảng
        IF @ThaoTac = N'SUA_BAI_GIANG'
        BEGIN
            BEGIN TRANSACTION;
            UPDATE dbo.BaiGiang
            SET TenBaiGiang = @TenBaiGiang,
                MonHoc = @MonHoc,
                SoThuTu = @SoThuTu,
                DuongDanVideo = @DuongDanVideo,
                ThoiLuongPhut = @ThoiLuongPhut,
                TaiLieuDinhKem = @TaiLieuDinhKem,
                NgayCapNhat = GETDATE()
            WHERE MaBaiGiang = @MaBaiGiang AND DaXoa = 0;
            COMMIT TRANSACTION;

            SELECT @MaBaiGiang AS MaBaiGiang;
            RETURN;
        END

        -- 8. Xóa bài giảng
        IF @ThaoTac = N'XOA_BAI_GIANG'
        BEGIN
            BEGIN TRANSACTION;
            UPDATE dbo.BaiGiang SET DaXoa = 1, NgayCapNhat = GETDATE() WHERE MaBaiGiang = @MaBaiGiang;
            COMMIT TRANSACTION;

            SELECT @MaBaiGiang AS MaBaiGiang;
            RETURN;
        END

        RAISERROR(N'Hành động @ThaoTac không được hỗ trợ.', 16, 1);

    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        DECLARE @ErrMsg NVARCHAR(4000) = ERROR_MESSAGE();
        RAISERROR(@ErrMsg, 16, 1);
    END CATCH
END;
GO


-- =========================================================================================
-- MODULE 4: QUẢN LÝ LỚP HỌC & PHÂN CÔNG (CLASS_MOD)
-- =========================================================================================

-- 4.1 Thủ tục: sp_QuanLyLopHocVaPhanCong
IF OBJECT_ID(N'dbo.sp_QuanLyLopHocVaPhanCong', N'P') IS NOT NULL DROP PROCEDURE dbo.sp_QuanLyLopHocVaPhanCong;
GO
CREATE PROCEDURE dbo.sp_QuanLyLopHocVaPhanCong
    @ThaoTac                NVARCHAR(50), -- 'LAY_DS_LOP', 'THEM_LOP', 'SUA_LOP', 'PHAN_CONG_GIAO_VIEN', 'LAY_DS_HOC_VIEN_LOP'
    @MaLopHoc               INT = NULL,
    @MaLopHocCode           NVARCHAR(50) = NULL,
    @TenLopHoc              NVARCHAR(255) = NULL,
    @MaKhoaHoc              INT = NULL,
    @MaGiaoVienPhuTrach     INT = NULL,
    @NgayKhaiGiang          DATE = NULL,
    @NgayBeGiang            DATE = NULL,
    @TrangThai              NVARCHAR(50) = NULL,
    @NguoiYeuCau            INT = NULL,
    @VaiTroYeuCau           NVARCHAR(20) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        -- 1. Lấy danh sách lớp học (Phân quyền: Giáo viên chỉ xem lớp mình phụ trách, Admin xem tất cả)
        IF @ThaoTac = N'LAY_DS_LOP'
        BEGIN
            SELECT 
                l.MaLopHoc,
                l.MaLopHocCode,
                l.TenLopHoc,
                l.MaKhoaHoc,
                k.TenKhoaHoc,
                k.MaHangGPLX,
                l.MaGiaoVienPhuTrach,
                gv.HoVaTen AS TenGiaoVien,
                l.NgayKhaiGiang,
                l.NgayBeGiang,
                l.TrangThai,
                COUNT(h.MaHocVien) AS SiSoHocVien
            FROM dbo.LopHoc l
            INNER JOIN dbo.KhoaHoc k ON l.MaKhoaHoc = k.MaKhoaHoc
            LEFT JOIN dbo.NguoiDung gv ON l.MaGiaoVienPhuTrach = gv.MaNguoiDung AND gv.DaXoa = 0
            LEFT JOIN dbo.HocVienLopHoc h ON l.MaLopHoc = h.MaLopHoc AND h.DaXoa = 0
            WHERE l.DaXoa = 0
              AND (
                  @VaiTroYeuCau = N'ADMIN' 
                  OR @VaiTroYeuCau IS NULL 
                  OR (@VaiTroYeuCau = N'TEACHER' AND l.MaGiaoVienPhuTrach = @NguoiYeuCau)
              )
            GROUP BY 
                l.MaLopHoc, l.MaLopHocCode, l.TenLopHoc, l.MaKhoaHoc, k.TenKhoaHoc, k.MaHangGPLX,
                l.MaGiaoVienPhuTrach, gv.HoVaTen, l.NgayKhaiGiang, l.NgayBeGiang, l.TrangThai
            ORDER BY l.NgayKhaiGiang DESC;
            RETURN;
        END

        -- 2. Thêm mới lớp học
        IF @ThaoTac = N'THEM_LOP'
        BEGIN
            BEGIN TRANSACTION;
            IF EXISTS (SELECT 1 FROM dbo.LopHoc WHERE MaLopHocCode = @MaLopHocCode AND DaXoa = 0)
            BEGIN
                RAISERROR(N'Mã lớp học này đã tồn tại trong hệ thống.', 16, 1);
                ROLLBACK TRANSACTION;
                RETURN;
            END;

            INSERT INTO dbo.LopHoc (
                MaLopHocCode, TenLopHoc, MaKhoaHoc, MaGiaoVienPhuTrach, NgayKhaiGiang, NgayBeGiang, TrangThai, DaXoa, NgayTao, NgayCapNhat
            )
            VALUES (
                @MaLopHocCode, @TenLopHoc, @MaKhoaHoc, @MaGiaoVienPhuTrach, @NgayKhaiGiang, @NgayBeGiang, ISNULL(@TrangThai, N'Đang đào tạo'), 0, GETDATE(), GETDATE()
            );

            DECLARE @NewLopID INT = SCOPE_IDENTITY();
            COMMIT TRANSACTION;

            SELECT @NewLopID AS MaLopHoc;
            RETURN;
        END

        -- 3. Phân công giáo viên cho lớp
        IF @ThaoTac = N'PHAN_CONG_GIAO_VIEN'
        BEGIN
            BEGIN TRANSACTION;
            UPDATE dbo.LopHoc
            SET MaGiaoVienPhuTrach = @MaGiaoVienPhuTrach,
                NgayCapNhat = GETDATE()
            WHERE MaLopHoc = @MaLopHoc AND DaXoa = 0;
            COMMIT TRANSACTION;

            SELECT @MaLopHoc AS MaLopHoc, @MaGiaoVienPhuTrach AS MaGiaoVienPhuTrach;
            RETURN;
        END

        -- 4. Xem danh sách học viên của lớp
        IF @ThaoTac = N'LAY_DS_HOC_VIEN_LOP'
        BEGIN
            SELECT 
                hl.MaHocVien,
                u.TenDangNhap,
                u.HoVaTen,
                u.SoCCCD,
                u.SoDienThoai,
                u.Email,
                hl.NgayGhiDanh,
                hl.TrangThaiHocTap
            FROM dbo.HocVienLopHoc hl
            INNER JOIN dbo.NguoiDung u ON hl.MaHocVien = u.MaNguoiDung
            WHERE hl.MaLopHoc = @MaLopHoc AND hl.DaXoa = 0 AND u.DaXoa = 0
            ORDER BY u.HoVaTen ASC;
            RETURN;
        END

        RAISERROR(N'Hành động lớp học không hợp lệ.', 16, 1);
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        DECLARE @ErrMsg NVARCHAR(4000) = ERROR_MESSAGE();
        RAISERROR(@ErrMsg, 16, 1);
    END CATCH
END;
GO


-- =========================================================================================
-- MODULE 5: TỰ ĐỘNG HÓA DỮ LIỆU BÁO CÁO XML / EXCEL (AUTO_MOD)
-- =========================================================================================

-- 5.1 Thủ tục: sp_NhapDuLieuHocVien
-- Chức năng: Tiếp nhận mảng JSON chứa danh sách học viên bóc tách từ file báo cáo cứng;
-- Thực hiện toàn bộ quy trình: 
--   1. Tạo tài khoản User (với mật khẩu mặc định hash).
--   2. Gán học viên vào Lớp học.
--   3. Khởi tạo sẵn toàn bộ bản ghi lộ trình bài giảng mẫu (TienDoHocTap) để sẵn sàng học ngay.
-- Đảm bảo toàn vẹn bằng 1 TRANSACTION duy nhất.
IF OBJECT_ID(N'dbo.sp_NhapDuLieuHocVien', N'P') IS NOT NULL DROP PROCEDURE dbo.sp_NhapDuLieuHocVien;
GO
CREATE PROCEDURE dbo.sp_NhapDuLieuHocVien
    @DuLieuJSON         NVARCHAR(MAX),  -- Mảng JSON: [{"HoVaTen": "...", "SoCCCD": "...", "SoDienThoai": "...", "Email": "...", "TenDangNhap": "...", "MatKhauHash": "..."}]
    @MaLopHoc           INT,
    @NguoiThucHien      INT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        BEGIN TRANSACTION;

        -- 1. Kiểm tra Lớp học có tồn tại không
        DECLARE @MaKhoaHoc INT;
        SELECT @MaKhoaHoc = MaKhoaHoc FROM dbo.LopHoc WHERE MaLopHoc = @MaLopHoc AND DaXoa = 0;
        IF @MaKhoaHoc IS NULL
        BEGIN
            RAISERROR(N'Lớp học không tồn tại hoặc đã bị xóa.', 16, 1);
            ROLLBACK TRANSACTION;
            RETURN;
        END;

        -- 2. Bảng tạm chứa danh sách parse từ JSON
        DECLARE @BangHocVienImport TABLE (
            TenDangNhap NVARCHAR(100),
            MatKhauHash NVARCHAR(255),
            HoVaTen     NVARCHAR(150),
            SoCCCD      NVARCHAR(20),
            SoDienThoai NVARCHAR(20),
            Email       NVARCHAR(100)
        );

        INSERT INTO @BangHocVienImport (TenDangNhap, MatKhauHash, HoVaTen, SoCCCD, SoDienThoai, Email)
        SELECT 
            JSON_VALUE(value, '$.TenDangNhap'),
            ISNULL(JSON_VALUE(value, '$.MatKhauHash'), N'$2a$10$wT0lV3c9JmU0fD.XQe1G5e27H4jY6zV9tQ.Kz.p3uR8n1d2s3t4u5'), -- Mật khẩu mặc định nếu thiếu
            JSON_VALUE(value, '$.HoVaTen'),
            JSON_VALUE(value, '$.SoCCCD'),
            JSON_VALUE(value, '$.SoDienThoai'),
            JSON_VALUE(value, '$.Email')
        FROM OPENJSON(@DuLieuJSON);

        DECLARE @SoLuongImport INT = (SELECT COUNT(1) FROM @BangHocVienImport);
        IF @SoLuongImport = 0
        BEGIN
            RAISERROR(N'Dữ liệu JSON tải lên rỗng hoặc không đúng định dạng.', 16, 1);
            ROLLBACK TRANSACTION;
            RETURN;
        END;

        -- 3. Tạo User nếu chưa tồn tại (Dựa vào SoCCCD hoặc TenDangNhap)
        -- Sử dụng MERGE hoặc Cursor/Loop để lấy được MaNguoiDung
        DECLARE @Cur_TenDangNhap NVARCHAR(100), @Cur_MatKhauHash NVARCHAR(255), @Cur_HoVaTen NVARCHAR(150), 
                @Cur_SoCCCD NVARCHAR(20), @Cur_SoDienThoai NVARCHAR(20), @Cur_Email NVARCHAR(100);
        DECLARE @MaHocVienHienTai INT;
        DECLARE @SoThanhCong INT = 0;

        DECLARE con_tro CURSOR LOCAL FAST_FORWARD FOR
            SELECT TenDangNhap, MatKhauHash, HoVaTen, SoCCCD, SoDienThoai, Email FROM @BangHocVienImport;

        OPEN con_tro;
        FETCH NEXT FROM con_tro INTO @Cur_TenDangNhap, @Cur_MatKhauHash, @Cur_HoVaTen, @Cur_SoCCCD, @Cur_SoDienThoai, @Cur_Email;

        WHILE @@FETCH_STATUS = 0
        BEGIN
            SET @MaHocVienHienTai = NULL;

            -- Kiểm tra xem học viên này đã có tài khoản trong hệ thống chưa (theo CCCD hoặc tên đăng nhập)
            SELECT @MaHocVienHienTai = MaNguoiDung 
            FROM dbo.NguoiDung 
            WHERE DaXoa = 0 AND ((SoCCCD = @Cur_SoCCCD AND @Cur_SoCCCD IS NOT NULL) OR TenDangNhap = @Cur_TenDangNhap);

            IF @MaHocVienHienTai IS NULL
            BEGIN
                -- Tạo mới tài khoản học viên
                INSERT INTO dbo.NguoiDung (
                    TenDangNhap, MatKhauHash, HoVaTen, SoCCCD, SoDienThoai, Email, MaVaiTro, TrangThai, DaXoa, NgayTao, NgayCapNhat
                )
                VALUES (
                    @Cur_TenDangNhap, @Cur_MatKhauHash, @Cur_HoVaTen, @Cur_SoCCCD, @Cur_SoDienThoai, @Cur_Email, N'STUDENT', 1, 0, GETDATE(), GETDATE()
                );
                SET @MaHocVienHienTai = SCOPE_IDENTITY();
            END
            ELSE
            BEGIN
                -- Cập nhật lại thông tin mới nhất
                UPDATE dbo.NguoiDung
                SET HoVaTen = @Cur_HoVaTen,
                    SoDienThoai = ISNULL(@Cur_SoDienThoai, SoDienThoai),
                    Email = ISNULL(@Cur_Email, Email),
                    NgayCapNhat = GETDATE()
                WHERE MaNguoiDung = @MaHocVienHienTai;
            END

            -- Ghi danh vào lớp học nếu chưa có
            IF NOT EXISTS (SELECT 1 FROM dbo.HocVienLopHoc WHERE MaHocVien = @MaHocVienHienTai AND MaLopHoc = @MaLopHoc)
            BEGIN
                INSERT INTO dbo.HocVienLopHoc (MaHocVien, MaLopHoc, NgayGhiDanh, TrangThaiHocTap, DaXoa)
                VALUES (@MaHocVienHienTai, @MaLopHoc, GETDATE(), N'Đang học', 0);
            END

            -- Khởi tạo sẵn lộ trình học tập cho tất cả các bài giảng thuộc khóa học
            INSERT INTO dbo.TienDoHocTap (MaHocVien, MaBaiGiang, ThoiGianHocGiay, DaHoanThanh, LanHocCuoi, NgayCapNhat)
            SELECT 
                @MaHocVienHienTai,
                b.MaBaiGiang,
                0,
                0,
                GETDATE(),
                GETDATE()
            FROM dbo.BaiGiang b
            WHERE b.MaKhoaHoc = @MaKhoaHoc 
              AND b.DaXoa = 0
              AND NOT EXISTS (
                  SELECT 1 FROM dbo.TienDoHocTap t 
                  WHERE t.MaHocVien = @MaHocVienHienTai AND t.MaBaiGiang = b.MaBaiGiang
              );

            SET @SoThanhCong = @SoThanhCong + 1;

            FETCH NEXT FROM con_tro INTO @Cur_TenDangNhap, @Cur_MatKhauHash, @Cur_HoVaTen, @Cur_SoCCCD, @Cur_SoDienThoai, @Cur_Email;
        END

        CLOSE con_tro;
        DEALLOCATE con_tro;

        -- Ghi nhật ký hệ thống
        INSERT INTO dbo.NhatKyHeThong (MaNguoiDung, HanhDong, DoiTuong, ChiTiet, NgayTao)
        VALUES (@NguoiThucHien, N'IMPORT_TU_DONG_HOC_VIEN', N'LopHoc', N'Import tự động ' + CAST(@SoThanhCong AS NVARCHAR(20)) + N' học viên vào Lớp ID: ' + CAST(@MaLopHoc AS NVARCHAR(20)), GETDATE());

        COMMIT TRANSACTION;

        -- Trả về kết quả tổng kết
        SELECT 
            @SoLuongImport AS TongSoHocVienTrongFile,
            @SoThanhCong AS SoLuongImportThanhCong,
            @MaLopHoc AS MaLopHoc;

    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        IF CURSOR_STATUS('local', 'con_tro') >= 0
        BEGIN
            CLOSE con_tro;
            DEALLOCATE con_tro;
        END
        DECLARE @ErrMsg NVARCHAR(4000) = ERROR_MESSAGE();
        RAISERROR(@ErrMsg, 16, 1);
    END CATCH
END;
GO


-- =========================================================================================
-- MODULE 6: HỌC TẬP TRỰC TUYẾN & GIÁM SÁT TIẾN ĐỘ (LMS_MOD)
-- =========================================================================================

-- 6.1 Thủ tục: sp_CapNhatTienDoHocTap (Cơ chế Heartbeat đếm giờ học lý thuyết)
IF OBJECT_ID(N'dbo.sp_CapNhatTienDoHocTap', N'P') IS NOT NULL DROP PROCEDURE dbo.sp_CapNhatTienDoHocTap;
GO
CREATE PROCEDURE dbo.sp_CapNhatTienDoHocTap
    @MaHocVien              INT,
    @MaBaiGiang             INT,
    @ThoiGianCongThemGiay   INT -- Thời gian xem video tích lũy được gửi lên từ heartbeat (ví dụ 30 hoặc 60 giây)
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        BEGIN TRANSACTION;

        -- 1. Lấy thời lượng chuẩn của bài giảng (giây)
        DECLARE @ThoiLuongYeuCauGiay INT;
        SELECT @ThoiLuongYeuCauGiay = ThoiLuongPhut * 60 FROM dbo.BaiGiang WHERE MaBaiGiang = @MaBaiGiang AND DaXoa = 0;

        IF @ThoiLuongYeuCauGiay IS NULL
        BEGIN
            RAISERROR(N'Bài giảng không tồn tại hoặc đã bị hủy.', 16, 1);
            ROLLBACK TRANSACTION;
            RETURN;
        END;

        -- 2. Kiểm tra xem đã có bản ghi tiến độ chưa
        IF NOT EXISTS (SELECT 1 FROM dbo.TienDoHocTap WHERE MaHocVien = @MaHocVien AND MaBaiGiang = @MaBaiGiang)
        BEGIN
            INSERT INTO dbo.TienDoHocTap (MaHocVien, MaBaiGiang, ThoiGianHocGiay, DaHoanThanh, LanHocCuoi, NgayCapNhat)
            VALUES (@MaHocVien, @MaBaiGiang, @ThoiGianCongThemGiay, 0, GETDATE(), GETDATE());
        END
        ELSE
        BEGIN
            UPDATE dbo.TienDoHocTap
            SET ThoiGianHocGiay = ThoiGianHocGiay + @ThoiGianCongThemGiay,
                LanHocCuoi = GETDATE(),
                NgayCapNhat = GETDATE()
            WHERE MaHocVien = @MaHocVien AND MaBaiGiang = @MaBaiGiang;
        END

        -- 3. Đánh giá hoàn thành: nếu thời gian học đạt ít nhất 90% thời lượng bài giảng
        DECLARE @ThoiGianHienTaiGiay INT;
        SELECT @ThoiGianHienTaiGiay = ThoiGianHocGiay FROM dbo.TienDoHocTap WHERE MaHocVien = @MaHocVien AND MaBaiGiang = @MaBaiGiang;

        IF @ThoiGianHienTaiGiay >= (@ThoiLuongYeuCauGiay * 0.9)
        BEGIN
            UPDATE dbo.TienDoHocTap
            SET DaHoanThanh = 1
            WHERE MaHocVien = @MaHocVien AND MaBaiGiang = @MaBaiGiang;
        END

        COMMIT TRANSACTION;

        -- Trả về tiến độ hiện tại của bài giảng
        SELECT 
            @MaHocVien AS MaHocVien,
            @MaBaiGiang AS MaBaiGiang,
            @ThoiGianHienTaiGiay AS ThoiGianHocGiay,
            @ThoiLuongYeuCauGiay AS ThoiLuongYeuCauGiay,
            CAST(ROUND((CAST(@ThoiGianHienTaiGiay AS FLOAT) / @ThoiLuongYeuCauGiay) * 100, 2) AS DECIMAL(5,2)) AS PhanTramHoanThanh,
            CASE WHEN @ThoiGianHienTaiGiay >= (@ThoiLuongYeuCauGiay * 0.9) THEN 1 ELSE 0 END AS DaHoanThanh;

    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        DECLARE @ErrMsg NVARCHAR(4000) = ERROR_MESSAGE();
        RAISERROR(@ErrMsg, 16, 1);
    END CATCH
END;
GO

-- 6.2 Thủ tục: sp_LayTienDoHocTap
-- Chức năng: Truy vấn tiến độ học tập theo ma trận phân quyền RBAC:
--   - Học viên: Xem danh mục bài giảng, % hoàn thành và tổng số giờ học lý thuyết cá nhân.
--   - Giáo viên: Xem tiến độ học viên của các lớp do mình trực tiếp giảng dạy/phụ trách.
--   - Admin: Giám sát toàn cục tất cả học viên trên toàn hệ thống hoặc theo lớp.
IF OBJECT_ID(N'dbo.sp_LayTienDoHocTap', N'P') IS NOT NULL DROP PROCEDURE dbo.sp_LayTienDoHocTap;
GO
CREATE PROCEDURE dbo.sp_LayTienDoHocTap
    @VaiTro         NVARCHAR(20),   -- 'STUDENT', 'TEACHER', 'ADMIN'
    @MaNguoiDung    INT,            -- ID của Actor đang thực hiện request
    @MaLopHoc       INT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        -- TRƯỜNG HỢP 1: HỌC VIÊN XEM TIẾN ĐỘ CÁ NHÂN
        IF @VaiTro = N'STUDENT'
        BEGIN
            -- 1. Bảng tiến độ từng bài học
            SELECT 
                b.MaBaiGiang,
                b.TenBaiGiang,
                b.MonHoc,
                b.SoThuTu,
                b.ThoiLuongPhut,
                b.DuongDanVideo,
                b.TaiLieuDinhKem,
                ISNULL(t.ThoiGianHocGiay, 0) AS ThoiGianHocGiay,
                ROUND(CAST(ISNULL(t.ThoiGianHocGiay, 0) AS FLOAT) / 60, 1) AS ThoiGianHocPhut,
                ISNULL(t.DaHoanThanh, 0) AS DaHoanThanh,
                t.LanHocCuoi
            FROM dbo.HocVienLopHoc hl
            INNER JOIN dbo.LopHoc l ON hl.MaLopHoc = l.MaLopHoc
            INNER JOIN dbo.BaiGiang b ON l.MaKhoaHoc = b.MaKhoaHoc AND b.DaXoa = 0
            LEFT JOIN dbo.TienDoHocTap t ON b.MaBaiGiang = t.MaBaiGiang AND t.MaHocVien = @MaNguoiDung
            WHERE hl.MaHocVien = @MaNguoiDung AND hl.DaXoa = 0
            ORDER BY b.MonHoc ASC, b.SoThuTu ASC;

            -- 2. Thống kê tổng hợp cá nhân
            SELECT 
                COUNT(b.MaBaiGiang) AS TongSoBaiHoc,
                SUM(CASE WHEN t.DaHoanThanh = 1 THEN 1 ELSE 0 END) AS SoBaiDaHoanThanh,
                ROUND(CAST(ISNULL(SUM(t.ThoiGianHocGiay), 0) AS FLOAT) / 3600, 2) AS TongGioHocLyThuyetTichLuy,
                k.TongSoGioLyThuyet AS TongGioYeuCau,
                CASE 
                    WHEN COUNT(b.MaBaiGiang) = 0 THEN 0
                    ELSE ROUND((CAST(SUM(CASE WHEN t.DaHoanThanh = 1 THEN 1 ELSE 0 END) AS FLOAT) / COUNT(b.MaBaiGiang)) * 100, 2)
                END AS PhanTramHoanThanhChung
            FROM dbo.HocVienLopHoc hl
            INNER JOIN dbo.LopHoc l ON hl.MaLopHoc = l.MaLopHoc
            INNER JOIN dbo.KhoaHoc k ON l.MaKhoaHoc = k.MaKhoaHoc
            INNER JOIN dbo.BaiGiang b ON l.MaKhoaHoc = b.MaKhoaHoc AND b.DaXoa = 0
            LEFT JOIN dbo.TienDoHocTap t ON b.MaBaiGiang = t.MaBaiGiang AND t.MaHocVien = @MaNguoiDung
            WHERE hl.MaHocVien = @MaNguoiDung AND hl.DaXoa = 0
            GROUP BY k.TongSoGioLyThuyet;

            RETURN;
        END

        -- TRƯỜNG HỢP 2 & 3: GIÁO VIÊN HOẶC ADMIN GIÁM SÁT HỌC VIÊN
        SELECT 
            u.MaNguoiDung AS MaHocVien,
            u.HoVaTen,
            u.SoCCCD,
            u.TenDangNhap,
            l.MaLopHoc,
            l.TenLopHoc,
            l.MaLopHocCode,
            k.MaHangGPLX,
            k.TongSoGioLyThuyet AS GioLyThuyetQuyDinh,
            ROUND(CAST(ISNULL(SUM(t.ThoiGianHocGiay), 0) AS FLOAT) / 3600, 2) AS TongGioHocThucTe,
            COUNT(DISTINCT b.MaBaiGiang) AS TongSoBaiGiang,
            SUM(CASE WHEN t.DaHoanThanh = 1 THEN 1 ELSE 0 END) AS SoBaiDaHoanThanh,
            CASE 
                WHEN COUNT(DISTINCT b.MaBaiGiang) = 0 THEN 0
                ELSE ROUND((CAST(SUM(CASE WHEN t.DaHoanThanh = 1 THEN 1 ELSE 0 END) AS FLOAT) / COUNT(DISTINCT b.MaBaiGiang)) * 100, 2)
            END AS TiLeHoanThanhPhanTram,
            hl.TrangThaiHocTap
        FROM dbo.HocVienLopHoc hl
        INNER JOIN dbo.NguoiDung u ON hl.MaHocVien = u.MaNguoiDung AND u.DaXoa = 0
        INNER JOIN dbo.LopHoc l ON hl.MaLopHoc = l.MaLopHoc AND l.DaXoa = 0
        INNER JOIN dbo.KhoaHoc k ON l.MaKhoaHoc = k.MaKhoaHoc
        INNER JOIN dbo.BaiGiang b ON l.MaKhoaHoc = b.MaKhoaHoc AND b.DaXoa = 0
        LEFT JOIN dbo.TienDoHocTap t ON u.MaNguoiDung = t.MaHocVien AND b.MaBaiGiang = t.MaBaiGiang
        WHERE hl.DaXoa = 0
          AND (@MaLopHoc IS NULL OR l.MaLopHoc = @MaLopHoc)
          AND (
              @VaiTro = N'ADMIN'
              OR (@VaiTro = N'TEACHER' AND l.MaGiaoVienPhuTrach = @MaNguoiDung)
          )
        GROUP BY 
            u.MaNguoiDung, u.HoVaTen, u.SoCCCD, u.TenDangNhap,
            l.MaLopHoc, l.TenLopHoc, l.MaLopHocCode, k.MaHangGPLX, k.TongSoGioLyThuyet, hl.TrangThaiHocTap
        ORDER BY l.MaLopHoc ASC, u.HoVaTen ASC;

    END TRY
    BEGIN CATCH
        DECLARE @ErrMsg NVARCHAR(4000) = ERROR_MESSAGE();
        RAISERROR(@ErrMsg, 16, 1);
    END CATCH
END;
GO


-- =========================================================================================
-- MODULE 7: BÁO CÁO & THỐNG KÊ (REPORT_MOD)
-- =========================================================================================

-- 7.1 Thủ tục: sp_BaoCaoTongQuanKhoaHoc
IF OBJECT_ID(N'dbo.sp_BaoCaoTongQuanKhoaHoc', N'P') IS NOT NULL DROP PROCEDURE dbo.sp_BaoCaoTongQuanKhoaHoc;
GO
CREATE PROCEDURE dbo.sp_BaoCaoTongQuanKhoaHoc
    @MaKhoaHoc  INT = NULL,
    @MaLopHoc   INT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        SELECT 
            l.MaLopHoc,
            l.MaLopHocCode,
            l.TenLopHoc,
            k.TenKhoaHoc,
            k.MaHangGPLX,
            l.NgayKhaiGiang,
            l.NgayBeGiang,
            l.TrangThai AS TrangThaiLop,
            COUNT(DISTINCT hl.MaHocVien) AS TongSoHocVien,
            SUM(CASE WHEN hl.TrangThaiHocTap = N'Đủ điều kiện thi' THEN 1 ELSE 0 END) AS SoHocVienDuDieuKienThi,
            SUM(CASE WHEN hl.TrangThaiHocTap = N'Đang học' THEN 1 ELSE 0 END) AS SoHocVienDangHoc,
            ROUND(AVG(ISNULL(sub.TongGioHoc, 0)), 2) AS GioHocTrungBinhTungHocVien
        FROM dbo.LopHoc l
        INNER JOIN dbo.KhoaHoc k ON l.MaKhoaHoc = k.MaKhoaHoc
        LEFT JOIN dbo.HocVienLopHoc hl ON l.MaLopHoc = hl.MaLopHoc AND hl.DaXoa = 0
        LEFT JOIN (
            SELECT 
                t.MaHocVien,
                ROUND(CAST(SUM(t.ThoiGianHocGiay) AS FLOAT) / 3600, 2) AS TongGioHoc
            FROM dbo.TienDoHocTap t
            GROUP BY t.MaHocVien
        ) sub ON hl.MaHocVien = sub.MaHocVien
        WHERE l.DaXoa = 0
          AND (@MaKhoaHoc IS NULL OR l.MaKhoaHoc = @MaKhoaHoc)
          AND (@MaLopHoc IS NULL OR l.MaLopHoc = @MaLopHoc)
        GROUP BY 
            l.MaLopHoc, l.MaLopHocCode, l.TenLopHoc, k.TenKhoaHoc, k.MaHangGPLX,
            l.NgayKhaiGiang, l.NgayBeGiang, l.TrangThai
        ORDER BY l.NgayKhaiGiang DESC;

    END TRY
    BEGIN CATCH
        DECLARE @ErrMsg NVARCHAR(4000) = ERROR_MESSAGE();
        RAISERROR(@ErrMsg, 16, 1);
    END CATCH
END;
GO

-- 7.2 Thủ tục: sp_BaoCaoChiTietHocVien
-- Chức năng: Trích xuất bảng kê chi tiết toàn bộ các bài giảng đã học của một học viên cụ thể,
-- tính toán số giờ học thực tế để phục vụ xuất chứng chỉ tốt nghiệp / danh sách sát hạch.
IF OBJECT_ID(N'dbo.sp_BaoCaoChiTietHocVien', N'P') IS NOT NULL DROP PROCEDURE dbo.sp_BaoCaoChiTietHocVien;
GO
CREATE PROCEDURE dbo.sp_BaoCaoChiTietHocVien
    @MaHocVien INT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        -- 1. Thông tin tổng quan học viên
        SELECT 
            u.MaNguoiDung AS MaHocVien,
            u.HoVaTen,
            u.SoCCCD,
            u.SoDienThoai,
            u.Email,
            l.MaLopHocCode,
            l.TenLopHoc,
            k.TenKhoaHoc,
            k.MaHangGPLX,
            k.TongSoGioLyThuyet AS GioQuyDinh,
            hl.NgayGhiDanh,
            hl.TrangThaiHocTap,
            ROUND(CAST(ISNULL(SUM(t.ThoiGianHocGiay), 0) AS FLOAT) / 3600, 2) AS TongGioHocThucTe,
            COUNT(DISTINCT b.MaBaiGiang) AS TongSoBai,
            SUM(CASE WHEN t.DaHoanThanh = 1 THEN 1 ELSE 0 END) AS SoBaiDaHoanThanh
        FROM dbo.NguoiDung u
        INNER JOIN dbo.HocVienLopHoc hl ON u.MaNguoiDung = hl.MaHocVien AND hl.DaXoa = 0
        INNER JOIN dbo.LopHoc l ON hl.MaLopHoc = l.MaLopHoc AND l.DaXoa = 0
        INNER JOIN dbo.KhoaHoc k ON l.MaKhoaHoc = k.MaKhoaHoc
        INNER JOIN dbo.BaiGiang b ON l.MaKhoaHoc = b.MaKhoaHoc AND b.DaXoa = 0
        LEFT JOIN dbo.TienDoHocTap t ON u.MaNguoiDung = t.MaHocVien AND b.MaBaiGiang = t.MaBaiGiang
        WHERE u.MaNguoiDung = @MaHocVien AND u.DaXoa = 0
        GROUP BY 
            u.MaNguoiDung, u.HoVaTen, u.SoCCCD, u.SoDienThoai, u.Email,
            l.MaLopHocCode, l.TenLopHoc, k.TenKhoaHoc, k.MaHangGPLX, k.TongSoGioLyThuyet, hl.NgayGhiDanh, hl.TrangThaiHocTap;

        -- 2. Chi tiết từng bài giảng đã học
        SELECT 
            b.MaBaiGiang,
            b.MonHoc,
            b.TenBaiGiang,
            b.SoThuTu,
            b.ThoiLuongPhut AS ThoiLuongChuanPhut,
            ROUND(CAST(ISNULL(t.ThoiGianHocGiay, 0) AS FLOAT) / 60, 1) AS ThoiGianHocThucTePhut,
            ISNULL(t.DaHoanThanh, 0) AS DaHoanThanh,
            t.LanHocCuoi
        FROM dbo.HocVienLopHoc hl
        INNER JOIN dbo.LopHoc l ON hl.MaLopHoc = l.MaLopHoc
        INNER JOIN dbo.BaiGiang b ON l.MaKhoaHoc = b.MaKhoaHoc AND b.DaXoa = 0
        LEFT JOIN dbo.TienDoHocTap t ON b.MaBaiGiang = t.MaBaiGiang AND t.MaHocVien = @MaHocVien
        WHERE hl.MaHocVien = @MaHocVien AND hl.DaXoa = 0
        ORDER BY b.MonHoc ASC, b.SoThuTu ASC;

    END TRY
    BEGIN CATCH
        DECLARE @ErrMsg NVARCHAR(4000) = ERROR_MESSAGE();
        RAISERROR(@ErrMsg, 16, 1);
    END CATCH
END;
GO

PRINT N'>>> HOÀN THÀNH TẠO HỆ THỐNG STORED PROCEDURES TIẾNG VIỆT CHO DỰ ÁN <<<';
GO
