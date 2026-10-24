import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { UpdateProgressDto } from './dto/update-progress.dto';
import { ChangePasswordDto } from './dto/change-password.dto';

@Injectable()
export class LmsService {
  // In-memory registry để theo dõi và throttle heartbeat chống spam I/O database
  private readonly heartbeatMap = new Map<string, { timestamp: number; lastResult: any }>();

  constructor(private readonly dataSource: DataSource) {
    // Dọn dẹp cache heartbeat mỗi 15 phút để giải phóng bộ nhớ
    setInterval(() => {
      const now = Date.now();
      for (const [key, val] of this.heartbeatMap.entries()) {
        if (now - val.timestamp > 15 * 60 * 1000) {
          this.heartbeatMap.delete(key);
        }
      }
    }, 15 * 60 * 1000);
  }

  // 1. Cập nhật tiến độ học tập (Heartbeat đếm giờ theo giây có Rate Limiting & Concurrency Protection)
  async updateProgress(studentId: number, dto: UpdateProgressDto) {
    const key = `${studentId}_${dto.maBaiGiang}`;
    const now = Date.now();
    const lastRecord = this.heartbeatMap.get(key);

    // Chặn spam request: Nếu request cùng học viên & bài giảng đến dồn dập trong < 3 giây
    if (lastRecord && now - lastRecord.timestamp < 3000) {
      return (
        lastRecord.lastResult || {
          message: 'Tiến độ đã được ghi nhận (throttled).',
          throttled: true,
        }
      );
    }

    // Bảo vệ tính toàn vẹn: Không cho phép cộng dồn quá 60 giây / nhịp heartbeat
    const safeIncrement = Math.min(Math.max(Number(dto.thoiGianCongThemGiay) || 5, 1), 60);

    const result = await this.dataSource.query(
      `EXEC dbo.sp_CapNhatTienDoHocTap 
        @MaHocVien = @0, 
        @MaBaiGiang = @1, 
        @ThoiGianCongThemGiay = @2`,
      [studentId, dto.maBaiGiang, safeIncrement],
    );

    const response = result?.[0] || { message: 'Đã cập nhật tiến độ.' };
    this.heartbeatMap.set(key, { timestamp: now, lastResult: response });

    return response;
  }

  // 2. Lấy thông tin tiến độ học tập theo vai trò (Student, Teacher, Admin)
  async getProgress(userId: number, role: string, classId?: number) {
    const rawResult = await this.dataSource.query(
      `EXEC dbo.sp_LayTienDoHocTap 
        @VaiTro = @0, 
        @MaNguoiDung = @1, 
        @MaLopHoc = @2`,
      [role, userId, classId || null],
    );

    if (role === 'STUDENT') {
      let danhSachBaiHoc = [];
      let thongKeTongHop = null;

      if (Array.isArray(rawResult)) {
        if (rawResult.length > 0 && Array.isArray(rawResult[0])) {
          danhSachBaiHoc = rawResult[0];
          if (rawResult.length > 1 && Array.isArray(rawResult[1])) {
            thongKeTongHop = rawResult[1][0] || null;
          }
        } else {
          danhSachBaiHoc = rawResult;
        }
      }

      return {
        danhSachBaiHoc,
        thongKeTongHop,
      };
    }

    // Với TEACHER và ADMIN: Trả về danh sách học viên và tiến độ của từng học viên
    return {
      danhSachHocVien: Array.isArray(rawResult) && rawResult.length > 0 && Array.isArray(rawResult[0]) ? rawResult[0] : rawResult,
    };
  }

