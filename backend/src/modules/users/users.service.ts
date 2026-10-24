import { Injectable, Logger, OnModuleInit, BadRequestException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import * as path from 'path';
import * as fs from 'fs';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const sharp = require('sharp');
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { QueryUserDto } from './dto/query-user.dto';

@Injectable()
export class UsersService implements OnModuleInit {
  private readonly logger = new Logger(UsersService.name);

  constructor(private readonly dataSource: DataSource) {}

  async onModuleInit() {
    await this.ensureAvatarUrlColumn();
  }

  // Đảm bảo cột AvatarUrl đã tồn tại và hỗ trợ Base64 (NVARCHAR(MAX))
  private async ensureAvatarUrlColumn() {
    try {
      await this.dataSource.query(`
        IF NOT EXISTS (
          SELECT 1 FROM sys.columns 
          WHERE object_id = OBJECT_ID(N'dbo.NguoiDung') AND name = N'AvatarUrl'
        )
        BEGIN
          ALTER TABLE dbo.NguoiDung ADD AvatarUrl NVARCHAR(MAX) NULL;
        END
        ELSE
        BEGIN
          ALTER TABLE dbo.NguoiDung ALTER COLUMN AvatarUrl NVARCHAR(MAX) NULL;
        END
      `);

      // Tự động chuyển đổi các avatar dạng file path (/uploads/avatars/...) sang Base64 Data URL
      const usersWithFilePath = await this.dataSource.query(`
        SELECT MaNguoiDung, AvatarUrl FROM dbo.NguoiDung 
        WHERE AvatarUrl LIKE '/uploads/avatars/%' AND DaXoa = 0
      `);
      if (Array.isArray(usersWithFilePath) && usersWithFilePath.length > 0) {
        for (const u of usersWithFilePath) {
          const localPath = path.join(process.cwd(), u.AvatarUrl);
          if (fs.existsSync(localPath)) {
            try {
              const fileBuf = fs.readFileSync(localPath);
              const b64 = `data:image/jpeg;base64,${fileBuf.toString('base64')}`;
              await this.dataSource.query(
                `UPDATE dbo.NguoiDung SET AvatarUrl = @0 WHERE MaNguoiDung = @1`,
                [b64, u.MaNguoiDung],
              );
              this.logger.log(`Đã tự động chuyển Avatar của tài khoản #${u.MaNguoiDung} sang định dạng Base64 Data URL`);
            } catch (convErr: any) {
              this.logger.warn(`Không thể đọc file avatar cho #${u.MaNguoiDung}: ${convErr.message}`);
            }
          }
        }
      }
    } catch (err: any) {
      this.logger.warn(`ensureAvatarUrlColumn: ${err.message}`);
    }
  }

  async getUsersPaged(query: QueryUserDto) {
    const {
      tuKhoa = null,
      maVaiTro = null,
      trangThai = null,
      trangHienTai = 1,
      soBanGhiMoiTrang = 10,
      sapXepTheo = 'NgayTao',
      huongSapXep = 'DESC',
    } = query;

    // TypeORM query mssql đa result set
    const result = await this.dataSource.query(
      `EXEC dbo.sp_LayDanhSachNguoiDungPhanTrang 
        @TuKhoa = @0, 
        @MaVaiTro = @1, 
        @TrangThai = @2, 
        @TrangHienTai = @3, 
        @SoBanGhiMoiTrang = @4, 
        @SapXepTheo = @5, 
        @HuongSapXep = @6`,
      [
        tuKhoa ? tuKhoa.trim() : null,
        maVaiTro || null,
        trangThai !== undefined && trangThai !== null ? (trangThai === 1 ? 1 : 0) : null,
        Number(trangHienTai),
        Number(soBanGhiMoiTrang),
        sapXepTheo,
        huongSapXep,
      ],
    );

    let danhSach = Array.isArray(result) ? (Array.isArray(result[0]) ? result[0] : result) : [];

    const tongSoBanGhi =
      danhSach.length > 0 && danhSach[0].TongSoBanGhi !== undefined
        ? Number(danhSach[0].TongSoBanGhi)
        : danhSach.length;

    const soBanGhi = Number(soBanGhiMoiTrang);
    const tongSoTrang = soBanGhi <= 0 ? 1 : Math.ceil(tongSoBanGhi / soBanGhi);

    const phanTrang = {
      tongSoBanGhi,
      trangHienTai: Number(trangHienTai),
      soBanGhiMoiTrang: soBanGhi,
      tongSoTrang,
    };

    // Loại bỏ trường TongSoBanGhi khỏi từng dòng trả về cho gọn gàng
    danhSach = danhSach.map(({ TongSoBanGhi, ...rest }) => rest);

    // Bổ sung AvatarUrl nếu sp chưa trả về
    if (danhSach.length > 0 && danhSach[0].AvatarUrl === undefined) {
      const userIds = danhSach.map((u: any) => u.MaNguoiDung).filter(Boolean);
      if (userIds.length > 0) {
        try {
          const avatars = await this.dataSource.query(
            `SELECT MaNguoiDung, AvatarUrl FROM dbo.NguoiDung WHERE MaNguoiDung IN (${userIds.join(',')})`,
          );
          const map = new Map(avatars.map((a: any) => [a.MaNguoiDung, a.AvatarUrl]));
          danhSach.forEach((u: any) => {
            u.AvatarUrl = map.get(u.MaNguoiDung) || null;
          });
        } catch {
          // ignore
        }
      }
    }

    return {
      danhSach,
      phanTrang,
    };
  }

  async createUser(dto: CreateUserDto, executorId: number) {
    // Hash mật khẩu an toàn với Bcrypt
    const matKhauHash = bcrypt.hashSync(dto.matKhau, 10);

    const result = await this.dataSource.query(
      `EXEC dbo.sp_ThemNguoiDung 
        @TenDangNhap = @0, 
        @MatKhauHash = @1, 
        @HoVaTen = @2, 
        @SoCCCD = @3, 
        @SoDienThoai = @4, 
        @Email = @5, 
        @MaVaiTro = @6, 
        @NguoiThucHien = @7`,
      [
        dto.tenDangNhap.trim(),
        matKhauHash,
        dto.hoVaTen.trim(),
        dto.soCCCD ? dto.soCCCD.trim() : null,
        dto.soDienThoai ? dto.soDienThoai.trim() : null,
        dto.email ? dto.email.trim() : null,
        dto.maVaiTro,
        executorId,
      ],
    );

    const maNguoiDung = Array.isArray(result) && result[0] ? result[0].MaNguoiDung : null;

    return {
      maNguoiDung,
      tenDangNhap: dto.tenDangNhap,
      hoVaTen: dto.hoVaTen,
      maVaiTro: dto.maVaiTro,
    };
  }

  async updateUser(id: number, dto: UpdateUserDto, executorId: number) {
    // 1. Kiểm tra tồn tại
    const existing = await this.dataSource.query(
      `SELECT MaNguoiDung, TenDangNhap FROM dbo.NguoiDung WHERE MaNguoiDung = @0 AND DaXoa = 0`,
      [id],
    );
    if (!existing || existing.length === 0) {
      throw new Error(`Người dùng ID #${id} không tồn tại hoặc đã bị xóa.`);
    }

    // 2. Kiểm tra trùng tên đăng nhập nếu có đổi
    const newUsername = dto.tenDangNhap ? dto.tenDangNhap.trim() : null;
    if (newUsername && newUsername.toLowerCase() !== existing[0].TenDangNhap.toLowerCase()) {
      const dup = await this.dataSource.query(
        `SELECT MaNguoiDung FROM dbo.NguoiDung WHERE TenDangNhap = @0 AND MaNguoiDung <> @1 AND DaXoa = 0`,
        [newUsername, id],
      );
      if (dup && dup.length > 0) {
        throw new Error(`Tên đăng nhập "${newUsername}" đã được sử dụng bởi người dùng khác.`);
      }
    }

    // 3. Hash mật khẩu nếu có truyền vào
    let matKhauHash: string | null = null;
    if (dto.matKhau && dto.matKhau.trim().length > 0) {
      matKhauHash = await bcrypt.hash(dto.matKhau.trim(), 10);
    }

    // 4. Cập nhật trực tiếp
    await this.dataSource.query(
      `UPDATE dbo.NguoiDung
       SET HoVaTen = @0,
           TenDangNhap = CASE WHEN @1 IS NOT NULL THEN @1 ELSE TenDangNhap END,
           SoCCCD = @2,
           SoDienThoai = @3,
           Email = @4,
           MaVaiTro = ISNULL(@5, MaVaiTro),
           MatKhauHash = CASE WHEN @6 IS NOT NULL THEN @6 ELSE MatKhauHash END,
           TrangThai = CASE WHEN @7 IS NOT NULL THEN @7 ELSE TrangThai END,
           NgayCapNhat = GETDATE()
       WHERE MaNguoiDung = @8 AND DaXoa = 0`,
      [
        dto.hoVaTen.trim(),
        newUsername,
        dto.soCCCD ? dto.soCCCD.trim() : null,
        dto.soDienThoai ? dto.soDienThoai.trim() : null,
        dto.email ? dto.email.trim() : null,
        dto.maVaiTro || null,
        matKhauHash,
        dto.trangThai !== undefined ? (dto.trangThai ? 1 : 0) : null,
        id,
      ],
    );

    return {
      maNguoiDung: id,
      hoVaTen: dto.hoVaTen,
      tenDangNhap: newUsername || existing[0].TenDangNhap,
      maVaiTro: dto.maVaiTro,
    };
  }

  async changeStatus(id: number, status: boolean, executorId: number) {
    const result = await this.dataSource.query(
      `EXEC dbo.sp_ChuyenTrangThaiTaiKhoan 
        @MaNguoiDung = @0, 
        @TrangThaiMoi = @1, 
        @NguoiThucHien = @2`,
      [id, status ? 1 : 0, executorId],
    );

    return {
      maNguoiDung: id,
      trangThai: status,
    };
  }

  async deleteUser(id: number, executorId: number) {
    const existing = await this.dataSource.query(
      `SELECT MaNguoiDung, AvatarUrl FROM dbo.NguoiDung WHERE MaNguoiDung = @0`,
      [id],
    );

    await this.dataSource.query(
      `EXEC dbo.sp_XoaNguoiDung 
        @MaNguoiDung = @0, 
        @NguoiThucHien = @1`,
      [id, executorId],
    );

    // Xóa tệp ảnh đại diện vật lý trên ổ đĩa nếu có
    const avatarUrl = existing?.[0]?.AvatarUrl;
    if (avatarUrl && avatarUrl.startsWith('/uploads/avatars/')) {
      try {
        const filePath = path.join(process.cwd(), avatarUrl);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      } catch {}
    }

    return {
      maNguoiDung: id,
      daXoa: true,
    };
  }

  // Cập nhật ảnh đại diện cá nhân theo quy trình lưu ảnh
  async updateAvatar(userId: number, file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Vui lòng chọn tệp hình ảnh để tải lên.');
    }

    // 1. Kiểm tra magic bytes / tính hợp lệ của ảnh bằng Sharp
    let metadata;
    try {
      metadata = await sharp(file.buffer).metadata();
    } catch {
      throw new BadRequestException('Tệp tải lên không phải là định dạng hình ảnh hợp lệ.');
    }

    const allowedFormats = ['jpeg', 'png', 'webp', 'jpg'];
    if (!metadata.format || !allowedFormats.includes(metadata.format.toLowerCase())) {
      throw new BadRequestException('Chỉ chấp nhận các định dạng ảnh: JPEG, PNG, WEBP.');
    }

    // 2. Thư mục đích
    const uploadDir = path.join(process.cwd(), 'uploads', 'avatars');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    // 3. Tên file ngẫu nhiên an toàn theo quy chuẩn
    const ext = metadata.format.toLowerCase() === 'jpeg' ? 'jpg' : metadata.format.toLowerCase();
    const fileName = `avatar-${userId}-${Date.now()}-${Math.round(Math.random() * 1e6)}.${ext}`;
    const targetPath = path.join(uploadDir, fileName);

    // 4. Lấy thông tin avatar cũ để dọn dẹp sau khi lưu thành công
    const user = await this.dataSource.query(
      `SELECT AvatarUrl FROM dbo.NguoiDung WHERE MaNguoiDung = @0 AND DaXoa = 0`,
      [userId],
    );
    const oldAvatarUrl = user?.[0]?.AvatarUrl;

    try {
      // 5. Tối ưu và lưu file vật lý bằng Sharp (chuẩn hóa 300x300, JPEG chất lượng cao tối ưu dung lượng)
      const outputBuffer = await sharp(file.buffer)
        .resize(300, 300, { fit: 'cover', withoutEnlargement: true })
        .jpeg({ quality: 85 })
        .toBuffer();

      // Lưu file vật lý làm backup
      await fs.promises.writeFile(targetPath, outputBuffer);

      // Tạo Data URL Base64 để hiển thị NGAY LẬP TỨC 100% trên mọi môi trường (Vercel, ngrok, localhost)
      const newAvatarUrl = `data:image/jpeg;base64,${outputBuffer.toString('base64')}`;

      // 6. Cập nhật đường dẫn trong CSDL (cột NVARCHAR(MAX))
      await this.dataSource.query(
        `UPDATE dbo.NguoiDung 
         SET AvatarUrl = @0, NgayCapNhat = GETDATE() 
         WHERE MaNguoiDung = @1 AND DaXoa = 0`,
        [newAvatarUrl, userId],
      );

      // 7. Dọn dẹp avatar cũ nếu có trên đĩa
      if (oldAvatarUrl && typeof oldAvatarUrl === 'string' && oldAvatarUrl.startsWith('/uploads/avatars/')) {
        const oldFile = path.join(process.cwd(), oldAvatarUrl);
        if (fs.existsSync(oldFile)) {
          try {
            fs.unlinkSync(oldFile);
          } catch {
            // ignore
          }
        }
      }

      this.logger.log(`Tài khoản #${userId} đã cập nhật ảnh đại diện thành công -> ${newAvatarUrl}`);
      return {
        avatarUrl: newAvatarUrl,
      };
    } catch (error) {
      // Rollback: xóa file vừa lưu nếu cập nhật CSDL thất bại
      if (fs.existsSync(targetPath)) {
        try {
          fs.unlinkSync(targetPath);
        } catch {}
      }
      throw error;
    }
  }

  // Lấy chi tiết các lớp học và học viên do giáo viên phụ trách
  async getTeacherAssignments(teacherId: number) {
    const teacher = await this.dataSource.query(
      `SELECT MaNguoiDung, HoVaTen, TenDangNhap, SoCCCD, SoDienThoai, Email, AvatarUrl, TrangThai, NgayTao
       FROM dbo.NguoiDung 
       WHERE MaNguoiDung = @0 AND DaXoa = 0`,
      [teacherId],
    );
    if (!teacher || teacher.length === 0) {
      throw new Error(`Giáo viên ID #${teacherId} không tồn tại.`);
    }

    // 1. Danh sách lớp học / khóa học phụ trách
    const classes = await this.dataSource.query(
      `SELECT DISTINCT
          l.MaLopHoc,
          l.MaLopHocCode,
          l.TenLopHoc,
          k.TenKhoaHoc,
          k.MaHangGPLX,
          l.NgayKhaiGiang,
          l.NgayBeGiang,
          l.TrangThai,
          (SELECT COUNT(1) FROM dbo.HocVienLopHoc s WHERE s.MaLopHoc = l.MaLopHoc AND s.DaXoa = 0) AS SiSoHocVien,
          (SELECT COUNT(1) FROM dbo.HocVienLopHoc hl WHERE hl.MaLopHoc = l.MaLopHoc AND hl.MaGiaoVien = @0 AND hl.DaXoa = 0) AS SoHocVienPhuTrachTrongLop,
          CASE WHEN l.MaGiaoVienPhuTrach = @0 THEN 1 ELSE 0 END AS LaGiaoVienChuNhiem
       FROM dbo.LopHoc l
       INNER JOIN dbo.KhoaHoc k ON l.MaKhoaHoc = k.MaKhoaHoc
       LEFT JOIN dbo.HocVienLopHoc hl ON l.MaLopHoc = hl.MaLopHoc AND hl.DaXoa = 0
       WHERE (l.MaGiaoVienPhuTrach = @0 OR hl.MaGiaoVien = @0) AND l.DaXoa = 0
       ORDER BY l.NgayKhaiGiang DESC`,
      [teacherId],
    );

    // 2. Danh sách học viên trực tiếp phụ trách
    const students = await this.dataSource.query(
      `SELECT 
          u.MaNguoiDung AS MaHocVien,
          u.HoVaTen,
          u.TenDangNhap,
          u.SoCCCD,
          u.SoDienThoai,
          u.Email,
          u.AvatarUrl,
          l.MaLopHoc,
          l.TenLopHoc,
          k.TenKhoaHoc,
          k.MaHangGPLX,
          hl.NgayGhiDanh,
          hl.TrangThaiHocTap,
          COUNT(DISTINCT t.MaBaiGiang) AS SoBaiDaHoc,
          ROUND(CAST(ISNULL(SUM(t.ThoiGianHocGiay), 0) AS FLOAT) / 60, 1) AS TongThoiGianHocPhut
       FROM dbo.HocVienLopHoc hl
       INNER JOIN dbo.NguoiDung u ON hl.MaHocVien = u.MaNguoiDung AND u.DaXoa = 0
       INNER JOIN dbo.LopHoc l ON hl.MaLopHoc = l.MaLopHoc AND l.DaXoa = 0
       INNER JOIN dbo.KhoaHoc k ON l.MaKhoaHoc = k.MaKhoaHoc
       LEFT JOIN dbo.TienDoHocTap t ON u.MaNguoiDung = t.MaHocVien
       WHERE (hl.MaGiaoVien = @0 OR (hl.MaGiaoVien IS NULL AND l.MaGiaoVienPhuTrach = @0)) AND hl.DaXoa = 0
       GROUP BY 
          u.MaNguoiDung, u.HoVaTen, u.TenDangNhap, u.SoCCCD, u.SoDienThoai, u.Email, u.AvatarUrl,
          l.MaLopHoc, l.TenLopHoc, k.TenKhoaHoc, k.MaHangGPLX, hl.NgayGhiDanh, hl.TrangThaiHocTap
       ORDER BY l.TenLopHoc ASC, u.HoVaTen ASC`,
      [teacherId],
    );

    return {
      thongTinGiaoVien: teacher[0],
      danhSachLopPhuTrach: classes,
      danhSachHocVienPhuTrach: students,
      tongSoLop: classes.length,
      tongSoHocVien: students.length,
    };
  }
}
