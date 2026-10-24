import React, { useState, useEffect, useRef } from 'react';
import { api, getMediaUrl } from '../../services/api';
import { TeacherAssignmentsData } from '../../types';
import { useAuth } from '../../context/AuthContext';
import {
  UserCheck,
  ShieldCheck,
  Lock,
  KeyRound,
  Building,
  Info,
  Award,
  AlertCircle,
  CheckCircle2,
  Calendar,
  Users,
  Camera,
  Loader2,
} from 'lucide-react';

export const TeacherProfilePage: React.FC = () => {
  const { user, updateUser } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [data, setData] = useState<TeacherAssignmentsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Avatar Upload State
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarMsg, setAvatarMsg] = useState<{ text: string; error?: boolean } | null>(null);

  // Password Change Form State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwLoading, setPwLoading] = useState(false);
  const [pwSuccess, setPwSuccess] = useState<string | null>(null);
  const [pwError, setPwError] = useState<string | null>(null);

  const loadProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.getMyTeacherAssignments();
      setData(res);
    } catch (err: any) {
      console.error('Error loading teacher profile:', err);
      setError(err.message || 'Không thể tải thông tin hồ sơ giáo viên.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.match(/\/(jpeg|png|webp|jpg)$/i)) {
      setAvatarMsg({ text: 'Chỉ chấp nhận ảnh định dạng JPG, PNG hoặc WEBP', error: true });
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setAvatarMsg({ text: 'Dung lượng ảnh tối đa 2MB', error: true });
      return;
    }

    setUploadingAvatar(true);
    setAvatarMsg(null);
    try {
      const res = await api.uploadMyAvatar(file);
      updateUser({ avatarUrl: res.avatarUrl });
      setData((prev) =>
        prev
          ? {
              ...prev,
              thongTinGiaoVien: {
                ...prev.thongTinGiaoVien,
                AvatarUrl: res.avatarUrl,
              },
            }
          : prev,
      );
      setAvatarMsg({ text: 'Cập nhật ảnh đại diện giáo viên thành công!' });
      setTimeout(() => setAvatarMsg(null), 3500);
    } catch (err: any) {
      setAvatarMsg({ text: err.message || 'Lỗi khi tải ảnh lên máy chủ', error: true });
    } finally {
      setUploadingAvatar(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwSuccess(null);
    setPwError(null);

    if (!currentPassword || !newPassword || !confirmPassword) {
      setPwError('Vui lòng nhập đầy đủ thông tin mật khẩu.');
      return;
    }

    if (newPassword.length < 6) {
      setPwError('Mật khẩu mới phải có tối thiểu 6 ký tự.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPwError('Mật khẩu xác nhận không trùng khớp.');
      return;
    }

    try {
      setPwLoading(true);
      await api.changePassword(currentPassword, newPassword);
      setPwSuccess('Đổi mật khẩu thành công! Mật khẩu mới đã được cập nhật an toàn.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setPwError(err.message || 'Mật khẩu hiện tại không chính xác.');
    } finally {
      setPwLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center space-y-3">
        <div className="w-10 h-10 border-4 border-amber-400/20 border-t-amber-400 rounded-full animate-spin"></div>
        <span className="text-xs font-semibold text-slate-500">Đang tải hồ sơ cán bộ giảng dạy...</span>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-8 rounded-3xl bg-white border border-slate-200/80 shadow-sm max-w-lg mx-auto text-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center mx-auto">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h3 className="text-base font-bold text-slate-800">Không tải được thông tin cá nhân</h3>
        <p className="text-xs text-slate-500 leading-relaxed">{error}</p>
        <button
          onClick={loadProfile}
          className="px-4 py-2 rounded-xl bg-amber-400 text-slate-950 font-bold text-xs hover:bg-amber-300 transition-colors"
        >
          Thử lại
        </button>
      </div>
    );
  }

  const { thongTinGiaoVien, danhSachLopPhuTrach } = data;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* 1. Header Hero Card */}
      <div className="bg-gradient-to-r from-[#0c1322] via-[#162035] to-[#1e293b] rounded-3xl p-6 sm:p-8 text-white relative overflow-hidden shadow-xl border border-slate-700/50">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-4">
            {/* Clickable Avatar with Camera Overlay */}
            <div
              className="relative group cursor-pointer shrink-0"
              onClick={() => fileInputRef.current?.click()}
              title="Bấm để đổi ảnh đại diện giáo viên"
            >
              {(user?.avatarUrl || thongTinGiaoVien.AvatarUrl) ? (
                <img
                  src={getMediaUrl(user?.avatarUrl || thongTinGiaoVien.AvatarUrl)}
                  alt={thongTinGiaoVien.HoVaTen}
                  className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl object-cover border-2 border-amber-400 shadow-lg shadow-amber-400/20 transition-all group-hover:brightness-75"
                />
              ) : (
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-gradient-to-tr from-amber-500 to-amber-300 text-slate-950 font-black text-2xl flex items-center justify-center shadow-lg shadow-amber-400/20 transition-all group-hover:brightness-75">
                  {thongTinGiaoVien.HoVaTen ? thongTinGiaoVien.HoVaTen.charAt(0).toUpperCase() : 'G'}
                </div>
              )}
              <div className="absolute inset-0 rounded-3xl flex flex-col items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity bg-black/40">
                {uploadingAvatar ? (
                  <Loader2 className="w-6 h-6 animate-spin text-amber-400" />
                ) : (
                  <>
                    <Camera className="w-5 h-5 text-amber-300" />
                    <span className="text-[10px] font-bold mt-1">Đổi ảnh</span>
                  </>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handleAvatarChange}
                disabled={uploadingAvatar}
              />
            </div>

            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 rounded-full bg-amber-400/20 text-amber-300 text-[10px] font-bold border border-amber-400/30 uppercase">
                  Hồ sơ giáo viên đào tạo
                </span>
                <span className="text-xs text-slate-400">•</span>
                <span className="text-xs text-slate-300 font-mono">
                  Mã số: #{thongTinGiaoVien.MaNguoiDung}
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-heading font-black text-white">
                {thongTinGiaoVien.HoVaTen}
              </h1>
              <div className="flex flex-wrap items-center gap-2.5 mt-1.5">
                <span className="text-xs text-slate-300 font-medium">
                  Tài khoản: <strong>{thongTinGiaoVien.TenDangNhap}</strong>
                </span>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingAvatar}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-bold transition-all shadow-md shadow-amber-400/20 cursor-pointer disabled:opacity-50"
                >
                  {uploadingAvatar ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Camera className="w-3.5 h-3.5" />
                  )}
                  <span>{uploadingAvatar ? 'Đang tải lên...' : 'Đổi ảnh đại diện'}</span>
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3 py-1.5 rounded-2xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold inline-flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Cán bộ giảng dạy chính thức</span>
            </span>
          </div>
        </div>
      </div>

      {avatarMsg && (
        <div
          className={`p-3.5 rounded-2xl text-xs flex items-center gap-2.5 ${
            avatarMsg.error
              ? 'bg-rose-50 text-rose-800 border border-rose-200'
              : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
          }`}
        >
          {avatarMsg.error ? (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          )}
          <span className="font-medium">{avatarMsg.text}</span>
        </div>
      )}

      {/* 2. Official Notice Banner */}
      <div className="p-4 sm:p-5 rounded-2xl bg-amber-50 border border-amber-200/80 flex items-start gap-3.5 text-amber-900 shadow-sm">
        <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="text-xs leading-relaxed flex-1">
          <strong className="block text-amber-950 font-bold mb-0.5">
            Quy định hồ sơ giáo viên giảng dạy:
          </strong>
          Hồ sơ cán bộ giáo viên được chuẩn hóa theo danh sách đăng ký giáo viên đào tạo lái xe gửi Sở GTVT. Mọi yêu cầu thay đổi Họ tên, CCCD hoặc thông tin phân công vui lòng liên hệ Ban Giám Đốc / Phòng Đào Tạo.
        </div>
      </div>

      {/* 3. Two Columns: Read-only Profile Details + Change Password Form */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Read-Only Info (7 Columns) */}
        <div className="lg:col-span-7 bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <h3 className="font-heading font-black text-slate-900 text-base flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-amber-500" />
              <span>Thông Tin Cán Bộ Giảng Dạy (Read-Only)</span>
            </h3>
            <span className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-slate-100 text-slate-500">
              Không thể sửa
            </span>
          </div>

          {/* Form Fields Display */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
              <span className="text-slate-400 font-medium">Họ và tên giáo viên</span>
              <p className="font-bold text-slate-800 text-sm">{thongTinGiaoVien.HoVaTen}</p>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
              <span className="text-slate-400 font-medium">Tên đăng nhập (@username)</span>
              <p className="font-bold text-slate-800 text-sm font-mono">
                {thongTinGiaoVien.TenDangNhap}
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
              <span className="text-slate-400 font-medium">Số CCCD / CMND</span>
              <p className="font-bold text-slate-800 text-sm font-mono">
                {thongTinGiaoVien.SoCCCD || 'Chưa cập nhật'}
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
              <span className="text-slate-400 font-medium">Số điện thoại liên hệ</span>
              <p className="font-bold text-slate-800 text-sm font-mono">
                {thongTinGiaoVien.SoDienThoai || 'Chưa cập nhật'}
              </p>
            </div>

            <div className="sm:col-span-2 p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
              <span className="text-slate-400 font-medium">Địa chỉ Email</span>
              <p className="font-bold text-slate-800 text-sm">
                {thongTinGiaoVien.Email || 'Chưa cập nhật'}
              </p>
            </div>
          </div>

          {/* Assigned Classes */}
          <div className="pt-2">
            <h4 className="text-xs font-heading font-black text-slate-800 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Building className="w-4 h-4 text-amber-500" />
              <span>Các lớp đang phụ trách ({danhSachLopPhuTrach.length})</span>
            </h4>

            <div className="space-y-2.5">
              {danhSachLopPhuTrach.map((lop) => (
                <div
                  key={lop.MaLopHoc}
                  className="p-3.5 rounded-2xl bg-slate-50/80 border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                >
                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-bold text-slate-900">{lop.TenLopHoc}</span>
                      <span className="px-2 py-0.5 rounded bg-amber-400/20 text-amber-700 font-bold text-[10px]">
                        Hạng {lop.MaHangGPLX}
                      </span>
                    </div>
                    <span className="text-slate-500 text-[11px]">
                      Sĩ số lớp: <strong>{lop.SiSoHocVien}</strong> HV • Phụ trách:{' '}
                      <strong>{lop.SoHocVienPhuTrachTrongLop}</strong> HV
                    </span>
                  </div>

                  <span className="px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-[11px] font-bold self-start sm:self-auto">
                    {lop.LaGiaoVienChuNhiem ? 'Chủ nhiệm' : 'Hướng dẫn'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Self-Service Change Password (5 Columns) */}
        <div className="lg:col-span-5 bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-5">
          <div className="border-b border-slate-100 pb-4">
            <h3 className="font-heading font-black text-slate-900 text-base flex items-center gap-2">
              <KeyRound className="w-5 h-5 text-amber-500" />
              <span>Đổi Mật Khẩu Cá Nhân</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Tự bảo vệ tài khoản giảng dạy bằng việc đổi mật khẩu định kỳ
            </p>
          </div>

          {pwSuccess && (
            <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-start gap-2.5 text-xs text-emerald-800">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>{pwSuccess}</span>
            </div>
          )}

          {pwError && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 flex items-start gap-2.5 text-xs text-rose-800">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{pwError}</span>
            </div>
          )}

          <form onSubmit={handleChangePassword} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">
                Mật khẩu hiện tại *
              </label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Nhập mật khẩu đang dùng"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-xs focus:outline-none focus:ring-2 focus:ring-amber-400/30 focus:border-amber-400 transition-all font-medium"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">
                Mật khẩu mới *
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Tối thiểu 6 ký tự"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-xs focus:outline-none focus:ring-2 focus:ring-amber-400/30 focus:border-amber-400 transition-all font-medium"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">
                Xác nhận mật khẩu mới *
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Nhập lại mật khẩu mới"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-xs focus:outline-none focus:ring-2 focus:ring-amber-400/30 focus:border-amber-400 transition-all font-medium"
              />
            </div>

            <button
              type="submit"
              disabled={pwLoading}
              className="w-full py-3 rounded-xl bg-amber-400 text-slate-950 font-bold text-xs hover:bg-amber-300 transition-all shadow-md shadow-amber-400/20 disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
            >
              <Lock className="w-4 h-4" />
              <span>{pwLoading ? 'Đang cập nhật...' : 'Cập nhật mật khẩu'}</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default TeacherProfilePage;
