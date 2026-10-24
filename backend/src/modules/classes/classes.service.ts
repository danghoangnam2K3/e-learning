import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { CreateClassDto, UpdateClassDto } from './dto/class.dto';

@Injectable()
export class ClassesService {
  constructor(private readonly dataSource: DataSource) {}

  // Lấy danh sách lớp học (Admin xem tất cả, Giáo viên xem lớp được phân công)
  async getClasses(userId: number, role: string) {
    return this.dataSource.query(
      `EXEC dbo.sp_QuanLyLopHocVaPhanCong 
        @ThaoTac = N'LAY_DS_LOP', 
        @NguoiYeuCau = @0, 
        @VaiTroYeuCau = @1`,
      [userId, role],
    );
  }

  // Thêm mới lớp học / khóa học (Chỉ Admin)
  async createClass(dto: CreateClassDto) {
    const code = dto.maLopHocCode.trim().toUpperCase();
    
    // Kiểm tra trùng mã trong toàn bộ cơ sở dữ liệu
    const existing = await this.dataSource.query(
      `SELECT MaLopHoc FROM dbo.LopHoc WHERE MaLopHocCode = @0`,
      [code],
    );
    if (existing && existing.length > 0) {
      throw new BadRequestException(`Mã khóa học "${code}" đã tồn tại trong hệ thống.`);
    }

    const insertResult = await this.dataSource.query(
      `INSERT INTO dbo.LopHoc (
        MaLopHocCode, TenLopHoc, MaKhoaHoc, MaGiaoVienPhuTrach, NgayKhaiGiang, NgayBeGiang, TrangThai, DaXoa, NgayTao, NgayCapNhat
      )
      OUTPUT INSERTED.MaLopHoc
      VALUES (@0, @1, @2, @3, @4, @5, @6, 0, GETDATE(), GETDATE())`,
      [
        code,
        dto.tenLopHoc.trim(),
        dto.maKhoaHoc,
        dto.maGiaoVienPhuTrach || null,
        dto.ngayKhaiGiang,
        dto.ngayBeGiang,
        dto.trangThai || 'Đang đào tạo',
      ],
    );

    const newId = insertResult?.[0]?.MaLopHoc;

    return {
      maLopHoc: newId,
      maLopHocCode: code,
      tenLopHoc: dto.tenLopHoc,
    };
  }

  // Sửa lớp học / khóa học (Chỉ Admin)
  async updateClass(id: number, dto: UpdateClassDto) {
    const existing = await this.dataSource.query(
      `SELECT MaLopHoc FROM dbo.LopHoc WHERE MaLopHoc = @0 AND DaXoa = 0`,
      [id],
    );
    if (!existing || existing.length === 0) {
      throw new NotFoundException(`Khóa học với mã ID #${id} không tồn tại hoặc đã bị xóa.`);
    }

    await this.dataSource.query(
      `UPDATE dbo.LopHoc 
       SET TenLopHoc = @0, 
           MaKhoaHoc = @1, 
           MaGiaoVienPhuTrach = @2, 
           NgayKhaiGiang = @3, 
           NgayBeGiang = @4, 
           TrangThai = ISNULL(@5, TrangThai),
           MaLopHocCode = CASE WHEN @6 IS NOT NULL THEN @6 ELSE MaLopHocCode END,
           NgayCapNhat = GETDATE()
       WHERE MaLopHoc = @7 AND DaXoa = 0`,
      [
        dto.tenLopHoc.trim(),
        dto.maKhoaHoc,
        dto.maGiaoVienPhuTrach || null,
        dto.ngayKhaiGiang,
        dto.ngayBeGiang,
        dto.trangThai || null,
        dto.maLopHocCode ? dto.maLopHocCode.trim().toUpperCase() : null,
        id,
      ],
    );

    return {
      maLopHoc: id,
      tenLopHoc: dto.tenLopHoc,
    };
  }

  // Xóa lớp học / khóa học (Hard delete trực tiếp CSDL theo yêu cầu người dùng)
  async deleteClass(id: number) {
    const existing = await this.dataSource.query(
      `SELECT MaLopHoc, TenLopHoc FROM dbo.LopHoc WHERE MaLopHoc = @0`,
      [id],
    );
    if (!existing || existing.length === 0) {
      throw new NotFoundException(`Khóa học với mã ID #${id} không tồn tại.`);
    }

    // 1. Xóa các bản ghi liên kết học viên trong lớp
    await this.dataSource.query(
      `DELETE FROM dbo.HocVienLopHoc WHERE MaLopHoc = @0`,
      [id],
    );

    // 2. Xóa hẳn lớp học khỏi bảng dbo.LopHoc trong CSDL
    await this.dataSource.query(
      `DELETE FROM dbo.LopHoc WHERE MaLopHoc = @0`,
      [id],
    );

    return {
      maLopHoc: id,
      deleted: true,
      tenLopHoc: existing[0]?.TenLopHoc,
    };
  }

  // Phân công giáo viên phụ trách lớp
  async assignTeacher(classId: number, teacherId: number) {
    await this.dataSource.query(
      `EXEC dbo.sp_QuanLyLopHocVaPhanCong 
        @ThaoTac = N'PHAN_CONG_GIAO_VIEN', 
        @MaLopHoc = @0, 
        @MaGiaoVienPhuTrach = @1`,
      [classId, teacherId],
    );

    return {
      maLopHoc: classId,
      maGiaoVienPhuTrach: teacherId,
    };
  }

  // Lấy danh sách học viên của lớp
  async getClassStudents(classId: number) {
    return this.dataSource.query(
      `SELECT 
         hl.MaHocVien,
         u.TenDangNhap,
         u.HoVaTen,
         u.SoCCCD,
         u.SoDienThoai,
         u.Email,
         u.AvatarUrl,
         hl.NgayGhiDanh,
         hl.TrangThaiHocTap,
         hl.MaGiaoVien,
         gv.HoVaTen AS TenGiaoVienPhuTrach
       FROM dbo.HocVienLopHoc hl
       INNER JOIN dbo.NguoiDung u ON hl.MaHocVien = u.MaNguoiDung
       LEFT JOIN dbo.NguoiDung gv ON hl.MaGiaoVien = gv.MaNguoiDung
       WHERE hl.MaLopHoc = @0 AND hl.DaXoa = 0 AND u.DaXoa = 0
       ORDER BY u.HoVaTen ASC`,
      [classId],
    );
  }
}
