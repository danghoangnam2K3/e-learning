import React, { useState, useEffect } from 'react';
import {api } from '../services/api';
import {
  X,
  GraduationCap,
  Clock,
  CheckCircle2,
  BookOpen,
  Calendar,
  Search,
  Phone,
  Mail,
  CreditCard,
  Layers,
  Sparkles,
  Camera,
  Loader2,
} from 'lucide-react';

interface StudentDetailModalProps {
  studentId: number | null;
  onClose: () => void;
}

export const StudentDetailModal: React.FC<StudentDetailModalProps> = ({
  studentId,
  onClose,
}) => {
  const [loading, setLoading] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !studentId) return;
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
      const res = await api.uploadUserAvatar(studentId, file);
      setData((prev: any) => prev ? {
        ...prev,
        tongQuanHocVien: { ...prev.tongQuanHocVien, AvatarUrl: res.avatarUrl },
      } : null);
    } catch (err: any) {
      alert(err.message || 'Lỗi tải ảnh lên');
    } finally {
      setUploadingAvatar(false);
      e.target.value = '';
    }
  };
  const [data, setData] = useState<{
    tongQuanHocVien: any;
    chiTietBaiGiang: any[];
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (!studentId) return;
    setLoading(true);
    setError(null);
    api.getStudentReport(studentId)
      .then((res: any) => {
        setData(res);
      })
      .catch((err: any) => {
        setError(err.message || 'Lỗi khi tải chi tiết tiến độ học tập.');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [studentId]);

  if (!studentId) return null;

  const tongQuan = data?.tongQuanHocVien;
  const chiTiet = data?.chiTietBaiGiang || [];

  const filteredLessons = chiTiet.filter((lesson) => {
    const s = searchTerm.toLowerCase().trim();
    if (!s) return true;
    return (
      lesson.TenBaiGiang?.toLowerCase().includes(s) ||
      lesson.MonHoc?.toLowerCase().includes(s) ||
      String(lesson.SoThuTu).includes(s)
    );
  });

  const tongGioThucTe = tongQuan?.TongGioHocThucTe || 0;
  const tongPhutThucTe = Math.round(tongGioThucTe * 60);
  const tongGioQuyDinh = tongQuan?.GioQuyDinh || 0;
  const tiLeHoanThanh = tongGioQuyDinh > 0 ? Math.min(100, (tongGioThucTe / tongGioQuyDinh) * 100) : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header Modal */}
        <div className="p-5 border-b border-slate-100 bg-slate-50/70 flex items-start justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="relative group/modalAvatar shrink-0" title="Admin: Nhấn để đổi ảnh đại diện cho học viên này">
            {tongQuan?.AvatarUrl ? (
              <img
                src={tongQuan.AvatarUrl}
                alt={tongQuan.HoVaTen}
                className="w-14 h-14 rounded-2xl object-cover border-2 border-amber-400 shadow-md shrink-0"
              />
            ) : (
              <div className="w-14 h-14 rounded-2xl bg-amber-400/20 text-amber-700 flex items-center justify-center font-bold text-lg border border-amber-200 shadow-xs shrink-0">
                {tongQuan?.HoVaTen ? tongQuan.HoVaTen.charAt(0).toUpperCase() : <GraduationCap className="w-6 h-6" />}
              </div>
            )}
            <label className="absolute inset-0 bg-slate-950/65 rounded-2xl flex items-center justify-center opacity-0 group-hover/modalAvatar:opacity-100 transition-opacity cursor-pointer shadow-md">
              {uploadingAvatar ? (
                <Loader2 className="w-5 h-5 text-amber-400 animate-spin" />
              ) : (
                <Camera className="w-5 h-5 text-white hover:text-amber-300 transition-colors" />
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
                  {tongQuan?.HoVaTen || 'Chi Tiết Tiến Độ Học Viên'}
                </h3>
                <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 font-mono text-[10px] font-bold">
                  ID #{studentId}
                </span>
                {tongQuan?.MaHangGPLX && (
                  <span className="px-2 py-0.5 rounded-md bg-blue-100 text-blue-800 text-[10px] font-bold">
                    Hạng {tongQuan.MaHangGPLX}
                  </span>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 mt-1">
                <span>CCCD: <strong className="text-slate-700 font-mono">{tongQuan?.SoCCCD || '—'}</strong></span>
                <span>ĐT: <strong className="text-slate-700 font-mono">{tongQuan?.SoDienThoai || '—'}</strong></span>
                {tongQuan?.TenLopHoc && (
                  <span>Lớp: <strong className="text-amber-700 font-semibold">{tongQuan.TenLopHoc}</strong></span>
                )}
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
              <div className="text-xs font-semibold">Đang tải chi tiết các bài học và thời gian học...</div>
            </div>
          ) : error ? (
            <div className="p-4 rounded-xl bg-rose-50 text-rose-800 border border-rose-200 text-xs">
              {error}
            </div>
          ) : (
            <>
              {/* 3 KPI Cards Tóm tắt */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Bài giảng đã học
                  </span>
                  <div className="text-xl font-black text-slate-800 mt-1">
                    {tongQuan?.SoBaiDaHoanThanh || 0} / {tongQuan?.TongSoBai || chiTiet.length || 0}
                  </div>
                  <span className="text-[11px] text-slate-500 font-medium">bài đã hoàn thành</span>
                </div>

                <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200/80">
                  <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider block">
                    Thời gian đã học
                  </span>
                  <div className="text-xl font-black text-amber-900 mt-1">
                    {tongGioThucTe > 0 ? `${tongGioThucTe} giờ` : `${tongPhutThucTe} phút`}
                  </div>
                  <span className="text-[11px] text-amber-700 font-medium">
                    {tongGioQuyDinh > 0 ? `Quy chuẩn: ${tongGioQuyDinh} giờ lý thuyết` : 'Chỉ tiêu đào tạo'}
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-blue-50/70 border border-blue-200/80">
                  <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider block">
                    Tiến độ tích lũy
                  </span>
                  <div className="text-xl font-black text-blue-900 mt-1">
                    {tiLeHoanThanh.toFixed(1)}%
                  </div>
                  <span className="text-[11px] text-blue-700 font-medium">
                    {tongQuan?.TrangThaiHocTap || 'Đang học'}
                  </span>
                </div>
              </div>

              {/* Bảng chi tiết bài giảng */}
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-amber-500" />
                    <span>Danh sách bài giảng & thời gian học thực tế ({filteredLessons.length} bài)</span>
                  </div>

                  <div className="relative w-full sm:w-64">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Tìm theo bài học, môn học..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-amber-400"
                    />
                  </div>
                </div>

                <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
                  <div className="overflow-x-auto max-h-[380px]">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead className="sticky top-0 z-10 bg-slate-100 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                        <tr>
                          <th className="py-2.5 px-3">#</th>
                          <th className="py-2.5 px-3">Bài Giảng</th>
                          <th className="py-2.5 px-3">Môn Học</th>
                          <th className="py-2.5 px-3 text-center">Yêu Cầu</th>
                          <th className="py-2.5 px-3 text-center">Đã Học</th>
                          <th className="py-2.5 px-3 text-center">Tình Trạng</th>
                          <th className="py-2.5 px-3 text-right">Lần Học Cuối</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white">
                        {filteredLessons.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="text-center py-12 text-slate-400 text-xs">
                              {chiTiet.length === 0
                                ? 'Học viên chưa có dữ liệu bài học nào trên hệ thống.'
                                : 'Không tìm thấy bài học nào phù hợp với từ khóa.'}
                            </td>
                          </tr>
                        ) : (
                          filteredLessons.map((item, idx) => {
                            const hocGiay = item.ThoiGianHocGiay || 0;
                            const hocPhut = Math.floor(hocGiay / 60);
                            const hocDuGiay = hocGiay % 60;
                            const daXong = item.DaHoanThanh === 1 || item.DaHoanThanh === true;

                            return (
                              <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                                <td className="py-2.5 px-3 text-slate-400 font-mono text-[11px]">
                                  {item.SoThuTu || idx + 1}
                                </td>
                                <td className="py-2.5 px-3 font-semibold text-slate-800">
                                  {item.TenBaiGiang}
                                </td>
                                <td className="py-2.5 px-3 text-slate-500 text-[11px]">
                                  {item.MonHoc || '—'}
                                </td>
                                <td className="py-2.5 px-3 text-center text-slate-600 font-medium">
                                  {item.ThoiLuongChuanPhut || item.ThoiLuongYeuCauPhut || 45} phút
                                </td>
                                <td className="py-2.5 px-3 text-center font-mono font-bold text-amber-700">
                                  {hocGiay > 0 ? `${hocPhut}p ${hocDuGiay}s` : '0p 0s'}
                                </td>
                                <td className="py-2.5 px-3 text-center">
                                  {daXong ? (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                      <CheckCircle2 className="w-3 h-3" />
                                      <span>Đã xong</span>
                                    </span>
                                  ) : hocGiay > 0 ? (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                                      <Clock className="w-3 h-3" />
                                      <span>Đang học ({Math.round(item.PhanTramHoanThanh || 0)}%)</span>
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-500">
                                      Chưa học
                                    </span>
                                  )}
                                </td>
                                <td className="py-2.5 px-3 text-right text-slate-400 font-mono text-[11px]">
                                  {item.LanHocCuoi
                                    ? new Date(item.LanHocCuoi).toLocaleDateString('vi-VN')
                                    : '—'}
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

export default StudentDetailModal;