  // 3. Đổi mật khẩu cá nhân an toàn
  async changePassword(userId: number, dto: ChangePasswordDto) {
    const users = await this.dataSource.query(
      `SELECT MaNguoiDung, MatKhauHash FROM dbo.NguoiDung WHERE MaNguoiDung = @0 AND DaXoa = 0`,
      [userId],
    );

    const user = users?.[0];
    if (!user) {
      throw new UnauthorizedException('Tài khoản không tồn tại.');
    }

    const isMatch = bcrypt.compareSync(dto.matKhauCu, user.MatKhauHash);
    if (!isMatch) {
      throw new BadRequestException('Mật khẩu hiện tại không chính xác.');
    }

    const newHash = bcrypt.hashSync(dto.matKhauMoi, 10);
    await this.dataSource.query(
      `UPDATE dbo.NguoiDung SET MatKhauHash = @0, NgayCapNhat = GETDATE() WHERE MaNguoiDung = @1`,
      [newHash, userId],
    );

    return { success: true };
  }

  // 4. Lấy danh sách khóa học của học viên (My Courses)
  async getMyCourses(studentId: number) {
    const rows = await this.dataSource.query(
      `SELECT 
         l.MaLopHoc,
         l.MaLopHocCode,
         l.TenLopHoc,
         l.NgayKhaiGiang,
         l.NgayBeGiang,
         l.TrangThai AS TrangThaiLop,
         k.MaKhoaHoc,
         k.TenKhoaHoc,
         k.MaHangGPLX,
         k.TongSoGioLyThuyet,
         k.MoTa,
         hl.NgayGhiDanh,
         hl.TrangThaiHocTap,
         COALESCE(gvLop.HoVaTen, gvHocVien.HoVaTen, N'Chưa phân công') AS TenGiaoVien,
         COALESCE(gvLop.SoDienThoai, gvHocVien.SoDienThoai, '') AS SoDienThoaiGiaoVien,
         (SELECT COUNT(1) FROM dbo.BaiGiang bg WHERE bg.MaKhoaHoc = k.MaKhoaHoc AND bg.DaXoa = 0) AS TongSoBaiHoc,
         (SELECT COUNT(1) 
          FROM dbo.TienDoHocTap td 
          INNER JOIN dbo.BaiGiang bg ON td.MaBaiGiang = bg.MaBaiGiang AND bg.DaXoa = 0
          WHERE td.MaHocVien = @0 AND bg.MaKhoaHoc = k.MaKhoaHoc AND td.DaHoanThanh = 1) AS SoBaiDaHoanThanh,
         (SELECT ISNULL(SUM(td.ThoiGianHocGiay), 0)
          FROM dbo.TienDoHocTap td 
          INNER JOIN dbo.BaiGiang bg ON td.MaBaiGiang = bg.MaBaiGiang AND bg.DaXoa = 0
          WHERE td.MaHocVien = @0 AND bg.MaKhoaHoc = k.MaKhoaHoc) AS TongThoiGianHocGiay
       FROM dbo.HocVienLopHoc hl
       INNER JOIN dbo.LopHoc l ON hl.MaLopHoc = l.MaLopHoc AND l.DaXoa = 0
       INNER JOIN dbo.KhoaHoc k ON l.MaKhoaHoc = k.MaKhoaHoc AND k.DaXoa = 0
       LEFT JOIN dbo.NguoiDung gvLop ON l.MaGiaoVienPhuTrach = gvLop.MaNguoiDung
       LEFT JOIN dbo.NguoiDung gvHocVien ON hl.MaGiaoVien = gvHocVien.MaNguoiDung
       WHERE hl.MaHocVien = @0 AND hl.DaXoa = 0
       ORDER BY l.NgayKhaiGiang DESC`,
      [studentId],
    );

    return rows.map((r: any) => {
      const tongGiay = Number(r.TongThoiGianHocGiay) || 0;
      const tongPhut = Math.round(tongGiay / 60);
      const tongGio = Math.round((tongGiay / 3600) * 10) / 10;
      const tongSoBai = Number(r.TongSoBaiHoc) || 0;
      const soBaiXong = Number(r.SoBaiDaHoanThanh) || 0;
      const tiLe = tongSoBai > 0 ? Math.min(100, Math.round((soBaiXong / tongSoBai) * 1000) / 10) : 0;

      return {
        maLopHoc: r.MaLopHoc,
        maLopHocCode: r.MaLopHocCode,
        tenLopHoc: r.TenLopHoc,
        ngayKhaiGiang: r.NgayKhaiGiang,
        ngayBeGiang: r.NgayBeGiang,
        trangThaiLop: r.TrangThaiLop,
        maKhoaHoc: r.MaKhoaHoc,
        tenKhoaHoc: r.TenKhoaHoc,
        maHangGPLX: r.MaHangGPLX,
        tongSoGioLyThuyet: Number(r.TongSoGioLyThuyet) || 0,
        moTa: r.MoTa || '',
        ngayGhiDanh: r.NgayGhiDanh,
        trangThaiHocTap: r.TrangThaiHocTap || 'Đang học',
        tenGiaoVien: r.TenGiaoVien,
        soDienThoaiGiaoVien: r.SoDienThoaiGiaoVien,
        tongSoBaiHoc: tongSoBai,
        soBaiDaHoanThanh: soBaiXong,
        tongThoiGianHocGiay: tongGiay,
        tongThoiGianHocPhut: tongPhut,
        tongThoiGianHocGio: tongGio,
        tiLeHoanThanh: tiLe,
      };
    });
  }

