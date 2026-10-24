-- =========================================================================================
-- DỰ ÁN: HỆ THỐNG QUẢN LÝ VÀ HỌC TRỰC TUYẾN TỰ ĐỘNG HÓA CHO TRUNG TÂM ĐÀO TẠO LÁI XE (LMS)
-- TẬP TIN: 01_schema.sql
-- MỤC ĐÍCH: Khởi tạo Cơ sở Dữ liệu, cấu trúc Bảng, Ràng buộc Khóa Chính/Khóa Ngoại và Chỉ mục (Indexes)
-- QUY CHUẨN: 100% Tên Bảng và Tên Cột sử dụng tiếng Việt không dấu (PascalCase)
-- HỆ QUẢN TRỊ: Microsoft SQL Server 2019
-- =========================================================================================

-- 1. Tạo Cơ sở Dữ liệu (Nếu chưa tồn tại)
IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = N'QL_DaoTaoLaiXe')
BEGIN
    CREATE DATABASE QL_DaoTaoLaiXe
    COLLATE Vietnamese_CI_AS;
END
GO

USE QL_DaoTaoLaiXe;
GO

-- =========================================================================================
-- 2. XÓA CÁC BẢNG THEO THỨ TỰ RÀNG BUỘC (NẾU CẦN TÁI TẠO LẠI)
-- =========================================================================================
IF OBJECT_ID(N'dbo.NhatKyHeThong', N'U') IS NOT NULL DROP TABLE dbo.NhatKyHeThong;
IF OBJECT_ID(N'dbo.TienDoHocTap', N'U') IS NOT NULL DROP TABLE dbo.TienDoHocTap;
IF OBJECT_ID(N'dbo.HocVienLopHoc', N'U') IS NOT NULL DROP TABLE dbo.HocVienLopHoc;
IF OBJECT_ID(N'dbo.LopHoc', N'U') IS NOT NULL DROP TABLE dbo.LopHoc;
IF OBJECT_ID(N'dbo.BaiGiang', N'U') IS NOT NULL DROP TABLE dbo.BaiGiang;
IF OBJECT_ID(N'dbo.KhoaHoc', N'U') IS NOT NULL DROP TABLE dbo.KhoaHoc;
IF OBJECT_ID(N'dbo.NguoiDung', N'U') IS NOT NULL DROP TABLE dbo.NguoiDung;
IF OBJECT_ID(N'dbo.VaiTro', N'U') IS NOT NULL DROP TABLE dbo.VaiTro;
GO

-- =========================================================================================
-- 3. BẢNG: VaiTro (Danh mục phân quyền hệ thống)
-- =========================================================================================
CREATE TABLE dbo.VaiTro (
    MaVaiTro        NVARCHAR(20)    NOT NULL,
    TenVaiTro       NVARCHAR(100)   NOT NULL,
    MoTa            NVARCHAR(255)   NULL,
    NgayTao         DATETIME        NOT NULL DEFAULT GETDATE(),

    CONSTRAINT PK_VaiTro PRIMARY KEY (MaVaiTro)
);
GO

-- =========================================================================================
-- 4. BẢNG: NguoiDung (Tài khoản người dùng: Quản trị viên, Giáo viên, Học viên)
-- =========================================================================================
CREATE TABLE dbo.NguoiDung (
    MaNguoiDung     INT IDENTITY(1,1)   NOT NULL,
    TenDangNhap     NVARCHAR(100)       NOT NULL,
    MatKhauHash     NVARCHAR(255)       NOT NULL,
    HoVaTen         NVARCHAR(150)       NOT NULL,
    SoCCCD          NVARCHAR(20)        NULL,
    SoDienThoai     NVARCHAR(20)        NULL,
    Email           NVARCHAR(100)       NULL,
    MaVaiTro        NVARCHAR(20)        NOT NULL,
    TrangThai       BIT                 NOT NULL DEFAULT 1, -- 1: Đang hoạt động, 0: Đã khóa
    DaXoa           BIT                 NOT NULL DEFAULT 0, -- 0: Còn hiệu lực, 1: Đã xóa mềm
    NgayTao         DATETIME            NOT NULL DEFAULT GETDATE(),
    NgayCapNhat     DATETIME            NOT NULL DEFAULT GETDATE(),

    CONSTRAINT PK_NguoiDung PRIMARY KEY (MaNguoiDung),
    CONSTRAINT UQ_NguoiDung_TenDangNhap UNIQUE (TenDangNhap),
    CONSTRAINT FK_NguoiDung_VaiTro FOREIGN KEY (MaVaiTro) REFERENCES dbo.VaiTro(MaVaiTro)
);
GO

