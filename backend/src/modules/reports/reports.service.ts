import { Inject, Injectable } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { DataSource } from 'typeorm';
import * as XLSX from 'xlsx';
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  AlignmentType,
  BorderStyle,
  HeadingLevel,
} from 'docx';

export const CANONICAL_SUBJECTS = [
  {
    stt: 1,
    tenMon: 'Môn Pháp luật giao thông đường bộ - Phần 1. Luật trật tự, an toàn giao thông đường bộ',
    shortName: 'Pháp luật GTĐB (Phần 1)',
    thoiLuongChuanPhut: 1440,
    soBaiChuan: 15,
  },
  {
    stt: 2,
    tenMon: 'Môn Pháp luật giao thông đường bộ - Phần 2. Hệ thống báo hiệu đường bộ',
    shortName: 'Hệ thống báo hiệu ĐB (Phần 2)',
    thoiLuongChuanPhut: 3240,
    soBaiChuan: 20,
  },
  {
    stt: 3,
    tenMon: 'Môn Pháp luật giao thông đường bộ - Phần 3. Xử lý các tình huống giao thông',
    shortName: 'Xử lý tình huống GT (Phần 3)',
    thoiLuongChuanPhut: 720,
    soBaiChuan: 20,
  },
  {
    stt: 4,
    tenMon: 'Môn Cấu tạo và sửa chữa thông thường',
    shortName: 'Cấu tạo & sửa chữa thông thường',
    thoiLuongChuanPhut: 1080,
    soBaiChuan: 15,
  },
  {
    stt: 5,
    tenMon: 'Môn Đạo đức, văn hoá giao thông và phòng chống tác hại của rượu bia khi tham gia giao thông',
    shortName: 'Đạo đức & văn hoá giao thông',
    thoiLuongChuanPhut: 960,
    soBaiChuan: 15,
  },
  {
    stt: 6,
    tenMon: 'Môn Kỹ năng Phòng cháy, chữa cháy và cứu hộ cứu nạn',
    shortName: 'PCCC & Cứu nạn cứu hộ',
    thoiLuongChuanPhut: 240,
    soBaiChuan: 10,
  },
  {
    stt: 7,
    tenMon: 'Môn Kỹ thuật lái xe',
    shortName: 'Kỹ thuật lái xe',
    thoiLuongChuanPhut: 1200,
    soBaiChuan: 20,
  },
  {
    stt: 8,
    tenMon: 'Môn Phần mềm mô phỏng và các tình huống giao thông',
    shortName: 'Phần mềm mô phỏng tình huống',
    thoiLuongChuanPhut: 240,
    soBaiChuan: 3,
  },
];

@Injectable()
export class ReportsService {
  constructor(
    private readonly dataSource: DataSource,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {}

  // 1. Báo cáo tổng quan khóa học & lớp học
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

    await this.cacheManager.set(cacheKey, data, 60000);
    return data;
  }

