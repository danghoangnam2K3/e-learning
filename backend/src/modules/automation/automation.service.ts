import { Injectable, BadRequestException, Logger, OnModuleInit } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { XMLParser } from 'fast-xml-parser';
import * as XLSX from 'xlsx';
import * as bcrypt from 'bcryptjs';
import * as path from 'path';
import * as fs from 'fs';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const sharp = require('sharp');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { JpxImage } = require('jpeg2000');
import { ImportStudentsDto, StudentRecordDto } from './dto/import-students.dto';

@Injectable()
export class AutomationService implements OnModuleInit {
  private readonly logger = new Logger(AutomationService.name);

  constructor(private readonly dataSource: DataSource) {}

  async onModuleInit() {
    await this.syncDatabaseAndProcedures();
  }

  // 1. Nhập trực tiếp qua JSON
  async importStudentsFromJson(dto: ImportStudentsDto, executorId: number) {
    const { maLopHoc, danhSachHocVien } = dto;
    return this.executeImport(maLopHoc, danhSachHocVien, executorId);
  }

  // 2. Phân tích cú pháp tệp XML Báo cáo 1 để TỰ ĐỘNG tạo Khóa học thực tế, gán bài giảng mẫu và nạp học viên
  async importStudentsFromFile(
    file: Express.Multer.File,
    classId: number | undefined,
    executorId: number,
  ) {
    if (!file) {
      throw new BadRequestException('Vui lòng tải lên tệp báo cáo (Excel hoặc XML).');
    }

    const ext = file.originalname.split('.').pop()?.toLowerCase();

    // Trường hợp 1: Tệp XML chuẩn Báo cáo 1 (DANG_KY_KHOA_HOC)
    if (ext === 'xml') {
      const xmlContent = file.buffer.toString('utf-8');
      const parser = new XMLParser({ ignoreAttributes: false, trimValues: true, parseTagValue: false });
      const jsonObj = parser.parse(xmlContent);

      // Nhận diện tệp XML Báo Cáo 1 Đăng ký Khóa học
      if (jsonObj?.DANG_KY_KHOA_HOC?.DATA) {
        return this.processReport1Xml(jsonObj.DANG_KY_KHOA_HOC.DATA, executorId);
      }

      // XML dạng danh sách học viên thông thường
      const students = this.parseXml(xmlContent);
      if (!students || students.length === 0) {
        throw new BadRequestException('Không tìm thấy bản ghi học viên hợp lệ trong tệp XML.');
      }
      if (!classId) {
        throw new BadRequestException('Vui lòng chọn lớp học để gán danh sách học viên này.');
      }
      return this.executeImport(classId, students, executorId);
    }

    // Trường hợp 2: Tệp Excel (.xlsx, .xls)
    if (ext === 'xlsx' || ext === 'xls') {
      const students = this.parseExcel(file.buffer);
      if (!students || students.length === 0) {
        throw new BadRequestException('Không tìm thấy bản ghi học viên hợp lệ trong tệp Excel.');
      }
      if (!classId) {
        throw new BadRequestException('Vui lòng chọn lớp học để gán danh sách học viên từ Excel.');
      }
      return this.executeImport(classId, students, executorId);
    }

    throw new BadRequestException('Định dạng tệp không được hỗ trợ. Vui lòng chọn file .xml hoặc .xlsx.');
  }

