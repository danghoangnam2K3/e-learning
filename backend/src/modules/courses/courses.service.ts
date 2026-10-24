import { Inject, Injectable } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { DataSource } from 'typeorm';
import { CreateCourseDto, UpdateCourseDto } from './dto/course.dto';
import { CreateLessonDto, UpdateLessonDto } from './dto/lesson.dto';

@Injectable()
export class CoursesService {
  constructor(
    private readonly dataSource: DataSource,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {}

  // Lấy danh sách khóa học (Có In-Memory Caching)
  async getCourses() {
    const cacheKey = 'courses:all';
    const cached = await this.cacheManager.get(cacheKey);
    if (cached) {
      return cached;
    }

    const data = await this.dataSource.query(
      `EXEC dbo.sp_QuanLyDanhMucKhoaHocVaBaiGiang @ThaoTac = N'LAY_DS_KHOA_HOC'`,
    );

    // Lưu cache 5 phút
    await this.cacheManager.set(cacheKey, data, 300000);
    return data;
  }

  // Thêm mới khóa học
  async createCourse(dto: CreateCourseDto, executorId: number) {
    const result = await this.dataSource.query(
      `EXEC dbo.sp_QuanLyDanhMucKhoaHocVaBaiGiang 
        @ThaoTac = N'THEM_KHOA_HOC', 
        @MaHangGPLX = @0, 
        @TenKhoaHoc = @1, 
        @MoTa = @2, 
        @TongSoGioLyThuyet = @3, 
        @NguoiThucHien = @4`,
      [
        dto.maHangGPLX.trim().toUpperCase(),
        dto.tenKhoaHoc.trim(),
        dto.moTa || null,
        dto.tongSoGioLyThuyet ?? 100.0,
        executorId,
      ],
    );

    // Invalidate cache khóa học
    await this.cacheManager.del('courses:all');

    return {
      maKhoaHoc: result?.[0]?.MaKhoaHoc,
      maHangGPLX: dto.maHangGPLX,
      tenKhoaHoc: dto.tenKhoaHoc,
    };
  }

  // Sửa khóa học
  async updateCourse(id: number, dto: UpdateCourseDto, executorId: number) {
    await this.dataSource.query(
      `EXEC dbo.sp_QuanLyDanhMucKhoaHocVaBaiGiang 
        @ThaoTac = N'SUA_KHOA_HOC', 
        @MaKhoaHoc = @0, 
        @TenKhoaHoc = @1, 
        @MoTa = @2, 
        @TongSoGioLyThuyet = @3, 
        @NguoiThucHien = @4`,
      [
        id,
        dto.tenKhoaHoc.trim(),
        dto.moTa || null,
        dto.tongSoGioLyThuyet ?? null,
        executorId,
      ],
    );

    // Invalidate cache khóa học
    await this.cacheManager.del('courses:all');

    return {
      maKhoaHoc: id,
      tenKhoaHoc: dto.tenKhoaHoc,
    };
  }

  // Xóa khóa học
  async deleteCourse(id: number, executorId: number) {
    await this.dataSource.query(
      `EXEC dbo.sp_QuanLyDanhMucKhoaHocVaBaiGiang 
        @ThaoTac = N'XOA_KHOA_HOC', 
        @MaKhoaHoc = @0, 
        @NguoiThucHien = @1`,
      [id, executorId],
    );

    // Invalidate cache khóa học
    await this.cacheManager.del('courses:all');
    await this.cacheManager.del(`lessons:course:${id}`);

    return { maKhoaHoc: id, daXoa: true };
  }

  // Lấy danh sách bài giảng theo khóa học (Có In-Memory Caching)
  async getLessons(courseId: number) {
    const cacheKey = `lessons:course:${courseId}`;
    const cached = await this.cacheManager.get(cacheKey);
    if (cached) {
      return cached;
    }

    const data = await this.dataSource.query(
      `EXEC dbo.sp_QuanLyDanhMucKhoaHocVaBaiGiang 
        @ThaoTac = N'LAY_DS_BAI_GIANG', 
        @MaKhoaHoc = @0`,
      [courseId],
    );

    // Lưu cache 5 phút
    await this.cacheManager.set(cacheKey, data, 300000);
    return data;
  }

  // Thêm bài giảng
  async createLesson(dto: CreateLessonDto, executorId: number) {
    const result = await this.dataSource.query(
      `EXEC dbo.sp_QuanLyDanhMucKhoaHocVaBaiGiang 
        @ThaoTac = N'THEM_BAI_GIANG', 
        @MaKhoaHoc = @0, 
        @TenBaiGiang = @1, 
        @MonHoc = @2, 
        @SoThuTu = @3, 
        @DuongDanVideo = @4, 
        @ThoiLuongPhut = @5, 
        @TaiLieuDinhKem = @6, 
        @NguoiThucHien = @7`,
      [
        dto.maKhoaHoc,
        dto.tenBaiGiang.trim(),
        dto.monHoc.trim(),
        dto.soThuTu ?? 1,
        dto.duongDanVideo || null,
        dto.thoiLuongPhut ?? 45,
        dto.taiLieuDinhKem || null,
        executorId,
      ],
    );

    // Invalidate cache bài giảng của khóa học
    await this.cacheManager.del(`lessons:course:${dto.maKhoaHoc}`);

    return {
      maBaiGiang: result?.[0]?.MaBaiGiang,
      maKhoaHoc: dto.maKhoaHoc,
      tenBaiGiang: dto.tenBaiGiang,
    };
  }

  // Sửa bài giảng
  async updateLesson(lessonId: number, dto: UpdateLessonDto, executorId: number) {
    await this.dataSource.query(
      `EXEC dbo.sp_QuanLyDanhMucKhoaHocVaBaiGiang 
        @ThaoTac = N'SUA_BAI_GIANG', 
        @MaBaiGiang = @0, 
        @TenBaiGiang = @1, 
        @MonHoc = @2, 
        @SoThuTu = @3, 
        @DuongDanVideo = @4, 
        @ThoiLuongPhut = @5, 
        @TaiLieuDinhKem = @6, 
        @NguoiThucHien = @7`,
      [
        lessonId,
        dto.tenBaiGiang.trim(),
        dto.monHoc.trim(),
        dto.soThuTu ?? 1,
        dto.duongDanVideo || null,
        dto.thoiLuongPhut ?? 45,
        dto.taiLieuDinhKem || null,
        executorId,
      ],
    );

    // Invalidate toàn bộ cache bài giảng nếu sửa bài giảng
    if (dto.maKhoaHoc) {
      await this.cacheManager.del(`lessons:course:${dto.maKhoaHoc}`);
    }

    return {
      maBaiGiang: lessonId,
      tenBaiGiang: dto.tenBaiGiang,
    };
  }

    // Xóa bài giảng
  async deleteLesson(lessonId: number, executorId: number) {
    await this.dataSource.query(
      `EXEC dbo.sp_QuanLyDanhMucKhoaHocVaBaiGiang 
        @ThaoTac = N'XOA_BAI_GIANG', 
        @MaBaiGiang = @0, 
        @NguoiThucHien = @1`,
      [lessonId, executorId],
    );

    await this.cacheManager.del('courses:curriculum_summary');
    return { maBaiGiang: lessonId, daXoa: true };
  }

  // =========================================================================
  // MỤC MỚI: QUẢN TRỊ CHƯƠNG TRÌNH ĐÀO TẠO THEO CHƯƠNG & BÀI GIẢNG
  // =========================================================================

  // 1. Lấy danh sách tổng hợp theo từng Khóa: Khóa | Chương | Bài giảng | Giờ
  async getCurriculumSummary() {
    const cacheKey = 'courses:curriculum_summary';
    const cached = await this.cacheManager.get(cacheKey);
    if (cached) {
      return cached;
    }

    const data = await this.dataSource.query(
      `EXEC dbo.sp_QuanLyChuongTrinhVaChuong @ThaoTac = N'LAY_DS_TONG_HOP'`,
    );

    await this.cacheManager.set(cacheKey, data, 60000);
    return data;
  }

  // 2. Lấy chi tiết toàn bộ chương và bài giảng của 1 Khóa học
  async getCurriculumDetail(courseId: number) {
    const [khoaHocRows, danhSachChuongRaw, danhSachBaiGiangRaw] = await Promise.all([
      this.dataSource.query(
        `SELECT MaKhoaHoc, MaHangGPLX, TenKhoaHoc, MoTa, TongSoGioLyThuyet, TrangThai 
         FROM dbo.KhoaHoc 
         WHERE MaKhoaHoc = @0 AND DaXoa = 0`,
        [courseId],
      ),
      this.dataSource.query(
        `SELECT c.MaChuong, c.MaKhoaHoc, c.SoThuTu, c.TenChuong, c.SoGioChuan, c.PhanTramYeuCau,
                (SELECT COUNT(1) FROM dbo.BaiGiang b WHERE b.MaChuong = c.MaChuong AND b.DaXoa = 0) AS SoBaiGiang
         FROM dbo.Chuong c 
         WHERE c.MaKhoaHoc = @0 AND c.DaXoa = 0 
         ORDER BY c.SoThuTu ASC`,
        [courseId],
      ),
      this.dataSource.query(
        `SELECT MaBaiGiang, MaKhoaHoc, MaChuong, TenBaiGiang, MonHoc, SoThuTu, DuongDanVideo, ThoiLuongPhut, TaiLieuDinhKem, TrangThai 
         FROM dbo.BaiGiang 
         WHERE MaKhoaHoc = @0 AND DaXoa = 0 
         ORDER BY SoThuTu ASC`,
        [courseId],
      ),
    ]);

    const khoaHoc = khoaHocRows?.[0] || null;

    // Ghép bài giảng tương ứng vào từng chương
    const danhSachChuong = (danhSachChuongRaw || []).map((ch: any) => ({
      ...ch,
      danhSachBaiGiang: (danhSachBaiGiangRaw || []).filter((b: any) => b.MaChuong === ch.MaChuong),
    }));

    return {
      khoaHoc,
      danhSachChuong,
      baiGiangChuaGanChuong: (danhSachBaiGiangRaw || []).filter((b: any) => !b.MaChuong || b.MaChuong === 0),
    };
  }

  // 3. Thêm mới Chương cho Khóa
  async createChapter(
    courseId: number,
    dto: { tenChuong: string; soThuTu?: number; soGioChuan?: number; phanTramYeuCau?: number },
    executorId: number,
  ) {
    const result = await this.dataSource.query(
      `EXEC dbo.sp_QuanLyChuongTrinhVaChuong 
        @ThaoTac = N'THEM_CHUONG',
        @MaKhoaHoc = @0,
        @TenChuong = @1,
        @SoThuTuChuong = @2,
        @SoGioChuan = @3,
        @PhanTramYeuCau = @4,
        @NguoiThucHien = @5`,
      [
        courseId,
        dto.tenChuong.trim(),
        dto.soThuTu ?? 1,
        dto.soGioChuan ?? 20.0,
        dto.phanTramYeuCau ?? 80.0,
        executorId,
      ],
    );

    await this.cacheManager.del('courses:curriculum_summary');
    return {
      maChuong: result?.[0]?.MaChuong,
      maKhoaHoc: courseId,
      tenChuong: dto.tenChuong,
    };
  }

  // 4. Sửa Chương
  async updateChapter(
    chapterId: number,
    dto: { tenChuong: string; soThuTu?: number; soGioChuan?: number; phanTramYeuCau?: number },
    executorId: number,
  ) {
    await this.dataSource.query(
      `EXEC dbo.sp_QuanLyChuongTrinhVaChuong 
        @ThaoTac = N'SUA_CHUONG',
        @MaChuong = @0,
        @TenChuong = @1,
        @SoThuTuChuong = @2,
        @SoGioChuan = @3,
        @PhanTramYeuCau = @4,
        @NguoiThucHien = @5`,
      [
        chapterId,
        dto.tenChuong.trim(),
        dto.soThuTu ?? 1,
        dto.soGioChuan ?? 20.0,
        dto.phanTramYeuCau ?? 80.0,
        executorId,
      ],
    );

    await this.cacheManager.del('courses:curriculum_summary');
    return { maChuong: chapterId, tenChuong: dto.tenChuong };
  }

  // 5. Xóa Chương
  async deleteChapter(chapterId: number, executorId: number) {
    await this.dataSource.query(
      `EXEC dbo.sp_QuanLyChuongTrinhVaChuong 
        @ThaoTac = N'XOA_CHUONG',
        @MaChuong = @0,
        @NguoiThucHien = @1`,
      [chapterId, executorId],
    );

    await this.cacheManager.del('courses:curriculum_summary');
    return { maChuong: chapterId, daXoa: true };
  }

  // 6. Thêm Bài giảng vào Chương
  async createLessonInChapter(
    chapterId: number,
    courseId: number,
    dto: { tenBaiGiang: string; soThuTu?: number; thoiLuongPhut?: number; duongDanVideo?: string; taiLieuDinhKem?: string },
    executorId: number,
  ) {
    const result = await this.dataSource.query(
      `EXEC dbo.sp_QuanLyChuongTrinhVaChuong 
        @ThaoTac = N'THEM_BAI_GIANG_CHUONG',
        @MaKhoaHoc = @0,
        @MaChuong = @1,
        @TenBaiGiang = @2,
        @SoThuTuChuong = @3,
        @ThoiLuongPhut = @4,
        @DuongDanVideo = @5,
        @TaiLieuDinhKem = @6,
        @NguoiThucHien = @7`,
      [
        courseId,
        chapterId,
        dto.tenBaiGiang.trim(),
        dto.soThuTu ?? 1,
        dto.thoiLuongPhut ?? 45,
        dto.duongDanVideo || null,
        dto.taiLieuDinhKem || null,
        executorId,
      ],
    );

    await this.cacheManager.del('courses:curriculum_summary');
    return {
      maBaiGiang: result?.[0]?.MaBaiGiang,
      maKhoaHoc: courseId,
      maChuong: chapterId,
      tenBaiGiang: dto.tenBaiGiang,
    };
  }

  // 7. Cập nhật yêu cầu Khóa học
  async updateCourseRequirement(
    courseId: number,
    dto: { tongSoGioLyThuyet?: number; moTa?: string },
    executorId: number,
  ) {
    await this.dataSource.query(
      `EXEC dbo.sp_QuanLyChuongTrinhVaChuong 
        @ThaoTac = N'CAP_NHAT_YEU_CAU_KHOA',
        @MaKhoaHoc = @0,
        @TongSoGioLyThuyet = @1,
        @MoTa = @2,
        @NguoiThucHien = @3`,
      [courseId, dto.tongSoGioLyThuyet ?? null, dto.moTa || null, executorId],
    );

    await this.cacheManager.del('courses:curriculum_summary');
    await this.cacheManager.del('courses:all');
    return { maKhoaHoc: courseId, capNhatThanhCong: true };
  }
}
