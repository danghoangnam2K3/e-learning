import { PaginationFooter } from './common/PaginationFooter';
import { SortableHeader } from './common/SortableHeader';
import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { ClassItem, CourseItem, UserItem } from '../types';
import {
  GraduationCap,
  Plus,
  Users,
  Calendar,
  CheckCircle2,
  AlertCircle,
  X,
  UserCheck,
  Building,
  Search,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  Table,
  Filter,
} from 'lucide-react';
import { useDebounce } from '../hooks/useDebounce';

export const ClassManagement: React.FC = () => {
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [courses, setCourses] = useState<CourseItem[]>([]);
  const [teachers, setTeachers] = useState<UserItem[]>([]);
  const [selectedClass, setSelectedClass] = useState<ClassItem | null>(null);
  const [classStudents, setClassStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [alertMsg, setAlertMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Modals
  const [isAddClassModal, setIsAddClassModal] = useState(false);
  const [isAssignModal, setIsAssignModal] = useState(false);
  const [isStudentsModal, setIsStudentsModal] = useState(false);

  // Search, Filter, Sort, Pagination for Classes
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 350); // Debounce 350ms
  const [filterCourse, setFilterCourse] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [sortBy, setSortBy] = useState<'MaLopHocCode' | 'TenLopHoc' | 'NgayKhaiGiang'>('MaLopHocCode');
  const [sortDir, setSortDir] = useState<'ASC' | 'DESC'>('ASC');
  const [pageSize, setPageSize] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Search, Filter, Pagination for Modal Students
  const [studentSearch, setStudentSearch] = useState('');
  const debouncedStudentSearch = useDebounce(studentSearch, 300); // Debounce 300ms
  const [studentFilterStatus, setStudentFilterStatus] = useState('');
  const [studentPageSize, setStudentPageSize] = useState<number>(10);
  const [studentCurrentPage, setStudentCurrentPage] = useState<number>(1);

  const [classForm, setClassForm] = useState({
    maLopHocCode: '',
    tenLopHoc: '',
    maKhoaHoc: 0,
    maGiaoVienPhuTrach: undefined as number | undefined,
    ngayKhaiGiang: '',
    ngayBeGiang: '',
    trangThai: 'Đang đào tạo',
  });

  const [selectedTeacherId, setSelectedTeacherId] = useState<number>(0);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [classesData, coursesData, teachersData] = await Promise.all([
        api.getClasses(),
        api.getCourses(),
        api.getUsers({ maVaiTro: 'TEACHER', soBanGhiMoiTrang: -1 }),
      ]);
      setClasses(classesData);
      setCourses(coursesData);
      setTeachers(teachersData.danhSach || []);
      if (coursesData.length > 0 && classForm.maKhoaHoc === 0) {
        setClassForm((prev) => ({ ...prev, maKhoaHoc: coursesData[0].MaKhoaHoc }));
      }
    } catch (err: any) {
      showAlert(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const showAlert = (text: string, type: 'success' | 'error') => {
    setAlertMsg({ text, type });
    setTimeout(() => setAlertMsg(null), 4000);
  };

  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createClass(classForm);
      showAlert('Tạo lớp học mới thành công.', 'success');
      setIsAddClassModal(false);
      fetchData();
    } catch (err: any) {
      showAlert(err.message, 'error');
    }
  };

  const handleAssignTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClass || !selectedTeacherId) return;

    const teacherObj = teachers.find((t) => t.MaNguoiDung === selectedTeacherId);
    const prevClasses = [...classes];

    // 1. Optimistic Update (toiuhoatocdo.md - Mục 2.B): Cập nhật giao diện ngay lập tức
    setClasses((current) =>
      current.map((c) =>
        c.MaLopHoc === selectedClass.MaLopHoc
          ? { ...c, MaGiaoVienPhuTrach: selectedTeacherId, TenGiaoVien: teacherObj?.HoVaTen || c.TenGiaoVien }
          : c,
      ),
    );
    showAlert('Phân công giáo viên phụ trách thành công.', 'success');
    setIsAssignModal(false);

    // 2. Chạy ngầm request lưu CSDL
    try {
      await api.assignTeacher(selectedClass.MaLopHoc, selectedTeacherId);
    } catch (err: any) {
      // 3. Hoàn tác nếu lỗi
      setClasses(prevClasses);
      showAlert(err.message || 'Phân công thất bại. Đã khôi phục dữ liệu cũ.', 'error');
    }
  };

  const openStudentsList = async (c: ClassItem) => {
    setSelectedClass(c);
    setStudentSearch('');
    setStudentFilterStatus('');
    setStudentCurrentPage(1);
    try {
      const students = await api.getClassStudents(c.MaLopHoc);
      setClassStudents(students);
      setIsStudentsModal(true);
    } catch (err: any) {
      showAlert(err.message, 'error');
    }
  };

  // Filter & Sort Classes (sử dụng debouncedSearchTerm để tránh re-render liên tục)
  const filteredClasses = classes
    .filter((c) => {
      const matchSearch =
        c.TenLopHoc.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        c.MaLopHocCode.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        (c.TenGiaoVien && c.TenGiaoVien.toLowerCase().includes(debouncedSearchTerm.toLowerCase()));
      const matchCourse = filterCourse ? String(c.MaKhoaHoc) === filterCourse : true;
      const matchStatus = filterStatus ? c.TrangThai === filterStatus : true;
      return matchSearch && matchCourse && matchStatus;
    })
    .sort((a, b) => {
      const valA = String(a[sortBy] || '');
      const valB = String(b[sortBy] || '');
      const cmp = valA.localeCompare(valB);
      return sortDir === 'ASC' ? cmp : -cmp;
    });

  // Pagination for Classes
  const totalClasses = filteredClasses.length;
  const isAllClasses = pageSize === -1;
  const totalClassPages = isAllClasses ? 1 : Math.ceil(totalClasses / pageSize) || 1;
  const displayedClasses = isAllClasses
    ? filteredClasses
    : filteredClasses.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  // Filter & Pagination for Modal Students (sử dụng debouncedStudentSearch)
  const filteredStudents = classStudents.filter((s) => {
    const matchSearch =
      (s.HoVaTen && s.HoVaTen.toLowerCase().includes(debouncedStudentSearch.toLowerCase())) ||
      (s.SoCCCD && s.SoCCCD.includes(debouncedStudentSearch)) ||
      (s.SoDienThoai && s.SoDienThoai.includes(debouncedStudentSearch));
    const matchStatus = studentFilterStatus ? s.TrangThaiHocTap === studentFilterStatus : true;
    return matchSearch && matchStatus;
  });
  const totalStudents = filteredStudents.length;
  const isAllStudents = studentPageSize === -1;
  const totalStudentPages = isAllStudents ? 1 : Math.ceil(totalStudents / studentPageSize) || 1;
  const displayedStudents = isAllStudents
    ? filteredStudents
    : filteredStudents.slice((studentCurrentPage - 1) * studentPageSize, studentCurrentPage * studentPageSize);

  return (
    <div className="space-y-6">
      {alertMsg && (
        <div
          className={`flex items-center gap-2 p-4 rounded-xl text-sm font-medium border ${
            alertMsg.type === 'success'
              ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
              : 'bg-rose-500/10 text-rose-300 border-rose-500/30'
          }`}
        >
          {alertMsg.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          <span>{alertMsg.text}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold font-heading text-white flex items-center gap-2">
            <Building className="w-5 h-5 text-indigo-400" /> Quản lý Lớp Đào tạo & Phân công Giảng dạy
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Tổ chức lớp học, phân công giáo viên phụ trách và theo dõi danh sách học viên theo từng lớp
          </p>
        </div>

        <button
          onClick={() => setIsAddClassModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm transition-all shadow-lg shadow-indigo-600/20 cursor-pointer w-fit"
        >
          <Plus className="w-4 h-4" /> Mở lớp đào tạo
        </button>
      </div>

      {/* Filter, Search, Sort & View Bar */}
      <div className="glass-panel p-4 rounded-2xl border border-slate-800 space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm kiếm mã lớp, tên lớp, giáo viên phụ trách..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800 shrink-0">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer flex items-center gap-1 ${
                viewMode === 'grid' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
              title="Dạng Thẻ"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Dạng Thẻ</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer flex items-center gap-1 ${
                viewMode === 'table' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
              title="Dạng Bảng"
            >
              <Table className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Dạng Bảng</span>
            </button>
          </div>
        </div>

        {/* Filter Dropdowns & Pagination Size */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800/80 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            {/* Filter by Course */}
            <div className="flex items-center gap-1.5 bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-slate-400">Khóa:</span>
              <select
                value={filterCourse}
                onChange={(e) => {
                  setFilterCourse(e.target.value);
                  setCurrentPage(1);
                }}
                className="bg-transparent text-white focus:outline-none cursor-pointer"
              >
                <option value="" className="bg-slate-900">Tất cả khóa</option>
                {courses.map((co) => (
                  <option key={co.MaKhoaHoc} value={co.MaKhoaHoc} className="bg-slate-900">
                    {co.TenKhoaHoc} (Hạng {co.MaHangGPLX})
                  </option>
                ))}
              </select>
            </div>

            {/* Filter by Status */}
            <div className="flex items-center gap-1.5 bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800">
              <span className="text-slate-400">Trạng thái:</span>
              <select
                value={filterStatus}
                onChange={(e) => {
                  setFilterStatus(e.target.value);
                  setCurrentPage(1);
                }}
                className="bg-transparent text-white focus:outline-none cursor-pointer"
              >
                <option value="" className="bg-slate-900">Tất cả trạng thái</option>
                <option value="Đang đào tạo" className="bg-slate-900">Đang đào tạo</option>
                <option value="Đã hoàn thành" className="bg-slate-900">Đã hoàn thành</option>
                <option value="Tạm dừng" className="bg-slate-900">Tạm dừng</option>
              </select>
            </div>

            {/* Sort by */}
            <div className="flex items-center gap-1.5 bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800">
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-slate-400">Sắp xếp:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-transparent text-white focus:outline-none cursor-pointer"
              >
                <option value="MaLopHocCode" className="bg-slate-900">Mã lớp</option>
                <option value="TenLopHoc" className="bg-slate-900">Tên lớp</option>
                <option value="NgayKhaiGiang" className="bg-slate-900">Ngày khai giảng</option>
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

          {/* Page size dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-slate-400">Hiển thị:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="bg-slate-900 border border-slate-700/80 rounded-xl px-2.5 py-1 text-white focus:outline-none cursor-pointer"
            >
              <option value={10}>10 dòng</option>
              <option value={20}>20 dòng</option>
              <option value={50}>50 dòng</option>
              <option value={-1}>Tất cả</option>
            </select>
          </div>
        </div>
      </div>

      {/* Classes Display: Grid or Table */}
      {displayedClasses.length === 0 ? (
        <div className="glass-panel p-12 rounded-2xl border border-slate-800 text-center text-slate-400 text-sm">
          Không tìm thấy lớp học nào khớp với điều kiện tìm kiếm.
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {displayedClasses.map((c) => (
            <div key={c.MaLopHoc} className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4 hover:border-slate-700 transition-all">
              <div className="flex items-start justify-between">
                <span className="px-3 py-1 rounded-lg text-xs font-bold font-mono bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  {c.MaLopHocCode}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  {c.TrangThai}
                </span>
              </div>

              <div>
                <h4 className="font-bold text-white text-base leading-snug">{c.TenLopHoc}</h4>
                <p className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
                  <span>{c.TenKhoaHoc}</span> (Hạng {c.MaHangGPLX})
                </p>
              </div>

              {/* Teacher assignment */}
              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800/80 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-indigo-400" />
                  <div>
                    <div className="text-[10px] text-slate-400 uppercase">Giáo viên phụ trách</div>
                    <div className="font-medium text-slate-200 mt-0.5">{c.TenGiaoVien || 'Chưa phân công'}</div>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setSelectedClass(c);
                    setSelectedTeacherId(c.MaGiaoVienPhuTrach || 0);
                    setIsAssignModal(true);
                  }}
                  className="px-2 py-1 rounded-lg bg-indigo-600/20 text-indigo-300 hover:bg-indigo-600/30 font-medium transition-colors cursor-pointer text-[11px]"
                >
                  {c.TenGiaoVien ? 'Đổi GV' : 'Phân công'}
                </button>
              </div>

              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{new Date(c.NgayKhaiGiang).toLocaleDateString('vi-VN')}</span>
                </div>
                <button
                  onClick={() => openStudentsList(c)}
                  className="flex items-center gap-1.5 text-indigo-400 hover:text-indigo-300 font-medium cursor-pointer"
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>{c.SiSoHocVien} học viên</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900/60 font-semibold text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-4">Mã Lớp</th>
                  <th className="py-3 px-4">Tên Lớp Đào Tạo</th>
                  <th className="py-3 px-4">Hạng Khóa Học</th>
                  <th className="py-3 px-4">Giáo viên phụ trách</th>
                  <th className="py-3 px-4 text-center">Sĩ số</th>
                  <th className="py-3 px-4">Thời gian đào tạo</th>
                  <th className="py-3 px-4 text-center">Trạng thái</th>
                  <th className="py-3 px-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {displayedClasses.map((c) => (
                  <tr key={c.MaLopHoc} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-indigo-400">{c.MaLopHocCode}</td>
                    <td className="py-3 px-4 font-bold text-white text-sm">{c.TenLopHoc}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-lg text-xs font-bold bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                        Hạng {c.MaHangGPLX}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-200">
                      {c.TenGiaoVien || <span className="text-slate-500 italic">Chưa phân công</span>}
                    </td>
                    <td className="py-3 px-4 text-center font-bold text-white">{c.SiSoHocVien}</td>
                    <td className="py-3 px-4 text-slate-400 text-[11px]">
                      {new Date(c.NgayKhaiGiang).toLocaleDateString('vi-VN')} → {new Date(c.NgayBeGiang).toLocaleDateString('vi-VN')}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        {c.TrangThai}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right space-x-2">
                      <button
                        onClick={() => {
                          setSelectedClass(c);
                          setSelectedTeacherId(c.MaGiaoVienPhuTrach || 0);
                          setIsAssignModal(true);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-indigo-600/20 text-indigo-300 hover:bg-indigo-600/30 font-medium transition-colors cursor-pointer text-xs"
                      >
                        Phân công
                      </button>
                      <button
                        onClick={() => openStudentsList(c)}
                        className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium transition-colors cursor-pointer text-xs"
                      >
                        Học viên ({c.SiSoHocVien})
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination Footer for Classes */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
        <div>
          Hiển thị{' '}
          <strong className="text-white">
            {isAllClasses ? totalClasses : Math.min((currentPage - 1) * pageSize + 1, totalClasses)}
          </strong>{' '}
          -{' '}
          <strong className="text-white">
            {isAllClasses ? totalClasses : Math.min(currentPage * pageSize, totalClasses)}
          </strong>{' '}
          trong tổng số <strong className="text-white">{totalClasses}</strong> lớp học
        </div>

        {!isAllClasses && totalClassPages > 1 && (
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg border border-slate-800 bg-slate-900 text-slate-300 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 py-1 font-medium text-slate-300">
              Trang {currentPage} / {totalClassPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalClassPages))}
              disabled={currentPage === totalClassPages}
              className="p-1.5 rounded-lg border border-slate-800 bg-slate-900 text-slate-300 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Modal Add Class */}
      {isAddClassModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="glass-panel w-full max-w-md rounded-2xl border border-slate-700 p-6 shadow-2xl relative">
            <button
              onClick={() => setIsAddClassModal(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-bold font-heading text-white mb-4">Mở Lớp Đào Tạo Mới</h3>
            <form onSubmit={handleCreateClass} className="space-y-4 text-sm">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Mã Lớp Học (Code) *</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: K45-B2-02"
                  value={classForm.maLopHocCode}
                  onChange={(e) => setClassForm({ ...classForm, maLopHocCode: e.target.value.toUpperCase() })}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-indigo-500 uppercase"
                />
              </div>
              <div>
                <label className="block text-slate-300 font-medium mb-1">Tên Lớp Học *</label>
                <input
                  type="text"
                  required
                  placeholder="Lớp Đào tạo B2 - Khóa 45 (Nhóm 02)"
                  value={classForm.tenLopHoc}
                  onChange={(e) => setClassForm({ ...classForm, tenLopHoc: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-slate-300 font-medium mb-1">Hạng Khóa Học *</label>
                <select
                  value={classForm.maKhoaHoc}
                  onChange={(e) => setClassForm({ ...classForm, maKhoaHoc: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
                >
                  {courses.map((co) => (
                    <option key={co.MaKhoaHoc} value={co.MaKhoaHoc}>
                      {co.TenKhoaHoc} (Hạng {co.MaHangGPLX})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-slate-300 font-medium mb-1">Giáo viên phụ trách</label>
                <select
                  value={classForm.maGiaoVienPhuTrach || ''}
                  onChange={(e) => setClassForm({ ...classForm, maGiaoVienPhuTrach: e.target.value ? Number(e.target.value) : undefined })}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
                >
                  <option value="">Chưa phân công</option>
                  {teachers.map((t) => (
                    <option key={t.MaNguoiDung} value={t.MaNguoiDung}>
                      {t.HoVaTen} (@{t.TenDangNhap})
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Ngày khai giảng *</label>
                  <input
                    type="date"
                    required
                    value={classForm.ngayKhaiGiang}
                    onChange={(e) => setClassForm({ ...classForm, ngayKhaiGiang: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Ngày bế giảng *</label>
                  <input
                    type="date"
                    required
                    value={classForm.ngayBeGiang}
                    onChange={(e) => setClassForm({ ...classForm, ngayBeGiang: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
                  />
                </div>
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddClassModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium shadow-lg shadow-indigo-600/30"
                >
                  Mở lớp
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Assign Teacher */}
      {isAssignModal && selectedClass && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="glass-panel w-full max-w-md rounded-2xl border border-slate-700 p-6 shadow-2xl relative">
            <button
              onClick={() => setIsAssignModal(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-bold font-heading text-white mb-2">Phân công Giáo viên</h3>
            <p className="text-xs text-slate-400 mb-4">Lớp: {selectedClass.TenLopHoc} ({selectedClass.MaLopHocCode})</p>
            <form onSubmit={handleAssignTeacher} className="space-y-4 text-sm">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Chọn Giáo viên giảng dạy *</label>
                <select
                  required
                  value={selectedTeacherId}
                  onChange={(e) => setSelectedTeacherId(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
                >
                  <option value="">-- Chọn giáo viên --</option>
                  {teachers.map((t) => (
                    <option key={t.MaNguoiDung} value={t.MaNguoiDung}>
                      {t.HoVaTen} (ĐT: {t.SoDienThoai || 'N/A'})
                    </option>
                  ))}
                </select>
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAssignModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium shadow-lg shadow-indigo-600/30"
                >
                  Xác nhận phân công
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal View Class Students */}
      {isStudentsModal && selectedClass && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="glass-panel w-full max-w-2xl rounded-2xl border border-slate-700 p-6 shadow-2xl relative max-h-[85vh] flex flex-col">
            <button
              onClick={() => setIsStudentsModal(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="mb-4">
              <h3 className="text-lg font-bold font-heading text-white">Danh Sách Học Viên Lớp Học</h3>
              <p className="text-xs text-slate-400 mt-1">{selectedClass.TenLopHoc} ({selectedClass.MaLopHocCode}) - Sĩ số: {classStudents.length} học viên</p>
            </div>

            {/* Modal Search, Filter & Page size */}
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3 text-xs">
              <div className="flex flex-wrap items-center gap-2 flex-1">
                <div className="relative min-w-[160px] flex-1">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Tìm theo họ tên, CCCD, SĐT..."
                    value={studentSearch}
                    onChange={(e) => {
                      setStudentSearch(e.target.value);
                      setStudentCurrentPage(1);
                    }}
                    className="w-full pl-8 pr-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 text-xs"
                  />
                </div>
                <select
                  value={studentFilterStatus}
                  onChange={(e) => {
                    setStudentFilterStatus(e.target.value);
                    setStudentCurrentPage(1);
                  }}
                  className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white text-xs focus:outline-none cursor-pointer"
                >
                  <option value="">Tất cả trạng thái</option>
                  <option value="Đang học">Đang học</option>
                  <option value="Đã hoàn thành">Đã hoàn thành</option>
                  <option value="Đình chỉ">Đình chỉ</option>
                </select>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <span className="text-slate-400">Hiển thị:</span>
                <select
                  value={studentPageSize}
                  onChange={(e) => {
                    setStudentPageSize(Number(e.target.value));
                    setStudentCurrentPage(1);
                  }}
                  className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-white text-xs focus:outline-none cursor-pointer"
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                  <option value={-1}>Tất cả</option>
                </select>
              </div>
            </div>

            <div className="overflow-y-auto flex-1 border border-slate-800 rounded-xl">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-900/80 text-slate-400 uppercase font-semibold">
                    <th className="py-2.5 px-3">Họ và tên</th>
                    <th className="py-2.5 px-3">Số CCCD</th>
                    <th className="py-2.5 px-3">Số điện thoại</th>
                    <th className="py-2.5 px-3 text-center">Trạng thái học</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {displayedStudents.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-6 text-center text-slate-400">Không tìm thấy học viên nào phù hợp.</td>
                    </tr>
                  ) : (
                    displayedStudents.map((s, idx) => (
                      <tr key={idx} className="hover:bg-slate-800/30">
                        <td className="py-2.5 px-3 font-medium text-white">{s.HoVaTen}</td>
                        <td className="py-2.5 px-3 text-slate-300 font-mono">{s.SoCCCD || '—'}</td>
                        <td className="py-2.5 px-3 text-slate-300">{s.SoDienThoai || '—'}</td>
                        <td className="py-2.5 px-3 text-center">
                          <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-400">
                            {s.TrangThaiHocTap}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Modal Pagination Footer */}
            <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
              <div>
                Tổng số: <strong className="text-white">{totalStudents}</strong> học viên
              </div>
              {!isAllStudents && totalStudentPages > 1 && (
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setStudentCurrentPage((p) => Math.max(p - 1, 1))}
                    disabled={studentCurrentPage === 1}
                    className="p-1 rounded border border-slate-700 bg-slate-800 text-slate-300 disabled:opacity-40"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                  <span className="px-2 font-medium text-slate-300">
                    {studentCurrentPage} / {totalStudentPages}
                  </span>
                  <button
                    onClick={() => setStudentCurrentPage((p) => Math.min(p + 1, totalStudentPages))}
                    disabled={studentCurrentPage === totalStudentPages}
                    className="p-1 rounded border border-slate-700 bg-slate-800 text-slate-300 disabled:opacity-40"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
