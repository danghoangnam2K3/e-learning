import { PaginationFooter } from './common/PaginationFooter';
import { SortableHeader } from './common/SortableHeader';
import { useClientPagination } from '../hooks/useClientPagination';
import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { ClassItem, CourseItem, UserItem } from '../types';
import { useDebounce } from '../hooks/useDebounce';
import {
  BookOpen,
  Search,
  RefreshCw,
  Clock,
  Layers,
  ArrowRight,
  Users,
  Calendar,
  FileCode2,
  CheckCircle2,
  Plus,
  Edit2,
  Trash2,
  MoreVertical,
  X,
  AlertTriangle,
  GraduationCap,
  LayoutGrid,
  Table as TableIcon,
  Tag,
  ShieldAlert,
} from 'lucide-react';

interface CourseListProps {
  onNavigateToLessons: (courseId?: number) => void;
  onNavigateToReport1?: () => void;
  onNavigateToStudents?: () => void;
}

export const CourseList: React.FC<CourseListProps> = ({
  onNavigateToLessons,
  onNavigateToReport1,
  onNavigateToStudents,
}) => {
  const [courses, setCourses] = useState<ClassItem[]>([]);
  const [templates, setTemplates] = useState<CourseItem[]>([]);
  const [teachers, setTeachers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const debouncedSearch = useDebounce(searchTerm, 300);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  // Delete Confirm Modal
  const [deleteModalCourse, setDeleteModalCourse] = useState<ClassItem | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    maLopHocCode: '',
    tenLopHoc: '',
    maKhoaHoc: 0,
    maGiaoVienPhuTrach: undefined as number | undefined,
    ngayKhaiGiang: '',
    ngayBeGiang: '',
    trangThai: 'Đang đào tạo',
  });

  // Tải danh sách khóa học thực tế, khung mẫu bài giảng và giáo viên
  const fetchData = async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const [classesRes, templatesRes, teachersRes] = await Promise.all([
        api.getClasses(true),
        api.getCourses(true).catch(() => []),
        api.getUsers({ maVaiTro: 'TEACHER', soBanGhiMoiTrang: 100 }).catch(() => ({ danhSach: [] })),
      ]);

      setCourses(classesRes || []);
      setTemplates(templatesRes || []);
      setTeachers(teachersRes?.danhSach || []);
    } catch (err: any) {
      console.error('Lỗi khi tải dữ liệu khóa học:', err);
      setErrorMessage(err.message || 'Không thể tải dữ liệu khóa học.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Mở modal thêm mới
  const handleOpenCreateModal = () => {
    setIsEditMode(false);
    setEditingId(null);
    const today = new Date().toISOString().split('T')[0];
    const threeMonthsLater = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    // Tự sinh mã khóa học gợi ý
    const randomCode = `K${new Date().getFullYear().toString().slice(-2)}-B2-${Math.floor(100 + Math.random() * 900)}`;

    setFormData({
      maLopHocCode: randomCode,
      tenLopHoc: '',
      maKhoaHoc: templates.length > 0 ? templates[0].MaKhoaHoc : 0,
      maGiaoVienPhuTrach: undefined,
      ngayKhaiGiang: today,
      ngayBeGiang: threeMonthsLater,
      trangThai: 'Đang đào tạo',
    });
    setErrorMessage(null);
    setIsModalOpen(true);
  };

  // Mở modal chỉnh sửa
  const handleOpenEditModal = (c: ClassItem) => {
    setIsEditMode(true);
    setEditingId(c.MaLopHoc);

    // Format ngày yyyy-MM-dd
    const formatDate = (dStr?: string) => {
      if (!dStr) return '';
      try {
        return new Date(dStr).toISOString().split('T')[0];
      } catch {
        return '';
      }
    };

    setFormData({
      maLopHocCode: c.MaLopHocCode,
      tenLopHoc: c.TenLopHoc,
      maKhoaHoc: c.MaKhoaHoc,
      maGiaoVienPhuTrach: c.MaGiaoVienPhuTrach,
      ngayKhaiGiang: formatDate(c.NgayKhaiGiang),
      ngayBeGiang: formatDate(c.NgayBeGiang),
      trangThai: c.TrangThai || 'Đang đào tạo',
    });
    setErrorMessage(null);
    setIsModalOpen(true);
  };

  // Submit Form Lưu / Cập nhật
  const handleSubmitCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.tenLopHoc.trim()) {
      alert('Vui lòng nhập tên khóa học.');
      return;
    }
    if (!formData.maKhoaHoc) {
      alert('Vui lòng chọn khung bài giảng mẫu.');
      return;
    }
    if (!formData.ngayKhaiGiang || !formData.ngayBeGiang) {
      alert('Vui lòng chọn ngày khai giảng và ngày bế giảng.');
      return;
    }

    setSubmitting(true);
    setErrorMessage(null);

    try {
      if (isEditMode && editingId) {
        // Cập nhật
        await api.updateClass(editingId, {
          tenLopHoc: formData.tenLopHoc,
          maKhoaHoc: formData.maKhoaHoc,
          maGiaoVienPhuTrach: formData.maGiaoVienPhuTrach || undefined,
          ngayKhaiGiang: formData.ngayKhaiGiang,
          ngayBeGiang: formData.ngayBeGiang,
          trangThai: formData.trangThai,
          maLopHocCode: formData.maLopHocCode,
        });
      } else {
        // Thêm mới
        await api.createClass({
          maLopHocCode: formData.maLopHocCode,
          tenLopHoc: formData.tenLopHoc,
          maKhoaHoc: formData.maKhoaHoc,
          maGiaoVienPhuTrach: formData.maGiaoVienPhuTrach || undefined,
          ngayKhaiGiang: formData.ngayKhaiGiang,
          ngayBeGiang: formData.ngayBeGiang,
          trangThai: formData.trangThai,
        });
      }

      setIsModalOpen(false);
      await fetchData();
    } catch (err: any) {
      setErrorMessage(err.message || 'Lỗi khi lưu thông tin khóa học.');
    } finally {
      setSubmitting(false);
    }
  };

  // Xác nhận xóa khóa học
  const handleConfirmDelete = async () => {
    if (!deleteModalCourse) return;
    setSubmitting(true);
    try {
      await api.deleteClass(deleteModalCourse.MaLopHoc);
      setDeleteModalCourse(null);
      await fetchData();
    } catch (err: any) {
      alert('Lỗi khi xóa khóa học: ' + (err.message || 'Có lỗi xảy ra'));
    } finally {
      setSubmitting(false);
    }
  };

  // Lọc dữ liệu theo từ khóa tìm kiếm và trạng thái
  const filteredCourses = courses.filter((c) => {
    const term = debouncedSearch.toLowerCase();
    const matchesSearch =
      c.TenLopHoc.toLowerCase().includes(term) ||
      c.MaLopHocCode.toLowerCase().includes(term) ||
      (c.MaHangGPLX && c.MaHangGPLX.toLowerCase().includes(term)) ||
      (c.TenKhoaHoc && c.TenKhoaHoc.toLowerCase().includes(term));

    if (!matchesSearch) return false;
    if (statusFilter === 'ALL') return true;
    return c.TrangThai === statusFilter;
  });

  // Áp dụng hook phân trang và sắp xếp client-side theo chuẩn skill/phan_trang.md
  const {
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    sortField,
    sortDirection,
    handleSort,
    paginatedData: paginatedCourses,
    totalItems: totalCoursesCount,
  } = useClientPagination({
    data: filteredCourses,
    initialPageSize: 10,
    initialSortField: 'MaLopHocCode',
    initialSortDirection: 'ASC',
  });

  return (
    <div className="space-y-6">
      {/* 1. Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-black font-heading tracking-tight text-slate-800 uppercase flex items-center gap-2.5">
            <BookOpen className="w-6 h-6 text-amber-500" />
            <span>Danh Sách Toàn Bộ Khóa Học</span>
          </h2>
          <p className="text-xs text-slate-500 font-medium">
            Quản trị viên có toàn quyền thêm, sửa thông tin, xóa và nạp khóa học từ Báo cáo 1
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={fetchData}
            className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition-colors cursor-pointer shadow-xs"
            title="Làm mới dữ liệu"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          {/* Nút Thêm Khóa Học Mới Thủ Công */}
          <button
            onClick={handleOpenCreateModal}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#042954] hover:bg-[#031e3e] text-amber-400 font-bold text-xs shadow-md transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ Thêm khóa học</span>
          </button>

          {/* Nút Nạp Khóa Học Từ Báo Cáo 1 (.XML) */}
          {onNavigateToReport1 && (
            <button
              onClick={onNavigateToReport1}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-500 text-slate-950 font-bold text-xs shadow-md shadow-amber-400/20 transition-all cursor-pointer"
            >
              <FileCode2 className="w-4 h-4" />
              <span>+ Nạp từ Báo cáo 1 (.XML)</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Banner giải thích nghiệp vụ & quy tắc liên kết */}
      <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200/80 flex items-start gap-3 text-xs text-amber-950 shadow-xs">
        <div className="w-8 h-8 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-black shrink-0 mt-0.5">
          💡
        </div>
        <div>
          <strong className="font-bold">Quy tắc liên kết giữa Khóa học và Bài giảng:</strong>
          <p className="text-[11px] text-amber-900/80 mt-0.5 leading-relaxed">
            - <strong>Khóa học thực tế</strong>: Là khóa đào tạo đang vận hành với danh sách học viên thật (ví dụ: <em>B số sàn KHÓA 01/2026, Khóa 45 Nhóm 01...</em>). Bạn có thể thêm thủ công hoặc tự động nạp từ Báo cáo 1.
            <br />
            - <strong>Khung bài giảng mẫu</strong>: Là mẫu chương trình học lý thuyết chuẩn (<em>B số sàn, B số tự động, C1</em>) gồm 8 chương, 30-32 bài giảng và tổng số giờ yêu cầu. Khi tạo khóa học, bạn chỉ cần liên kết với khung bài giảng mẫu tương ứng.
          </p>
        </div>
      </div>

      {/* 3. Search & Filter Bar */}
      <div className="akkhor-card p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex-1 flex flex-col sm:flex-row gap-3">
          {/* Ô Tìm Kiếm */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm theo tên khóa học (B số sàn khóa 1...), mã khóa hoặc hạng GPLX..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-amber-400 focus:bg-white transition-all font-medium"
            />
          </div>

          {/* Bộ lọc trạng thái */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:border-amber-400"
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="Đang đào tạo">Đang đào tạo</option>
            <option value="Sắp khai giảng">Sắp khai giảng</option>
            <option value="Đã hoàn thành">Đã hoàn thành</option>
          </select>
        </div>

        {/* Chuyển đổi View Grid / Table & Thống kê */}
        <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
          <span className="text-xs text-slate-500 font-semibold">
            Tổng cộng: <strong className="text-slate-800">{filteredCourses.length}</strong> khóa học
          </span>

          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'grid' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
              }`}
              title="Xem dạng thẻ lưới"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'table' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
              }`}
              title="Xem dạng bảng chi tiết"
            >
              <TableIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 4. CHẾ ĐỘ HIỂN THỊ DẠNG THẺ LƯỚI (GRID CARDS) */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {totalCoursesCount === 0 ? (
            <div className="col-span-full py-16 text-center text-slate-400 font-medium akkhor-card space-y-3">
              <p>{loading ? 'Đang tải danh sách khóa học thực tế...' : 'Không tìm thấy khóa học nào phù hợp.'}</p>
              <button
                onClick={handleOpenCreateModal}
                className="inline-flex items-center gap-2 px-4 py-2 bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-sm hover:bg-amber-500 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Thêm Khóa Học Mới Ngay</span>
              </button>
            </div>
          ) : (
            paginatedCourses.map((c) => (
              <div
                key={c.MaLopHoc}
                className="akkhor-card p-5 flex flex-col justify-between space-y-4 hover:border-amber-400/60 group transition-all relative"
              >
                <div className="space-y-3">
                  {/* Badge & Quick Action Menu */}
                  <div className="flex items-center justify-between">
                    <span className="px-3 py-1 rounded-full text-xs font-black bg-amber-100 text-amber-800 uppercase tracking-wider">
                      Hạng {c.MaHangGPLX || 'B2'}
                    </span>

                    <div className="flex items-center gap-1.5">
                      <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                        {c.TrangThai || 'Đang đào tạo'}
                      </span>

                      {/* Nút Sửa */}
                      <button
                        onClick={() => handleOpenEditModal(c)}
                        title="Chỉnh sửa khóa học"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition-colors cursor-pointer"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>

                      {/* Nút Xóa */}
                      <button
                        onClick={() => setDeleteModalCourse(c)}
                        title="Xóa khóa học"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Title & Code */}
                  <div>
                    <h3 className="font-heading font-bold text-base text-slate-800 group-hover:text-amber-600 transition-colors">
                      {c.TenLopHoc}
                    </h3>
                    <div className="text-[11px] text-slate-400 font-mono mt-0.5 flex items-center gap-2">
                      <span>Mã: {c.MaLopHocCode}</span>
                      {c.TenGiaoVien && (
                        <span className="text-indigo-600 font-semibold">• GV: {c.TenGiaoVien}</span>
                      )}
                    </div>
                  </div>

                  {/* Thông tin Khung bài giảng áp dụng & Sĩ số */}
                  <div className="p-3 bg-slate-50 rounded-xl space-y-1.5 border border-slate-100 text-xs">
                    <div className="flex items-center justify-between text-slate-600">
                      <span className="text-[11px] text-slate-400">Khung bài giảng mẫu:</span>
                      <strong className="text-slate-800 font-bold">
                        {c.TenKhoaHoc || `Hạng ${c.MaHangGPLX || 'B2'}`}
                      </strong>
                    </div>
                    <div className="flex items-center justify-between text-slate-600">
                      <span className="text-[11px] text-slate-400">Sĩ số học viên:</span>
                      <strong className="text-blue-700 font-bold">{c.SiSoHocVien || 0} học viên</strong>
                    </div>
                  </div>

                  {/* Thời gian đào tạo */}
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>
                      {c.NgayKhaiGiang ? new Date(c.NgayKhaiGiang).toLocaleDateString('vi-VN') : '---'}
                      {' → '}
                      {c.NgayBeGiang ? new Date(c.NgayBeGiang).toLocaleDateString('vi-VN') : '---'}
                    </span>
                  </div>
                </div>

                {/* Bottom Action buttons */}
                <div className="pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs">
                  {onNavigateToStudents && (
                    <button
                      onClick={onNavigateToStudents}
                      className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition-colors cursor-pointer"
                    >
                      <Users className="w-3.5 h-3.5" />
                      <span>Học viên ({c.SiSoHocVien || 0})</span>
                    </button>
                  )}

                  <button
                    onClick={() => onNavigateToLessons(c.MaKhoaHoc)}
                    className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-amber-400 hover:bg-amber-500 text-slate-950 font-bold transition-colors cursor-pointer"
                  >
                    <Layers className="w-3.5 h-3.5" />
                    <span>Khung bài giảng</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* 5. CHẾ ĐỘ HIỂN THỊ DẠNG BẢNG (TABLE VIEW) */}
      {viewMode === 'table' && (
        <div className="akkhor-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                  <SortableHeader
                    field="MaLopHocCode"
                    currentField={sortField}
                    currentDirection={sortDirection}
                    onSort={handleSort}
                  >
                    Mã Khóa
                  </SortableHeader>
                  <SortableHeader
                    field="TenLopHoc"
                    currentField={sortField}
                    currentDirection={sortDirection}
                    onSort={handleSort}
                  >
                    Tên Khóa Học
                  </SortableHeader>
                  <SortableHeader
                    field="MaHangGPLX"
                    currentField={sortField}
                    currentDirection={sortDirection}
                    onSort={handleSort}
                  >
                    Hạng GPLX
                  </SortableHeader>
                  <th className="py-3 px-4">Khung Bài Giảng Mẫu</th>
                  <SortableHeader
                    field="SiSoHocVien"
                    align="center"
                    currentField={sortField}
                    currentDirection={sortDirection}
                    onSort={handleSort}
                  >
                    Sĩ Số
                  </SortableHeader>
                  <SortableHeader
                    field="NgayKhaiGiang"
                    currentField={sortField}
                    currentDirection={sortDirection}
                    onSort={handleSort}
                  >
                    Thời Gian Đào Tạo
                  </SortableHeader>
                  <SortableHeader
                    field="TrangThai"
                    currentField={sortField}
                    currentDirection={sortDirection}
                    onSort={handleSort}
                  >
                    Trạng Thái
                  </SortableHeader>
                  <th className="py-3 px-4 text-right">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {totalCoursesCount === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400 font-medium">
                      Không tìm thấy khóa học nào phù hợp.
                    </td>
                  </tr>
                ) : (
                  paginatedCourses.map((c) => (
                    <tr key={c.MaLopHoc} className="hover:bg-slate-50/80 transition-colors group">
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-700">{c.MaLopHocCode}</td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-800 text-sm group-hover:text-amber-600 transition-colors">
                          {c.TenLopHoc}
                        </div>
                        {c.TenGiaoVien && (
                          <div className="text-[11px] text-slate-400">GV: {c.TenGiaoVien}</div>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-amber-100 text-amber-800 uppercase">
                          {c.MaHangGPLX || 'B2'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-medium text-slate-700">
                        {c.TenKhoaHoc || `Hạng ${c.MaHangGPLX}`}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="px-2 py-1 rounded-lg bg-blue-50 text-blue-700 font-bold font-mono">
                          {c.SiSoHocVien || 0}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 text-[11px]">
                        {c.NgayKhaiGiang ? new Date(c.NgayKhaiGiang).toLocaleDateString('vi-VN') : '---'}
                        {' → '}
                        {c.NgayBeGiang ? new Date(c.NgayBeGiang).toLocaleDateString('vi-VN') : '---'}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                          {c.TrangThai || 'Đang đào tạo'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => onNavigateToLessons(c.MaKhoaHoc)}
                            title="Xem khung bài giảng mẫu"
                            className="p-1.5 rounded-lg text-slate-500 hover:text-amber-700 hover:bg-amber-100 transition-colors cursor-pointer"
                          >
                            <Layers className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleOpenEditModal(c)}
                            title="Chỉnh sửa khóa học"
                            className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteModalCourse(c)}
                            title="Xóa khóa học"
                            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 6. Phân trang chuyên nghiệp theo skill/phan_trang.md */}
      <div className="akkhor-card overflow-hidden rounded-2xl">
        <PaginationFooter
          currentPage={currentPage}
          pageSize={pageSize}
          totalItems={totalCoursesCount}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
          pageSizeOptions={[10, 20, 50, 100, -1]}
          itemName="khóa học"
        />
      </div>

      {/* ========================================================================= */}
      {/* 6. MODAL THÊM MỚI / CHỈNH SỬA KHÓA HỌC */}
      {/* ========================================================================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-[#042954] text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-400 text-slate-950 flex items-center justify-center font-bold">
                  {isEditMode ? <Edit2 className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                </div>
                <div>
                  <h3 className="font-heading font-black text-sm uppercase tracking-tight">
                    {isEditMode ? 'Chỉnh Sửa Thông Tin Khóa Học' : 'Thêm Khóa Học Đào Tạo Mới'}
                  </h3>
                  <span className="text-[10px] text-amber-400 font-medium">
                    {isEditMode ? 'Cập nhật chỉ tiêu đào tạo & thời gian' : 'Tạo khóa học thực tế và gán khung bài giảng'}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body / Form */}
            <form onSubmit={handleSubmitCourse} className="p-6 space-y-4 text-xs">
              {errorMessage && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 font-semibold flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Tên Khóa Học */}
              <div>
                <label className="block font-bold text-slate-700 mb-1 uppercase tracking-wider">
                  Tên khóa học đào tạo <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: B số sàn KHÓA 02/2026 hoặc Lớp B2 Khóa 46"
                  value={formData.tenLopHoc}
                  onChange={(e) => setFormData({ ...formData, tenLopHoc: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-semibold focus:outline-none focus:border-amber-400 focus:bg-white transition-colors"
                />
              </div>

              {/* Mã Khóa & Khung Bài Giảng Mẫu */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1 uppercase tracking-wider">
                    Mã khóa / Số hiệu <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="K26-B2-02"
                    value={formData.maLopHocCode}
                    onChange={(e) => setFormData({ ...formData, maLopHocCode: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-800 uppercase focus:outline-none focus:border-amber-400 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1 uppercase tracking-wider">
                    Khung bài giảng mẫu <span className="text-rose-500">*</span>
                  </label>
                  <select
                    required
                    value={formData.maKhoaHoc}
                    onChange={(e) => setFormData({ ...formData, maKhoaHoc: parseInt(e.target.value, 10) })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-semibold focus:outline-none focus:border-amber-400 focus:bg-white"
                  >
                    <option value={0}>-- Chọn khung bài giảng --</option>
                    {templates.map((t) => (
                      <option key={t.MaKhoaHoc} value={t.MaKhoaHoc}>
                        {t.TenKhoaHoc} ({t.TongSoBaiGiang || 0} bài giảng, {t.TongSoGioLyThuyet || 0}h)
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Giáo viên phụ trách & Trạng thái */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1 uppercase tracking-wider">
                    Giáo viên phụ trách
                  </label>
                  <select
                    value={formData.maGiaoVienPhuTrach || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        maGiaoVienPhuTrach: e.target.value ? parseInt(e.target.value, 10) : undefined,
                      })
                    }
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-amber-400 focus:bg-white"
                  >
                    <option value="">-- Chưa phân công --</option>
                    {teachers.map((gv) => (
                      <option key={gv.MaNguoiDung} value={gv.MaNguoiDung}>
                        {gv.HoVaTen} ({gv.TenDangNhap})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1 uppercase tracking-wider">
                    Trạng thái đào tạo
                  </label>
                  <select
                    value={formData.trangThai}
                    onChange={(e) => setFormData({ ...formData, trangThai: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-semibold focus:outline-none focus:border-amber-400 focus:bg-white"
                  >
                    <option value="Đang đào tạo">Đang đào tạo</option>
                    <option value="Sắp khai giảng">Sắp khai giảng</option>
                    <option value="Đã hoàn thành">Đã hoàn thành</option>
                  </select>
                </div>
              </div>

              {/* Ngày khai giảng & Ngày bế giảng */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1 uppercase tracking-wider">
                    Ngày khai giảng <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.ngayKhaiGiang}
                    onChange={(e) => setFormData({ ...formData, ngayKhaiGiang: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-amber-400 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1 uppercase tracking-wider">
                    Ngày bế giảng <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.ngayBeGiang}
                    onChange={(e) => setFormData({ ...formData, ngayBeGiang: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-amber-400 focus:bg-white"
                  />
                </div>
              </div>

              {/* Actions Footer */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold transition-colors cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-xl bg-[#042954] hover:bg-[#031e3e] text-amber-400 font-bold transition-colors cursor-pointer shadow-md disabled:opacity-50"
                >
                  {submitting ? 'Đang lưu...' : isEditMode ? 'Lưu cập nhật' : 'Tạo khóa học'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 7. MODAL XÁC NHẬN XÓA KHÓA HỌC */}
      {/* ========================================================================= */}
      {deleteModalCourse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4 border border-rose-200">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <h4 className="font-heading font-black text-sm text-slate-800 uppercase">
                  Xác Nhận Xóa Khóa Học
                </h4>
                <p className="text-[11px] text-slate-500 font-medium">Hành động này sẽ ẩn khóa học khỏi hệ thống</p>
              </div>
            </div>

            <div className="p-3.5 bg-rose-50/60 border border-rose-100 rounded-xl text-xs space-y-1.5 text-slate-700">
              <div>
                Tên khóa: <strong className="text-rose-700">{deleteModalCourse.TenLopHoc}</strong>
              </div>
              <div>
                Mã khóa: <span className="font-mono font-bold">{deleteModalCourse.MaLopHocCode}</span>
              </div>
              <div>
                Sĩ số hiện tại: <strong className="text-blue-700">{deleteModalCourse.SiSoHocVien || 0} học viên</strong>
              </div>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              Bạn có chắc chắn muốn xóa khóa học này không? Danh sách học viên và dữ liệu tiến độ sẽ được lưu trữ an toàn trong lịch sử hệ thống.
            </p>

            <div className="pt-2 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setDeleteModalCourse(null)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={handleConfirmDelete}
                className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md shadow-rose-600/20 transition-all cursor-pointer disabled:opacity-50"
              >
                {submitting ? 'Đang xóa...' : 'Đồng ý xóa'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CourseList;
