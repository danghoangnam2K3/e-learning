import { PaginationFooter } from './common/PaginationFooter';
import { SortableHeader } from './common/SortableHeader';
import { useClientPagination } from '../hooks/useClientPagination';
import React, { useState, useEffect, useMemo } from 'react';
import { api } from '../services/api';
import { ReportOverviewItem, CourseItem } from '../types';
import {
  FileBarChart,
  Search,
  RefreshCw,
  Award,
  Users,
  CheckCircle2,
  Clock,
  BookOpen,
  FileSpreadsheet,
  Printer,
  ArrowLeft,
  Eye,
  Download,
  Filter,
  CheckCircle,
  XCircle,
  Building2,
  Calendar,
  Layers,
} from 'lucide-react';

interface CanonicalSubjectInfo {
  stt: number;
  tenMon: string;
  thoiLuongChuanPhut: number;
  soBaiChuan: number;
}

interface StudentCourseReportRow {
  stt: number;
  hoVaTen: string;
  ngaySinh: string;
  soCCCD: string;
  diaChiThuongTru: string;
  mon_1: string;
  mon_2: string;
  mon_3: string;
  mon_4: string;
  mon_5: string;
  mon_6: string;
  mon_7: string;
  mon_8: string;
  danhGia: string;
}

interface ClassReportData {
  lopHoc: {
    MaLopHoc: number;
    MaLopHocCode: string;
    TenLopHoc: string;
    TenKhoaHoc: string;
    MaHangGPLX: string;
    NgayKhaiGiang?: string;
    NgayBeGiang?: string;
    TrangThai?: string;
  };
  ngayBaoCao: string;
  monHocs: CanonicalSubjectInfo[];
  danhSachBaoCao: StudentCourseReportRow[];
}