  // Đồng bộ CSDL và dọn dẹp các bản ghi soft-deleted theo yêu cầu người dùng:
  // "khi xóa dữ liệu trên web sẻ xóa luôn dữ liệu trong database"
  async syncDatabaseAndProcedures() {
    try {
      this.logger.log('Bắt đầu đồng bộ CSDL: Dọn dẹp bản ghi cũ đã xóa và cập nhật Stored Procedures...');

      // 1. Dọn dẹp sạch sẽ các bản ghi có DaXoa = 1 để đồng bộ 100% CSDL với dữ liệu hiển thị trên Web
      await this.dataSource.query(`
        -- Xóa tiến độ của học viên đã xóa
        DELETE FROM dbo.TienDoHocTap 
        WHERE MaHocVien IN (SELECT MaNguoiDung FROM dbo.NguoiDung WHERE DaXoa = 1);

        -- Xóa phân công / liên kết lớp học của học viên hoặc giáo viên hoặc lớp đã xóa
        DELETE FROM dbo.HocVienLopHoc 
        WHERE DaXoa = 1 
           OR MaLopHoc IN (SELECT MaLopHoc FROM dbo.LopHoc WHERE DaXoa = 1)
           OR MaHocVien IN (SELECT MaNguoiDung FROM dbo.NguoiDung WHERE DaXoa = 1);

        -- Gỡ giáo viên phụ trách nếu giáo viên đã bị xóa
        UPDATE dbo.LopHoc 
        SET MaGiaoVienPhuTrach = NULL 
        WHERE MaGiaoVienPhuTrach IN (SELECT MaNguoiDung FROM dbo.NguoiDung WHERE DaXoa = 1);

        -- Xóa vĩnh viễn các lớp học đã xóa (giải phóng toàn bộ Unique Key như 79172K262033)
        DELETE FROM dbo.LopHoc WHERE DaXoa = 1;

        -- Xóa nhật ký liên quan đến người dùng đã xóa
        DELETE FROM dbo.NhatKyHeThong 
        WHERE MaNguoiDung IN (SELECT MaNguoiDung FROM dbo.NguoiDung WHERE DaXoa = 1);

        -- Xóa vĩnh viễn người dùng đã xóa
        DELETE FROM dbo.NguoiDung WHERE DaXoa = 1;
      `);

      // 2. Đảm bảo cột AvatarUrl tồn tại trong dbo.NguoiDung
      await this.dataSource.query(`
        IF NOT EXISTS (
          SELECT 1 FROM sys.columns 
          WHERE object_id = OBJECT_ID(N'dbo.NguoiDung') AND name = N'AvatarUrl'
        )
        BEGIN
          ALTER TABLE dbo.NguoiDung ADD AvatarUrl NVARCHAR(500) NULL;
        END
      `);

      // 3. Cập nhật Stored Procedure sp_XoaNguoiDung sang Hard Delete trực tiếp
      await this.dataSource.query(`
        CREATE OR ALTER PROCEDURE dbo.sp_XoaNguoiDung
            @MaNguoiDung    INT,
            @NguoiThucHien  INT = NULL
        AS
        BEGIN
            SET NOCOUNT ON;
            BEGIN TRY
                BEGIN TRANSACTION;

                -- Xóa tiến độ học tập
                DELETE FROM dbo.TienDoHocTap WHERE MaHocVien = @MaNguoiDung;

                -- Xóa liên kết lớp học
                DELETE FROM dbo.HocVienLopHoc WHERE MaHocVien = @MaNguoiDung OR MaGiaoVien = @MaNguoiDung;

                -- Gỡ phụ trách lớp
                UPDATE dbo.LopHoc SET MaGiaoVienPhuTrach = NULL WHERE MaGiaoVienPhuTrach = @MaNguoiDung;

                -- Xóa nhật ký
                DELETE FROM dbo.NhatKyHeThong WHERE MaNguoiDung = @MaNguoiDung;

                -- Xóa bản ghi người dùng
                DELETE FROM dbo.NguoiDung WHERE MaNguoiDung = @MaNguoiDung;

                COMMIT TRANSACTION;
                SELECT @MaNguoiDung AS MaNguoiDung;
            END TRY
            BEGIN CATCH
                IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
                DECLARE @ErrMsg NVARCHAR(4000) = ERROR_MESSAGE();
                RAISERROR(@ErrMsg, 16, 1);
            END CATCH
        END
      `);

      // 4. Cập nhật Stored Procedure sp_TiepNhanBaoCao1XML sang cơ chế idempotent (tự động cập nhật nếu lớp/học viên đã tồn tại, không văng lỗi Unique Key)
      await this.dataSource.query(`
        CREATE OR ALTER PROCEDURE dbo.sp_TiepNhanBaoCao1XML
            @DuLieuKhoaHocJSON  NVARCHAR(MAX),
            @DuLieuHocVienJSON  NVARCHAR(MAX),
            @NguoiThucHien      INT = NULL
        AS
        BEGIN
            SET NOCOUNT ON;
            BEGIN TRY
                BEGIN TRANSACTION;

                -- 1. Bóc tách thông tin Khóa học từ JSON
                DECLARE @MaKhoaHocCode  NVARCHAR(100),
                        @TenKhoaHoc     NVARCHAR(200),
                        @HangGPLX       NVARCHAR(20),
                        @NgayKhaiGiang  DATETIME,
                        @NgayBeGiang    DATETIME,
                        @SoHocSinh      INT;

                SELECT 
                    @MaKhoaHocCode = JSON_VALUE(@DuLieuKhoaHocJSON, '$.MaKhoaHocCode'),
                    @TenKhoaHoc    = JSON_VALUE(@DuLieuKhoaHocJSON, '$.TenKhoaHoc'),
                    @HangGPLX      = JSON_VALUE(@DuLieuKhoaHocJSON, '$.HangGPLX'),
                    @NgayKhaiGiang = TRY_CAST(JSON_VALUE(@DuLieuKhoaHocJSON, '$.NgayKhaiGiang') AS DATETIME),
                    @NgayBeGiang   = TRY_CAST(JSON_VALUE(@DuLieuKhoaHocJSON, '$.NgayBeGiang') AS DATETIME),
                    @SoHocSinh     = TRY_CAST(JSON_VALUE(@DuLieuKhoaHocJSON, '$.SoHocSinh') AS INT);

                IF @TenKhoaHoc IS NULL OR LTRIM(RTRIM(@TenKhoaHoc)) = ''
                BEGIN
                    SET @TenKhoaHoc = N'Khóa học mới - ' + CONVERT(NVARCHAR(30), GETDATE(), 120);
                END;

                IF @MaKhoaHocCode IS NULL OR LTRIM(RTRIM(@MaKhoaHocCode)) = ''
                BEGIN
                    SET @MaKhoaHocCode = N'KH_' + CONVERT(NVARCHAR(20), DATEDIFF(SECOND, '1970-01-01', GETUTCDATE()));
                END;

                -- 2. Tự động tìm Khung Bài Giảng Mẫu
                DECLARE @MaKhoaHocMau INT = NULL;

                IF LOWER(@TenKhoaHoc) LIKE N'%số sàn%' OR UPPER(@HangGPLX) = 'B2'
                BEGIN
                    SELECT TOP 1 @MaKhoaHocMau = MaKhoaHoc FROM dbo.KhoaHoc WHERE MaHangGPLX = 'B2' AND DaXoa = 0;
                END
                ELSE IF LOWER(@TenKhoaHoc) LIKE N'%tự động%' OR UPPER(@HangGPLX) = 'B1'
                BEGIN
                    SELECT TOP 1 @MaKhoaHocMau = MaKhoaHoc FROM dbo.KhoaHoc WHERE MaHangGPLX = 'B1' AND DaXoa = 0;
                END
                ELSE IF UPPER(@HangGPLX) = 'C1' OR LOWER(@TenKhoaHoc) LIKE N'%c1%'
                BEGIN
                    SELECT TOP 1 @MaKhoaHocMau = MaKhoaHoc FROM dbo.KhoaHoc WHERE MaHangGPLX = 'C1' AND DaXoa = 0;
                END
                ELSE
                BEGIN
                    SELECT TOP 1 @MaKhoaHocMau = MaKhoaHoc FROM dbo.KhoaHoc WHERE MaHangGPLX = @HangGPLX AND DaXoa = 0;
                END;

                IF @MaKhoaHocMau IS NULL
                BEGIN
                    SELECT TOP 1 @MaKhoaHocMau = MaKhoaHoc FROM dbo.KhoaHoc WHERE DaXoa = 0 ORDER BY MaKhoaHoc ASC;
                END;

                -- 3. Kiểm tra xem Khóa học thực tế đã tồn tại chưa theo MaLopHocCode
                DECLARE @MaLopHocThucTe INT = NULL;
                SELECT TOP 1 @MaLopHocThucTe = MaLopHoc 
                FROM dbo.LopHoc 
                WHERE MaLopHocCode = @MaKhoaHocCode;

                IF @MaLopHocThucTe IS NULL
                BEGIN
                    INSERT INTO dbo.LopHoc (
                        MaLopHocCode, TenLopHoc, MaKhoaHoc, MaGiaoVienPhuTrach,
                        NgayKhaiGiang, NgayBeGiang, TrangThai, DaXoa, NgayTao, NgayCapNhat
                    )
                    VALUES (
                        @MaKhoaHocCode,
                        @TenKhoaHoc,
                        @MaKhoaHocMau,
                        NULL,
                        ISNULL(@NgayKhaiGiang, GETDATE()),
                        ISNULL(@NgayBeGiang, DATEADD(MONTH, 3, GETDATE())),
                        N'Đang đào tạo',
                        0,
                        GETDATE(),
                        GETDATE()
                    );
                    SET @MaLopHocThucTe = SCOPE_IDENTITY();
                END
                ELSE
                BEGIN
                    UPDATE dbo.LopHoc
                    SET TenLopHoc = @TenKhoaHoc,
                        MaKhoaHoc = @MaKhoaHocMau,
                        NgayKhaiGiang = ISNULL(@NgayKhaiGiang, NgayKhaiGiang),
                        NgayBeGiang = ISNULL(@NgayBeGiang, NgayBeGiang),
                        TrangThai = N'Đang đào tạo',
                        DaXoa = 0,
                        NgayCapNhat = GETDATE()
                    WHERE MaLopHoc = @MaLopHocThucTe;
                END;

                -- 4. Bóc tách danh sách học viên từ @DuLieuHocVienJSON
                DECLARE @BangHocVienImport TABLE (
                    TenDangNhap NVARCHAR(100),
                    MatKhauHash NVARCHAR(255),
                    HoVaTen     NVARCHAR(150),
                    SoCCCD      NVARCHAR(20),
                    SoDienThoai NVARCHAR(20),
                    Email       NVARCHAR(100),
                    TenGiaoVien NVARCHAR(100)
                );

                INSERT INTO @BangHocVienImport (TenDangNhap, MatKhauHash, HoVaTen, SoCCCD, SoDienThoai, Email, TenGiaoVien)
                SELECT 
                    JSON_VALUE(value, '$.TenDangNhap'),
                    ISNULL(JSON_VALUE(value, '$.MatKhauHash'), N'$2a$10$wT0lV3c9JmU0fD.XQe1G5e27H4jY6zV9tQ.Kz.p3uR8n1d2s3t4u5'),
                    JSON_VALUE(value, '$.HoVaTen'),
                    JSON_VALUE(value, '$.SoCCCD'),
                    JSON_VALUE(value, '$.SoDienThoai'),
                    JSON_VALUE(value, '$.Email'),
                    JSON_VALUE(value, '$.TenGiaoVien')
                FROM OPENJSON(@DuLieuHocVienJSON);

                -- 5. Nạp học viên vào bảng NguoiDung, HocVienLopHoc và TienDoHocTap
                DECLARE @Cur_TenDangNhap NVARCHAR(100), @Cur_MatKhauHash NVARCHAR(255), @Cur_HoVaTen NVARCHAR(150), 
                        @Cur_SoCCCD NVARCHAR(20), @Cur_SoDienThoai NVARCHAR(20), @Cur_Email NVARCHAR(100), @Cur_TenGiaoVien NVARCHAR(100);
                DECLARE @MaHocVienHienTai INT;
                DECLARE @SoThanhCong INT = 0;

                DECLARE con_tro CURSOR LOCAL FAST_FORWARD FOR
                    SELECT TenDangNhap, MatKhauHash, HoVaTen, SoCCCD, SoDienThoai, Email, TenGiaoVien FROM @BangHocVienImport;

                OPEN con_tro;
                FETCH NEXT FROM con_tro INTO @Cur_TenDangNhap, @Cur_MatKhauHash, @Cur_HoVaTen, @Cur_SoCCCD, @Cur_SoDienThoai, @Cur_Email, @Cur_TenGiaoVien;

                WHILE @@FETCH_STATUS = 0
                BEGIN
                    SET @MaHocVienHienTai = NULL;

                    SELECT @MaHocVienHienTai = MaNguoiDung 
                    FROM dbo.NguoiDung 
                    WHERE ((SoCCCD = @Cur_SoCCCD AND @Cur_SoCCCD IS NOT NULL AND @Cur_SoCCCD <> '') OR TenDangNhap = @Cur_TenDangNhap);

                    IF @MaHocVienHienTai IS NULL
                    BEGIN
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
                        UPDATE dbo.NguoiDung
                        SET HoVaTen = @Cur_HoVaTen,
                            SoDienThoai = ISNULL(@Cur_SoDienThoai, SoDienThoai),
                            Email = ISNULL(@Cur_Email, Email),
                            DaXoa = 0,
                            TrangThai = 1,
                            NgayCapNhat = GETDATE()
                        WHERE MaNguoiDung = @MaHocVienHienTai;
                    END

                    -- Ghi danh vào Khóa học thực tế này
                    IF NOT EXISTS (SELECT 1 FROM dbo.HocVienLopHoc WHERE MaHocVien = @MaHocVienHienTai AND MaLopHoc = @MaLopHocThucTe)
                    BEGIN
                        INSERT INTO dbo.HocVienLopHoc (MaHocVien, MaLopHoc, NgayGhiDanh, TrangThaiHocTap, DaXoa)
                        VALUES (@MaHocVienHienTai, @MaLopHocThucTe, GETDATE(), N'Đang học', 0);
                    END
                    ELSE
                    BEGIN
                        UPDATE dbo.HocVienLopHoc
                        SET DaXoa = 0, TrangThaiHocTap = N'Đang học'
                        WHERE MaHocVien = @MaHocVienHienTai AND MaLopHoc = @MaLopHocThucTe;
                    END

                    -- Tự động gán toàn bộ lộ trình bài giảng từ Khung Bài Giảng Mẫu tương ứng
                    INSERT INTO dbo.TienDoHocTap (MaHocVien, MaBaiGiang, ThoiGianHocGiay, DaHoanThanh, LanHocCuoi, NgayCapNhat)
                    SELECT 
                        @MaHocVienHienTai,
                        b.MaBaiGiang,
                        0,
                        0,
                        GETDATE(),
                        GETDATE()
                    FROM dbo.BaiGiang b
                    WHERE b.MaKhoaHoc = @MaKhoaHocMau 
                      AND b.DaXoa = 0
                      AND NOT EXISTS (
                          SELECT 1 FROM dbo.TienDoHocTap t 
                          WHERE t.MaHocVien = @MaHocVienHienTai AND t.MaBaiGiang = b.MaBaiGiang
                      );

                    SET @SoThanhCong = @SoThanhCong + 1;

                    FETCH NEXT FROM con_tro INTO @Cur_TenDangNhap, @Cur_MatKhauHash, @Cur_HoVaTen, @Cur_SoCCCD, @Cur_SoDienThoai, @Cur_Email, @Cur_TenGiaoVien;
                END

                CLOSE con_tro;
                DEALLOCATE con_tro;

                COMMIT TRANSACTION;

                -- Trả về kết quả khởi tạo
                SELECT 
                    l.MaLopHoc,
                    l.MaLopHocCode,
                    l.TenLopHoc,
                    k.MaKhoaHoc AS MaKhoaHocMau,
                    k.TenKhoaHoc AS TenKhungBaiGiangMau,
                    k.MaHangGPLX,
                    (SELECT COUNT(DISTINCT bg.MonHoc) FROM dbo.BaiGiang bg WHERE bg.MaKhoaHoc = k.MaKhoaHoc AND bg.DaXoa = 0) AS TongSoChuongKhung,
                    (SELECT COUNT(1) FROM dbo.BaiGiang bg WHERE bg.MaKhoaHoc = k.MaKhoaHoc AND bg.DaXoa = 0) AS TongSoBaiGiangKhung,
                    l.NgayKhaiGiang,
                    l.NgayBeGiang,
                    l.TrangThai,
                    @SoThanhCong AS SoLuongImportThanhCong
                FROM dbo.LopHoc l
                INNER JOIN dbo.KhoaHoc k ON l.MaKhoaHoc = k.MaKhoaHoc
                WHERE l.MaLopHoc = @MaLopHocThucTe;
            END TRY
            BEGIN CATCH
                IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
                DECLARE @Loi NVARCHAR(4000) = ERROR_MESSAGE();
                RAISERROR(@Loi, 16, 1);
            END CATCH
        END
      `);

      this.logger.log('✓ Đồng bộ CSDL thành công: Toàn bộ bản ghi cũ đã được dọn sạch, Stored Procedures sẵn sàng.');
    } catch (err: any) {
      this.logger.error(`Lỗi trong quá trình đồng bộ CSDL: ${err.message}`, err.stack);
    }
  }

