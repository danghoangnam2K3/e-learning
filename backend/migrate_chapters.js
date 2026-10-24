const { DataSource } = require('typeorm');

const AppDataSource = new DataSource({
  type: 'mssql',
  host: '127.0.0.1',
  port: 58222,
  username: 'sa',
  password: 'Nam@07112003',
  database: 'QL_DaoTaoLaiXe',
  options: {
    encrypt: false,
    trustServerCertificate: true,
  },
  extra: {
    pool: {
      max: 1,
      min: 1,
    },
  },
});

async function run() {
  await AppDataSource.initialize();
  console.log('Connected to SQL Server!');

  // 1. Tạo bảng Chuong nếu chưa có
  console.log('1. Creating table Chuong...');
  await AppDataSource.query(`
    IF OBJECT_ID(N'dbo.Chuong', N'U') IS NULL
    BEGIN
        CREATE TABLE dbo.Chuong (
            MaChuong        INT IDENTITY(1,1) PRIMARY KEY,
            MaKhoaHoc       INT NOT NULL,
            SoThuTu         INT NOT NULL DEFAULT 1,
            TenChuong       NVARCHAR(255) NOT NULL,
            SoGioChuan      DECIMAL(6,2) NOT NULL DEFAULT 20.0,
            PhanTramYeuCau  DECIMAL(5,2) NOT NULL DEFAULT 80.0,
            DaXoa           BIT NOT NULL DEFAULT 0,
            NgayTao         DATETIME NOT NULL DEFAULT GETDATE(),
            NgayCapNhat     DATETIME NOT NULL DEFAULT GETDATE(),
            CONSTRAINT FK_Chuong_KhoaHoc FOREIGN KEY (MaKhoaHoc) REFERENCES dbo.KhoaHoc(MaKhoaHoc)
        );
    END
  `);

  // 2. Thêm cột MaChuong vào BaiGiang nếu chưa có
  console.log('2. Altering BaiGiang table...');
  await AppDataSource.query(`
    IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'dbo.BaiGiang') AND name = N'MaChuong')
    BEGIN
        ALTER TABLE dbo.BaiGiang ADD MaChuong INT NULL;
        ALTER TABLE dbo.BaiGiang ADD CONSTRAINT FK_BaiGiang_Chuong FOREIGN KEY (MaChuong) REFERENCES dbo.Chuong(MaChuong);
    END
  `);

  // 3. Đảm bảo có các Khóa học B2, B1, C1
  console.log('3. Ensuring courses B2, B1, C1 exist...');
  await AppDataSource.query(`
    IF NOT EXISTS (SELECT 1 FROM dbo.KhoaHoc WHERE MaHangGPLX = 'B2' AND DaXoa = 0)
    BEGIN
        INSERT INTO dbo.KhoaHoc (MaHangGPLX, TenKhoaHoc, MoTa, TongSoGioLyThuyet, TrangThai, DaXoa)
        VALUES ('B2', N'Đào tạo Lái xe Hạng B2', N'Chương trình đào tạo lái xe hạng B2 chuẩn Bộ GTVT', 180.0, 1, 0);
    END
    ELSE
    BEGIN
        UPDATE dbo.KhoaHoc SET TongSoGioLyThuyet = 180.0 WHERE MaHangGPLX = 'B2';
    END

    IF NOT EXISTS (SELECT 1 FROM dbo.KhoaHoc WHERE MaHangGPLX = 'B1' AND DaXoa = 0)
    BEGIN
        INSERT INTO dbo.KhoaHoc (MaHangGPLX, TenKhoaHoc, MoTa, TongSoGioLyThuyet, TrangThai, DaXoa)
        VALUES ('B1', N'Đào tạo Lái xe Hạng B1', N'Chương trình đào tạo lái xe số tự động hạng B1', 170.0, 1, 0);
    END
    ELSE
    BEGIN
        UPDATE dbo.KhoaHoc SET TongSoGioLyThuyet = 170.0 WHERE MaHangGPLX = 'B1';
    END

    IF NOT EXISTS (SELECT 1 FROM dbo.KhoaHoc WHERE MaHangGPLX = 'C1' AND DaXoa = 0)
    BEGIN
        INSERT INTO dbo.KhoaHoc (MaHangGPLX, TenKhoaHoc, MoTa, TongSoGioLyThuyet, TrangThai, DaXoa)
        VALUES ('C1', N'Đào tạo Lái xe Hạng C1', N'Chương trình đào tạo lái xe hạng C1', 190.0, 1, 0);
    END
    ELSE
    BEGIN
        UPDATE dbo.KhoaHoc SET TongSoGioLyThuyet = 190.0 WHERE MaHangGPLX = 'C1';
    END
  `);

  // 4. Seed dữ liệu 8 chương cho từng khóa nếu chưa có
  console.log('4. Seeding 8 chapters for B2, B1, C1...');
  await AppDataSource.query(`
    DECLARE @MaB2 INT = (SELECT TOP 1 MaKhoaHoc FROM dbo.KhoaHoc WHERE MaHangGPLX = 'B2' AND DaXoa = 0);
    DECLARE @MaB1 INT = (SELECT TOP 1 MaKhoaHoc FROM dbo.KhoaHoc WHERE MaHangGPLX = 'B1' AND DaXoa = 0);
    DECLARE @MaC1 INT = (SELECT TOP 1 MaKhoaHoc FROM dbo.KhoaHoc WHERE MaHangGPLX = 'C1' AND DaXoa = 0);

    -- Seed cho B2 (8 chương)
    IF NOT EXISTS (SELECT 1 FROM dbo.Chuong WHERE MaKhoaHoc = @MaB2 AND DaXoa = 0)
    BEGIN
        INSERT INTO dbo.Chuong (MaKhoaHoc, SoThuTu, TenChuong, SoGioChuan, PhanTramYeuCau) VALUES
        (@MaB2, 1, N'Chương 1: Pháp luật giao thông đường bộ', 40.0, 90.0),
        (@MaB2, 2, N'Chương 2: Cấu tạo và sửa chữa thông thường', 25.0, 80.0),
        (@MaB2, 3, N'Chương 3: Nghiệp vụ vận tải', 20.0, 80.0),
        (@MaB2, 4, N'Chương 4: Đạo đức người lái xe & Văn hóa giao thông', 20.0, 90.0),
        (@MaB2, 5, N'Chương 5: Kỹ thuật lái xe ô tô', 25.0, 85.0),
        (@MaB2, 6, N'Chương 6: Hệ thống biển báo hiệu đường bộ', 15.0, 85.0),
        (@MaB2, 7, N'Chương 7: Giải các thế sa hình và quy tắc ưu tiên', 20.0, 85.0),
        (@MaB2, 8, N'Chương 8: Kỹ năng xử lý tình huống mô phỏng thực tế', 15.0, 80.0);
    END

    -- Seed cho B1 (8 chương)
    IF NOT EXISTS (SELECT 1 FROM dbo.Chuong WHERE MaKhoaHoc = @MaB1 AND DaXoa = 0)
    BEGIN
        INSERT INTO dbo.Chuong (MaKhoaHoc, SoThuTu, TenChuong, SoGioChuan, PhanTramYeuCau) VALUES
        (@MaB1, 1, N'Chương 1: Pháp luật giao thông đường bộ', 35.0, 90.0),
        (@MaB1, 2, N'Chương 2: Cấu tạo xe số tự động cơ bản', 20.0, 80.0),
        (@MaB1, 3, N'Chương 3: Nghiệp vụ và kỹ năng điều khiển xe tự động', 20.0, 80.0),
        (@MaB1, 4, N'Chương 4: Đạo đức người lái xe & Văn hóa giao thông', 20.0, 90.0),
        (@MaB1, 5, N'Chương 5: Kỹ thuật lái xe số tự động an toàn', 25.0, 85.0),
        (@MaB1, 6, N'Chương 6: Hệ thống biển báo hiệu đường bộ', 15.0, 85.0),
        (@MaB1, 7, N'Chương 7: Hướng dẫn giải thế sa hình', 20.0, 85.0),
        (@MaB1, 8, N'Chương 8: Tình huống mô phỏng giao thông trên phần mềm', 15.0, 80.0);
    END

    -- Seed cho C1 (8 chương)
    IF NOT EXISTS (SELECT 1 FROM dbo.Chuong WHERE MaKhoaHoc = @MaC1 AND DaXoa = 0)
    BEGIN
        INSERT INTO dbo.Chuong (MaKhoaHoc, SoThuTu, TenChuong, SoGioChuan, PhanTramYeuCau) VALUES
        (@MaC1, 1, N'Chương 1: Pháp luật giao thông đường bộ chuyên sâu xe tải', 40.0, 90.0),
        (@MaC1, 2, N'Chương 2: Cấu tạo và sửa chữa xe tải chuyên dùng', 30.0, 80.0),
        (@MaC1, 3, N'Chương 3: Nghiệp vụ vận tải hàng hóa đường bộ', 25.0, 80.0),
        (@MaC1, 4, N'Chương 4: Đạo đức người lái xe tải & Trách nhiệm xã hội', 20.0, 90.0),
        (@MaC1, 5, N'Chương 5: Kỹ thuật lái xe tải trong các điều kiện địa hình phức tạp', 30.0, 85.0),
        (@MaC1, 6, N'Chương 6: Hệ thống biển báo hiệu đường bộ và tải trọng', 15.0, 85.0),
        (@MaC1, 7, N'Chương 7: Sa hình nâng cao cho xe tải', 15.0, 85.0),
        (@MaC1, 8, N'Chương 8: Mô phỏng tình huống nguy hiểm xe tải nặng', 15.0, 80.0);
    END
  `);

  // 5. Cập nhật bài giảng mẫu để thuộc các chương
  console.log('5. Mapping lessons to chapters...');
  await AppDataSource.query(`
    DECLARE @MaB2 INT = (SELECT TOP 1 MaKhoaHoc FROM dbo.KhoaHoc WHERE MaHangGPLX = 'B2' AND DaXoa = 0);
    IF @MaB2 IS NOT NULL
    BEGIN
        DECLARE @C1 INT = (SELECT TOP 1 MaChuong FROM dbo.Chuong WHERE MaKhoaHoc = @MaB2 AND SoThuTu = 1);
        DECLARE @C2 INT = (SELECT TOP 1 MaChuong FROM dbo.Chuong WHERE MaKhoaHoc = @MaB2 AND SoThuTu = 2);
        DECLARE @C4 INT = (SELECT TOP 1 MaChuong FROM dbo.Chuong WHERE MaKhoaHoc = @MaB2 AND SoThuTu = 4);
        DECLARE @C5 INT = (SELECT TOP 1 MaChuong FROM dbo.Chuong WHERE MaKhoaHoc = @MaB2 AND SoThuTu = 5);
        DECLARE @C7 INT = (SELECT TOP 1 MaChuong FROM dbo.Chuong WHERE MaKhoaHoc = @MaB2 AND SoThuTu = 7);

        UPDATE dbo.BaiGiang SET MaChuong = @C1 WHERE MaKhoaHoc = @MaB2 AND MonHoc LIKE N'%Pháp luật%' AND (MaChuong IS NULL OR MaChuong = 0);
        UPDATE dbo.BaiGiang SET MaChuong = @C2 WHERE MaKhoaHoc = @MaB2 AND MonHoc LIKE N'%Cấu tạo%' AND (MaChuong IS NULL OR MaChuong = 0);
        UPDATE dbo.BaiGiang SET MaChuong = @C4 WHERE MaKhoaHoc = @MaB2 AND MonHoc LIKE N'%Đạo đức%' AND (MaChuong IS NULL OR MaChuong = 0);
        UPDATE dbo.BaiGiang SET MaChuong = @C5 WHERE MaKhoaHoc = @MaB2 AND MonHoc LIKE N'%Kỹ thuật%' AND (MaChuong IS NULL OR MaChuong = 0);
        UPDATE dbo.BaiGiang SET MaChuong = @C7 WHERE MaKhoaHoc = @MaB2 AND MonHoc LIKE N'%sa hình%' AND (MaChuong IS NULL OR MaChuong = 0);

        DECLARE @CurrentB2Count INT = (SELECT COUNT(1) FROM dbo.BaiGiang WHERE MaKhoaHoc = @MaB2 AND DaXoa = 0);
        WHILE @CurrentB2Count < 32
        BEGIN
            SET @CurrentB2Count = @CurrentB2Count + 1;
            DECLARE @TargetChuong INT = (SELECT TOP 1 MaChuong FROM dbo.Chuong WHERE MaKhoaHoc = @MaB2 AND SoThuTu = ((@CurrentB2Count % 8) + 1));
            DECLARE @TenCh NVARCHAR(255) = (SELECT TOP 1 TenChuong FROM dbo.Chuong WHERE MaChuong = @TargetChuong);
            
            INSERT INTO dbo.BaiGiang (MaKhoaHoc, MaChuong, TenBaiGiang, MonHoc, SoThuTu, DuongDanVideo, ThoiLuongPhut, TrangThai, DaXoa)
            VALUES (@MaB2, @TargetChuong, N'Bài giảng ' + CAST(@CurrentB2Count AS NVARCHAR(10)) + N': ' + @TenCh, @TenCh, @CurrentB2Count, N'/videos/b2_lesson_' + CAST(@CurrentB2Count AS NVARCHAR(10)) + N'.mp4', 45, 1, 0);
        END
    END

    DECLARE @MaB1 INT = (SELECT TOP 1 MaKhoaHoc FROM dbo.KhoaHoc WHERE MaHangGPLX = 'B1' AND DaXoa = 0);
    IF @MaB1 IS NOT NULL
    BEGIN
        DECLARE @CurrentB1Count INT = (SELECT COUNT(1) FROM dbo.BaiGiang WHERE MaKhoaHoc = @MaB1 AND DaXoa = 0);
        WHILE @CurrentB1Count < 30
        BEGIN
            SET @CurrentB1Count = @CurrentB1Count + 1;
            DECLARE @TargetB1Chuong INT = (SELECT TOP 1 MaChuong FROM dbo.Chuong WHERE MaKhoaHoc = @MaB1 AND SoThuTu = ((@CurrentB1Count % 8) + 1));
            DECLARE @TenB1Ch NVARCHAR(255) = (SELECT TOP 1 TenChuong FROM dbo.Chuong WHERE MaChuong = @TargetB1Chuong);
            
            INSERT INTO dbo.BaiGiang (MaKhoaHoc, MaChuong, TenBaiGiang, MonHoc, SoThuTu, DuongDanVideo, ThoiLuongPhut, TrangThai, DaXoa)
            VALUES (@MaB1, @TargetB1Chuong, N'Bài học ' + CAST(@CurrentB1Count AS NVARCHAR(10)) + N': ' + @TenB1Ch, @TenB1Ch, @CurrentB1Count, N'/videos/b1_lesson_' + CAST(@CurrentB1Count AS NVARCHAR(10)) + N'.mp4', 40, 1, 0);
        END
    END

    DECLARE @MaC1 INT = (SELECT TOP 1 MaKhoaHoc FROM dbo.KhoaHoc WHERE MaHangGPLX = 'C1' AND DaXoa = 0);
    IF @MaC1 IS NOT NULL
    BEGIN
        DECLARE @CurrentC1Count INT = (SELECT COUNT(1) FROM dbo.BaiGiang WHERE MaKhoaHoc = @MaC1 AND DaXoa = 0);
        WHILE @CurrentC1Count < 32
        BEGIN
            SET @CurrentC1Count = @CurrentC1Count + 1;
            DECLARE @TargetC1Chuong INT = (SELECT TOP 1 MaChuong FROM dbo.Chuong WHERE MaKhoaHoc = @MaC1 AND SoThuTu = ((@CurrentC1Count % 8) + 1));
            DECLARE @TenC1Ch NVARCHAR(255) = (SELECT TOP 1 TenChuong FROM dbo.Chuong WHERE MaChuong = @TargetC1Chuong);
            
            INSERT INTO dbo.BaiGiang (MaKhoaHoc, MaChuong, TenBaiGiang, MonHoc, SoThuTu, DuongDanVideo, ThoiLuongPhut, TrangThai, DaXoa)
            VALUES (@MaC1, @TargetC1Chuong, N'Bài học xe tải ' + CAST(@CurrentC1Count AS NVARCHAR(10)) + N': ' + @TenC1Ch, @TenC1Ch, @CurrentC1Count, N'/videos/c1_lesson_' + CAST(@CurrentC1Count AS NVARCHAR(10)) + N'.mp4', 50, 1, 0);
        END
    END
  `);

  // 6. Tạo Stored Procedure dbo.sp_QuanLyChuongTrinhVaChuong
  console.log('6. Creating Stored Procedure sp_QuanLyChuongTrinhVaChuong...');
  await AppDataSource.query(`
    IF OBJECT_ID(N'dbo.sp_QuanLyChuongTrinhVaChuong', N'P') IS NOT NULL 
        DROP PROCEDURE dbo.sp_QuanLyChuongTrinhVaChuong;
  `);

  await AppDataSource.query(`
    CREATE PROCEDURE dbo.sp_QuanLyChuongTrinhVaChuong
        @ThaoTac            NVARCHAR(50), 
        @MaKhoaHoc          INT = NULL,
        @MaChuong           INT = NULL,
        @TenChuong          NVARCHAR(255) = NULL,
        @SoThuTuChuong      INT = 1,
        @SoGioChuan         DECIMAL(6,2) = 20.0,
        @PhanTramYeuCau     DECIMAL(5,2) = 80.0,
        @MaBaiGiang         INT = NULL,
        @TenBaiGiang        NVARCHAR(255) = NULL,
        @ThoiLuongPhut      INT = 45,
        @DuongDanVideo      NVARCHAR(500) = NULL,
        @TaiLieuDinhKem     NVARCHAR(500) = NULL,
        @TongSoGioLyThuyet  DECIMAL(6,2) = NULL,
        @MoTa               NVARCHAR(MAX) = NULL,
        @NguoiThucHien      INT = NULL
    AS
    BEGIN
        SET NOCOUNT ON;
        BEGIN TRY
            -- 1. LẤY TỔNG HỢP TOÀN BỘ CÁC KHÓA (Cho bảng tổng hợp: Khóa | Chương | Bài giảng | Giờ)
            IF @ThaoTac = N'LAY_DS_TONG_HOP'
            BEGIN
                SELECT 
                    k.MaKhoaHoc,
                    k.MaHangGPLX,
                    k.TenKhoaHoc,
                    k.MoTa,
                    CAST(k.TongSoGioLyThuyet AS INT) AS TongSoGio,
                    COUNT(DISTINCT c.MaChuong) AS SoChuong,
                    COUNT(DISTINCT b.MaBaiGiang) AS SoBaiGiang,
                    k.NgayTao
                FROM dbo.KhoaHoc k
                LEFT JOIN dbo.Chuong c ON k.MaKhoaHoc = c.MaKhoaHoc AND c.DaXoa = 0
                LEFT JOIN dbo.BaiGiang b ON k.MaKhoaHoc = b.MaKhoaHoc AND b.DaXoa = 0
                WHERE k.DaXoa = 0
                GROUP BY k.MaKhoaHoc, k.MaHangGPLX, k.TenKhoaHoc, k.MoTa, k.TongSoGioLyThuyet, k.NgayTao
                ORDER BY 
                    CASE k.MaHangGPLX 
                        WHEN 'B2' THEN 1 
                        WHEN 'B1' THEN 2 
                        WHEN 'C1' THEN 3 
                        ELSE 4 
                    END, k.MaKhoaHoc ASC;
                RETURN;
            END

            -- 2. LẤY CHI TIẾT CHƯƠNG TRÌNH CỦA 1 KHÓA (Khóa -> Các Chương -> Danh sách Bài giảng)
            IF @ThaoTac = N'LAY_CHI_TIET_KHOA_CHUONG'
            BEGIN
                -- Bảng 1: Thông tin Khóa
                SELECT 
                    k.MaKhoaHoc,
                    k.MaHangGPLX,
                    k.TenKhoaHoc,
                    k.MoTa,
                    CAST(k.TongSoGioLyThuyet AS INT) AS TongSoGio,
                    k.TrangThai
                FROM dbo.KhoaHoc k
                WHERE k.MaKhoaHoc = @MaKhoaHoc AND k.DaXoa = 0;

                -- Bảng 2: Danh sách các Chương
                SELECT 
                    c.MaChuong,
                    c.MaKhoaHoc,
                    c.SoThuTu,
                    c.TenChuong,
                    CAST(c.SoGioChuan AS INT) AS SoGioChuan,
                    CAST(c.PhanTramYeuCau AS INT) AS PhanTramYeuCau,
                    COUNT(b.MaBaiGiang) AS TongSoBaiGiang
                FROM dbo.Chuong c
                LEFT JOIN dbo.BaiGiang b ON c.MaChuong = b.MaChuong AND b.DaXoa = 0
                WHERE c.MaKhoaHoc = @MaKhoaHoc AND c.DaXoa = 0
                GROUP BY c.MaChuong, c.MaKhoaHoc, c.SoThuTu, c.TenChuong, c.SoGioChuan, c.PhanTramYeuCau
                ORDER BY c.SoThuTu ASC, c.MaChuong ASC;

                -- Bảng 3: Danh sách các Bài giảng của khóa kèm MaChuong
                SELECT 
                    b.MaBaiGiang,
                    b.MaKhoaHoc,
                    b.MaChuong,
                    b.TenBaiGiang,
                    b.MonHoc,
                    b.SoThuTu,
                    b.DuongDanVideo,
                    b.ThoiLuongPhut,
                    b.TaiLieuDinhKem,
                    b.TrangThai
                FROM dbo.BaiGiang b
                WHERE b.MaKhoaHoc = @MaKhoaHoc AND b.DaXoa = 0
                ORDER BY b.SoThuTu ASC, b.MaBaiGiang ASC;

                RETURN;
            END

            -- 3. THÊM CHƯƠNG MỚI
            IF @ThaoTac = N'THEM_CHUONG'
            BEGIN
                BEGIN TRANSACTION;
                INSERT INTO dbo.Chuong (MaKhoaHoc, SoThuTu, TenChuong, SoGioChuan, PhanTramYeuCau, DaXoa, NgayTao, NgayCapNhat)
                VALUES (@MaKhoaHoc, @SoThuTuChuong, @TenChuong, @SoGioChuan, @PhanTramYeuCau, 0, GETDATE(), GETDATE());

                DECLARE @NewMaChuong INT = SCOPE_IDENTITY();
                COMMIT TRANSACTION;

                SELECT @NewMaChuong AS MaChuong;
                RETURN;
            END

            -- 4. SỬA CHƯƠNG
            IF @ThaoTac = N'SUA_CHUONG'
            BEGIN
                BEGIN TRANSACTION;
                UPDATE dbo.Chuong
                SET TenChuong = @TenChuong,
                    SoGioChuan = @SoGioChuan,
                    PhanTramYeuCau = @PhanTramYeuCau,
                    SoThuTu = ISNULL(@SoThuTuChuong, SoThuTu),
                    NgayCapNhat = GETDATE()
                WHERE MaChuong = @MaChuong AND DaXoa = 0;
                COMMIT TRANSACTION;

                SELECT @MaChuong AS MaChuong;
                RETURN;
            END

            -- 5. XÓA CHƯƠNG
            IF @ThaoTac = N'XOA_CHUONG'
            BEGIN
                BEGIN TRANSACTION;
                UPDATE dbo.Chuong SET DaXoa = 1, NgayCapNhat = GETDATE() WHERE MaChuong = @MaChuong;
                UPDATE dbo.BaiGiang SET MaChuong = NULL WHERE MaChuong = @MaChuong;
                COMMIT TRANSACTION;

                SELECT @MaChuong AS MaChuong;
                RETURN;
            END

            -- 6. THÊM BÀI GIẢNG VÀO CHƯƠNG
            IF @ThaoTac = N'THEM_BAI_GIANG_CHUONG'
            BEGIN
                BEGIN TRANSACTION;
                DECLARE @MonHocChuong NVARCHAR(150) = (SELECT TOP 1 TenChuong FROM dbo.Chuong WHERE MaChuong = @MaChuong);

                INSERT INTO dbo.BaiGiang (MaKhoaHoc, MaChuong, TenBaiGiang, MonHoc, SoThuTu, DuongDanVideo, ThoiLuongPhut, TaiLieuDinhKem, TrangThai, DaXoa, NgayTao, NgayCapNhat)
                VALUES (@MaKhoaHoc, @MaChuong, @TenBaiGiang, ISNULL(@MonHocChuong, N'Lý thuyết'), @SoThuTuChuong, @DuongDanVideo, @ThoiLuongPhut, @TaiLieuDinhKem, 1, 0, GETDATE(), GETDATE());

                DECLARE @NewBaiGiangId INT = SCOPE_IDENTITY();
                COMMIT TRANSACTION;

                SELECT @NewBaiGiangId AS MaBaiGiang;
                RETURN;
            END

            -- 7. CẬP NHẬT YÊU CẦU KHÓA
            IF @ThaoTac = N'CAP_NHAT_YEU_CAU_KHOA'
            BEGIN
                BEGIN TRANSACTION;
                UPDATE dbo.KhoaHoc
                SET TongSoGioLyThuyet = ISNULL(@TongSoGioLyThuyet, TongSoGioLyThuyet),
                    MoTa = ISNULL(@MoTa, MoTa),
                    NgayCapNhat = GETDATE()
                WHERE MaKhoaHoc = @MaKhoaHoc AND DaXoa = 0;
                COMMIT TRANSACTION;

                SELECT @MaKhoaHoc AS MaKhoaHoc;
                RETURN;
            END

            RAISERROR(N'Thao tác không hợp lệ trong sp_QuanLyChuongTrinhVaChuong.', 16, 1);
        END TRY
        BEGIN CATCH
            IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
            DECLARE @Err NVARCHAR(4000) = ERROR_MESSAGE();
            RAISERROR(@Err, 16, 1);
        END CATCH
    END
  `);

  console.log('Database migration & Stored Procedures completed successfully!');
  await AppDataSource.destroy();
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