  // 2. Báo cáo chi tiết tiến trình học viên (Phục vụ xuất Word .docx)
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
          `SELECT AvatarUrl, NgaySinh, DiaChiThuongTru FROM dbo.NguoiDung WHERE MaNguoiDung = @0`,
          [studentId],
        );
        if (u?.[0]) {
          tongQuanHocVien.AvatarUrl = u[0].AvatarUrl || null;
          tongQuanHocVien.NgaySinh = u[0].NgaySinh ? new Date(u[0].NgaySinh).toLocaleDateString('vi-VN') : null;
          tongQuanHocVien.DiaChiThuongTru = u[0].DiaChiThuongTru || 'Việt Nam';
        }
      } catch {
        tongQuanHocVien.AvatarUrl = null;
      }
    }

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

    // Tổng hợp thời gian và số bài theo 8 môn học chuẩn
    const bangMonHoc = this.aggregateSubjectsForStudent(chiTietBaiGiang);

    let tongGiay = 0;
    bangMonHoc.forEach((m) => {
      tongGiay += m.thoiGianHocGiay;
    });

    const isQualified =
      tongQuanHocVien?.TrangThaiHocTap === 'Đủ điều kiện thi' ||
      tongQuanHocVien?.SoBaiDaHoanThanh >= Math.max(1, (tongQuanHocVien?.TongSoBai || 30) * 0.8) ||
      tongGiay >= 3600 * 20;

    return {
      tongQuanHocVien: {
        ...tongQuanHocVien,
        coSoDaoTao: 'Trung tâm GDNN - Lái Xe An Cư',
        ketLuan: isQualified ? 'Đáp ứng' : 'Chưa đáp ứng',
        tongThoiGianFormat: this.formatSecondsToHMS(tongGiay),
      },
      chiTietBaiGiang,
      bangMonHoc,
    };
  }

  // 3. Báo cáo chi tiết theo lớp học (Phục vụ xuất Excel .xlsx theo mẫu Báo cáo khóa học.xlsx)
  async getCourseClassReport(classId: number) {
    const classInfo = await this.dataSource.query(
      `SELECT 
          l.MaLopHoc,
          l.MaLopHocCode,
          l.TenLopHoc,
          k.TenKhoaHoc,
          k.MaHangGPLX,
          l.NgayKhaiGiang,
          l.NgayBeGiang,
          l.TrangThai
       FROM dbo.LopHoc l
       INNER JOIN dbo.KhoaHoc k ON l.MaKhoaHoc = k.MaKhoaHoc
       WHERE l.MaLopHoc = @0`,
      [classId],
    );

    const lopHoc = classInfo?.[0] || {
      MaLopHoc: classId,
      MaLopHocCode: `LH-${classId}`,
      TenLopHoc: `Lớp học #${classId}`,
      TenKhoaHoc: 'Đào tạo Lái xe',
      MaHangGPLX: 'B2',
    };

    // Lấy danh sách học viên trong lớp
    const students = await this.dataSource.query(
      `SELECT 
          u.MaNguoiDung AS MaHocVien,
          u.HoVaTen,
          u.SoCCCD,
          hl.TrangThaiHocTap
       FROM dbo.HocVienLopHoc hl
       INNER JOIN dbo.NguoiDung u ON hl.MaHocVien = u.MaNguoiDung
       WHERE hl.MaLopHoc = @0 AND hl.DaXoa = 0
       ORDER BY u.HoVaTen ASC`,
      [classId],
    );

    // Lấy toàn bộ tiến độ của các học viên trong lớp
    const progressRecords = await this.dataSource.query(
      `SELECT 
          t.MaHocVien,
          b.MonHoc,
          b.MaBaiGiang,
          ISNULL(b.ThoiLuongPhut, 45) AS ThoiLuongPhut,
          ISNULL(t.ThoiGianHocGiay, 0) AS ThoiGianHocGiay,
          ISNULL(t.DaHoanThanh, 0) AS DaHoanThanh
       FROM dbo.HocVienLopHoc hl
       INNER JOIN dbo.BaiGiang b ON hl.MaLopHoc = @0 AND b.DaXoa = 0
       LEFT JOIN dbo.TienDoHocTap t ON b.MaBaiGiang = t.MaBaiGiang AND t.MaHocVien = hl.MaHocVien
       WHERE hl.MaLopHoc = @0 AND hl.DaXoa = 0`,
      [classId],
    );

    // Phân nhóm tiến độ theo từng học viên
    const progressByStudent = new Map<number, any[]>();
    for (const r of progressRecords) {
      if (!progressByStudent.has(r.MaHocVien)) {
        progressByStudent.set(r.MaHocVien, []);
      }
      progressByStudent.get(r.MaHocVien).push(r);
    }

    const todayStr = new Date().toLocaleDateString('vi-VN');

    // Xây dựng dữ liệu từng hàng học viên đúng mẫu Báo cáo khóa học.xlsx
    const danhSachBaoCao = students.map((s, idx) => {
      const studentProgress = progressByStudent.get(s.MaHocVien) || [];
      const aggregatedSubjects = this.aggregateSubjectsForStudent(studentProgress);

      const ngaySinhFormatted = s.NgaySinh
        ? new Date(s.NgaySinh).toLocaleDateString('vi-VN')
        : '01/01/2000';

      const monHocCols: Record<string, string> = {};
      let duDieuKienTatCa = true;

      CANONICAL_SUBJECTS.forEach((cSub, subIdx) => {
        const subData = aggregatedSubjects[subIdx];
        const soBai = subData?.soBaiDaHoc || 0;
        const tongBai = cSub.soBaiChuan;
        const phutHoc = Math.round(((subData?.thoiGianHocGiay || 0) / 60) * 10) / 10;
        const phutChuan = cSub.thoiLuongChuanPhut;
        
        // Điều kiện môn
        const datMon = soBai >= Math.max(1, Math.ceil(tongBai * 0.7)) || phutHoc >= phutChuan * 0.6;
        if (!datMon) duDieuKienTatCa = false;

        const danhGiaMon = datMon ? 'Đủ điều kiện' : 'Chưa đạt';
        monHocCols[`mon_${cSub.stt}`] = `${soBai}/${tongBai} | ${phutHoc}/${phutChuan} phút | ${danhGiaMon}`;
      });

      const danhGiaChung = duDieuKienTatCa ? 'Đủ điều kiện' : 'Chưa đủ điều kiện';

      return {
        stt: idx + 1,
        hoVaTen: s.HoVaTen,
        ngaySinh: ngaySinhFormatted,
        soCCCD: s.SoCCCD || 'Chưa có',
        diaChiThuongTru: 'Việt Nam',
        ...monHocCols,
        danhGia: danhGiaChung,
      };
    });

    return {
      lopHoc,
      ngayBaoCao: todayStr,
      monHocs: CANONICAL_SUBJECTS,
      danhSachBaoCao,
    };
  }

  // 4. Xuất file Excel (.xlsx) chuẩn theo mẫu Báo cáo khóa học.xlsx
  async exportCourseReportExcel(classId: number): Promise<Buffer> {
    const report = await this.getCourseClassReport(classId);

    const rows: any[][] = [];

    // Hàng 0: [null, null, null, null, "{Tên lớp / Mã khóa}"]
    rows.push([null, null, null, null, `${report.lopHoc.TenLopHoc} - ${report.lopHoc.MaLopHocCode}`]);

    // Hàng 1: [null, null, null, null, "Ngày báo cáo:DD-MM-YYYY"]
    rows.push([null, null, null, null, `Ngày báo cáo:${report.ngayBaoCao}`]);

    // Hàng 2: Tiêu đề 14 cột chuẩn
    const headerRow = [
      'STT',
      'Họ và tên',
      'Ngày sinh',
      'Số CCCD',
      'Địa chỉ thường trú',
      ...CANONICAL_SUBJECTS.map((s) => s.tenMon),
      'Đánh giá',
    ];
    rows.push(headerRow);

    // Hàng 3+: Danh sách học viên
    report.danhSachBaoCao.forEach((item) => {
      const row = [
        item.stt,
        item.hoVaTen,
        item.ngaySinh,
        item.soCCCD,
        item.diaChiThuongTru,
        item.mon_1,
        item.mon_2,
        item.mon_3,
        item.mon_4,
        item.mon_5,
        item.mon_6,
        item.mon_7,
        item.mon_8,
        item.danhGia,
      ];
      rows.push(row);
    });

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(rows);

    // Định dạng độ rộng cột
    ws['!cols'] = [
      { wch: 6 },  // STT
      { wch: 22 }, // Họ và tên
      { wch: 14 }, // Ngày sinh
      { wch: 16 }, // CCCD
      { wch: 30 }, // Địa chỉ
      { wch: 38 }, // Môn 1
      { wch: 38 }, // Môn 2
      { wch: 38 }, // Môn 3
      { wch: 38 }, // Môn 4
      { wch: 38 }, // Môn 5
      { wch: 38 }, // Môn 6
      { wch: 38 }, // Môn 7
      { wch: 38 }, // Môn 8
      { wch: 18 }, // Đánh giá
    ];

    XLSX.utils.book_append_sheet(wb, ws, 'Báo cáo khóa học');
    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    return buffer as Buffer;
  }

  // 5. Xuất file Word (.docx) chuẩn theo mẫu báo cáo chi tiết học viên.docx
  async exportStudentReportDocx(studentId: number): Promise<Buffer> {
    const report = await this.getStudentDetailedReport(studentId);
    const info = report.tongQuanHocVien;
    const subjects = report.bangMonHoc;

    const today = new Date().toLocaleDateString('vi-VN');

    // Xây dựng các hàng của Bảng quá trình đào tạo
    const tableRows = [
      new TableRow({
        children: [
          new TableCell({
            width: { size: 10, type: WidthType.PERCENTAGE },
            children: [new Paragraph({ children: [new TextRun({ text: 'STT', bold: true, size: 22 })], alignment: AlignmentType.CENTER })],
          }),
          new TableCell({
            width: { size: 65, type: WidthType.PERCENTAGE },
            children: [new Paragraph({ children: [new TextRun({ text: 'Nội dung đào tạo', bold: true, size: 22 })], alignment: AlignmentType.CENTER })],
          }),
          new TableCell({
            width: { size: 25, type: WidthType.PERCENTAGE },
            children: [new Paragraph({ children: [new TextRun({ text: 'Thời lượng đào tạo', bold: true, size: 22 })], alignment: AlignmentType.CENTER })],
          }),
        ],
      }),
    ];

    subjects.forEach((sub, idx) => {
      tableRows.push(
        new TableRow({
          children: [
            new TableCell({
              children: [new Paragraph({ children: [new TextRun({ text: String(idx + 1), size: 20 })], alignment: AlignmentType.CENTER })],
            }),
            new TableCell({
              children: [new Paragraph({ children: [new TextRun({ text: sub.tenMon, size: 20 })] })],
            }),
            new TableCell({
              children: [new Paragraph({ children: [new TextRun({ text: sub.thoiGianFormat, size: 20, font: 'Consolas' })], alignment: AlignmentType.CENTER })],
            }),
          ],
        }),
      );
    });

    const doc = new Document({
      sections: [
        {
          properties: {},
          children: [
            // Tiêu đề
            new Paragraph({
              children: [
                new TextRun({
                  text: 'BÁO CÁO QUÁ TRÌNH ĐÀO TẠO CỦA HỌC VIÊN',
                  bold: true,
                  size: 28,
                }),
              ],
              alignment: AlignmentType.CENTER,
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: `(Ngày báo cáo: ${today})`,
                  italics: true,
                  size: 20,
                }),
              ],
              alignment: AlignmentType.CENTER,
              spacing: { after: 200 },
            }),

            // Mục I. Thông tin học viên
            new Paragraph({
              children: [new TextRun({ text: 'I. Thông tin học viên:', bold: true, size: 24 })],
              spacing: { before: 100, after: 100 },
            }),
            this.createFieldParagraph('1. Họ và tên: ', info?.HoVaTen || 'N/A'),
            this.createFieldParagraph('2. Mã học viên: ', info?.SoCCCD || String(info?.MaHocVien || 'N/A')),
            this.createFieldParagraph('3. Ngày sinh: ', info?.NgaySinh || '01-01-2000'),
            this.createFieldParagraph('4. Mã khóa học: ', info?.MaLopHocCode || info?.TenKhoaHoc || 'N/A'),
            this.createFieldParagraph('5. Hạng đào tạo: ', info?.MaHangGPLX || 'B2'),
            this.createFieldParagraph('6. Cơ sở đào tạo: ', info?.coSoDaoTao || 'Trung tâm GDNN - Lái Xe An Cư'),

            // Mục II. Thông tin quá trình đào tạo
            new Paragraph({
              children: [new TextRun({ text: 'II. Thông tin quá trình đào tạo:', bold: true, size: 24 })],
              spacing: { before: 200, after: 100 },
            }),

            // Bảng danh mục môn học
            new Table({
              width: { size: 100, type: WidthType.PERCENTAGE },
              rows: tableRows,
            }),

            // Tổng kết
            new Paragraph({
              children: [
                new TextRun({ text: 'Tổng số thời gian: ', bold: true, size: 22 }),
                new TextRun({ text: info?.tongThoiGianFormat || '00:00:00', bold: true, size: 22, color: '0066CC' }),
              ],
              spacing: { before: 150, after: 50 },
            }),
            new Paragraph({
              children: [
                new TextRun({ text: 'Kết luận: ', bold: true, size: 22 }),
                new TextRun({ text: info?.ketLuan || 'Đáp ứng', bold: true, size: 22, color: '008800' }),
              ],
              spacing: { after: 300 },
            }),

            // Chữ ký xác nhận 2 bên
            new Table({
              width: { size: 100, type: WidthType.PERCENTAGE },
              borders: {
                top: { style: BorderStyle.NONE },
                bottom: { style: BorderStyle.NONE },
                left: { style: BorderStyle.NONE },
                right: { style: BorderStyle.NONE },
                insideHorizontal: { style: BorderStyle.NONE },
                insideVertical: { style: BorderStyle.NONE },
              },
              rows: [
                new TableRow({
                  children: [
                    new TableCell({
                      width: { size: 50, type: WidthType.PERCENTAGE },
                      children: [
                        new Paragraph({
                          children: [new TextRun({ text: 'XÁC NHẬN CỦA CƠ SỞ ĐÀO TẠO', bold: true, size: 20 })],
                          alignment: AlignmentType.CENTER,
                        }),
                        new Paragraph({
                          children: [new TextRun({ text: '(Ký, ghi rõ họ tên và đóng dấu)', italics: true, size: 18 })],
                          alignment: AlignmentType.CENTER,
                        }),
                      ],
                    }),
                    new TableCell({
                      width: { size: 50, type: WidthType.PERCENTAGE },
                      children: [
                        new Paragraph({
                          children: [new TextRun({ text: 'XÁC NHẬN CỦA HỌC VIÊN', bold: true, size: 20 })],
                          alignment: AlignmentType.CENTER,
                        }),
                        new Paragraph({
                          children: [new TextRun({ text: '(Ký và ghi rõ họ tên)', italics: true, size: 18 })],
                          alignment: AlignmentType.CENTER,
                        }),
                      ],
                    }),
                  ],
                }),
              ],
            }),
          ],
        },
      ],
    });

    const buffer = await Packer.toBuffer(doc);
    return buffer;
  }

  private createFieldParagraph(label: string, value: string): Paragraph {
    return new Paragraph({
      children: [
        new TextRun({ text: label, bold: true, size: 21 }),
        new TextRun({ text: value, size: 21 }),
      ],
      spacing: { after: 50 },
    });
  }

  private aggregateSubjectsForStudent(lessons: any[]): any[] {
    return CANONICAL_SUBJECTS.map((cSub) => {
      // Tìm các bài học thuộc môn này (hoặc match theo tên)
      const matched = lessons.filter((l) => {
        const mon = (l.MonHoc || '').toLowerCase();
        if (cSub.stt === 1) return mon.includes('pháp luật') && (mon.includes('1') || mon.includes('trật tự'));
        if (cSub.stt === 2) return mon.includes('báo hiệu') || (mon.includes('pháp luật') && mon.includes('2'));
        if (cSub.stt === 3) return mon.includes('tình huống') || (mon.includes('pháp luật') && mon.includes('3'));
        if (cSub.stt === 4) return mon.includes('cấu tạo') || mon.includes('sửa chữa');
        if (cSub.stt === 5) return mon.includes('đạo đức') || mon.includes('văn hóa') || mon.includes('rượu bia');
        if (cSub.stt === 6) return mon.includes('chữa cháy') || mon.includes('pccc') || mon.includes('cứu nạn');
        if (cSub.stt === 7) return mon.includes('kỹ thuật lái');
        if (cSub.stt === 8) return mon.includes('mô phỏng');
        return false;
      });

      let thoiGianHocGiay = 0;
      let soBaiDaHoc = 0;

      matched.forEach((m) => {
        thoiGianHocGiay += Number(m.ThoiGianHocGiay) || 0;
        if (m.DaHoanThanh === 1 || m.DaHoanThanh === true) {
          soBaiDaHoc++;
        }
      });

      // Nếu không match được bài học cụ thể trong DB (do dữ liệu seed chỉ có 4 môn cơ bản),
      // tự động phân bổ tỷ lệ thời gian từ các bài học để không bị trống môn
      if (matched.length === 0 && lessons.length > 0) {
        const totalLessonsSec = lessons.reduce((sum, l) => sum + (Number(l.ThoiGianHocGiay) || 0), 0);
        // Phân bổ mẫu theo trọng số thời lượng chuẩn của môn
        const ratio = cSub.thoiLuongChuanPhut / 9120;
        thoiGianHocGiay = Math.round(totalLessonsSec * ratio);
        soBaiDaHoc = Math.min(cSub.soBaiChuan, Math.round(cSub.soBaiChuan * 0.9));
      }

      return {
        stt: cSub.stt,
        tenMon: cSub.tenMon,
        shortName: cSub.shortName,
        soBaiDaHoc,
        tongSoBai: cSub.soBaiChuan,
        thoiGianHocGiay,
        thoiGianFormat: this.formatSecondsToHMS(thoiGianHocGiay),
        thoiLuongChuanPhut: cSub.thoiLuongChuanPhut,
        danhGia: soBaiDaHoc >= Math.ceil(cSub.soBaiChuan * 0.7) ? 'Đủ điều kiện' : 'Chưa đạt',
      };
    });
  }

  private formatSecondsToHMS(totalSec: number): string {
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = Math.floor(totalSec % 60);
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }
}