-- =========================================================================================
-- 5. BẢNG: KhoaHoc (Danh mục hạng đào tạo GPLX: B1, B2, C, D, E...)
-- =========================================================================================
CREATE TABLE dbo.KhoaHoc (
    MaKhoaHoc           INT IDENTITY(1,1)   NOT NULL,
    MaHangGPLX          NVARCHAR(20)        NOT NULL, -- 'B11', 'B2', 'C', 'D', 'E'
    TenKhoaHoc          NVARCHAR(255)       NOT NULL,
    MoTa                NVARCHAR(MAX)       NULL,
    TongSoGioLyThuyet   DECIMAL(6,2)        NOT NULL DEFAULT 100.00, -- Số giờ chuẩn theo quy định
    TrangThai           BIT                 NOT NULL DEFAULT 1,
    DaXoa               BIT                 NOT NULL DEFAULT 0,
    NgayTao             DATETIME            NOT NULL DEFAULT GETDATE(),
    NgayCapNhat         DATETIME            NOT NULL DEFAULT GETDATE(),

    CONSTRAINT PK_KhoaHoc PRIMARY KEY (MaKhoaHoc),
    CONSTRAINT UQ_KhoaHoc_MaHangGPLX UNIQUE (MaHangGPLX)
);
GO

-- =========================================================================================
-- 6. BẢNG: BaiGiang (Khung bài giảng mẫu theo chương trình chuẩn)
-- =========================================================================================
CREATE TABLE dbo.BaiGiang (
    MaBaiGiang          INT IDENTITY(1,1)   NOT NULL,
    MaKhoaHoc           INT                 NOT NULL,
    TenBaiGiang         NVARCHAR(255)       NOT NULL,
    MonHoc              NVARCHAR(150)       NOT NULL, -- Pháp luật GTĐB, Kỹ thuật lái xe, Cấu tạo sửa chữa...
    SoThuTu             INT                 NOT NULL DEFAULT 1,
    DuongDanVideo       NVARCHAR(500)       NULL,
    ThoiLuongPhut       INT                 NOT NULL DEFAULT 45, -- Thời lượng chuẩn theo giáo trình
    TaiLieuDinhKem      NVARCHAR(500)       NULL,
    TrangThai           BIT                 NOT NULL DEFAULT 1,
    DaXoa               BIT                 NOT NULL DEFAULT 0,
    NgayTao             DATETIME            NOT NULL DEFAULT GETDATE(),
    NgayCapNhat         DATETIME            NOT NULL DEFAULT GETDATE(),

    CONSTRAINT PK_BaiGiang PRIMARY KEY (MaBaiGiang),
    CONSTRAINT FK_BaiGiang_KhoaHoc FOREIGN KEY (MaKhoaHoc) REFERENCES dbo.KhoaHoc(MaKhoaHoc)
);
GO

-- =========================================================================================
-- 7. BẢNG: LopHoc (Lớp đào tạo & Phân công giáo viên phụ trách)
-- =========================================================================================
CREATE TABLE dbo.LopHoc (
    MaLopHoc            INT IDENTITY(1,1)   NOT NULL,
    MaLopHocCode        NVARCHAR(50)        NOT NULL, -- Ví dụ: 'K45-B2-01'
    TenLopHoc           NVARCHAR(255)       NOT NULL,
    MaKhoaHoc           INT                 NOT NULL,
    MaGiaoVienPhuTrach  INT                 NULL,
    NgayKhaiGiang       DATE                NOT NULL,
    NgayBeGiang         DATE                NOT NULL,
    TrangThai           NVARCHAR(50)        NOT NULL DEFAULT N'Đang đào tạo', -- 'Sắp mở', 'Đang đào tạo', 'Đã hoàn thành'
    DaXoa               BIT                 NOT NULL DEFAULT 0,
    NgayTao             DATETIME            NOT NULL DEFAULT GETDATE(),
    NgayCapNhat         DATETIME            NOT NULL DEFAULT GETDATE(),

    CONSTRAINT PK_LopHoc PRIMARY KEY (MaLopHoc),
    CONSTRAINT UQ_LopHoc_MaCode UNIQUE (MaLopHocCode),
    CONSTRAINT FK_LopHoc_KhoaHoc FOREIGN KEY (MaKhoaHoc) REFERENCES dbo.KhoaHoc(MaKhoaHoc),
    CONSTRAINT FK_LopHoc_GiaoVien FOREIGN KEY (MaGiaoVienPhuTrach) REFERENCES dbo.NguoiDung(MaNguoiDung)
);
GO

-- =========================================================================================
-- 8. BẢNG: HocVienLopHoc (Danh sách học viên đăng ký theo từng lớp đào tạo)
-- =========================================================================================
CREATE TABLE dbo.HocVienLopHoc (
    MaDangKy            INT IDENTITY(1,1)   NOT NULL,
    MaHocVien           INT                 NOT NULL,
    MaLopHoc            INT                 NOT NULL,
    NgayGhiDanh         DATETIME            NOT NULL DEFAULT GETDATE(),
    TrangThaiHocTap     NVARCHAR(50)        NOT NULL DEFAULT N'Đang học', -- 'Đang học', 'Đủ điều kiện thi', 'Chưa đạt', 'Bảo lưu'
    DaXoa               BIT                 NOT NULL DEFAULT 0,

    CONSTRAINT PK_HocVienLopHoc PRIMARY KEY (MaDangKy),
    CONSTRAINT UQ_HocVienLopHoc UNIQUE (MaHocVien, MaLopHoc),
    CONSTRAINT FK_HocVienLopHoc_HocVien FOREIGN KEY (MaHocVien) REFERENCES dbo.NguoiDung(MaNguoiDung),
    CONSTRAINT FK_HocVienLopHoc_LopHoc FOREIGN KEY (MaLopHoc) REFERENCES dbo.LopHoc(MaLopHoc)
);
GO

