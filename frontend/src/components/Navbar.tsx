import React from 'react';
import { AuthUser } from '../types';
import { ShieldCheck, LogOut, KeyRound, Award, GraduationCap, UserCheck } from 'lucide-react';

interface NavbarProps {
  user: AuthUser;
  onLogout: () => void;
  onChangePassword: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ user, onLogout, onChangePassword }) => {
  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <ShieldCheck className="w-3.5 h-3.5" /> Quản trị viên
          </span>
        );
      case 'TEACHER':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <GraduationCap className="w-3.5 h-3.5" /> Giáo viên đào tạo
          </span>
        );
      case 'STUDENT':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <UserCheck className="w-3.5 h-3.5" /> Học viên
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full glass-panel border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-indigo-500/20 ring-1 ring-white/20">
            <Award className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold font-heading bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent leading-none">
              LMS ĐÀO TẠO LÁI XE
            </h1>
            <p className="text-[11px] text-slate-400 mt-0.5 tracking-wide uppercase font-medium">
              Trung tâm Đào tạo & Sát hạch
            </p>
          </div>
        </div>

        {/* User Info & Actions */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex flex-col items-end mr-1">
            <span className="text-sm font-medium text-slate-200">{user.hoVaTen}</span>
            <div className="mt-0.5">{getRoleBadge(user.maVaiTro)}</div>
          </div>

          <div className="h-7 w-[1px] bg-slate-800 hidden sm:block"></div>

          <button
            onClick={onChangePassword}
            title="Đổi mật khẩu"
            className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 transition-all cursor-pointer border border-transparent hover:border-slate-700"
          >
            <KeyRound className="w-4 h-4" />
          </button>

          <button
            onClick={onLogout}
            title="Đăng xuất an toàn"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 border border-rose-500/20 hover:border-rose-500/30 transition-all cursor-pointer ml-1"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Đăng xuất</span>
          </button>
        </div>
      </div>
    </header>
  );
};
