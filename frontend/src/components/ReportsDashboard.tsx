import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { ReportOverviewItem, CourseItem, ClassItem } from '../types';
import {
  BarChart3,
  Users,
  Award,
  Clock,
  Download,
  Filter,
  FileCheck2,
  Search,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useDebounce } from '../hooks/useDebounce';

export const ReportsDashboard: React.FC = () => {
  const [reports, setReports] = useState<ReportOverviewItem[]>([]);
  const [courses, setCourses] = useState<CourseItem[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);

  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [loading, setLoading] = useState(false);

  // Search, Sort, Pagination for Reports Table (Debounced 350ms)
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 350);
  const [sortBy, setSortBy] = useState<'TenLopHoc' | 'TongSoHocVien' | 'SoHocVienDuDieuKienThi' | 'GioHocTrungBinhTungHocVien'>('TenLopHoc');
  const [sortDir, setSortDir] = useState<'ASC' | 'DESC'>('ASC');
  const [pageSize, setPageSize] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Student detailed transcript lookup
  const [studentSearchId, setStudentSearchId] = useState('');
  const [studentReport, setStudentReport] = useState<any | null>(null);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const data = await api.getCoursesOverview(
        selectedCourseId ? Number(selectedCourseId) : undefined,
        selectedClassId ? Number(selectedClassId) : undefined,
      );
      setReports(data);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    Promise.all([api.getCourses(), api.getClasses()]).then(([co, cl]) => {
      setCourses(co);
      setClasses(cl);
    });
    fetchReports();
  }, [selectedCourseId, selectedClassId]);

  const handleLookupStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentSearchId) return;
    try {
      const data = await api.getStudentReport(Number(studentSearchId));
      setStudentReport(data);
    } catch (err: any) {
      alert(err.message || 'Không tìm thấy học viên.');
    }
  };

  // Filter & Sort Reports (sử dụng debouncedSearchTerm)
  const filteredReports = reports
    .filter((r) => {
      const matchSearch =
        r.TenLopHoc.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        r.MaLopHocCode.toLowerCase().includes(debouncedSearchTerm.toLowerCase());
      return matchSearch;
    })
    .sort((a, b) => {
      const valA = a[sortBy];
      const valB = b[sortBy];
      if (typeof valA === 'string' || typeof valB === 'string') {
        const cmp = String(valA).localeCompare(String(valB));
        return sortDir === 'ASC' ? cmp : -cmp;
      }
      return sortDir === 'ASC' ? Number(valA) - Number(valB) : Number(valB) - Number(valA);
    });

  const totalReports = filteredReports.length;
  const isAllReports = pageSize === -1;
  const totalReportPages = isAllReports ? 1 : Math.ceil(totalReports / pageSize) || 1;
  const displayedReports = isAllReports
    ? filteredReports
    : filteredReports.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold font-heading text-white flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-indigo-400" /> Báo cáo & Thống kê Đào tạo (REPORT_MOD)
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Tổng hợp quá trình đào tạo, tỷ lệ đủ điều kiện dự sát hạch và trích xuất bảng kê chi tiết giờ học
        </p>
      </div>

      {/* Filters & Search Bar */}
      <div className="glass-panel p-4 rounded-2xl border border-slate-800 space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm kiếm mã lớp, tên lớp trong báo cáo..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>

          {/* Page size dropdown */}
          <div className="flex items-center gap-2 text-xs shrink-0">
            <span className="text-slate-400">Hiển thị:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="bg-slate-900 border border-slate-700/80 rounded-xl px-2.5 py-1.5 text-white focus:outline-none cursor-pointer"
            >
              <option value={10}>10 dòng</option>
              <option value={20}>20 dòng</option>
              <option value={50}>50 dòng</option>
              <option value={-1}>Tất cả</option>
            </select>
          </div>
        </div>

        {/* Filter Dropdowns & Sorter */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800/80 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-slate-400">Khóa học:</span>
              <select
                value={selectedCourseId}
                onChange={(e) => {
                  setSelectedCourseId(e.target.value);
                  setCurrentPage(1);
                }}
                className="bg-transparent text-white focus:outline-none cursor-pointer"
              >
                <option value="" className="bg-slate-900">Tất cả khóa đào tạo</option>
                {courses.map((c) => (
                  <option key={c.MaKhoaHoc} value={c.MaKhoaHoc} className="bg-slate-900">
                    {c.TenKhoaHoc} (Hạng {c.MaHangGPLX})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-1.5 bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800">
              <span className="text-slate-400">Lớp học:</span>
              <select
                value={selectedClassId}
                onChange={(e) => {
                  setSelectedClassId(e.target.value);
                  setCurrentPage(1);
                }}
                className="bg-transparent text-white focus:outline-none cursor-pointer"
              >
                <option value="" className="bg-slate-900">Tất cả lớp</option>
                {classes.map((cl) => (
                  <option key={cl.MaLopHoc} value={cl.MaLopHoc} className="bg-slate-900">
                    {cl.TenLopHoc} ({cl.MaLopHocCode})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-1.5 bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800">
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-slate-400">Sắp xếp:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-transparent text-white focus:outline-none cursor-pointer"
              >
                <option value="TenLopHoc" className="bg-slate-900">Tên lớp</option>
                <option value="TongSoHocVien" className="bg-slate-900">Sĩ số</option>
                <option value="SoHocVienDuDieuKienThi" className="bg-slate-900">Đủ ĐK thi</option>
                <option value="GioHocTrungBinhTungHocVien" className="bg-slate-900">Giờ học TB</option>
              </select>
              <button
                type="button"
                onClick={() => setSortDir((prev) => (prev === 'ASC' ? 'DESC' : 'ASC'))}
                className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-indigo-400 font-mono font-bold cursor-pointer"
              >
                {sortDir}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Reports Table */}
      <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/60 font-semibold text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-4">Mã & Tên Lớp đào tạo</th>
                <th className="py-3 px-4">Hạng đào tạo</th>
                <th className="py-3 px-4 text-center">Tổng sĩ số</th>
                <th className="py-3 px-4 text-center">Đủ điều kiện thi</th>
                <th className="py-3 px-4 text-center">Đang đào tạo</th>
                <th className="py-3 px-4 text-center">Giờ học TB/Học viên</th>
                <th className="py-3 px-4 text-right">Trạng thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">Đang tổng hợp báo cáo...</td>
                </tr>
              ) : displayedReports.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">Không có dữ liệu báo cáo nào phù hợp.</td>
                </tr>
              ) : (
                displayedReports.map((r) => (
                  <tr key={r.MaLopHoc} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-bold text-white text-sm">{r.TenLopHoc}</div>
                      <div className="text-[11px] text-slate-400 font-mono mt-0.5">{r.MaLopHocCode}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-lg text-xs font-bold bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                        Hạng {r.MaHangGPLX}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center font-bold text-white text-sm">{r.TongSoHocVien}</td>
                    <td className="py-3 px-4 text-center">
                      <span className="inline-flex items-center gap-1 text-emerald-400 font-bold">
                        <Award className="w-3.5 h-3.5" /> {r.SoHocVienDuDieuKienThi}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center font-medium text-slate-300">{r.SoHocVienDangHoc}</td>
                    <td className="py-3 px-4 text-center font-mono text-cyan-400 font-medium">
                      {r.GioHocTrungBinhTungHocVien || 0} giờ
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                        {r.TrangThaiLop}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination Footer for Reports */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
        <div>
          Hiển thị{' '}
          <strong className="text-white">
            {isAllReports ? totalReports : Math.min((currentPage - 1) * pageSize + 1, totalReports)}
          </strong>{' '}
          -{' '}
          <strong className="text-white">
            {isAllReports ? totalReports : Math.min(currentPage * pageSize, totalReports)}
          </strong>{' '}
          trong tổng số <strong className="text-white">{totalReports}</strong> lớp học báo cáo
        </div>

        {!isAllReports && totalReportPages > 1 && (
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg border border-slate-800 bg-slate-900 text-slate-300 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 py-1 font-medium text-slate-300">
              Trang {currentPage} / {totalReportPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalReportPages))}
              disabled={currentPage === totalReportPages}
              className="p-1.5 rounded-lg border border-slate-800 bg-slate-900 text-slate-300 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Detailed Student Transcript Lookup */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
        <div>
          <h3 className="text-base font-bold font-heading text-white flex items-center gap-2">
            <FileCheck2 className="w-5 h-5 text-indigo-400" /> Tra cứu Bảng kê Chi tiết Học viên (fn_detailed_student_report)
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Nhập ID học viên (ví dụ: 4 hoặc 5) để trích xuất toàn bộ thời lượng lý thuyết phục vụ sát hạch
          </p>
        </div>

        <form onSubmit={handleLookupStudent} className="flex gap-2 max-w-md">
          <input
            type="number"
            required
            placeholder="Nhập Mã Học viên (ID)..."
            value={studentSearchId}
            onChange={(e) => setStudentSearchId(e.target.value)}
            className="flex-1 px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm rounded-xl shadow-lg shadow-indigo-600/30 flex items-center gap-1.5 cursor-pointer"
          >
            <Search className="w-4 h-4" /> Tra cứu
          </button>
        </form>

        {studentReport && studentReport.tongQuanHocVien && (
          <div className="mt-4 p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs border-b border-slate-800 pb-3">
              <div>
                <span className="text-slate-400">Họ và tên:</span>
                <div className="text-sm font-bold text-white mt-0.5">{studentReport.tongQuanHocVien.HoVaTen}</div>
              </div>
              <div>
                <span className="text-slate-400">Số CCCD:</span>
                <div className="text-sm font-bold text-white mt-0.5">{studentReport.tongQuanHocVien.SoCCCD || '—'}</div>
              </div>
              <div>
                <span className="text-slate-400">Lớp đào tạo:</span>
                <div className="text-sm font-bold text-white mt-0.5">{studentReport.tongQuanHocVien.TenLopHoc}</div>
              </div>
              <div>
                <span className="text-slate-400">Tổng giờ tích lũy:</span>
                <div className="text-sm font-bold text-emerald-400 mt-0.5">{studentReport.tongQuanHocVien.TongGioHocThucTe} / {studentReport.tongQuanHocVien.GioQuyDinh} giờ</div>
              </div>
            </div>

            <div className="text-xs">
              <div className="font-semibold text-slate-300 mb-2">Chi tiết danh mục bài giảng đã học:</div>
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {studentReport.chiTietBaiGiang?.map((bg: any) => (
                  <div key={bg.MaBaiGiang} className="p-2 rounded-lg bg-slate-950/60 border border-slate-800/80 flex items-center justify-between">
                    <div>
                      <span className="text-slate-200 font-medium">Bài {bg.SoThuTu}: {bg.TenBaiGiang}</span>
                      <span className="text-slate-400 text-[10px] ml-2">({bg.MonHoc})</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-cyan-400">{bg.ThoiGianHocThucTePhut}p / {bg.ThoiLuongChuanPhut}p</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${bg.DaHoanThanh ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-400'}`}>
                        {bg.DaHoanThanh ? 'Đạt' : 'Chưa đạt'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