-- =========================================================================================
-- 9. BẢNG: TienDoHocTap (Ghi nhận thời gian học lý thuyết tích lũy & Trạng thái bài học)
-- =========================================================================================
CREATE TABLE dbo.TienDoHocTap (
    MaTienDo            INT IDENTITY(1,1)   NOT NULL,
    MaHocVien           INT                 NOT NULL,
    MaBaiGiang          INT                 NOT NULL,
    ThoiGianHocGiay     INT                 NOT NULL DEFAULT 0, -- Thời gian học thực tế tích lũy
    DaHoanThanh         BIT                 NOT NULL DEFAULT 0, -- 1: Đã đạt thời lượng yêu cầu
    LanHocCuoi          DATETIME            NOT NULL DEFAULT GETDATE(),
    NgayCapNhat         DATETIME            NOT NULL DEFAULT GETDATE(),

    CONSTRAINT PK_TienDoHocTap PRIMARY KEY (MaTienDo),
    CONSTRAINT UQ_TienDoHocTap UNIQUE (MaHocVien, MaBaiGiang),
    CONSTRAINT FK_TienDoHocTap_HocVien FOREIGN KEY (MaHocVien) REFERENCES dbo.NguoiDung(MaNguoiDung),
    CONSTRAINT FK_TienDoHocTap_BaiGiang FOREIGN KEY (MaBaiGiang) REFERENCES dbo.BaiGiang(MaBaiGiang)
);
GO

-- =========================================================================================
-- 10. BẢNG: NhatKyHeThong (Audit Logs ghi nhận mọi thao tác quan trọng)
-- =========================================================================================
CREATE TABLE dbo.NhatKyHeThong (
    MaNhatKy            BIGINT IDENTITY(1,1) NOT NULL,
    MaNguoiDung         INT                 NULL,
    HanhDong            NVARCHAR(100)       NOT NULL,
    DoiTuong            NVARCHAR(100)       NOT NULL,
    ChiTiet             NVARCHAR(MAX)       NULL,
    DiaChiIP            NVARCHAR(50)        NULL,
    NgayTao             DATETIME            NOT NULL DEFAULT GETDATE(),

    CONSTRAINT PK_NhatKyHeThong PRIMARY KEY (MaNhatKy),
    CONSTRAINT FK_NhatKyHeThong_NguoiDung FOREIGN KEY (MaNguoiDung) REFERENCES dbo.NguoiDung(MaNguoiDung)
);
GO

-- =========================================================================================
-- 11. TẠO CÁC CHỈ MỤC TỐI ƯU TRUY VẤN (INDEXES)
-- =========================================================================================
CREATE NONCLUSTERED INDEX IX_NguoiDung_SoCCCD ON dbo.NguoiDung (SoCCCD) WHERE DaXoa = 0;
CREATE NONCLUSTERED INDEX IX_NguoiDung_MaVaiTro ON dbo.NguoiDung (MaVaiTro, TrangThai) WHERE DaXoa = 0;

CREATE NONCLUSTERED INDEX IX_BaiGiang_MaKhoaHoc ON dbo.BaiGiang (MaKhoaHoc, SoThuTu) WHERE DaXoa = 0;

CREATE NONCLUSTERED INDEX IX_LopHoc_MaKhoaHoc ON dbo.LopHoc (MaKhoaHoc) WHERE DaXoa = 0;
CREATE NONCLUSTERED INDEX IX_LopHoc_GiaoVien ON dbo.LopHoc (MaGiaoVienPhuTrach) WHERE DaXoa = 0;

CREATE NONCLUSTERED INDEX IX_HocVienLopHoc_MaHocVien ON dbo.HocVienLopHoc (MaHocVien) WHERE DaXoa = 0;
CREATE NONCLUSTERED INDEX IX_HocVienLopHoc_MaLopHoc ON dbo.HocVienLopHoc (MaLopHoc) WHERE DaXoa = 0;

CREATE NONCLUSTERED INDEX IX_TienDoHocTap_MaHocVien ON dbo.TienDoHocTap (MaHocVien, DaHoanThanh);
CREATE NONCLUSTERED INDEX IX_TienDoHocTap_MaBaiGiang ON dbo.TienDoHocTap (MaBaiGiang);

CREATE NONCLUSTERED INDEX IX_NhatKyHeThong_MaNguoiDung ON dbo.NhatKyHeThong (MaNguoiDung, NgayTao);
GO

PRINT N'>>> HOÀN THÀNH TẠO BẢNG, RÀNG BUỘC VÀ INDEXES CƠ SỞ DỮ LIỆU QL_DaoTaoLaiXe <<<';
GO