  // 5. Lấy toàn bộ thông tin khóa học, các chương và bài học kèm tiến độ học viên
  async getCourseCurriculum(studentId: number, classId: number) {
    const classRows = await this.dataSource.query(
      `SELECT 
         l.MaLopHoc,
         l.MaLopHocCode,
         l.TenLopHoc,
         l.NgayKhaiGiang,
         l.NgayBeGiang,
         l.TrangThai AS TrangThaiLop,
         k.MaKhoaHoc,
         k.TenKhoaHoc,
         k.MaHangGPLX,
         k.TongSoGioLyThuyet,
         k.MoTa,
         hl.NgayGhiDanh,
         hl.TrangThaiHocTap,
         COALESCE(gvLop.HoVaTen, gvHocVien.HoVaTen, N'Chưa phân công') AS TenGiaoVien,
         COALESCE(gvLop.SoDienThoai, gvHocVien.SoDienThoai, '') AS SoDienThoaiGiaoVien
       FROM dbo.HocVienLopHoc hl
       INNER JOIN dbo.LopHoc l ON hl.MaLopHoc = l.MaLopHoc AND l.DaXoa = 0
       INNER JOIN dbo.KhoaHoc k ON l.MaKhoaHoc = k.MaKhoaHoc AND k.DaXoa = 0
       LEFT JOIN dbo.NguoiDung gvLop ON l.MaGiaoVienPhuTrach = gvLop.MaNguoiDung
       LEFT JOIN dbo.NguoiDung gvHocVien ON hl.MaGiaoVien = gvHocVien.MaNguoiDung
       WHERE hl.MaHocVien = @0 AND hl.MaLopHoc = @1 AND hl.DaXoa = 0`,
      [studentId, classId],
    );

    const classInfo = classRows?.[0];
    if (!classInfo) {
      throw new BadRequestException('Học viên không thuộc lớp học này hoặc lớp học không tồn tại.');
    }

    const courseId = classInfo.MaKhoaHoc;

    // Lấy các chương
    const chapters = await this.dataSource.query(
      `SELECT MaChuong, MaKhoaHoc, SoThuTu, TenChuong, SoGioChuan, PhanTramYeuCau
       FROM dbo.Chuong
       WHERE MaKhoaHoc = @0 AND DaXoa = 0
       ORDER BY SoThuTu ASC`,
      [courseId],
    );

    // Lấy tất cả bài giảng và tiến độ của học viên
    const lessons = await this.dataSource.query(
      `SELECT 
         b.MaBaiGiang,
         b.MaKhoaHoc,
         b.MaChuong,
         b.TenBaiGiang,
         b.MonHoc,
         b.SoThuTu,
         b.DuongDanVideo,
         b.ThoiLuongPhut,
         b.TaiLieuDinhKem,
         ISNULL(td.ThoiGianHocGiay, 0) AS ThoiGianHocGiay,
         ISNULL(td.DaHoanThanh, 0) AS DaHoanThanh,
         td.LanHocCuoi
       FROM dbo.BaiGiang b
       LEFT JOIN dbo.TienDoHocTap td ON b.MaBaiGiang = td.MaBaiGiang AND td.MaHocVien = @0
       WHERE b.MaKhoaHoc = @1 AND b.DaXoa = 0
       ORDER BY b.SoThuTu ASC`,
      [studentId, courseId],
    );

    // Ghép bài giảng vào từng chương
    let tongSoBaiKhoa = lessons.length;
    let soBaiDaXongKhoa = 0;
    let tongThoiGianHocGiayKhoa = 0;

    const danhSachChuong = chapters.map((c: any) => {
      const chapterLessons = lessons
        .filter((l: any) => l.MaChuong === c.MaChuong)
        .map((l: any) => {
          const giay = Number(l.ThoiGianHocGiay) || 0;
          const thoiLuongPhut = Number(l.ThoiLuongPhut) || 45;
          const thoiLuongGiay = thoiLuongPhut * 60;
          const daHoanThanh = l.DaHoanThanh === 1 || l.DaHoanThanh === true;
          if (daHoanThanh) soBaiDaXongKhoa++;
          tongThoiGianHocGiayKhoa += giay;

          const phanTram = thoiLuongGiay > 0 ? Math.min(100, Math.round((giay / thoiLuongGiay) * 1000) / 10) : 0;
          const trangThai = daHoanThanh ? 'HOAN_THANH' : giay > 0 ? 'DANG_HOC' : 'CHUA_HOC';

          return {
            maBaiGiang: l.MaBaiGiang,
            maChuong: l.MaChuong,
            tenBaiGiang: l.TenBaiGiang,
            monHoc: l.MonHoc,
            soThuTu: l.SoThuTu,
            duongDanVideo: l.DuongDanVideo || '',
            thoiLuongPhut: thoiLuongPhut,
            taiLieuDinhKem: l.TaiLieuDinhKem || '',
            thoiGianHocGiay: giay,
            thoiGianHocPhut: Math.floor(giay / 60),
            phanTramHoanThanh: phanTram,
            daHoanThanh: daHoanThanh,
            trangThai: trangThai,
            lanHocCuoi: l.LanHocCuoi,
          };
        });

      const soBaiXongTrongChuong = chapterLessons.filter((l: any) => l.daHoanThanh).length;
      const tiLeChuong = chapterLessons.length > 0 ? Math.min(100, Math.round((soBaiXongTrongChuong / chapterLessons.length) * 1000) / 10) : 0;

      return {
        maChuong: c.MaChuong,
        tenChuong: c.TenChuong,
        soThuTu: c.SoThuTu,
        soGioChuan: Number(c.SoGioChuan) || 0,
        phanTramYeuCau: Number(c.PhanTramYeuCau) || 100,
        soBaiGiang: chapterLessons.length,
        soBaiDaHoanThanh: soBaiXongTrongChuong,
        tiLeHoanThanhChuong: tiLeChuong,
        danhSachBaiHoc: chapterLessons,
        kiemTraLyThuyet: {
          tieuDe: `Kiểm tra lý thuyết - ${c.TenChuong}`,
          soCauHoi: 20,
          thoiGianLamBaiPhut: 15,
          diemDat: 18,
          daDat: soBaiXongTrongChuong === chapterLessons.length && chapterLessons.length > 0,
          ghiChu: 'Trắc nghiệm đánh giá kiến thức lý thuyết sát hạch',
        },
      };
    });

    return {
      thongTinLop: {
        maLopHoc: classInfo.MaLopHoc,
        maLopHocCode: classInfo.MaLopHocCode,
        tenLopHoc: classInfo.TenLopHoc,
        ngayKhaiGiang: classInfo.NgayKhaiGiang,
        ngayBeGiang: classInfo.NgayBeGiang,
        trangThaiLop: classInfo.TrangThaiLop,
        tenGiaoVien: classInfo.TenGiaoVien,
        soDienThoaiGiaoVien: classInfo.SoDienThoaiGiaoVien,
      },
      thongTinKhoaHoc: {
        maKhoaHoc: classInfo.MaKhoaHoc,
        tenKhoaHoc: classInfo.TenKhoaHoc,
        maHangGPLX: classInfo.MaHangGPLX,
        tongSoGioLyThuyet: Number(classInfo.TongSoGioLyThuyet) || 0,
        moTa: classInfo.MoTa || '',
      },
      tienDoTongHop: {
        tongSoBai: tongSoBaiKhoa,
        soBaiDaHoanThanh: soBaiDaXongKhoa,
        tongThoiGianHocGiay: tongThoiGianHocGiayKhoa,
        tongThoiGianHocPhut: Math.round(tongThoiGianHocGiayKhoa / 60),
        tongThoiGianHocGio: Math.round((tongThoiGianHocGiayKhoa / 3600) * 10) / 10,
        tiLeHoanThanh: tongSoBaiKhoa > 0 ? Math.min(100, Math.round((soBaiDaXongKhoa / tongSoBaiKhoa) * 1000) / 10) : 0,
        trangThaiHocTap: classInfo.TrangThaiHocTap || 'Đang học',
      },
      danhSachChuong: danhSachChuong,
    };
  }

