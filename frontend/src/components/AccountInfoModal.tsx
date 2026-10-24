import React, { useState, useRef } from 'react';
import { AuthUser } from '../types';
import { api, getMediaUrl } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  User,
  ShieldCheck,
  Phone,
  Mail,
  CreditCard,
  Calendar,
  X,
  KeyRound,
  Camera,
  Loader2,
  CheckCircle2,
} from 'lucide-react';

interface AccountInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: AuthUser;
  onOpenChangePassword: () => void;
}

export const AccountInfoModal: React.FC<AccountInfoModalProps> = ({
  isOpen,
  onClose,
  user: propUser,
  onOpenChangePassword,
}) => {
  const { user: authUser, updateUser } = useAuth();
  const user = authUser || propUser;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [msg, setMsg] = useState<{ text: string; error?: boolean } | null>(null);

  if (!isOpen) return null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.match(/\/(jpeg|png|webp|jpg)$/i)) {
      setMsg({ text: 'Chỉ chấp nhận ảnh định dạng JPG, PNG hoặc WEBP', error: true });
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setMsg({ text: 'Dung lượng ảnh tối đa 2MB', error: true });
      return;
    }

    setUploading(true);
    setMsg(null);
    try {
      const res = await api.uploadMyAvatar(file);
      updateUser({ avatarUrl: res.avatarUrl });
      setMsg({ text: 'Cập nhật ảnh đại diện thành công!' });
      setTimeout(() => setMsg(null), 3000);
    } catch (err: any) {
      setMsg({ text: err.message || 'Lỗi khi tải ảnh lên máy chủ', error: true });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-5 animate-in fade-in zoom-in-95 duration-200">
        {/* Header Modal */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="font-heading font-bold text-base text-slate-800 flex items-center gap-2">
            <User className="w-5 h-5 text-amber-500" />
            <span>Thông Tin Tài Khoản Cá Nhân</span>
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Profile Card with Avatar Upload */}
        <div className="flex items-center gap-4 p-4 rounded-2xl bg-amber-50/60 border border-amber-200/60">
          <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
            {user.avatarUrl ? (
              <img
                src={getMediaUrl(user.avatarUrl)}
                alt={user.hoVaTen}
                className="w-16 h-16 rounded-2xl object-cover border-2 border-amber-400 shadow-md transition-all group-hover:brightness-75"
              />
            ) : (
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#042954] to-indigo-700 text-white font-black text-2xl flex items-center justify-center shadow-md transition-all group-hover:brightness-75">
                {user.hoVaTen ? user.hoVaTen.charAt(0).toUpperCase() : 'A'}
              </div>
            )}
            <div className="absolute inset-0 rounded-2xl flex flex-col items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity bg-black/40">
              {uploading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Camera className="w-5 h-5" />
                  <span className="text-[9px] font-bold mt-0.5">Đổi ảnh</span>
                </>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handleFileChange}
              disabled={uploading}
            />
          </div>

          <div className="flex-1">
            <div className="font-heading font-bold text-base text-slate-800">
              {user.hoVaTen || user.tenDangNhap}
            </div>
            <div className="inline-flex items-center gap-1.5 mt-0.5 px-2.5 py-0.5 rounded-full bg-amber-400 text-slate-950 font-black text-[10px] uppercase tracking-wider">
              <ShieldCheck className="w-3 h-3" />
              <span>{user.tenVaiTro || user.maVaiTro}</span>
            </div>
            <div className="mt-2 flex items-center gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs transition-colors shadow-sm cursor-pointer disabled:opacity-50"
              >
                {uploading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Camera className="w-3.5 h-3.5" />
                )}
                <span>{uploading ? 'Đang tải lên...' : 'Đổi ảnh đại diện'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Message Alert */}
        {msg && (
          <div
            className={`p-2.5 rounded-xl text-xs flex items-center gap-2 ${
              msg.error ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
            }`}
          >
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{msg.text}</span>
          </div>
        )}

        {/* Detailed Fields */}
        <div className="space-y-3 text-xs divide-y divide-slate-100">
          <div className="flex items-center justify-between pt-2">
            <span className="text-slate-400 font-medium flex items-center gap-2">
              <User className="w-3.5 h-3.5" />
              Tên đăng nhập:
            </span>
            <span className="font-mono font-bold text-slate-800">{user.tenDangNhap}</span>
          </div>

          <div className="flex items-center justify-between pt-2">
            <span className="text-slate-400 font-medium flex items-center gap-2">
              <CreditCard className="w-3.5 h-3.5" />
              Số CCCD:
            </span>
            <span className="font-mono font-bold text-slate-800">{user.soCCCD || 'Chưa cập nhật'}</span>
          </div>

          <div className="flex items-center justify-between pt-2">
            <span className="text-slate-400 font-medium flex items-center gap-2">
              <Phone className="w-3.5 h-3.5" />
              Số điện thoại:
            </span>
            <span className="font-medium text-slate-800">{user.soDienThoai || 'Chưa cập nhật'}</span>
          </div>

          <div className="flex items-center justify-between pt-2">
            <span className="text-slate-400 font-medium flex items-center gap-2">
              <Mail className="w-3.5 h-3.5" />
              Email:
            </span>
            <span className="font-medium text-slate-800">{user.email || 'Chưa cập nhật'}</span>
          </div>

          <div className="flex items-center justify-between pt-2">
            <span className="text-slate-400 font-medium flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5" />
              Trạng thái:
            </span>
            <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold text-[10px]">
              Đang hoạt động
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="pt-2 flex items-center justify-between border-t border-slate-100">
          <button
            onClick={() => {
              onClose();
              onOpenChangePassword();
            }}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-amber-700 hover:bg-amber-50 font-bold text-xs transition-colors cursor-pointer"
          >
            <KeyRound className="w-4 h-4" />
            <span>Đổi mật khẩu</span>
          </button>

          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