  // Tự động bóc tách và giải mã ảnh chân dung học viên từ Base64 (JP2 / JPEG / PNG) và lưu vào ổ đĩa máy chủ
  private async saveStudentPhoto(base64Str: string | undefined, cccd: string): Promise<string | null> {
    if (!base64Str || typeof base64Str !== 'string' || base64Str.trim().length === 0) {
      return null;
    }

    try {
      const uploadDir = path.join(process.cwd(), 'uploads', 'avatars');
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      const cleanBase64 = base64Str.replace(/^data:image\/[a-z]+;base64,/, '').trim();
      const buf = Buffer.from(cleanBase64, 'base64');
      if (buf.length < 10) {
        return null;
      }

      const safeCccd = cccd.replace(/[^a-zA-Z0-9_-]/g, '');
      const fileName = `avatar-${safeCccd}-${Date.now()}.jpg`;
      const targetPath = path.join(uploadDir, fileName);

      // Kiểm tra định dạng ảnh JPEG 2000 (JP2 sinh trắc học chuẩn Tổng cục Đường bộ Việt Nam)
      // File JP2 bắt đầu bằng 0x00 0x00 0x00 0x0C 0x6A 0x50 0x20 0x20
      const isJp2 = buf.length > 12 && buf[0] === 0x00 && buf[1] === 0x00 && buf[2] === 0x00 && buf[3] === 0x0C && buf[4] === 0x6A && buf[5] === 0x50;

      if (isJp2) {
        const jpx = new JpxImage();
        jpx.parse(buf);
        const rawPixels = Buffer.from(jpx.tiles[0].items);
        await sharp(rawPixels, {
          raw: {
            width: jpx.width,
            height: jpx.height,
            channels: (jpx.componentsCount || 3) as 1 | 2 | 3 | 4,
          },
        })
          .jpeg({ quality: 85 })
          .toFile(targetPath);
      } else {
        // Ảnh định dạng thông thường (JPEG, PNG, WEBP)
        await sharp(buf)
          .jpeg({ quality: 85 })
          .toFile(targetPath);
      }

      this.logger.log(`Đã trích xuất & lưu thành công ảnh học viên CCCD: ${cccd} -> /uploads/avatars/${fileName}`);
      return `/uploads/avatars/${fileName}`;
    } catch (error: any) {
      this.logger.warn(`Không thể giải mã ảnh học viên CCCD ${cccd}: ${error?.message || error}`);
      return null;
    }
  }

