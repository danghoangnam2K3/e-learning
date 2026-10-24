import { PaginationFooter } from '../../components/common/PaginationFooter';
import { SortableHeader } from '../../components/common/SortableHeader';
import { useClientPagination } from '../../hooks/useClientPagination';
import { getMediaUrl } from '../../services/api';
import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../../services/api';
import { TeacherAssignmentsData, TeacherStudentItem } from '../../types';
import { StudentDetailModal } from '../../components/StudentDetailModal';
import {
  GraduationCap,
  Search,
  Filter,
  RefreshCw,
  Phone,
  Clock,
  BookOpen,
  Award,
  AlertCircle,
  Eye,
  CheckCircle2,
  Users,
} from 'lucide-react';

export const TeacherStudentsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialClassId = searchParams.get('lopId') || '';

  const [data, setData] = useState<TeacherAssignmentsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [selectedClassId, setSelectedClassId] = useState<string>(initialClassId);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'DONE'>('ALL');

  // Selected student for progress modal
  const [selectedStudent, setSelectedStudent] = useState<{
    id: number;
    name: string;
    classCode?: string;
    courseName?: string;
  } | null>(null);

  const loadAssignments = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.getMyTeacherAssignments();
      setData(res);
    } catch (err: any) {
      console.error('Error loading teacher assignments:', err);
      setError(err.message || 'Không thể tải danh sách học viên phụ trách.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAssignments();
  }, []);

  const students = data?.danhSachHocVienPhuTrach || [];
  const classes = data?.danhSachLopPhuTrach || [];

  const filteredStudents = students.filter((s) => {
    // Filter by class
    if (selectedClassId && String(s.MaLopHoc) !== selectedClassId) {
      return false;
    }

    // Filter by search term
    const term = searchTerm.toLowerCase();
    const matchSearch =
      s.HoVaTen?.toLowerCase().includes(term) ||
      s.SoCCCD?.toLowerCase().includes(term) ||
      s.SoDienThoai?.toLowerCase().includes(term) ||
      s.TenLopHoc?.toLowerCase().includes(term);

    if (!matchSearch) return false;

    // Filter by status
    if (statusFilter === 'ACTIVE' && s.TongThoiGianHocPhut === 0) return false;
    if (statusFilter === 'DONE' && (s.SoBaiDaHoc < 30 || s.TongThoiGianHocPhut < 60)) return false;

    return true;
  });

  const {
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    sortField,
    sortDirection,
    handleSort,
    paginatedData: paginatedStudents,
    totalItems: totalStudentsCount,
  } = useClientPagination({
    data: filteredStudents,
    initialPageSize: 10,
    initialSortField: 'HoVaTen',
    initialSortDirection: 'ASC',
  });

  return (
    <div className="space-y-6">
      {/* 1. Header Banner */}
      <div className="bg-gradient-to-r from-[#0c1322] via-[#162035] to-[#1e293b] rounded-3xl p-6 sm:p-8 text-white relative overflow-hidden shadow-xl border border-slate-700/50">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/20 text-amber-300 font-bold text-xs mb-3 border border-amber-400/30">
            <Award className="w-3.5 h-3.5" />
            <span>Phân Hệ Quản Lý & Giám Sát Học Viên</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-heading font-black tracking-tight mb-2">
            Danh Sách Học Viên Phụ Trách
          </h1>
          <p className="text-sm text-slate-300 leading-relaxed">
            Giám sát thời gian học lý thuyết tích lũy, số bài giảng đã hoàn thành của từng học viên. Nhấp vào học viên để xem chi tiết tiến độ từng bài.
          </p>
        </div>
      </div>

      {/* 2. Controls, Filter Dropdown & Search Bar */}
      <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm theo tên học viên, CCCD, số điện thoại..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-xs focus:outline-none focus:ring-2 focus:ring-amber-400/30 focus:border-amber-400 transition-all font-medium"
          />
        </div>

        {/* Filter by Class */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={selectedClassId}
              onChange={(e) => {
                setSelectedClassId(e.target.value);
                setSearchParams(e.target.value ? { lopId: e.target.value } : {});
              }}
              className="px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-400/30 transition-all cursor-pointer"
            >
              <option value="">-- Tất cả các lớp phụ trách ({classes.length}) --</option>
              {classes.map((c) => (
                <option key={c.MaLopHoc} value={String(c.MaLopHoc)}>
                  {c.TenLopHoc} ({c.SoHocVienPhuTrachTrongLop} HV)
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={loadAssignments}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-bold transition-all disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Làm mới</span>
          </button>
        </div>
      </div>

      {/* 3. Loading & Error States */}
      {loading && (
        <div className="py-20 flex flex-col items-center justify-center space-y-3">
          <div className="w-10 h-10 border-4 border-amber-400/20 border-t-amber-400 rounded-full animate-spin"></div>
          <span className="text-xs font-semibold text-slate-500">Đang đồng bộ danh sách học viên...</span>
        </div>
      )}

      {error && !loading && (
        <div className="p-5 rounded-2xl bg-rose-50 border border-rose-200 flex items-start gap-3.5 text-rose-800">
          <AlertCircle className="w-5 h-5 shrink-0 text-rose-600 mt-0.5" />
          <div className="flex-1">
            <h4 className="text-sm font-bold">Lỗi tải dữ liệu</h4>
            <p className="text-xs mt-1 leading-relaxed">{error}</p>
          </div>
          <button
            onClick={loadAssignments}
            className="px-3 py-1.5 rounded-lg bg-rose-600 text-white font-bold text-xs hover:bg-rose-700 transition-colors"
          >
            Thử lại
          </button>
        </div>
      )}

      {/* 4. Students Table */}
      {!loading && !error && (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-amber-500" />
              <h3 className="text-xs font-heading font-black text-slate-800 uppercase tracking-wider">
                Danh sách học viên ({filteredStudents.length} / {students.length})
              </h3>
            </div>
            <span className="text-[11px] text-slate-400 font-medium">
              Nhấp vào tên hoặc icon mắt để xem chi tiết bài học
            </span>
          </div>

          {totalStudentsCount === 0 ? (
            <div className="p-12 text-center text-xs text-slate-500 space-y-2">
              <GraduationCap className="w-10 h-10 text-slate-300 mx-auto" />
              <p className="font-bold text-slate-700">Không tìm thấy học viên nào phù hợp</p>
              <p className="text-slate-400">Thử thay đổi bộ lọc lớp học hoặc từ khóa tìm kiếm.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-100 text-slate-400 font-bold uppercase text-[10px] tracking-wider">
                    <SortableHeader
                      field="HoVaTen"
                      currentField={sortField}
                      currentDirection={sortDirection}
                      onSort={handleSort}
                    >
                      Học viên
                    </SortableHeader>
                    <SortableHeader
                      field="SoCCCD"
                      currentField={sortField}
                      currentDirection={sortDirection}
                      onSort={handleSort}
                    >
                      Số CCCD
                    </SortableHeader>
                    <th className="py-3.5 px-4">Số điện thoại</th>
                    <SortableHeader
                      field="TenLopHoc"
                      currentField={sortField}
                      currentDirection={sortDirection}
                      onSort={handleSort}
                    >
                      Lớp học
                    </SortableHeader>
                    <SortableHeader
                      field="SoBaiDaHoc"
                      align="center"
                      currentField={sortField}
                      currentDirection={sortDirection}
                      onSort={handleSort}
                    >
                      Số bài đã học
                    </SortableHeader>
                    <SortableHeader
                      field="TongThoiGianHocPhut"
                      align="center"
                      currentField={sortField}
                      currentDirection={sortDirection}
                      onSort={handleSort}
                    >
                      Thời gian tích lũy
                    </SortableHeader>
                    <th className="py-3.5 px-4 text-center">Trạng thái</th>
                    <th className="py-3.5 px-4 text-center">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {paginatedStudents.map((s) => (
                    <tr
                      key={s.MaHocVien}
                      className="hover:bg-amber-50/30 transition-colors group"
                    >
                      {/* Name & Avatar */}
                      <td className="py-3 px-4">
                        <div
                          onClick={() =>
                            setSelectedStudent({
                              id: s.MaHocVien,
                              name: s.HoVaTen,
                              classCode: s.TenLopHoc,
                              courseName: s.TenKhoaHoc,
                            })
                          }
                          className="flex items-center gap-3 cursor-pointer"
                        >
                          {s.AvatarUrl ? (
                            <img
                              src={getMediaUrl(s.AvatarUrl)}
                              alt={s.HoVaTen}
                              className="w-8 h-8 rounded-xl object-cover border border-amber-300 shadow-sm shrink-0 group-hover:scale-105 transition-transform"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-xl bg-amber-400 text-slate-950 font-bold flex items-center justify-center shrink-0 shadow-sm group-hover:scale-105 transition-transform">
                              {s.HoVaTen ? s.HoVaTen.charAt(0).toUpperCase() : 'H'}
                            </div>
                          )}
                          <div>
                            <span className="font-bold text-slate-900 group-hover:text-amber-600 transition-colors block">
                              {s.HoVaTen}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              #{s.MaHocVien} • @{s.TenDangNhap}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* CCCD */}
                      <td className="py-3 px-4 font-mono text-slate-600">
                        {s.SoCCCD || 'Chưa cập nhật'}
                      </td>

                      {/* Phone */}
                      <td className="py-3 px-4">
                        {s.SoDienThoai ? (
                          <a
                            href={`tel:${s.SoDienThoai}`}
                            className="inline-flex items-center gap-1 font-mono text-slate-600 hover:text-amber-600 transition-colors"
                          >
                            <Phone className="w-3 h-3 text-slate-400" />
                            <span>{s.SoDienThoai}</span>
                          </a>
                        ) : (
                          <span className="text-slate-400">---</span>
                        )}
                      </td>

                      {/* Class */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-semibold text-slate-800">{s.TenLopHoc}</span>
                          <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 text-[9px] font-bold">
                            {s.MaHangGPLX}
                          </span>
                        </div>
                      </td>

                      {/* Completed lessons */}
                      <td className="py-3 px-4 text-center">
                        <span className="font-bold text-slate-800 bg-slate-100 px-2.5 py-1 rounded-lg">
                          {s.SoBaiDaHoc || 0} bài
                        </span>
                      </td>

                      {/* Study duration */}
                      <td className="py-3 px-4 text-center">
                        <span className="font-mono text-slate-700 inline-flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-400" />
                          <strong>{s.TongThoiGianHocPhut || 0}</strong> phút
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[11px] font-bold inline-flex items-center gap-1 ${
                            s.TongThoiGianHocPhut > 0
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              s.TongThoiGianHocPhut > 0 ? 'bg-emerald-500' : 'bg-slate-400'
                            }`}
                          ></span>
                          {s.TongThoiGianHocPhut > 0 ? 'Đang học' : 'Chưa học'}
                        </span>
                      </td>

                      {/* Action */}
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() =>
                            setSelectedStudent({
                              id: s.MaHocVien,
                              name: s.HoVaTen,
                              classCode: s.TenLopHoc,
                              courseName: s.TenKhoaHoc,
                            })
                          }
                          title="Xem chi tiết các bài giảng đã học"
                          className="p-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-700 transition-colors cursor-pointer"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination Footer */}
          <PaginationFooter
            currentPage={currentPage}
            pageSize={pageSize}
            totalItems={totalStudentsCount}
            onPageChange={setCurrentPage}
            onPageSizeChange={setPageSize}
            pageSizeOptions={[10, 20, 50, 100, -1]}
            itemName="học viên"
          />
        </div>
      )}

      {/* 5. Student Detail Modal (Inspect detailed lessons & times) */}
      {selectedStudent && (
        <StudentDetailModal
          studentId={selectedStudent.id}
          onClose={() => setSelectedStudent(null)}
        />
      )}
    </div>
  );
};

export default TeacherStudentsPage;
