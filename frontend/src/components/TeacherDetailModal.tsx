import React, { useState, useEffect } from 'react';
import {api } from '../services/api';
import {
  X,
  UserCheck,
  BookOpen,
  Users,
  Calendar,
  Search,
  Phone,
  Mail,
  CreditCard,
  Layers,
  CheckCircle2,
  Clock,
  Award,
  Camera,
  Loader2,
} from 'lucide-react';

interface TeacherDetailModalProps {
  teacherId: number | null;
  onClose: () => void;
}

export const TeacherDetailModal: React.FC<TeacherDetailModalProps> = ({
  teacherId,
  onClose,
}) => {
  const [loading, setLoading] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !teacherId) return;
    if (!file.type.match(/\/(jpeg|png|webp|jpg)$/i)) {
      alert('Chỉ chấp nhận hình ảnh JPG, PNG hoặc WEBP.');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      alert('Dung lượng hình ảnh tối đa 2MB.');
      return;
    }
    setUploadingAvatar(true);
    try {
      const res = await api.uploadUserAvatar(teacherId, file);
      setData((prev: any) => prev ? {
        ...prev,
        thongTinGiaoVien: { ...prev.thongTinGiaoVien, AvatarUrl: res.avatarUrl },
      } : null);
    } catch (err: any) {
      alert(err.message || 'Lỗi tải ảnh lên');
    } finally {
      setUploadingAvatar(false);
      e.target.value = '';
    }
  };
  const [data, setData] = useState<{
    thongTinGiaoVien: any;
    danhSachLopPhuTrach: any[];
    danhSachHocVienPhuTrach: any[];
    tongSoLop: number;
    tongSoHocVien: number;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'CLASSES' | 'STUDENTS'>('CLASSES');
  const [studentSearch, setStudentSearch] = useState('');

  useEffect(() => {
    if (!teacherId) return;
    setLoading(true);
    setError(null);
    api.getTeacherAssignments(teacherId)
      .then((res: any) => {
        setData(res);
      })
      .catch((err: any) => {
        setError(err.message || 'Lỗi khi tải thông tin phân công giáo viên.');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [teacherId]);

  if (!teacherId) return null;

  const teacher = data?.thongTinGiaoVien;
  const classes = data?.danhSachLopPhuTrach || [];
  const students = data?.danhSachHocVienPhuTrach || [];

  const filteredStudents = students.filter((stu) => {
    const s = studentSearch.toLowerCase().trim();
    if (!s) return true;
    return (
      stu.HoVaTen?.toLowerCase().includes(s) ||
      stu.SoCCCD?.includes(s) ||
      stu.TenLopHoc?.toLowerCase().includes(s) ||
      stu.TenDangNhap?.toLowerCase().includes(s)
    );
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header Modal */}
        <div className="p-5 border-b border-slate-100 bg-slate-50/70 flex items-start justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="relative group/modalAvatar shrink-0" title="Admin: Nhấn để đổi ảnh đại diện cho giáo viên này">
            {teacher?.AvatarUrl ? (
              <img
                src={teacher.AvatarUrl}
                alt={teacher.HoVaTen}
                className="w-12 h-12 rounded-2xl object-cover border border-blue-300 shadow-xs shrink-0"
              />
            ) : (
              <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-lg border border-blue-200 shadow-xs shrink-0">
                {teacher?.HoVaTen ? teacher.HoVaTen.charAt(0).toUpperCase() : <UserCheck className="w-6 h-6" />}
              </div>
            )}
            <label className="absolute inset-0 bg-slate-950/65 rounded-2xl flex items-center justify-center opacity-0 group-hover/modalAvatar:opacity-100 transition-opacity cursor-pointer shadow-md">
              {uploadingAvatar ? (
                <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />
              ) : (
                <Camera className="w-5 h-5 text-white hover:text-blue-300 transition-colors" />
              )}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                disabled={uploadingAvatar}
                onChange={handleAvatarChange}
              />
            </label>
          </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-heading font-black text-lg text-slate-900">
                  {teacher?.HoVaTen || 'Chi Tiết Phân Công Giáo Viên'}
                </h3>
                <span className="px-2 py-0.5 rounded-md bg-blue-100 text-blue-800 font-mono text-[10px] font-bold">
                  ID #{teacherId}
                </span>
                <span
                  className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                    teacher?.TrangThai
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-rose-100 text-rose-800'
                  }`}
                >
                  {teacher?.TrangThai ? 'Đang giảng dạy' : 'Tạm dừng'}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 mt-1">
                <span>Tên đăng nhập: <strong className="text-slate-800 font-mono">@{teacher?.TenDangNhap}</strong></span>
                <span>CCCD: <strong className="text-slate-700 font-mono">{teacher?.SoCCCD || '—'}</strong></span>
                <span>ĐT: <strong className="text-slate-700 font-mono">{teacher?.SoDienThoai || '—'}</strong></span>
                <span>Email: <strong className="text-slate-700">{teacher?.Email || '—'}</strong></span>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-5 flex-1">
          {loading ? (
            <div className="py-20 text-center text-slate-500 space-y-3">
              <div className="w-9 h-9 border-3 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto"></div>
              <div className="text-xs font-semibold">Đang tải danh sách khóa học và học viên phụ trách...</div>
            </div>
          ) : error ? (
            <div className="p-4 rounded-xl bg-rose-50 text-rose-800 border border-rose-200 text-xs">
              {error}
            </div>
          ) : (
            <>
              {/* 2 KPI Cards Tóm tắt */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200/80 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider block">
                      Khóa / Lớp học phụ trách
                    </span>
                    <div className="text-2xl font-black text-amber-900 mt-0.5">
                      {data?.tongSoLop || classes.length} lớp đào tạo
                    </div>
                    <span className="text-[11px] text-amber-700">Các lớp học lý thuyết / thực hành</span>
                  </div>
                  <div className="w-11 h-11 rounded-xl bg-amber-200/80 text-amber-800 flex items-center justify-center">
                    <BookOpen className="w-5 h-5" />
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-200/80 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider block">
                      Học viên trực tiếp quản lý
                    </span>
                    <div className="text-2xl font-black text-blue-900 mt-0.5">
                      {data?.tongSoHocVien || students.length} học viên
                    </div>
                    <span className="text-[11px] text-blue-700">Phân công theo lớp hoặc bảng kê Excel</span>
                  </div>
                  <div className="w-11 h-11 rounded-xl bg-blue-200/80 text-blue-800 flex items-center justify-center">
                    <Users className="w-5 h-5" />
                  </div>
                </div>
              </div>

              {/* Tabs Switcher */}
              <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
                <button
                  onClick={() => setActiveTab('CLASSES')}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activeTab === 'CLASSES'
                      ? 'bg-amber-400 text-slate-950 shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <BookOpen className="w-4 h-4" />
                  <span>Danh sách Khóa / Lớp học ({classes.length})</span>
                </button>

                <button
                  onClick={() => setActiveTab('STUDENTS')}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activeTab === 'STUDENTS'
                      ? 'bg-amber-400 text-slate-950 shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <Users className="w-4 h-4" />
                  <span>Danh sách Học viên phụ trách ({students.length})</span>
                </button>
              </div>

              {/* Tab 1: Danh sách Lớp Học */}
              {activeTab === 'CLASSES' && (
                <div className="space-y-3">
                  <div className="text-xs text-slate-500 font-medium">
                    Các khóa học và lớp đào tạo mà giáo viên đang làm chủ nhiệm hoặc được phân công hướng dẫn học viên:
                  </div>

                  {classes.length === 0 ? (
                    <div className="py-12 text-center text-slate-400 text-xs border border-dashed border-slate-200 rounded-2xl">
                      Giáo viên hiện chưa được phân công phụ trách lớp đào tạo nào.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {classes.map((cls, idx) => (
                        <div
                          key={idx}
                          className="p-4 rounded-xl border border-slate-200 bg-white hover:border-amber-400 hover:shadow-xs transition-all space-y-2.5"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <div className="font-bold text-slate-900 text-sm">
                                {cls.TenLopHoc}
                              </div>
                              <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                                Mã lớp: {cls.MaLopHocCode} • Khóa: {cls.TenKhoaHoc}
                              </div>
                            </div>
                            <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-900 font-bold text-[10px]">
                              Hạng {cls.MaHangGPLX}
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 pt-2 border-t border-slate-100">
                            <div>
                              <span className="text-slate-400">Sĩ số lớp:</span>{' '}
                              <strong className="text-slate-800">{cls.SiSoHocVien || 0} học viên</strong>
                            </div>
                            <div>
                              <span className="text-slate-400">Học viên phụ trách:</span>{' '}
                              <strong className="text-amber-700 font-bold">{cls.SoHocVienPhuTrachTrongLop || 0} học viên</strong>
                            </div>
                            <div className="col-span-2 text-slate-400 text-[10px]">
                              Khai giảng: <span className="text-slate-600 font-medium">{new Date(cls.NgayKhaiGiang).toLocaleDateString('vi-VN')}</span> — Bế giảng: <span className="text-slate-600 font-medium">{new Date(cls.NgayBeGiang).toLocaleDateString('vi-VN')}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Tab 2: Danh sách Học Viên Phụ Trách */}
              {activeTab === 'STUDENTS' && (
                <div className="space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="text-xs text-slate-500 font-medium">
                      Danh sách toàn bộ học viên đang theo học dưới sự hướng dẫn của giáo viên:
                    </div>

                    <div className="relative w-full sm:w-64">
                      <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Tìm học viên, CCCD, lớp..."
                        value={studentSearch}
                        onChange={(e) => setStudentSearch(e.target.value)}
                        className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-amber-400"
                      />
                    </div>
                  </div>

                  <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
                    <div className="overflow-x-auto max-h-[380px]">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead className="sticky top-0 z-10 bg-slate-100 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                          <tr>
                            <th className="py-2.5 px-3">Học Viên</th>
                            <th className="py-2.5 px-3">Số CCCD</th>
                            <th className="py-2.5 px-3">Khóa / Lớp Học</th>
                            <th className="py-2.5 px-3">Liên Hệ</th>
                            <th className="py-2.5 px-3 text-center">Tiến Độ</th>
                            <th className="py-2.5 px-3 text-center">Trạng Thái</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white">
                          {filteredStudents.length === 0 ? (
                            <tr>
                              <td colSpan={6} className="text-center py-12 text-slate-400 text-xs">
                                {students.length === 0
                                  ? 'Chưa có học viên nào được phân công cho giáo viên này.'
                                  : 'Không tìm thấy học viên nào phù hợp với từ khóa.'}
                              </td>
                            </tr>
                          ) : (
                            filteredStudents.map((item, idx) => (
                              <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                                <td className="py-2.5 px-3">
                                  <div className="font-bold text-slate-800 flex items-center gap-2">
                                    {item.AvatarUrl ? (
                                      <img
                                        src={item.AvatarUrl}
                                        alt={item.HoVaTen}
                                        className="w-7 h-7 rounded-full object-cover shrink-0 border border-amber-300"
                                      />
                                    ) : (
                                      <div className="w-7 h-7 rounded-full bg-amber-100 text-amber-800 font-bold flex items-center justify-center text-[10px] shrink-0">
                                        {item.HoVaTen ? item.HoVaTen.charAt(0).toUpperCase() : 'H'}
                                      </div>
                                    )}
                                    <div>
                                      <div>{item.HoVaTen}</div>
                                      <div className="text-[10px] text-slate-400 font-mono">#{item.MaHocVien} • @{item.TenDangNhap}</div>
                                    </div>
                                  </div>
                                </td>
                                <td className="py-2.5 px-3 font-mono text-slate-600 text-[11px]">
                                  {item.SoCCCD || '—'}
                                </td>
                                <td className="py-2.5 px-3">
                                  <div className="font-semibold text-slate-800">{item.TenLopHoc}</div>
                                  <div className="text-[10px] text-amber-700 font-medium">Hạng {item.MaHangGPLX}</div>
                                </td>
                                <td className="py-2.5 px-3 text-slate-500 text-[11px]">
                                  {item.SoDienThoai ? (
                                    <div className="font-mono">{item.SoDienThoai}</div>
                                  ) : (
                                    '—'
                                  )}
                                </td>
                                <td className="py-2.5 px-3 text-center">
                                  <span className="font-mono font-bold text-amber-700">
                                    {item.SoBaiDaHoc || 0} bài
                                  </span>
                                  <span className="text-[10px] text-slate-400 block">
                                    {item.TongThoiGianHocPhut || 0} phút
                                  </span>
                                </td>
                                <td className="py-2.5 px-3 text-center">
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                    {item.TrangThaiHocTap || 'Đang học'}
                                  </span>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs transition-all cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};

export default TeacherDetailModal;