  // Xử lý chuyên sâu cho tệp Báo cáo 1 (Tự động tạo khóa học, gán bài giảng mẫu tương ứng, nạp học viên kèm trích xuất ảnh chân dung)
  private async processReport1Xml(dataNode: any, executorId: number) {
    await this.syncDatabaseAndProcedures();
    const rawKhoaHoc = dataNode?.KHOA_HOC || {};
    let rawNguoiLxs = dataNode?.NGUOI_LXS?.NGUOI_LX || [];

    if (!Array.isArray(rawNguoiLxs)) {
      rawNguoiLxs = [rawNguoiLxs];
    }

    const defaultPasswordHash = bcrypt.hashSync('HocVien@123', 10);

    const khoaHocInfo = {
      MaKhoaHocCode: rawKhoaHoc.MA_KHOA_HOC || rawKhoaHoc.SO_DANG_KY_KHOA_HOC || `KH_${Date.now()}`,
      TenKhoaHoc: rawKhoaHoc.TEN_KHOA_HOC || 'Khóa đào tạo lái xe mới',
      HangGPLX: rawKhoaHoc.HANG_GPLX || rawKhoaHoc.MA_HANG_DAO_TAO || 'B2',
      NgayKhaiGiang: rawKhoaHoc.NGAY_KHAI_GIANG || null,
      NgayBeGiang: rawKhoaHoc.NGAY_BE_GIANG || null,
      SoHocSinh: rawKhoaHoc.SO_HOC_SINH ? Number(rawKhoaHoc.SO_HOC_SINH) : rawNguoiLxs.length,
    };

    // Tự động trích xuất và chuyển đổi ảnh chân dung học viên từ Báo cáo 1
    const hocVienList = await Promise.all(
      rawNguoiLxs.map(async (s: any, idx: number) => {
        const cccd = String(s.SO_CMT || s.SoCCCD || s.CCCD || `0000000000${idx + 1}`).trim();
        const hoTen = s.HO_VA_TEN || `${s.HO_TEN_DEM || ''} ${s.TEN || ''}`.trim() || 'Học viên';
        const phone = s.DIEN_THOAI || s.SoDienThoai || '';
        const email = s.Email || '';
        const gv = s.TEN_GIAO_VIEN || '';

        // Tự động lấy thẻ <ANH_CHAN_DUNG> từ <HO_SO> hoặc trực tiếp
        const photoBase64 = s.HO_SO?.ANH_CHAN_DUNG || s.ANH_CHAN_DUNG;
        const avatarUrl = await this.saveStudentPhoto(photoBase64, cccd);

        return {
          HoVaTen: hoTen,
          SoCCCD: cccd,
          SoDienThoai: String(phone).trim(),
          Email: email,
          TenDangNhap: cccd,
          MatKhauHash: defaultPasswordHash,
          TenGiaoVien: gv,
          AvatarUrl: avatarUrl,
        };
      }),
    );

    const result = await this.dataSource.query(
      `EXEC dbo.sp_TiepNhanBaoCao1XML 
        @DuLieuKhoaHocJSON = @0, 
        @DuLieuHocVienJSON = @1, 
        @NguoiThucHien = @2`,
      [JSON.stringify(khoaHocInfo), JSON.stringify(hocVienList), executorId],
    );

    // Đồng bộ đường dẫn AvatarUrl vào CSDL dbo.NguoiDung
    for (const hv of hocVienList) {
      if (hv.AvatarUrl) {
        try {
          await this.dataSource.query(
            `UPDATE dbo.NguoiDung 
             SET AvatarUrl = @0, NgayCapNhat = GETDATE() 
             WHERE (SoCCCD = @1 OR TenDangNhap = @1) AND DaXoa = 0`,
            [hv.AvatarUrl, hv.SoCCCD],
          );
        } catch (dbErr: any) {
          this.logger.warn(`Lỗi cập nhật AvatarUrl cho học viên ${hv.SoCCCD}: ${dbErr?.message}`);
        }
      }
    }

    const summary = result?.[0] || {};

    return {
      tuDongHoa: true,
      thongBao: `Đã tự động tạo khóa học "${summary.TenLopHoc}", gán Khung bài giảng mẫu "${summary.TenKhungBaiGiangMau}" (${summary.TongSoBaiGiangKhung} bài giảng) và tiếp nhận ${summary.SoLuongImportThanhCong} học viên (kèm ảnh chân dung tự động trích xuất).`,
      chiTietKhoaHoc: {
        maLopHoc: summary.MaLopHoc,
        maKhoaHocCode: summary.MaLopHocCode,
        tenKhoaHoc: summary.TenLopHoc,
        hangGPLX: summary.MaHangGPLX,
        ngayKhaiGiang: summary.NgayKhaiGiang,
        ngayBeGiang: summary.NgayBeGiang,
        trangThai: summary.TrangThai,
        khungBaiGiangMau: {
          maKhauMau: summary.MaKhoaHocMau,
          tenKhung: summary.TenKhungBaiGiangMau,
          tongSoChuong: summary.TongSoChuongKhung,
          tongSoBaiGiang: summary.TongSoBaiGiangKhung,
        },
        soHocVien: summary.SoLuongImportThanhCong,
      },
    };
  }