export const CourseReportView: React.FC = () => {
  // Mode: 'overview' (bảng danh sách khóa/lớp) hoặc 'classDetail' (báo cáo chuẩn 14 cột)
  const [viewMode, setViewMode] = useState<'overview' | 'classDetail'>('overview');

  // Dữ liệu Tổng quan
  const [reports, setReports] = useState<ReportOverviewItem[]>([]);
  const [courses, setCourses] = useState<CourseItem[]>([]);
  const [selectedCourseFilter, setSelectedCourseFilter] = useState<number>(0);
  const [loading, setLoading] = useState(false);

  // Dữ liệu Chi tiết Lớp học (mẫu 14 cột theo Báo cáo khóa học.xlsx)
  const [selectedClassId, setSelectedClassId] = useState<number | null>(null);
  const [classReport, setClassReport] = useState<ClassReportData | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [exportingExcel, setExportingExcel] = useState(false);

  // Bộ lọc cho danh sách học viên trong báo cáo 14 cột
  const [studentSearch, setStudentSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'QUALIFIED' | 'UNQUALIFIED'>('ALL');

  // Phân trang & sắp xếp cho bảng Tổng quan
  const {
    currentPage: overviewPage,
    setCurrentPage: setOverviewPage,
    pageSize: overviewPageSize,
    setPageSize: setOverviewPageSize,
    sortField: overviewSortField,
    sortDirection: overviewSortDirection,
    handleSort: handleOverviewSort,
    paginatedData: paginatedReports,
    totalItems: totalReportsCount,
  } = useClientPagination({
    data: reports,
    initialPageSize: 10,
    initialSortField: 'TenKhoaHoc',
    initialSortDirection: 'ASC',
  });

  // Tải danh sách tổng quan
  const fetchReports = async (courseId?: number) => {
    setLoading(true);
    try {
      const data = await api.getCoursesOverview(courseId || undefined);
      setReports(data || []);
    } catch (err) {
      console.error('Lỗi khi tải báo cáo tổng quan khóa học:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    api.getCourses().then(setCourses);
    fetchReports();
  }, []);

  const handleFilterChange = (courseId: number) => {
    setSelectedCourseFilter(courseId);
    fetchReports(courseId === 0 ? undefined : courseId);
  };

  // Tải dữ liệu báo cáo chi tiết lớp học
  const fetchClassReport = async (classId: number) => {
    setLoadingDetail(true);
    try {
      const data = await api.getCourseClassReport(classId);
      setClassReport(data);
    } catch (err) {
      console.error('Lỗi khi tải chi tiết báo cáo lớp học:', err);
      alert('Không thể tải báo cáo chi tiết cho lớp học này.');
    } finally {
      setLoadingDetail(false);
    }
  };

  // Chọn lớp để xem báo cáo 14 cột
  const handleSelectClass = (classId: number) => {
    setSelectedClassId(classId);
    setViewMode('classDetail');
    fetchClassReport(classId);
  };

  // Xuất file Excel (.xlsx) chuẩn theo mẫu Báo cáo khóa học.xlsx
  const handleExportExcel = async (classId: number, className?: string, classCode?: string) => {
    setExportingExcel(true);
    try {
      const cleanName = (className || 'LopHoc')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/\s+/g, '_');
      const filename = `Bao_cao_khoa_hoc_${cleanName}_${classCode || classId}.xlsx`;
      await api.downloadCourseReportExcel(classId, filename);
    } catch (err: any) {
      console.error('Lỗi xuất file Excel:', err);
      alert(err.message || 'Lỗi khi xuất file Excel báo cáo khóa học.');
    } finally {
      setExportingExcel(false);
    }
  };

  // Lọc học viên trong báo cáo 14 cột
  const filteredStudents = useMemo(() => {
    if (!classReport?.danhSachBaoCao) return [];
    return classReport.danhSachBaoCao.filter((s) => {
      const matchSearch =
        s.hoVaTen.toLowerCase().includes(studentSearch.toLowerCase()) ||
        s.soCCCD.toLowerCase().includes(studentSearch.toLowerCase()) ||
        s.diaChiThuongTru.toLowerCase().includes(studentSearch.toLowerCase());

      const isQualified = s.danhGia === 'Đủ điều kiện';
      if (statusFilter === 'QUALIFIED') return matchSearch && isQualified;
      if (statusFilter === 'UNQUALIFIED') return matchSearch && !isQualified;
      return matchSearch;
    });
  }, [classReport?.danhSachBaoCao, studentSearch, statusFilter]);

  // Phân trang & sắp xếp cho bảng 14 cột
  const {
    currentPage: detailPage,
    setCurrentPage: setDetailPage,
    pageSize: detailPageSize,
    setPageSize: setDetailPageSize,
    sortField: detailSortField,
    sortDirection: detailSortDirection,
    handleSort: handleDetailSort,
    paginatedData: paginatedStudents,
    totalItems: totalStudentsCount,
  } = useClientPagination({
    data: filteredStudents,
    initialPageSize: 10,
    initialSortField: 'stt',
    initialSortDirection: 'ASC',
  });

  // Render cell môn học "{soBai}/{tongBai} | {phutHoc}/{phutChuan} phút | {Đủ điều kiện / Chưa đạt}"
  const renderSubjectCell = (cellValue: string) => {
    if (!cellValue) {
      return <span className="text-slate-400 italic">--</span>;
    }
    const parts = cellValue.split('|').map((p) => p.trim());
    const lessons = parts[0] || '';
    const minutes = parts[1] || '';
    const status = parts[2] || '';
    const isDat = status === 'Đủ điều kiện';

    return (
      <div className="space-y-0.5 text-center py-1">
        <div className="text-[11px] font-semibold text-slate-800 whitespace-nowrap">
          {lessons}
        </div>
        <div className="text-[10px] text-slate-500 whitespace-nowrap">
          {minutes}
        </div>
        <div>
          <span
            className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
              isDat
                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                : 'bg-rose-50 text-rose-700 border border-rose-200'
            }`}
          >
            {status || (isDat ? 'Đạt' : 'Chưa đạt')}
          </span>
        </div>
      </div>
    );
  };

  // Tính toán số lượng đạt / chưa đạt
  const totalInClass = classReport?.danhSachBaoCao.length || 0;
  const qualifiedInClass =
    classReport?.danhSachBaoCao.filter((s) => s.danhGia === 'Đủ điều kiện').length || 0;
  const qualifiedRate = totalInClass > 0 ? Math.round((qualifiedInClass / totalInClass) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* 1. Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            {viewMode === 'classDetail' && (
              <button
                onClick={() => setViewMode('overview')}
                className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer mr-1"
                title="Quay lại danh sách tổng quan"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            <h2 className="text-xl font-black font-heading tracking-tight text-slate-800 uppercase flex items-center gap-2.5">
              <FileBarChart className="w-6 h-6 text-amber-500" />
              <span>
                {viewMode === 'overview'
                  ? 'Báo Cáo Khóa Học & Lớp Đào Tạo'
                  : 'Báo Cáo Chi Tiết Khóa Học (Mẫu 14 Cột)'}
              </span>
            </h2>
          </div>
          <p className="text-xs text-slate-500 font-medium mt-1">
            {viewMode === 'overview'
              ? 'Thống kê tiến độ đào tạo, tổng số học viên và tỷ lệ hoàn thành chương trình lý thuyết theo từng khóa'
              : 'Báo cáo chi tiết quá trình học tập theo mẫu quy định (14 cột chuẩn: Thông tin học viên & 8 môn học lý thuyết)'}
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          {viewMode === 'classDetail' && selectedClassId && (
            <>
              <button
                onClick={() => {
                  if (classReport) {
                    handleExportExcel(
                      selectedClassId,
                      classReport.lopHoc.TenLopHoc,
                      classReport.lopHoc.MaLopHocCode
                    );
                  }
                }}
                disabled={exportingExcel || loadingDetail}
                className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-sm shadow-emerald-200 cursor-pointer disabled:opacity-50"
                title="Xuất file Excel (.xlsx) chuẩn theo mẫu quy định"
              >
                <FileSpreadsheet className={`w-4 h-4 ${exportingExcel ? 'animate-bounce' : ''}`} />
                <span>{exportingExcel ? 'Đang xuất Excel...' : 'Xuất file Excel (.xlsx)'}</span>
              </button>

              <button
                onClick={() => window.print()}
                className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
                title="In trang báo cáo này"
              >
                <Printer className="w-4 h-4 text-slate-500" />
                <span className="hidden sm:inline">In Báo Cáo</span>
              </button>
            </>
          )}

          <button
            onClick={() => {
              if (viewMode === 'overview') {
                fetchReports(selectedCourseFilter === 0 ? undefined : selectedCourseFilter);
              } else if (selectedClassId) {
                fetchClassReport(selectedClassId);
              }
            }}
            className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition-colors cursor-pointer"
            title="Làm mới dữ liệu"
          >
            <RefreshCw
              className={`w-4 h-4 ${loading || loadingDetail ? 'animate-spin' : ''}`}
            />
          </button>
        </div>
      </div>

      {/* ========================================================
          CHẾ ĐỘ 1: TỔNG QUAN CÁC KHÓA HỌC / LỚP HỌC
          ======================================================== */}
      {viewMode === 'overview' && (
        <>
          {/* Filter Bar */}
          <div className="akkhor-card p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                Lọc theo khóa học:
              </label>
              <select
                value={selectedCourseFilter}
                onChange={(e) => handleFilterChange(Number(e.target.value))}
                className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-amber-400"
              >
                <option value={0}>Tất cả khóa học</option>
                {courses.map((c) => (
                  <option key={c.MaKhoaHoc} value={c.MaKhoaHoc}>
                    [Hạng {c.MaHangGPLX}] - {c.TenKhoaHoc}
                  </option>
                ))}
              </select>
            </div>

            <div className="text-xs text-slate-500 font-semibold">
              Tổng số lớp báo cáo: <strong className="text-slate-800">{reports.length}</strong>
            </div>
          </div>

          {/* Table Tổng quan */}
          <div className="akkhor-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                    <SortableHeader
                      field="TenKhoaHoc"
                      currentField={overviewSortField}
                      currentDirection={overviewSortDirection}
                      onSort={handleOverviewSort}
                    >
                      Tên Khóa Học
                    </SortableHeader>
                    <SortableHeader
                      field="TenLopHoc"
                      currentField={overviewSortField}
                      currentDirection={overviewSortDirection}
                      onSort={handleOverviewSort}
                    >
                      Lớp Học
                    </SortableHeader>
                    <SortableHeader
                      field="MaHangGPLX"
                      currentField={overviewSortField}
                      currentDirection={overviewSortDirection}
                      onSort={handleOverviewSort}
                    >
                      Hạng GPLX
                    </SortableHeader>
                    <SortableHeader
                      field="TongSoHocVien"
                      align="center"
                      currentField={overviewSortField}
                      currentDirection={overviewSortDirection}
                      onSort={handleOverviewSort}
                    >
                      Tổng Sĩ Số
                    </SortableHeader>
                    <SortableHeader
                      field="SoHocVienDuDieuKienThi"
                      align="center"
                      currentField={overviewSortField}
                      currentDirection={overviewSortDirection}
                      onSort={handleOverviewSort}
                    >
                      Hoàn Thành (Đủ ĐK)
                    </SortableHeader>
                    <th className="py-3.5 px-4 text-center">Tỷ Lệ</th>
                    <th className="py-3.5 px-4 text-center">Tiến Độ Trung Bình</th>
                    <th className="py-3.5 px-4 text-right">Thao Tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {totalReportsCount === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center py-12 text-slate-400 font-medium">
                        {loading ? 'Đang tải báo cáo tổng quan...' : 'Không có dữ liệu báo cáo nào.'}
                      </td>
                    </tr>
                  ) : (
                    paginatedReports.map((item, idx) => {
                      const soHoanThanh =
                        item.SoHocVienDuDieuKienThi ?? item.SoHocVienHoanThanh ?? 0;
                      const rate =
                        item.TongSoHocVien > 0
                          ? Math.round((soHoanThanh / item.TongSoHocVien) * 100)
                          : 0;

                      return (
                        <tr key={idx} className="hover:bg-amber-50/20 transition-colors">
                          <td className="py-3.5 px-4">
                            <div className="font-bold text-slate-800 text-sm">
                              {item.TenKhoaHoc}
                            </div>
                            <div className="text-[10px] text-slate-400 font-medium">
                              Mã lớp: {item.MaLopHocCode}
                            </div>
                          </td>

                          <td className="py-3.5 px-4 font-semibold text-slate-700">
                            {item.TenLopHoc || 'Toàn khóa'}
                          </td>

                          <td className="py-3.5 px-4">
                            <span className="px-2.5 py-1 rounded-full text-xs font-black bg-amber-100 text-amber-800">
                              Hạng {item.MaHangGPLX}
                            </span>
                          </td>

                          <td className="py-3.5 px-4 text-center font-bold text-slate-800">
                            {item.TongSoHocVien} học viên
                          </td>

                          <td className="py-3.5 px-4 text-center font-bold text-emerald-600">
                            {soHoanThanh} học viên
                          </td>

                          <td className="py-3.5 px-4 text-center">
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full font-bold text-[11px] bg-emerald-50 text-emerald-700">
                              {rate}%
                            </span>
                          </td>

                          <td className="py-3.5 px-4">
                            <div className="w-32 mx-auto space-y-1">
                              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                                <div
                                  className="bg-amber-500 h-2 rounded-full transition-all"
                                  style={{ width: `${Math.min(rate, 100)}%` }}
                                ></div>
                              </div>
                              <div className="text-[10px] text-right font-semibold text-slate-500">
                                {rate}%
                              </div>
                            </div>
                          </td>

                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => handleSelectClass(item.MaLopHoc)}
                                className="flex items-center gap-1.5 px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-lg font-bold text-xs transition-colors cursor-pointer border border-amber-200"
                                title="Xem báo cáo chi tiết chuẩn 14 cột"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span>Báo Cáo 14 Cột</span>
                              </button>

                              <button
                                onClick={() =>
                                  handleExportExcel(
                                    item.MaLopHoc,
                                    item.TenLopHoc,
                                    item.MaLopHocCode
                                  )
                                }
                                disabled={exportingExcel}
                                className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg transition-colors cursor-pointer border border-emerald-200"
                                title="Xuất file Excel (.xlsx)"
                              >
                                <Download className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Footer */}
            <PaginationFooter
              currentPage={overviewPage}
              pageSize={overviewPageSize}
              totalItems={totalReportsCount}
              onPageChange={setOverviewPage}
              onPageSizeChange={setOverviewPageSize}
              pageSizeOptions={[10, 20, 50, -1]}
              itemName="lớp báo cáo"
            />
          </div>
        </>
      )}

      {/* ========================================================
          CHẾ ĐỘ 2: BÁO CÁO CHI TIẾT 14 CỘT THEO MẪU Báo cáo khóa học.xlsx
          ======================================================== */}
      {viewMode === 'classDetail' && (
        <div className="space-y-6">
          {/* Banner Thông Tin Lớp Học Chuẩn */}
          {classReport && (
            <div className="akkhor-card p-5 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-200/80">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 text-xs font-bold text-amber-800 tracking-wider uppercase">
                    <Building2 className="w-4 h-4 text-amber-600" />
                    <span>Cơ Sở Đào Tạo Và Sát Hạch Lái Xe</span>
                  </div>
                  <h3 className="text-lg lg:text-xl font-black text-slate-800 font-heading">
                    {classReport.lopHoc.TenLopHoc} ({classReport.lopHoc.MaLopHocCode})
                  </h3>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600">
                    <div>
                      Khóa: <strong className="text-slate-800">{classReport.lopHoc.TenKhoaHoc}</strong>
                    </div>
                    <div>•</div>
                    <div>
                      Hạng GPLX:{' '}
                      <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-bold text-[11px]">
                        Hạng {classReport.lopHoc.MaHangGPLX}
                      </span>
                    </div>
                    <div>•</div>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>Ngày báo cáo: <strong>{classReport.ngayBaoCao}</strong></span>
                    </div>
                  </div>
                </div>

                {/* KPI Metrics */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-white/90 p-3 rounded-xl border border-slate-200/80 text-center shadow-xs">
                    <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      Tổng Sĩ Số
                    </div>
                    <div className="text-xl font-black text-slate-800">{totalInClass}</div>
                    <div className="text-[10px] text-slate-400 font-medium">học viên</div>
                  </div>

                  <div className="bg-white/90 p-3 rounded-xl border border-emerald-200 text-center shadow-xs">
                    <div className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">
                      Đủ Điều Kiện
                    </div>
                    <div className="text-xl font-black text-emerald-600">{qualifiedInClass}</div>
                    <div className="text-[10px] text-emerald-700 font-semibold">{qualifiedRate}%</div>
                  </div>

                  <div className="bg-white/90 p-3 rounded-xl border border-rose-200 text-center shadow-xs">
                    <div className="text-[11px] font-bold text-rose-700 uppercase tracking-wider">
                      Chưa Đạt
                    </div>
                    <div className="text-xl font-black text-rose-600">
                      {totalInClass - qualifiedInClass}
                    </div>
                    <div className="text-[10px] text-rose-600 font-semibold">
                      {100 - qualifiedRate}%
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Thanh công cụ Tìm kiếm & Lọc học viên trong lớp */}
          <div className="akkhor-card p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 flex-1">
              {/* Ô tìm kiếm */}
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Tìm học viên theo họ tên, CCCD, nơi cư trú..."
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:border-amber-400"
                />
              </div>

              {/* Lọc theo kết quả đánh giá */}
              <div className="flex items-center gap-2">
                <Filter className="w-3.5 h-3.5 text-slate-400" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:border-amber-400"
                >
                  <option value="ALL">Tất cả đánh giá</option>
                  <option value="QUALIFIED">Đủ điều kiện</option>
                  <option value="UNQUALIFIED">Chưa đủ điều kiện</option>
                </select>
              </div>
            </div>

            {/* Quick Switch Lớp khác */}
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-500 font-bold whitespace-nowrap">Đổi lớp:</span>
              <select
                value={selectedClassId || 0}
                onChange={(e) => {
                  const newClassId = Number(e.target.value);
                  if (newClassId > 0) handleSelectClass(newClassId);
                }}
                className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-amber-400"
              >
                {reports.map((r) => (
                  <option key={r.MaLopHoc} value={r.MaLopHoc}>
                    {r.TenLopHoc} ({r.MaLopHocCode}) - {r.TenKhoaHoc}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Bảng 14 Cột Chuẩn Mẫu Báo cáo khóa học.xlsx */}
          <div className="akkhor-card overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-amber-500" />
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Bảng Chi Tiết 14 Cột Môn Học Lý Thuyết & Đánh Giá
                </span>
              </div>
              <span className="text-xs text-slate-500 font-medium">
                Hiển thị <strong>{filteredStudents.length}</strong> / {totalInClass} học viên
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100/80 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-2 text-center w-12 sticky left-0 bg-slate-100 z-10 border-r border-slate-200">
                      STT
                    </th>
                    <th className="py-3 px-3 min-w-[170px] sticky left-12 bg-slate-100 z-10 border-r border-slate-200">
                      Họ và tên
                    </th>
                    <th className="py-3 px-2.5 min-w-[95px] text-center border-r border-slate-200">
                      Ngày sinh
                    </th>
                    <th className="py-3 px-3 min-w-[110px] text-center border-r border-slate-200">
                      Số CCCD
                    </th>
                    <th className="py-3 px-3 min-w-[180px] border-r border-slate-200">
                      Địa chỉ thường trú
                    </th>

                    {/* 8 Cột môn học chuẩn */}
                    <th className="py-3 px-2 min-w-[145px] text-center border-r border-slate-200 bg-amber-50/50">
                      1. PL GTĐB - P1
                      <div className="text-[9px] font-normal text-slate-400 capitalize">Luật TTAT GTĐB</div>
                    </th>
                    <th className="py-3 px-2 min-w-[145px] text-center border-r border-slate-200 bg-amber-50/50">
                      2. PL GTĐB - P2
                      <div className="text-[9px] font-normal text-slate-400 capitalize">Báo hiệu đường bộ</div>
                    </th>
                    <th className="py-3 px-2 min-w-[145px] text-center border-r border-slate-200 bg-amber-50/50">
                      3. PL GTĐB - P3
                      <div className="text-[9px] font-normal text-slate-400 capitalize">Xử lý tình huống</div>
                    </th>
                    <th className="py-3 px-2 min-w-[145px] text-center border-r border-slate-200 bg-amber-50/50">
                      4. Cấu tạo & SC TT
                      <div className="text-[9px] font-normal text-slate-400 capitalize">Sửa chữa cơ bản</div>
                    </th>
                    <th className="py-3 px-2 min-w-[145px] text-center border-r border-slate-200 bg-amber-50/50">
                      5. Đạo đức & VHGT
                      <div className="text-[9px] font-normal text-slate-400 capitalize">Tác hại rượu bia</div>
                    </th>
                    <th className="py-3 px-2 min-w-[145px] text-center border-r border-slate-200 bg-amber-50/50">
                      6. KN PCCC & CNCH
                      <div className="text-[9px] font-normal text-slate-400 capitalize">Phòng cháy chữa cháy</div>
                    </th>
                    <th className="py-3 px-2 min-w-[145px] text-center border-r border-slate-200 bg-amber-50/50">
                      7. Kỹ thuật lái xe
                      <div className="text-[9px] font-normal text-slate-400 capitalize">Lý thuyết kỹ thuật</div>
                    </th>
                    <th className="py-3 px-2 min-w-[145px] text-center border-r border-slate-200 bg-amber-50/50">
                      8. Mô phỏng THGT
                      <div className="text-[9px] font-normal text-slate-400 capitalize">Phần mềm mô phỏng</div>
                    </th>

                    <th className="py-3 px-3 min-w-[130px] text-center bg-slate-100">
                      Đánh Giá
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {totalStudentsCount === 0 ? (
                    <tr>
                      <td colSpan={14} className="text-center py-12 text-slate-400 font-medium">
                        {loadingDetail
                          ? 'Đang tính toán dữ liệu 14 cột theo chuẩn...'
                          : 'Không có dữ liệu học viên nào phù hợp.'}
                      </td>
                    </tr>
                  ) : (
                    paginatedStudents.map((item) => {
                      const isDatChung = item.danhGia === 'Đủ điều kiện';

                      return (
                        <tr
                          key={item.stt}
                          className="hover:bg-amber-50/30 transition-colors group"
                        >
                          {/* STT */}
                          <td className="py-3 px-2 text-center font-bold text-slate-600 sticky left-0 bg-white group-hover:bg-amber-50/50 z-10 border-r border-slate-100">
                            {item.stt}
                          </td>

                          {/* Họ và tên */}
                          <td className="py-3 px-3 sticky left-12 bg-white group-hover:bg-amber-50/50 z-10 border-r border-slate-100">
                            <div className="font-bold text-slate-800 text-[13px]">
                              {item.hoVaTen}
                            </div>
                          </td>

                          {/* Ngày sinh */}
                          <td className="py-3 px-2.5 text-center text-slate-600 font-medium border-r border-slate-100 whitespace-nowrap">
                            {item.ngaySinh}
                          </td>

                          {/* CCCD */}
                          <td className="py-3 px-3 text-center font-mono text-[11px] text-slate-700 font-semibold border-r border-slate-100 whitespace-nowrap">
                            {item.soCCCD}
                          </td>

                          {/* Địa chỉ */}
                          <td className="py-3 px-3 text-slate-600 font-medium border-r border-slate-100 max-w-[220px] truncate" title={item.diaChiThuongTru}>
                            {item.diaChiThuongTru}
                          </td>

                          {/* 8 Cột môn học */}
                          <td className="py-2 px-2 border-r border-slate-100">
                            {renderSubjectCell(item.mon_1)}
                          </td>
                          <td className="py-2 px-2 border-r border-slate-100">
                            {renderSubjectCell(item.mon_2)}
                          </td>
                          <td className="py-2 px-2 border-r border-slate-100">
                            {renderSubjectCell(item.mon_3)}
                          </td>
                          <td className="py-2 px-2 border-r border-slate-100">
                            {renderSubjectCell(item.mon_4)}
                          </td>
                          <td className="py-2 px-2 border-r border-slate-100">
                            {renderSubjectCell(item.mon_5)}
                          </td>
                          <td className="py-2 px-2 border-r border-slate-100">
                            {renderSubjectCell(item.mon_6)}
                          </td>
                          <td className="py-2 px-2 border-r border-slate-100">
                            {renderSubjectCell(item.mon_7)}
                          </td>
                          <td className="py-2 px-2 border-r border-slate-100">
                            {renderSubjectCell(item.mon_8)}
                          </td>

                          {/* Đánh giá chung */}
                          <td className="py-3 px-3 text-center whitespace-nowrap">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
                                isDatChung
                                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                  : 'bg-rose-100 text-rose-800 border border-rose-300'
                              }`}
                            >
                              {isDatChung ? (
                                <CheckCircle className="w-3.5 h-3.5" />
                              ) : (
                                <XCircle className="w-3.5 h-3.5" />
                              )}
                              <span>{item.danhGia}</span>
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Footer */}
            <PaginationFooter
              currentPage={detailPage}
              pageSize={detailPageSize}
              totalItems={totalStudentsCount}
              onPageChange={setDetailPage}
              onPageSizeChange={setDetailPageSize}
              pageSizeOptions={[10, 20, 50, -1]}
              itemName="học viên"
            />
          </div>

          {/* Khối Chữ Ký & Xác Nhận Chuẩn */}
          <div className="akkhor-card p-6 bg-slate-50 border border-slate-200">
            <div className="text-right text-xs text-slate-500 italic mb-6">
              Ngày báo cáo: {classReport?.ngayBaoCao || new Date().toLocaleDateString('vi-VN')}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 text-center text-xs">
              <div className="space-y-1">
                <div className="font-bold text-slate-800 uppercase">Người Lập Báo Cáo</div>
                <div className="text-[11px] text-slate-500 italic">(Ký và ghi rõ họ tên)</div>
                <div className="h-20"></div>
                <div className="font-semibold text-slate-700">Cán bộ phụ trách dữ liệu</div>
              </div>

              <div className="space-y-1">
                <div className="font-bold text-slate-800 uppercase">Phòng Đào Tạo</div>
                <div className="text-[11px] text-slate-500 italic">(Ký và ghi rõ họ tên)</div>
                <div className="h-20"></div>
                <div className="font-semibold text-slate-700">Trưởng phòng đào tạo</div>
              </div>

              <div className="space-y-1">
                <div className="font-bold text-slate-800 uppercase">Thủ Trưởng Cơ Sở Đào Tạo</div>
                <div className="text-[11px] text-slate-500 italic">(Ký tên và đóng dấu)</div>
                <div className="h-20"></div>
                <div className="font-semibold text-slate-700">Giám đốc trung tâm</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
