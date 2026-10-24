import { getMediaUrl } from '../services/api';
import React, { useState, Suspense } from 'react';
import { Outlet, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  BookOpen,
  UserCheck,
  Car,
  Menu,
  LogOut,
  KeyRound,
  ShieldCheck,
  GraduationCap,
  HelpCircle,
} from 'lucide-react';
import { ChangePasswordModal } from '../components/ChangePasswordModal';

const PageLoadingFallback = () => (
  <div className="flex flex-col items-center justify-center py-28 space-y-4">
    <div className="w-10 h-10 border-4 border-amber-400/20 border-t-amber-400 rounded-full animate-spin"></div>
    <div className="text-xs text-slate-500 font-semibold animate-pulse">
      Đang tải dữ liệu học tập...
    </div>
  </div>
);

export const StudentLayout: React.FC = () => {
  const { user, loading, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isChangePassOpen, setIsChangePassOpen] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f0f3f8] flex items-center justify-center">
        <PageLoadingFallback />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Active check
  const pathname = location.pathname;
  const isCoursesActive = pathname === '/hoc' || pathname.startsWith('/hoc/khoahoc');
  const isAccountActive = pathname === '/hoc/taikhoan';

  return (
    <div className="min-h-screen bg-[#f0f3f8] text-slate-800 flex">
      {/* 1. SIDEBAR DÀNH CHO HỌC VIÊN - PHONG CÁCH AKKHOR DASHBOARD */}
      <aside
        className={`fixed top-0 left-0 bottom-0 z-40 bg-[#0c1322] border-r border-slate-800 flex flex-col transition-all duration-300 ${
          isCollapsed ? 'w-20' : 'w-72'
        }`}
      >
        {/* Brand Header */}
        <div className="h-20 flex items-center justify-between px-5 border-b border-slate-800/80 bg-[#080d18]">
          {!isCollapsed && (
            <div
              onClick={() => navigate('/hoc/khoahoc')}
              className="flex items-center gap-3 cursor-pointer group"
            >
              <div className="w-10 h-10 rounded-xl bg-amber-400 flex items-center justify-center text-slate-900 shadow-lg shadow-amber-400/20 group-hover:scale-105 transition-transform">
                <Car className="w-6 h-6 stroke-[2.5]" />
              </div>
              <div className="flex flex-col">
                <span className="font-heading font-black text-sm text-white tracking-wider flex items-center gap-1.5">
                  LMS LÁI XE
                  <span className="px-1.5 py-0.5 rounded text-[9px] bg-amber-400/20 text-amber-300 font-bold border border-amber-400/30">
                    HỌC VIÊN
                  </span>
                </span>
                <span className="text-[10px] text-amber-400 font-bold tracking-wider uppercase">
                  Cổng Học Trực Tuyến
                </span>
              </div>
            </div>
          )}

          {isCollapsed && (
            <div
              onClick={() => navigate('/hoc/khoahoc')}
              className="w-full flex justify-center cursor-pointer"
            >
              <div className="w-10 h-10 rounded-xl bg-amber-400 flex items-center justify-center text-slate-900 shadow-md">
                <Car className="w-6 h-6 stroke-[2.5]" />
              </div>
            </div>
          )}

          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            title={isCollapsed ? 'Mở rộng Menu' : 'Thu gọn Menu'}
            className={`p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer ${
              isCollapsed ? 'hidden' : 'block'
            }`}
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Items (Chỉ 2 Menu: Khóa học của tôi & Thông tin tài khoản) */}
        <div className="flex-1 overflow-y-auto py-6 px-3.5 space-y-2 scrollbar-thin">
          {isCollapsed && (
            <div className="flex justify-center mb-4">
              <button
                onClick={() => setIsCollapsed(false)}
                title="Mở rộng menu"
                className="p-2.5 rounded-xl bg-white/10 text-white hover:bg-white/20 transition-all cursor-pointer"
              >
                <Menu className="w-5 h-5" />
              </button>
            </div>
          )}

          {/* Menu 1: Khóa học của tôi */}
          <button
            onClick={() => navigate('/hoc/khoahoc')}
            className={`w-full flex items-center gap-3.5 px-3.5 py-3.5 rounded-xl font-medium text-sm transition-all cursor-pointer ${
              isCoursesActive
                ? 'bg-amber-400 text-slate-950 font-bold shadow-lg shadow-amber-400/20'
                : 'text-slate-300 hover:bg-white/10 hover:text-white'
            }`}
            title="Khóa học của tôi"
          >
            <BookOpen className="w-5 h-5 shrink-0" />
            {!isCollapsed && (
              <div className="flex-1 text-left flex items-center justify-between">
                <span>Khóa học của tôi</span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    isCoursesActive
                      ? 'bg-slate-900 text-amber-300'
                      : 'bg-white/10 text-slate-300'
                  }`}
                >
                  LMS
                </span>
              </div>
            )}
          </button>

          {/* Menu 2: Thông tin tài khoản */}
          <button
            onClick={() => navigate('/hoc/taikhoan')}
            className={`w-full flex items-center gap-3.5 px-3.5 py-3.5 rounded-xl font-medium text-sm transition-all cursor-pointer ${
              isAccountActive
                ? 'bg-amber-400 text-slate-950 font-bold shadow-lg shadow-amber-400/20'
                : 'text-slate-300 hover:bg-white/10 hover:text-white'
            }`}
            title="Thông tin tài khoản"
          >
            <UserCheck className="w-5 h-5 shrink-0" />
            {!isCollapsed && (
              <div className="flex-1 text-left flex items-center justify-between">
                <span>Thông tin tài khoản</span>
                <ShieldCheck className="w-4 h-4 opacity-70" />
              </div>
            )}
          </button>
        </div>

        {/* User Card & Logout Bottom */}
        <div className="p-3.5 border-t border-slate-800/80 bg-[#080d18]">
          <div
            className={`flex items-center ${
              isCollapsed ? 'justify-center' : 'justify-between'
            } gap-2`}
          >
            {!isCollapsed && (
              <div className="flex items-center gap-2.5 overflow-hidden">
                {user.avatarUrl ? (
                  <img
                    src={getMediaUrl(user.avatarUrl)}
                    alt={user.hoVaTen}
                    className="w-9 h-9 rounded-xl object-cover border border-amber-400 shadow-sm shrink-0"
                  />
                ) : (
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-300 flex items-center justify-center text-slate-950 font-black text-sm shrink-0 shadow-sm">
                    {user.hoVaTen ? user.hoVaTen.charAt(0).toUpperCase() : 'H'}
                  </div>
                )}
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-bold text-white truncate">
                    {user.hoVaTen || user.tenDangNhap}
                  </span>
                  <span className="text-[10px] text-amber-400 font-medium truncate">
                    Mã HV: #{user.maNguoiDung}
                  </span>
                </div>
              </div>
            )}

            <button
              onClick={logout}
              title="Đăng xuất"
              className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </aside>

      {/* 2. KHU VỰC NỘI DUNG CHÍNH */}
      <div
        className={`flex-1 flex flex-col transition-all duration-300 min-h-screen ${
          isCollapsed ? 'ml-20' : 'ml-72'
        }`}
      >
        {/* TOP HEADER DÀNH CHO HỌC VIÊN */}
        <header className="h-20 bg-white border-b border-slate-200/80 px-6 sm:px-8 flex items-center justify-between sticky top-0 z-30 shadow-sm">
          <div className="flex items-center gap-4">
            <div>
              <h2 className="text-base sm:text-lg font-heading font-black text-slate-900 flex items-center gap-2">
                <span>Hệ Thống Học Trực Tuyến Lý Thuyết GPLX</span>
                <span className="hidden md:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  Đang hoạt động
                </span>
              </h2>
              <p className="text-xs text-slate-400 font-medium hidden sm:block">
                Tự động đồng bộ và giám sát thời gian học lý thuyết đạt chuẩn Sở GTVT
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Quick Profile Pill */}
            <div
              onClick={() => navigate('/hoc/taikhoan')}
              className="flex items-center gap-3 p-1.5 pr-3 rounded-2xl hover:bg-slate-50 border border-transparent hover:border-slate-200 cursor-pointer transition-all"
            >
              {user.avatarUrl ? (
                <img
                  src={getMediaUrl(user.avatarUrl)}
                  alt={user.hoVaTen}
                  className="w-9 h-9 rounded-xl object-cover border border-amber-400 shadow-sm shrink-0"
                />
              ) : (
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-400 to-amber-200 flex items-center justify-center font-bold text-slate-900 text-sm shadow-sm shrink-0">
                  {user.hoVaTen ? user.hoVaTen.charAt(0).toUpperCase() : 'H'}
                </div>
              )}
              <div className="hidden sm:flex flex-col text-left">
                <span className="text-xs font-bold text-slate-800">
                  {user.hoVaTen || user.tenDangNhap}
                </span>
                <span className="text-[10px] font-semibold text-slate-400">
                  Học viên trung tâm
                </span>
              </div>
            </div>

            {/* Đổi mật khẩu nhanh */}
            <button
              onClick={() => setIsChangePassOpen(true)}
              title="Đổi mật khẩu"
              className="p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:text-amber-600 hover:bg-amber-50 hover:border-amber-200 transition-all cursor-pointer"
            >
              <KeyRound className="w-4 h-4" />
            </button>

            {/* Đăng xuất */}
            <button
              onClick={logout}
              title="Đăng xuất"
              className="p-2.5 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 transition-all cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* CONTAINER CHÍNH */}
        <main className="flex-1 p-6 sm:p-8 max-w-7xl w-full mx-auto">
          <Suspense fallback={<PageLoadingFallback />}>
            <Outlet />
          </Suspense>
        </main>

        {/* FOOTER BẢN QUYỀN */}
        <footer className="py-4 px-8 border-t border-slate-200/80 bg-white text-xs text-slate-400 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            © 2026 Cổng Học Trực Tuyến Đào Tạo Lái Xe - Chuẩn hóa Báo cáo 1 Sở GTVT.
          </div>
          <div className="font-semibold text-slate-500">
            Hỗ trợ học tập 24/7 | Bản quyền Trung tâm Đào tạo
          </div>
        </footer>
      </div>

      {/* MODAL ĐỔI MẬT KHẨU */}
      <ChangePasswordModal
        isOpen={isChangePassOpen}
        onClose={() => setIsChangePassOpen(false)}
      />
    </div>
  );
};

export default StudentLayout;