  // Thực thi SP import dữ liệu thường vào một lớp đã chỉ định
  private async executeImport(
    classId: number,
    students: StudentRecordDto[],
    executorId: number,
  ) {
    const defaultPasswordHash = bcrypt.hashSync('HocVien@123', 10);

    const formattedData = students.map((s) => ({
      HoVaTen: s.HoVaTen ? String(s.HoVaTen).trim() : 'Học viên',
      SoCCCD: s.SoCCCD ? String(s.SoCCCD).trim() : null,
      SoDienThoai: s.SoDienThoai ? String(s.SoDienThoai).trim() : null,
      Email: s.Email ? String(s.Email).trim() : null,
      TenDangNhap: s.TenDangNhap ? String(s.TenDangNhap).trim() : (s.SoCCCD ? String(s.SoCCCD).trim() : `hv_${Date.now()}`),
      MatKhauHash: defaultPasswordHash,
    }));

    const jsonString = JSON.stringify(formattedData);

    const result = await this.dataSource.query(
      `EXEC dbo.sp_NhapDuLieuHocVien 
        @DuLieuJSON = @0, 
        @MaLopHoc = @1, 
        @NguoiThucHien = @2`,
      [jsonString, classId, executorId],
    );

    return {
      maLopHoc: classId,
      tongSoHocVienXuLy: students.length,
      ketQua: result?.[0] || { ThongBao: 'Nhập dữ liệu thành công.' },
    };
  }

