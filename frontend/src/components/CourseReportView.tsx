import React, { useState, useEffect } from 'react';
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
} from 'lucide-react';

export const CourseReportView: React.FC = () => {
  const [reports, setReports] = useState<ReportOverviewItem[]>([]);
  const [courses, setCourses] = useState<CourseItem[]>([]);
  const [selectedCourseFilter, setSelectedCourseFilter] = useState<number>(0);
  const [loading, setLoading] = useState(false);

  const fetchReports = async (courseId?: number) => {
    setLoading(true);
    try {
      const data = await api.getCoursesOverview(courseId || undefined);
      setReports(data || []);
    } catch (err) {
      console.error('Lỗi khi tải báo cáo khóa học:', err);
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

  return (
    <div className="space-y-6">
      {/* 1. Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-black font-heading tracking-tight text-slate-800 uppercase flex items-center gap-2.5">
            <FileBarChart className="w-6 h-6 text-amber-500" />
            <span>Báo Cáo Chi Tiết Từng Khóa Học</span>
          </h2>
          <p className="text-xs text-slate-500 font-medium">
            Thống kê tiến độ đào tạo, tổng số học viên và tỷ lệ hoàn thành chương trình lý thuyết theo từng khóa
          </p>
        </div>

        <button
          onClick={() => fetchReports(selectedCourseFilter === 0 ? undefined : selectedCourseFilter)}
          className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition-colors cursor-pointer self-start sm:self-auto"
          title="Làm mới báo cáo"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* 2. Filter Bar */}
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
          Tổng số báo cáo: <strong className="text-slate-800">{reports.length}</strong>
        </div>
      </div>

      {/* 3. Reports Table (Akkhor Style) */}
      <div className="akkhor-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3.5 px-4">Tên Khóa Học</th>
                <th className="py-3.5 px-4">Lớp Học</th>
                <th className="py-3.5 px-4">Hạng GPLX</th>
                <th className="py-3.5 px-4 text-center">Tổng Sĩ Số</th>
                <th className="py-3.5 px-4 text-center">Hoàn Thành (Đủ ĐK)</th>
                <th className="py-3.5 px-4 text-center">Tỷ Lệ</th>
                <th className="py-3.5 px-4 text-center">Tiến Độ Trung Bình</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {reports.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400 font-medium">
                    {loading ? 'Đang tải báo cáo tổng quan...' : 'Không có dữ liệu báo cáo nào.'}
                  </td>
                </tr>
              ) : (
                reports.map((item, idx) => {
                  const soHoanThanh = item.SoHocVienDuDieuKienThi ?? item.SoHocVienHoanThanh ?? 0;
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
                          Lớp: {item.MaLopHocCode}
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
                        <div className="w-36 mx-auto space-y-1">
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
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
