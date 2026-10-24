import { Inject, Injectable } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { DataSource } from 'typeorm';

@Injectable()
export class ReportsService {
  constructor(
    private readonly dataSource: DataSource,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {}

  // Báo cáo tổng quan khóa học & lớp học (In-Memory Caching 60 giây)
  async getCourseOverviewReport(courseId?: number, classId?: number) {
    const cacheKey = `reports:overview:${courseId || 0}_${classId || 0}`;
    const cached = await this.cacheManager.get(cacheKey);
    if (cached) {
      return cached;
    }

    const data = await this.dataSource.query(
      `EXEC dbo.sp_BaoCaoTongQuanKhoaHoc 
        @MaKhoaHoc = @0, 
        @MaLopHoc = @1`,
      [courseId || null, classId || null],
    );

    // Lưu cache 60s để giảm tải tính toán aggregation cho DB
    await this.cacheManager.set(cacheKey, data, 60000);
    return data;
  }

  // Báo cáo chi tiết tiến trình học viên (Phục vụ xét tốt nghiệp, cấp chứng nhận sát hạch)
  async getStudentDetailedReport(studentId: number) {
    const rawResult = await this.dataSource.query(
      `EXEC dbo.sp_BaoCaoChiTietHocVien @MaHocVien = @0`,
      [studentId],
    );

    let tongQuanHocVien = null;
    let chiTietBaiGiang = [];

    if (Array.isArray(rawResult)) {
      if (rawResult.length > 0 && Array.isArray(rawResult[0])) {
        tongQuanHocVien = rawResult[0][0] || null;
        if (rawResult.length > 1 && Array.isArray(rawResult[1])) {
          chiTietBaiGiang = rawResult[1];
        }
      } else {
        tongQuanHocVien = rawResult[0] || null;
      }
    }

    if (tongQuanHocVien && tongQuanHocVien.AvatarUrl === undefined) {
      try {
        const u = await this.dataSource.query(
          `SELECT AvatarUrl FROM dbo.NguoiDung WHERE MaNguoiDung = @0`,
          [studentId],
        );
        tongQuanHocVien.AvatarUrl = u?.[0]?.AvatarUrl || null;
      } catch {
        tongQuanHocVien.AvatarUrl = null;
      }
    }

    // Nếu TypeORM chỉ nhận recordset đầu tiên từ stored procedure, query tiếp chi tiết bài học
    if (!chiTietBaiGiang || chiTietBaiGiang.length === 0) {
      chiTietBaiGiang = await this.dataSource.query(
        `SELECT 
            b.MaBaiGiang,
            b.MonHoc,
            b.TenBaiGiang,
            b.SoThuTu,
            ISNULL(b.ThoiLuongPhut, 45) AS ThoiLuongChuanPhut,
            ISNULL(b.ThoiLuongPhut, 45) AS ThoiLuongYeuCauPhut,
            ISNULL(t.ThoiGianHocGiay, 0) AS ThoiGianHocGiay,
            ROUND(CAST(ISNULL(t.ThoiGianHocGiay, 0) AS FLOAT) / 60, 1) AS ThoiGianHocThucTePhut,
            CASE 
              WHEN ISNULL(b.ThoiLuongPhut, 45) * 60 > 0 
              THEN ROUND(CAST(ISNULL(t.ThoiGianHocGiay, 0) AS FLOAT) * 100 / (ISNULL(b.ThoiLuongPhut, 45) * 60), 1)
              ELSE 0 
            END AS PhanTramHoanThanh,
            ISNULL(t.DaHoanThanh, 0) AS DaHoanThanh,
            t.LanHocCuoi
        FROM dbo.HocVienLopHoc hl
        INNER JOIN dbo.LopHoc l ON hl.MaLopHoc = l.MaLopHoc
        INNER JOIN dbo.BaiGiang b ON l.MaKhoaHoc = b.MaKhoaHoc AND b.DaXoa = 0
        LEFT JOIN dbo.TienDoHocTap t ON b.MaBaiGiang = t.MaBaiGiang AND t.MaHocVien = @0
        WHERE hl.MaHocVien = @0 AND hl.DaXoa = 0
        ORDER BY b.MonHoc ASC, b.SoThuTu ASC`,
        [studentId],
      );
    }

    return {
      tongQuanHocVien,
      chiTietBaiGiang,
    };
  }
}