  // 6. Lấy hồ sơ cá nhân của học viên (Read-Only)
  async getStudentProfile(studentId: number) {
    const userRows = await this.dataSource.query(
      `SELECT MaNguoiDung, HoVaTen, TenDangNhap, SoCCCD, SoDienThoai, Email, AvatarUrl, NgayTao, TrangThai
       FROM dbo.NguoiDung 
       WHERE MaNguoiDung = @0 AND DaXoa = 0`,
      [studentId],
    );

    const user = userRows?.[0];
    if (!user) {
      throw new UnauthorizedException('Tài khoản học viên không tồn tại.');
    }

    const classes = await this.dataSource.query(
      `SELECT 
         l.MaLopHoc,
         l.TenLopHoc,
         l.MaLopHocCode,
         k.TenKhoaHoc,
         k.MaHangGPLX,
         l.NgayKhaiGiang,
         l.NgayBeGiang,
         hl.NgayGhiDanh,
         hl.TrangThaiHocTap,
         COALESCE(gvLop.HoVaTen, gvHocVien.HoVaTen, N'Chưa phân công') AS TenGiaoVien,
         COALESCE(gvLop.SoDienThoai, gvHocVien.SoDienThoai, '') AS SoDienThoaiGiaoVien
       FROM dbo.HocVienLopHoc hl
       INNER JOIN dbo.LopHoc l ON hl.MaLopHoc = l.MaLopHoc AND l.DaXoa = 0
       INNER JOIN dbo.KhoaHoc k ON l.MaKhoaHoc = k.MaKhoaHoc AND k.DaXoa = 0
       LEFT JOIN dbo.NguoiDung gvLop ON l.MaGiaoVienPhuTrach = gvLop.MaNguoiDung
       LEFT JOIN dbo.NguoiDung gvHocVien ON hl.MaGiaoVien = gvHocVien.MaNguoiDung
       WHERE hl.MaHocVien = @0 AND hl.DaXoa = 0`,
      [studentId],
    );

    return {
      thongTinCaNhan: {
        maNguoiDung: user.MaNguoiDung,
        hoVaTen: user.HoVaTen,
        tenDangNhap: user.TenDangNhap,
        soCCCD: user.SoCCCD || 'Chưa cập nhật',
        soDienThoai: user.SoDienThoai || 'Chưa cập nhật',
        email: user.Email || 'Chưa cập nhật',
        avatarUrl: user.AvatarUrl || null,
        ngayTao: user.NgayTao,
        trangThai: user.TrangThai,
      },
      danhSachLopHoc: classes,
      coTheSua: false,
      ghiChu: 'Hồ sơ học viên đã được liên kết với Báo cáo 1 gửi Sở GTVT. Mọi yêu cầu đính chính Họ tên, CCCD hoặc thông tin cá nhân vui lòng liên hệ Ban Quản Trị (Admin) trung tâm để được hỗ trợ.',
    };
  }
}