  // Parse tệp Excel
  private parseExcel(buffer: Buffer): StudentRecordDto[] {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    const rows: any[] = XLSX.utils.sheet_to_json(worksheet);

    return rows.map((r) => ({
      HoVaTen: r['Họ và tên'] || r['HoVaTen'] || r['Họ tên'] || r['FullName'] || '',
      SoCCCD: r['Số CCCD'] || r['SoCCCD'] || r['CCCD'] || r['CMND'] || '',
      SoDienThoai: r['Số điện thoại'] || r['SoDienThoai'] || r['Phone'] || '',
      Email: r['Email'] || '',
      TenDangNhap: r['Tên đăng nhập'] || r['TenDangNhap'] || r['Username'] || undefined,
    })).filter((s) => s.HoVaTen && s.SoCCCD);
  }

  // Parse tệp XML
  private parseXml(xmlContent: string): StudentRecordDto[] {
    const parser = new XMLParser({ ignoreAttributes: false, trimValues: true });
    const jsonObj = parser.parse(xmlContent);

    // Tìm node danh sách học viên trong XML
    let studentNodes: any[] = [];
    if (jsonObj?.BaoCao?.DanhSachHocVien?.HocVien) {
      studentNodes = jsonObj.BaoCao.DanhSachHocVien.HocVien;
    } else if (jsonObj?.DanhSachHocVien?.HocVien) {
      studentNodes = jsonObj.DanhSachHocVien.HocVien;
    } else if (jsonObj?.Root?.HocVien) {
      studentNodes = jsonObj.Root.HocVien;
    }

    if (!Array.isArray(studentNodes)) {
      studentNodes = [studentNodes];
    }

    return studentNodes.map((s) => ({
      HoVaTen: s.HoVaTen || s.HoTen || '',
      SoCCCD: s.SoCCCD || s.CCCD || '',
      SoDienThoai: s.SoDienThoai || s.DienThoai || '',
      Email: s.Email || '',
      TenDangNhap: s.TenDangNhap || undefined,
    })).filter((s) => s.HoVaTen && s.SoCCCD);
  }

  // --- TỰ ĐỘNG HÓA PHÂN CÔNG GIÁO VIÊN QUA EXCEL (PHAN_GIAO_VIEN.xlsx) ---

