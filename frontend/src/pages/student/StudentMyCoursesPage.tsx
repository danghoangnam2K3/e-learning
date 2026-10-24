import { PaginationFooter } from '../../components/common/PaginationFooter';
import { useClientPagination } from '../../hooks/useClientPagination';
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { StudentEnrolledCourse } from '../../types';
import {
  BookOpen,
  Calendar,
  UserCheck,
  Phone,
  Clock,
  CheckCircle2,
  PlayCircle,
  ArrowRight,
  Award,
  AlertCircle,
  RefreshCw,
  Search,
} from 'lucide-react';

export const StudentMyCoursesPage: React.FC = () => {
  const navigate = useNavigate();
  const [courses, setCourses] = useState<StudentEnrolledCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const loadCourses = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.getMyCourses();
      setCourses(res || []);
    } catch (err: any) {
      console.error('Error loading my courses:', err);
      setError(err.message || 'Không thể tải danh sách khóa học. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCourses();
  }, []);

  const filteredCourses = courses.filter((c) => {
    const term = searchTerm.toLowerCase();
    return (
      c.tenKhoaHoc?.toLowerCase().includes(term) ||
      c.tenLopHoc?.toLowerCase().includes(term) ||
      c.maHangGPLX?.toLowerCase().includes(term) ||
      c.tenGiaoVien?.toLowerCase().includes(term)
    );
  });

  const {
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    paginatedData: paginatedCourses,
    totalItems: totalCoursesCount,
  } = useClientPagination({
    data: filteredCourses,
    initialPageSize: 10,
  });

  return (
    <div className="space-y-6">
      {/* 1. Header Banner */}
      <div className="bg-gradient-to-r from-[#0c1322] via-[#162035] to-[#1e293b] rounded-3xl p-6 sm:p-8 text-white relative overflow-hidden shadow-xl border border-slate-700/50">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-radial from-amber-400/10 via-transparent to-transparent pointer-events-none"></div>
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/20 text-amber-300 font-bold text-xs mb-3 border border-amber-400/30">
            <Award className="w-3.5 h-3.5" />
            <span>Chương Trình Đào Tạo Lý Thuyết Chuẩn Quốc Gia</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-heading font-black tracking-tight mb-2">
            Khóa Học Của Tôi
          </h1>
          <p className="text-sm text-slate-300 leading-relaxed">
            Theo dõi tiến trình bài giảng lý thuyết, tích lũy thời gian học theo quy định của Sở GTVT và chuẩn bị cho kỳ thi sát hạch lý thuyết.
          </p>
        </div>
      </div>

      {/* 2. Controls & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm theo tên khóa, lớp học, hạng GPLX..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400/30 focus:border-amber-400 transition-all placeholder:text-slate-400 font-medium"
          />
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadCourses}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Làm mới</span>
          </button>
          <div className="text-xs text-slate-500 font-semibold px-3 py-2 bg-slate-100 rounded-xl">
            Tổng cộng: <strong>{courses.length}</strong> lớp học
          </div>
        </div>
      </div>

      {/* 3. Loading & Error States */}
      {loading && (
        <div className="py-20 flex flex-col items-center justify-center space-y-3">
          <div className="w-10 h-10 border-4 border-amber-400/20 border-t-amber-400 rounded-full animate-spin"></div>
          <span className="text-xs font-semibold text-slate-500">Đang đồng bộ dữ liệu khóa học...</span>
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
            onClick={loadCourses}
            className="px-3 py-1.5 rounded-lg bg-rose-600 text-white font-bold text-xs hover:bg-rose-700 transition-colors"
          >
            Thử lại
          </button>
        </div>
      )}

      {/* 4. Course Cards Grid */}
      {!loading && !error && totalCoursesCount === 0 && (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200/80 shadow-sm max-w-lg mx-auto">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center mx-auto mb-4">
            <BookOpen className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-slate-800 mb-1">
            Chưa tìm thấy khóa học nào
          </h3>
          <p className="text-xs text-slate-500 leading-relaxed mb-4">
            {searchTerm
              ? 'Không có khóa học nào khớp với từ khóa tìm kiếm.'
              : 'Tài khoản của bạn hiện chưa được ghi danh vào lớp đào tạo nào. Vui lòng liên hệ trung tâm để được xếp lớp.'}
          </p>
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 transition-colors"
            >
              Xóa bộ lọc
            </button>
          )}
        </div>
      )}

      {!loading && !error && totalCoursesCount > 0 && (
        <>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {paginatedCourses.map((course) => {
            const isCompleted = course.tiLeHoanThanh >= 100;

            return (
              <div
                key={course.maLopHoc}
                className="bg-white rounded-3xl border border-slate-200/90 shadow-sm hover:shadow-xl hover:border-amber-300 transition-all duration-300 flex flex-col overflow-hidden group"
              >
                {/* Card Header */}
                <div className="p-6 border-b border-slate-100 bg-gradient-to-br from-slate-50/80 to-white">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-2">
                      <span className="px-3 py-1 rounded-xl bg-amber-400 text-slate-950 font-black text-xs shadow-sm">
                        Hạng {course.maHangGPLX}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-lg bg-slate-100 text-slate-600 font-bold text-[11px] border border-slate-200">
                        {course.maLopHocCode}
                      </span>
                    </div>

                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1.5 ${
                        isCompleted
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          isCompleted ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'
                        }`}
                      ></span>
                      {course.trangThaiHocTap || (isCompleted ? 'Đã hoàn thành' : 'Đang học')}
                    </span>
                  </div>

                  <h3 className="text-lg font-heading font-black text-slate-900 group-hover:text-amber-600 transition-colors">
                    {course.tenKhoaHoc}
                  </h3>
                  <p className="text-xs font-semibold text-slate-500 mt-0.5">
                    Lớp: {course.tenLopHoc}
                  </p>
                </div>

                {/* Card Body: Details & Progress */}
                <div className="p-6 flex-1 space-y-5">
                  {/* Meta Specs Grid */}
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                      <span className="text-slate-400 block text-[11px] font-medium mb-1">
                        Giáo viên hướng dẫn
                      </span>
                      <div className="font-bold text-slate-800 flex items-center gap-1.5 truncate">
                        <UserCheck className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                        <span className="truncate">{course.tenGiaoVien || 'Chưa phân công'}</span>
                      </div>
                      {course.soDienThoaiGiaoVien && (
                        <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-1">
                          <Phone className="w-3 h-3 text-slate-400" />
                          <span>{course.soDienThoaiGiaoVien}</span>
                        </div>
                      )}
                    </div>

                    <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                      <span className="text-slate-400 block text-[11px] font-medium mb-1">
                        Thời gian khóa học
                      </span>
                      <div className="font-bold text-slate-800 flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                        <span>
                          {course.ngayKhaiGiang
                            ? new Date(course.ngayKhaiGiang).toLocaleDateString('vi-VN')
                            : 'N/A'}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-400 block mt-1">
                        Đến:{' '}
                        {course.ngayBeGiang
                          ? new Date(course.ngayBeGiang).toLocaleDateString('vi-VN')
                          : 'N/A'}
                      </span>
                    </div>
                  </div>

                  {/* Progress Statistics (Backend Computed) */}
                  <div className="p-4 rounded-2xl bg-amber-50/40 border border-amber-200/60 space-y-2.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-700 flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-amber-500" />
                        Tiến độ hoàn thành bài giảng
                      </span>
                      <span className="font-heading font-black text-amber-600 text-sm">
                        {course.tiLeHoanThanh}%
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-amber-500 to-amber-400 h-full rounded-full transition-all duration-700 ease-out"
                        style={{ width: `${Math.min(100, course.tiLeHoanThanh)}%` }}
                      ></div>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-500 font-semibold pt-1">
                      <span>
                        Bài học: <strong>{course.soBaiDaHoanThanh}</strong> / {course.tongSoBaiHoc} bài
                      </span>
                      <span className="flex items-center gap-1 text-slate-600">
                        <Clock className="w-3 h-3 text-slate-400" />
                        Đã học: <strong>{course.tongThoiGianHocGio}h</strong> / {course.tongSoGioLyThuyet}h
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Footer: Action Button */}
                <div className="p-5 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
                  <span className="text-xs text-slate-400 font-medium">
                    Ghi danh: {course.ngayGhiDanh ? new Date(course.ngayGhiDanh).toLocaleDateString('vi-VN') : 'Đã xác nhận'}
                  </span>

                  <button
                    onClick={() => navigate(`/hoc/khoahoc/${course.maLopHoc}`)}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-400 text-slate-950 font-bold text-xs hover:bg-amber-300 hover:shadow-lg hover:shadow-amber-400/20 transition-all cursor-pointer group-hover:scale-102"
                  >
                    <span>Vào học ngay</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Pagination Footer */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
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
        </>
      )}
    </div>
  );
};

export default StudentMyCoursesPage;
