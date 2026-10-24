import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { TeacherAssignmentsData, TeacherClassItem } from '../../types';
import {
  BookOpen,
  Calendar,
  Users,
  GraduationCap,
  Award,
  ArrowRight,
  RefreshCw,
  Search,
  CheckCircle2,
  Clock,
  AlertCircle,
  ShieldCheck,
  UserCheck,
} from 'lucide-react';

export const TeacherCoursesPage: React.FC = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<TeacherAssignmentsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const loadAssignments = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.getMyTeacherAssignments();
      setData(res);
    } catch (err: any) {
      console.error('Error loading teacher assignments:', err);
      setError(err.message || 'Không thể tải danh sách lớp học phụ trách.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAssignments();
  }, []);

  const classes = data?.danhSachLopPhuTrach || [];
  const filteredClasses = classes.filter((c) => {
    const term = searchTerm.toLowerCase();
    return (
      c.TenLopHoc?.toLowerCase().includes(term) ||
      c.MaLopHocCode?.toLowerCase().includes(term) ||
      c.TenKhoaHoc?.toLowerCase().includes(term) ||
      c.MaHangGPLX?.toLowerCase().includes(term)
    );
  });

  const chuNhiemCount = classes.filter(
    (c) => c.LaGiaoVienChuNhiem === 1 || c.LaGiaoVienChuNhiem === true
  ).length;

  return (
    <div className="space-y-6">
      {/* 1. Header Hero Banner */}
      <div className="bg-gradient-to-r from-[#0c1322] via-[#162035] to-[#1e293b] rounded-3xl p-6 sm:p-8 text-white relative overflow-hidden shadow-xl border border-slate-700/50">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/20 text-amber-300 font-bold text-xs mb-3 border border-amber-400/30">
            <Award className="w-3.5 h-3.5" />
            <span>Phân Hệ Quản Lý Lớp Học & Khóa Đào Tạo</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-heading font-black tracking-tight mb-2">
            Khóa Học & Lớp Phụ Trách
          </h1>
          <p className="text-sm text-slate-300 leading-relaxed">
            Theo dõi danh sách các lớp đào tạo lái xe được phân công, giám sát sĩ số, thời gian đào tạo và tiến độ học tập của các nhóm học viên.
          </p>
        </div>
      </div>

      {/* 2. KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-400 block">Lớp học phụ trách</span>
            <span className="text-2xl font-heading font-black text-slate-900">
              {classes.length} <span className="text-xs text-slate-500 font-normal">lớp</span>
            </span>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-400 block">Học viên hướng dẫn</span>
            <span className="text-2xl font-heading font-black text-slate-900">
              {data?.tongSoHocVien || 0}{' '}
              <span className="text-xs text-slate-500 font-normal">học viên</span>
            </span>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-400 block">Lớp chủ nhiệm</span>
            <span className="text-2xl font-heading font-black text-slate-900">
              {chuNhiemCount} <span className="text-xs text-slate-500 font-normal">lớp</span>
            </span>
          </div>
        </div>
      </div>

      {/* 3. Search & Refresh Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm theo tên lớp, mã lớp code, tên khóa..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400/30 focus:border-amber-400 transition-all font-medium"
          />
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadAssignments}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Làm mới</span>
          </button>
        </div>
      </div>

      {/* 4. Loading & Error States */}
      {loading && (
        <div className="py-20 flex flex-col items-center justify-center space-y-3">
          <div className="w-10 h-10 border-4 border-amber-400/20 border-t-amber-400 rounded-full animate-spin"></div>
          <span className="text-xs font-semibold text-slate-500">Đang tải danh sách phân công giảng dạy...</span>
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

      {/* 5. Class Cards Grid */}
      {!loading && !error && filteredClasses.length === 0 && (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200/80 shadow-sm max-w-lg mx-auto">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center mx-auto mb-4">
            <BookOpen className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-slate-800 mb-1">
            Chưa tìm thấy lớp học phụ trách
          </h3>
          <p className="text-xs text-slate-500 leading-relaxed mb-4">
            {searchTerm
              ? 'Không có lớp học nào khớp với từ khóa tìm kiếm.'
              : 'Tài khoản giáo viên hiện chưa được phân công lớp học nào. Vui lòng liên hệ Ban Quản Trị để được chỉ định lớp giảng dạy.'}
          </p>
        </div>
      )}

      {!loading && !error && filteredClasses.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredClasses.map((item) => {
            const isChuNhiem = item.LaGiaoVienChuNhiem === 1 || item.LaGiaoVienChuNhiem === true;

            return (
              <div
                key={item.MaLopHoc}
                className="bg-white rounded-3xl border border-slate-200/90 shadow-sm hover:shadow-xl hover:border-amber-300 transition-all duration-300 flex flex-col overflow-hidden group"
              >
                {/* Card Header */}
                <div className="p-6 border-b border-slate-100 bg-gradient-to-br from-slate-50/80 to-white">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-2">
                      <span className="px-3 py-1 rounded-xl bg-amber-400 text-slate-950 font-black text-xs shadow-sm">
                        Hạng {item.MaHangGPLX}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-lg bg-slate-100 text-slate-600 font-bold text-[11px] border border-slate-200">
                        {item.MaLopHocCode}
                      </span>
                    </div>

                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1.5 ${
                        isChuNhiem
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-blue-50 text-blue-700 border border-blue-200'
                      }`}
                    >
                      {isChuNhiem ? 'Giáo viên chủ nhiệm' : 'Giáo viên hướng dẫn'}
                    </span>
                  </div>

                  <h3 className="text-lg font-heading font-black text-slate-900 group-hover:text-amber-600 transition-colors">
                    {item.TenLopHoc}
                  </h3>
                  <p className="text-xs font-semibold text-slate-500 mt-0.5">
                    Khóa đào tạo: {item.TenKhoaHoc}
                  </p>
                </div>

                {/* Card Body */}
                <div className="p-6 flex-1 space-y-4">
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                      <span className="text-slate-400 block text-[11px] font-medium mb-1">
                        Sĩ số học viên
                      </span>
                      <div className="font-bold text-slate-800 flex items-center gap-2">
                        <Users className="w-4 h-4 text-amber-500" />
                        <span>Toàn lớp: <strong>{item.SiSoHocVien}</strong> HV</span>
                      </div>
                      <span className="text-[11px] text-amber-700 font-bold block mt-1">
                        Trực tiếp phụ trách: {item.SoHocVienPhuTrachTrongLop} HV
                      </span>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                      <span className="text-slate-400 block text-[11px] font-medium mb-1">
                        Thời gian đào tạo
                      </span>
                      <div className="font-bold text-slate-800 flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                        <span>
                          {item.NgayKhaiGiang
                            ? new Date(item.NgayKhaiGiang).toLocaleDateString('vi-VN')
                            : 'N/A'}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-400 block mt-1">
                        Bế giảng:{' '}
                        {item.NgayBeGiang
                          ? new Date(item.NgayBeGiang).toLocaleDateString('vi-VN')
                          : 'N/A'}
                      </span>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-amber-50/40 border border-amber-200/50 flex items-center justify-between text-xs">
                    <span className="text-slate-600 font-medium">Trạng thái lớp học:</span>
                    <span className="font-bold text-amber-800 bg-amber-100/80 px-2.5 py-0.5 rounded-lg">
                      {item.TrangThai || 'Đang đào tạo'}
                    </span>
                  </div>
                </div>

                {/* Card Footer */}
                <div className="p-5 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
                  <span className="text-xs text-slate-400 font-medium">
                    Mã hệ thống: #{item.MaLopHoc}
                  </span>

                  <button
                    onClick={() => navigate(`/gv/hocvien?lopId=${item.MaLopHoc}`)}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-400 text-slate-950 font-bold text-xs hover:bg-amber-300 hover:shadow-lg hover:shadow-amber-400/20 transition-all cursor-pointer"
                  >
                    <span>Xem danh sách học viên</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default TeacherCoursesPage;