  // Chuẩn hóa chuỗi tiếng Việt phục vụ so khớp mềm
  private normalizeVietnamese(str: string): string {
    if (!str) return '';
    return str
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/Đ/g, 'd')
      .trim()
      .replace(/\s+/g, ' ');
  }

  // Đảm bảo cột MaGiaoVien đã tồn tại trong bảng HocVienLopHoc
  private async ensureMaGiaoVienColumn() {
    try {
      await this.dataSource.query(`
        IF NOT EXISTS (
          SELECT 1 FROM sys.columns 
          WHERE object_id = OBJECT_ID(N'dbo.HocVienLopHoc') AND name = N'MaGiaoVien'
        )
        BEGIN
          ALTER TABLE dbo.HocVienLopHoc ADD MaGiaoVien INT NULL;
          ALTER TABLE dbo.HocVienLopHoc ADD CONSTRAINT FK_HocVienLopHoc_GiaoVien 
            FOREIGN KEY (MaGiaoVien) REFERENCES dbo.NguoiDung(MaNguoiDung);
        END
      `);
    } catch (err: any) {
      this.logger.warn(`ensureMaGiaoVienColumn: ${err.message}`);
    }
  }

  // Bóc tách bảng phân công từ Excel (tương thích mẫu PHAN_GIAO_VIEN.xlsx và các biến thể)
  private parseTeacherAssignmentExcel(buffer: Buffer) {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const assignments: {
      sheet: string;
      rowNum: number;
      hoTenHocVien: string;
      soCCCD: string;
      soDienThoai: string;
      tenGiaoVien: string;
    }[] = [];

    for (const sheetName of workbook.SheetNames) {
      const worksheet = workbook.Sheets[sheetName];
      const rows: any[] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

      let headerIdx = -1;
      let colMap = { gvCol: -1, hoCol: -1, tenCol: -1, hoTenCol: -1, cccdCol: -1, phoneCol: -1 };

      for (let r = 0; r < Math.min(rows.length, 15); r++) {
        const row = rows[r];
        if (!Array.isArray(row)) continue;

        const normRow = row.map((cell) => String(cell || '').trim().toLowerCase());
        const gvCol = normRow.findIndex((c) => c.includes('tên giáo viên') || c.includes('giáo viên') || c === 'gv');
        const hoCol = normRow.findIndex((c) => c === 'họ' || c === 'ho');
        const tenCol = normRow.findIndex((c) => c === 'tên' || c === 'ten');
        const hoTenCol = normRow.findIndex((c) => c.includes('họ và tên') || c.includes('họ tên') || c.includes('học viên'));
        const cccdCol = normRow.findIndex((c) => c.includes('cmnd') || c.includes('cccd') || c.includes('cmt'));
        const phoneCol = normRow.findIndex((c) => c.includes('điện thoại') || c.includes('phone') || c.includes('sđt'));

        if (gvCol !== -1 && (hoTenCol !== -1 || (hoCol !== -1 && tenCol !== -1))) {
          headerIdx = r;
          colMap = { gvCol, hoCol, tenCol, hoTenCol, cccdCol, phoneCol };
          break;
        }
      }

      if (headerIdx !== -1) {
        for (let r = headerIdx + 1; r < rows.length; r++) {
          const row = rows[r];
          if (!Array.isArray(row) || row.length === 0) continue;

          const tenGiaoVien = String(row[colMap.gvCol] || '').trim();
          if (!tenGiaoVien) continue;

          let hoTenHocVien = '';
          if (colMap.hoTenCol !== -1 && row[colMap.hoTenCol]) {
            hoTenHocVien = String(row[colMap.hoTenCol]).trim();
          } else if (colMap.hoCol !== -1 && colMap.tenCol !== -1) {
            const ho = String(row[colMap.hoCol] || '').trim();
            const ten = String(row[colMap.tenCol] || '').trim();
            hoTenHocVien = `${ho} ${ten}`.trim();
          }

          const cccd = colMap.cccdCol !== -1 ? String(row[colMap.cccdCol] || '').trim() : '';
          const phone = colMap.phoneCol !== -1 ? String(row[colMap.phoneCol] || '').trim() : '';

          // Lọc bỏ hàng tiêu đề nhóm (vd "5 Học viên", hoặc trùng tên giáo viên)
          if (!hoTenHocVien || hoTenHocVien.toLowerCase().includes('học viên') || hoTenHocVien.toLowerCase() === tenGiaoVien.toLowerCase()) {
            continue;
          }

          assignments.push({
            sheet: sheetName,
            rowNum: r + 1,
            hoTenHocVien,
            soCCCD: cccd,
            soDienThoai: phone,
            tenGiaoVien,
          });
        }

        if (assignments.length > 0) break;
      }
    }

    return assignments;
  }

  // 3. Xem trước và đối soát phân công giáo viên từ Excel
  async previewTeacherAssignment(file: Express.Multer.File, classId: number) {
    if (!file) {
      throw new BadRequestException('Vui lòng tải lên tệp Excel phân công (.xlsx, .xls).');
    }

    await this.ensureMaGiaoVienColumn();

    // 1. Kiểm tra lớp học
    const lopHoc = await this.dataSource.query(
      `SELECT MaLopHoc, MaLopHocCode, TenLopHoc FROM dbo.LopHoc WHERE MaLopHoc = @0 AND DaXoa = 0`,
      [classId],
    );
    if (!lopHoc || lopHoc.length === 0) {
      throw new BadRequestException(`Không tìm thấy lớp học với ID #${classId}.`);
    }

    // 2. Parse file Excel
    const parsedAssignments = this.parseTeacherAssignmentExcel(file.buffer);
    if (!parsedAssignments || parsedAssignments.length === 0) {
      throw new BadRequestException('Không tìm thấy danh sách phân công học viên - giáo viên hợp lệ trong tệp Excel.');
    }

    // 3. Lấy danh sách toàn bộ giáo viên hợp lệ trong hệ thống
    const dbTeachers: any[] = await this.dataSource.query(
      `SELECT MaNguoiDung, HoVaTen, TenDangNhap, SoCCCD, SoDienThoai 
       FROM dbo.NguoiDung 
       WHERE MaVaiTro = 'TEACHER' AND DaXoa = 0 AND TrangThai = 1`,
    );

    // 4. Lấy danh sách học viên hiện đang ghi danh trong lớp
    const dbStudents: any[] = await this.dataSource.query(
      `SELECT hl.MaDangKy, hl.MaHocVien, u.HoVaTen, u.SoCCCD, u.SoDienThoai, hl.MaGiaoVien, gv.HoVaTen AS TenGiaoVienHienTai
       FROM dbo.HocVienLopHoc hl
       INNER JOIN dbo.NguoiDung u ON hl.MaHocVien = u.MaNguoiDung
       LEFT JOIN dbo.NguoiDung gv ON hl.MaGiaoVien = gv.MaNguoiDung
       WHERE hl.MaLopHoc = @0 AND hl.DaXoa = 0 AND u.DaXoa = 0`,
      [classId],
    );

    // 5. Kiểm tra đối soát tài khoản giáo viên
    const uniqueTeacherNames = Array.from(new Set(parsedAssignments.map((a) => a.tenGiaoVien)));
    const teacherMap: Record<string, any | null> = {};
    const missingTeachers: string[] = [];

    for (const rawName of uniqueTeacherNames) {
      const cleanName = rawName.replace(/^(Thầy|Cô|thầy|cô)\s+/i, '').trim();
      const normName = this.normalizeVietnamese(cleanName);

      const matchedTeacher = dbTeachers.find((t) => {
        const tNorm = this.normalizeVietnamese(t.HoVaTen);
        const uNorm = this.normalizeVietnamese(t.TenDangNhap);
        return tNorm === normName || uNorm === normName || tNorm.includes(normName) || normName.includes(tNorm);
      });

      if (matchedTeacher) {
        teacherMap[rawName] = matchedTeacher;
      } else {
        teacherMap[rawName] = null;
        missingTeachers.push(rawName);
      }
    }

    // 6. Ghép học viên trong file Excel với học viên thực tế trong lớp học
    const assignmentPreviewList = parsedAssignments.map((item) => {
      const normItemName = this.normalizeVietnamese(item.hoTenHocVien);
      const cleanItemCccd = item.soCCCD.replace(/^0+/, '');
      const cleanItemPhone = item.soDienThoai.replace(/^0+/, '');

      const matchedDbStudent = dbStudents.find((s) => {
        const sCccd = String(s.SoCCCD || '').replace(/^0+/, '');
        const sPhone = String(s.SoDienThoai || '').replace(/^0+/, '');
        const sName = this.normalizeVietnamese(s.HoVaTen);

        return (
          (cleanItemCccd && cleanItemCccd === sCccd) ||
          (sName && sName === normItemName) ||
          (cleanItemPhone && cleanItemPhone === sPhone)
        );
      });

      const matchedTeacher = teacherMap[item.tenGiaoVien];

      return {
        rowNum: item.rowNum,
        hoTenHocVienExcel: item.hoTenHocVien,
        soCCCDExcel: item.soCCCD,
        soDienThoaiExcel: item.soDienThoai,
        tenGiaoVienExcel: item.tenGiaoVien,
        giaoVienHopLe: !!matchedTeacher,
        thongTinGiaoVien: matchedTeacher
          ? {
              maGiaoVien: matchedTeacher.MaNguoiDung,
              hoVaTen: matchedTeacher.HoVaTen,
              tenDangNhap: matchedTeacher.TenDangNhap,
            }
          : null,
        hocVienTrongLop: matchedDbStudent
          ? {
              maHocVien: matchedDbStudent.MaHocVien,
              maDangKy: matchedDbStudent.MaDangKy,
              hoVaTen: matchedDbStudent.HoVaTen,
              soCCCD: matchedDbStudent.SoCCCD,
              tenGiaoVienHienTai: matchedDbStudent.TenGiaoVienHienTai || 'Chưa phân công',
            }
          : null,
        trangThaiKhopHocVien: !!matchedDbStudent,
      };
    });

    const isAllTeachersValid = missingTeachers.length === 0;

    return {
      lopHoc: lopHoc[0],
      tongSoPhanCongExcel: parsedAssignments.length,
      tongSoHocVienTrongLop: dbStudents.length,
      soHocVienKhop: assignmentPreviewList.filter((a) => a.trangThaiKhopHocVien).length,
      danhSachGiaoVienTrongFile: uniqueTeacherNames.map((name) => ({
        tenExcel: name,
        tonTaiTrongHeThong: !!teacherMap[name],
        thongTinGV: teacherMap[name] || null,
      })),
      giaoVienChuaCoTaiKhoan: missingTeachers,
      hopLe: isAllTeachersValid,
      thongBao: isAllTeachersValid
        ? `Tệp Excel hợp lệ. Toàn bộ ${uniqueTeacherNames.length} giáo viên đều tồn tại trên hệ thống. Sẵn sàng phân công!`
        : `Không tìm thấy giáo viên phụ trách: ${missingTeachers.map((t) => `"${t}"`).join(', ')}. Vui lòng tạo tài khoản giáo viên trước khi phân công!`,
      chiTietPhanCong: assignmentPreviewList,
    };
  }

  // 4. Thực thi phân công giáo viên vào CSDL
  async assignTeachersFromExcel(file: Express.Multer.File, classId: number, executorId: number) {
    const preview = await this.previewTeacherAssignment(file, classId);

    // RÀNG BUỘC THEO SKILL: Nếu giáo viên được phân cho học viên mà không thấy tài khoản giáo viên đó thì sẽ báo lỗi không tìm thấy giáo viên phụ trách
    if (!preview.hopLe || preview.giaoVienChuaCoTaiKhoan.length > 0) {
      throw new BadRequestException(
        `Không tìm thấy giáo viên phụ trách: ${preview.giaoVienChuaCoTaiKhoan.map((t: string) => `"${t}"`).join(', ')}. Vui lòng tạo tài khoản giáo viên trước khi phân công!`,
      );
    }

    const matchedList = preview.chiTietPhanCong.filter(
      (item) => item.trangThaiKhopHocVien && item.giaoVienHopLe && item.hocVienTrongLop && item.thongTinGiaoVien,
    );

    if (matchedList.length === 0) {
      throw new BadRequestException('Không tìm thấy học viên nào trong lớp khớp với danh sách tệp Excel để phân công.');
    }

    // Thực thi cập nhật CSDL
    let updateCount = 0;
    const assignedTeachers = new Set<string>();

    for (const item of matchedList) {
      const maDangKy = item.hocVienTrongLop?.maDangKy;
      const maGiaoVien = item.thongTinGiaoVien?.maGiaoVien;

      if (maDangKy && maGiaoVien) {
        await this.dataSource.query(
          `UPDATE dbo.HocVienLopHoc 
           SET MaGiaoVien = @0 
           WHERE MaDangKy = @1`,
          [maGiaoVien, maDangKy],
        );
        updateCount++;
        assignedTeachers.add(item.thongTinGiaoVien.hoVaTen);
      }
    }

    // Cập nhật giáo viên phụ trách chính của lớp nếu lớp chưa có giáo viên phụ trách
    const firstTeacherId = matchedList[0]?.thongTinGiaoVien?.maGiaoVien;
    if (firstTeacherId) {
      await this.dataSource.query(
        `UPDATE dbo.LopHoc 
         SET MaGiaoVienPhuTrach = ISNULL(MaGiaoVienPhuTrach, @0), 
             NgayCapNhat = GETDATE() 
         WHERE MaLopHoc = @1`,
        [firstTeacherId, classId],
      );
    }

    // Ghi nhật ký hệ thống
    try {
      await this.dataSource.query(
        `INSERT INTO dbo.NhatKyHeThong (MaNguoiDung, HanhDong, DoiTuong, ChiTiet, NgayTao)
         VALUES (@0, N'PHAN_CONG_GIAO_VIEN_EXCEL', N'HocVienLopHoc', @1, GETDATE())`,
        [
          executorId,
          `Phân công tự động ${updateCount} học viên cho các giáo viên: ${Array.from(assignedTeachers).join(', ')} trong lớp #${classId}`,
        ],
      );
    } catch (e) {}

    return {
      success: true,
      thongBao: `Phân công giáo viên thành công! Đã gán ${updateCount} học viên cho các giáo viên phụ trách (${Array.from(assignedTeachers).join(', ')}).`,
      soLuongHocVienPhanCong: updateCount,
      lopHoc: preview.lopHoc,
      danhSachGiaoVien: Array.from(assignedTeachers),
    };
  }
}
