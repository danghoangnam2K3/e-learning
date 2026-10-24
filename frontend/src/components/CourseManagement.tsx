import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { CourseItem, LessonItem } from '../types';
import {
  BookOpen,
  Plus,
  BookMarked,
  Video,
  Clock,
  CheckCircle2,
  AlertCircle,
  X,
  ChevronRight,
  Search,
  Filter,
  ArrowUpDown,
  ChevronLeft,
} from 'lucide-react';
import { useDebounce } from '../hooks/useDebounce';

export const CourseManagement: React.FC = () => {
  const [courses, setCourses] = useState<CourseItem[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<CourseItem | null>(null);
  const [lessons, setLessons] = useState<LessonItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [alertMsg, setAlertMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Search & Filter for Courses (Debounced 350ms)
  const [courseSearch, setCourseSearch] = useState('');
  const debouncedCourseSearch = useDebounce(courseSearch, 350);

  // Search, Filter, Sort & Pagination for Lessons (Debounced 300ms)
  const [lessonSearch, setLessonSearch] = useState('');
  const debouncedLessonSearch = useDebounce(lessonSearch, 300);
  const [lessonSubjectFilter, setLessonSubjectFilter] = useState('');
  const [lessonSortBy, setLessonSortBy] = useState<'SoThuTu' | 'TenBaiGiang' | 'ThoiLuongPhut'>('SoThuTu');
  const [lessonSortDir, setLessonSortDir] = useState<'ASC' | 'DESC'>('ASC');
  const [lessonPageSize, setLessonPageSize] = useState<number>(10);
  const [lessonCurrentPage, setLessonCurrentPage] = useState<number>(1);

  // Modals
  const [isAddCourseModal, setIsAddCourseModal] = useState(false);
  const [isAddLessonModal, setIsAddLessonModal] = useState(false);

  const [courseForm, setCourseForm] = useState({
    maHangGPLX: '',
    tenKhoaHoc: '',
    moTa: '',
    tongSoGioLyThuyet: 100,
  });

  const [lessonForm, setLessonForm] = useState({
    tenBaiGiang: '',
    monHoc: 'Pháp luật giao thông đường bộ',
    soThuTu: 1,
    duongDanVideo: '',
    thoiLuongPhut: 45,
  });

  const fetchCourses = async () => {
    setLoading(true);
    try {
      const data = await api.getCourses();
      setCourses(data);
      if (data.length > 0 && !selectedCourse) {
        setSelectedCourse(data[0]);
      }
    } catch (err: any) {
      showAlert(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchLessons = async (courseId: number) => {
    try {
      const data = await api.getLessons(courseId);
      setLessons(data);
    } catch (err: any) {
      showAlert(err.message, 'error');
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  useEffect(() => {
    if (selectedCourse) {
      fetchLessons(selectedCourse.MaKhoaHoc);
    }
  }, [selectedCourse]);

  const showAlert = (text: string, type: 'success' | 'error') => {
    setAlertMsg({ text, type });
    setTimeout(() => setAlertMsg(null), 4000);
  };

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createCourse(courseForm);
      showAlert('Thêm mới hạng khóa học thành công.', 'success');
      setIsAddCourseModal(false);
      setCourseForm({ maHangGPLX: '', tenKhoaHoc: '', moTa: '', tongSoGioLyThuyet: 100 });
      fetchCourses();
    } catch (err: any) {
      showAlert(err.message, 'error');
    }
  };

  const handleCreateLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourse) return;
    try {
      await api.createLesson({
        maKhoaHoc: selectedCourse.MaKhoaHoc,
        ...lessonForm,
      });
      showAlert('Thêm bài giảng thành công.', 'success');
      setIsAddLessonModal(false);
      setLessonForm({
        tenBaiGiang: '',
        monHoc: 'Pháp luật giao thông đường bộ',
        soThuTu: lessons.length + 1,
        duongDanVideo: '',
        thoiLuongPhut: 45,
      });
      fetchLessons(selectedCourse.MaKhoaHoc);
      fetchCourses();
    } catch (err: any) {
      showAlert(err.message, 'error');
    }
  };

  // Filter Courses (sử dụng debouncedCourseSearch)
  const filteredCourses = courses.filter(
    (c) =>
      c.TenKhoaHoc.toLowerCase().includes(debouncedCourseSearch.toLowerCase()) ||
      c.MaHangGPLX.toLowerCase().includes(debouncedCourseSearch.toLowerCase()),
  );

  // Filter & Sort Lessons (sử dụng debouncedLessonSearch)
  const filteredLessons = lessons
    .filter((l) => {
      const matchSearch =
        l.TenBaiGiang.toLowerCase().includes(debouncedLessonSearch.toLowerCase()) ||
        l.MonHoc.toLowerCase().includes(debouncedLessonSearch.toLowerCase());
      const matchSubject = lessonSubjectFilter ? l.MonHoc === lessonSubjectFilter : true;
      return matchSearch && matchSubject;
    })
    .sort((a, b) => {
      const valA = a[lessonSortBy];
      const valB = b[lessonSortBy];
      if (typeof valA === 'string' || typeof valB === 'string') {
        const cmp = String(valA).localeCompare(String(valB));
        return lessonSortDir === 'ASC' ? cmp : -cmp;
      }
      return lessonSortDir === 'ASC' ? Number(valA) - Number(valB) : Number(valB) - Number(valA);
    });

  const totalLessons = filteredLessons.length;
  const isAllLessons = lessonPageSize === -1;
  const totalLessonPages = isAllLessons ? 1 : Math.ceil(totalLessons / lessonPageSize) || 1;
  const displayedLessons = isAllLessons
    ? filteredLessons
    : filteredLessons.slice((lessonCurrentPage - 1) * lessonPageSize, lessonCurrentPage * lessonPageSize);

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
            <BookOpen className="w-5 h-5 text-indigo-400" /> Quản lý Khóa Đào tạo & Bài giảng Mẫu
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Định nghĩa khung đào tạo GPLX chuẩn (B1, B2, C...) và giáo trình bài giảng lý thuyết
          </p>
        </div>

        <button
          onClick={() => setIsAddCourseModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm transition-all shadow-lg shadow-indigo-600/20 cursor-pointer w-fit"
        >
          <Plus className="w-4 h-4" /> Thêm khóa học
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Courses list */}
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">
              Danh mục Hạng GPLX
            </h3>
            <span className="text-xs text-slate-400 font-medium">({filteredCourses.length} khóa)</span>
          </div>

          {/* Search Courses */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm theo hạng GPLX hoặc tên..."
              value={courseSearch}
              onChange={(e) => setCourseSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-slate-900 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="space-y-2">
            {filteredCourses.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-400">Không tìm thấy khóa đào tạo nào.</div>
            ) : (
              filteredCourses.map((c) => {
                const isSelected = selectedCourse?.MaKhoaHoc === c.MaKhoaHoc;
                return (
                  <div
                    key={c.MaKhoaHoc}
                    onClick={() => {
                      setSelectedCourse(c);
                      setLessonCurrentPage(1);
                    }}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-indigo-600/15 border-indigo-500/50 shadow-lg shadow-indigo-500/10'
                        : 'glass-panel border-slate-800/80 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <span className="px-2.5 py-0.5 rounded-lg text-xs font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                        Hạng {c.MaHangGPLX}
                      </span>
                      <span className="text-xs text-slate-400 flex items-center gap-1">
                        <BookMarked className="w-3.5 h-3.5" /> {c.TongSoBaiGiang} bài giảng
                      </span>
                    </div>
                    <h4 className="font-semibold text-white mt-2.5 text-sm">{c.TenKhoaHoc}</h4>
                    <p className="text-xs text-slate-400 mt-1 line-clamp-2">{c.MoTa || 'Không có mô tả.'}</p>
                    <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                      <span>Quy định: <strong className="text-slate-200">{c.TongSoGioLyThuyet}h</strong></span>
                      <ChevronRight className={`w-4 h-4 transition-transform ${isSelected ? 'translate-x-1 text-indigo-400' : ''}`} />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right: Lessons of selected course */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">
              Khung bài giảng: <span className="text-indigo-400 normal-case">{selectedCourse?.TenKhoaHoc}</span>
            </h3>
            {selectedCourse && (
              <button
                onClick={() => {
                  setLessonForm((prev) => ({ ...prev, soThuTu: lessons.length + 1 }));
                  setIsAddLessonModal(true);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 border border-slate-700 transition-colors cursor-pointer w-fit"
              >
                <Plus className="w-3.5 h-3.5" /> Thêm bài giảng
              </button>
            )}
          </div>

          {/* Lessons Filter Bar */}
          <div className="glass-panel p-3 rounded-2xl border border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex flex-wrap items-center gap-2 flex-1">
              <div className="relative min-w-[180px] flex-1">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Tìm tên bài giảng, môn học..."
                  value={lessonSearch}
                  onChange={(e) => {
                    setLessonSearch(e.target.value);
                    setLessonCurrentPage(1);
                  }}
                  className="w-full pl-8 pr-3 py-1.5 bg-slate-900 border border-slate-700/80 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 text-xs"
                />
              </div>

              <select
                value={lessonSubjectFilter}
                onChange={(e) => {
                  setLessonSubjectFilter(e.target.value);
                  setLessonCurrentPage(1);
                }}
                className="bg-slate-900 border border-slate-700/80 rounded-xl px-2.5 py-1.5 text-white text-xs focus:outline-none cursor-pointer"
              >
                <option value="">Tất cả môn học</option>
                <option value="Pháp luật giao thông đường bộ">Pháp luật giao thông</option>
                <option value="Cấu tạo và sửa chữa thông thường">Cấu tạo & sửa chữa</option>
                <option value="Nghiệp vụ vận tải">Nghiệp vụ vận tải</option>
                <option value="Đạo đức người lái xe">Đạo đức lái xe</option>
                <option value="Kỹ thuật lái xe">Kỹ thuật lái xe</option>
              </select>

              <div className="flex items-center gap-1 bg-slate-900 px-2.5 py-1.5 rounded-xl border border-slate-800">
                <ArrowUpDown className="w-3 h-3 text-slate-400" />
                <select
                  value={lessonSortBy}
                  onChange={(e) => setLessonSortBy(e.target.value as any)}
                  className="bg-transparent text-white focus:outline-none cursor-pointer text-xs"
                >
                  <option value="SoThuTu" className="bg-slate-900">Số thứ tự</option>
                  <option value="TenBaiGiang" className="bg-slate-900">Tên bài</option>
                  <option value="ThoiLuongPhut" className="bg-slate-900">Thời lượng</option>
                </select>
                <button
                  type="button"
                  onClick={() => setLessonSortDir((prev) => (prev === 'ASC' ? 'DESC' : 'ASC'))}
                  className="px-1 py-0.5 rounded bg-slate-800 text-indigo-400 font-mono font-bold cursor-pointer"
                >
                  {lessonSortDir}
                </button>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <span className="text-slate-400">Hiển thị:</span>
              <select
                value={lessonPageSize}
                onChange={(e) => {
                  setLessonPageSize(Number(e.target.value));
                  setLessonCurrentPage(1);
                }}
                className="bg-slate-900 border border-slate-700/80 rounded-xl px-2 py-1 text-white text-xs focus:outline-none cursor-pointer"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={-1}>Tất cả</option>
              </select>
            </div>
          </div>

          <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden">
            {displayedLessons.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-sm">
                {lessons.length === 0
                  ? 'Chưa có bài giảng nào trong khóa đào tạo này. Bấm "Thêm bài giảng" để bắt đầu.'
                  : 'Không có bài giảng nào khớp với điều kiện tìm kiếm.'}
              </div>
            ) : (
              <div className="divide-y divide-slate-800/60">
                {displayedLessons.map((l) => (
                  <div key={l.MaBaiGiang} className="p-4 hover:bg-slate-800/30 transition-colors flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                        {l.SoThuTu}
                      </div>
                      <div>
                        <div className="text-xs font-medium text-indigo-400 uppercase tracking-wider">{l.MonHoc}</div>
                        <h5 className="font-medium text-white text-sm mt-0.5">{l.TenBaiGiang}</h5>
                        <div className="flex items-center gap-4 mt-1.5 text-xs text-slate-400">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" /> {l.ThoiLuongPhut} phút
                          </span>
                          {l.DuongDanVideo && (
                            <span className="flex items-center gap-1 text-cyan-400">
                              <Video className="w-3.5 h-3.5" /> Đã có video
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Lessons Pagination Footer */}
          {!isAllLessons && totalLessonPages > 1 && (
            <div className="flex items-center justify-between text-xs text-slate-400 px-1 pt-1">
              <div>
                Tổng số bài giảng: <strong className="text-white">{totalLessons}</strong>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setLessonCurrentPage((p) => Math.max(p - 1, 1))}
                  disabled={lessonCurrentPage === 1}
                  className="p-1.5 rounded-lg border border-slate-800 bg-slate-900 text-slate-300 disabled:opacity-40"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <span className="px-2 font-medium text-slate-300">
                  {lessonCurrentPage} / {totalLessonPages}
                </span>
                <button
                  onClick={() => setLessonCurrentPage((p) => Math.min(p + 1, totalLessonPages))}
                  disabled={lessonCurrentPage === totalLessonPages}
                  className="p-1.5 rounded-lg border border-slate-800 bg-slate-900 text-slate-300 disabled:opacity-40"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal Add Course */}
      {isAddCourseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="glass-panel w-full max-w-md rounded-2xl border border-slate-700 p-6 shadow-2xl relative">
            <button
              onClick={() => setIsAddCourseModal(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-bold font-heading text-white mb-4">Thêm Hạng Khóa Học</h3>
            <form onSubmit={handleCreateCourse} className="space-y-4 text-sm">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Mã Hạng GPLX *</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: B2, C, D"
                  value={courseForm.maHangGPLX}
                  onChange={(e) => setCourseForm({ ...courseForm, maHangGPLX: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-indigo-500 uppercase"
                />
              </div>
              <div>
                <label className="block text-slate-300 font-medium mb-1">Tên Khóa Học *</label>
                <input
                  type="text"
                  required
                  placeholder="Đào tạo Lái xe Hạng..."
                  value={courseForm.tenKhoaHoc}
                  onChange={(e) => setCourseForm({ ...courseForm, tenKhoaHoc: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-slate-300 font-medium mb-1">Tổng Số Giờ Lý Thuyết Quy Định (giờ) *</label>
                <input
                  type="number"
                  required
                  value={courseForm.tongSoGioLyThuyet}
                  onChange={(e) => setCourseForm({ ...courseForm, tongSoGioLyThuyet: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-slate-300 font-medium mb-1">Mô tả</label>
                <textarea
                  rows={3}
                  value={courseForm.moTa}
                  onChange={(e) => setCourseForm({ ...courseForm, moTa: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddCourseModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium shadow-lg shadow-indigo-600/30"
                >
                  Tạo khóa học
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Add Lesson */}
      {isAddLessonModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="glass-panel w-full max-w-md rounded-2xl border border-slate-700 p-6 shadow-2xl relative">
            <button
              onClick={() => setIsAddLessonModal(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-bold font-heading text-white mb-4">Thêm Bài Giảng Vào Khung Đào Tạo</h3>
            <form onSubmit={handleCreateLesson} className="space-y-4 text-sm">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Tên Môn Học *</label>
                <select
                  value={lessonForm.monHoc}
                  onChange={(e) => setLessonForm({ ...lessonForm, monHoc: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="Pháp luật giao thông đường bộ">Pháp luật giao thông đường bộ</option>
                  <option value="Đạo đức người lái xe và văn hóa giao thông">Đạo đức người lái xe và văn hóa giao thông</option>
                  <option value="Kỹ thuật lái xe ô tô">Kỹ thuật lái xe ô tô</option>
                  <option value="Cấu tạo và sửa chữa thông thường">Cấu tạo và sửa chữa thông thường</option>
                  <option value="Nghiệp vụ vận tải">Nghiệp vụ vận tải</option>
                </select>
              </div>
              <div>
                <label className="block text-slate-300 font-medium mb-1">Tên Bài Giảng *</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Bài 1: Khái niệm..."
                  value={lessonForm.tenBaiGiang}
                  onChange={(e) => setLessonForm({ ...lessonForm, tenBaiGiang: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Số thứ tự</label>
                  <input
                    type="number"
                    value={lessonForm.soThuTu}
                    onChange={(e) => setLessonForm({ ...lessonForm, soThuTu: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Thời lượng (phút)</label>
                  <input
                    type="number"
                    value={lessonForm.thoiLuongPhut}
                    onChange={(e) => setLessonForm({ ...lessonForm, thoiLuongPhut: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-slate-300 font-medium mb-1">Đường dẫn Video (URL / MP4)</label>
                <input
                  type="text"
                  placeholder="/videos/bai1.mp4"
                  value={lessonForm.duongDanVideo}
                  onChange={(e) => setLessonForm({ ...lessonForm, duongDanVideo: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddLessonModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium shadow-lg shadow-indigo-600/30"
                >
                  Lưu bài giảng
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
