import React, { useState, Suspense } from 'react';
import { Outlet, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  BookOpen,
  GraduationCap,
  UserCheck,
  Car,
  Menu,
  LogOut,
  KeyRound,
  ShieldCheck,
  HelpCircle,
} from 'lucide-react';
import { ChangePasswordModal } from '../components/ChangePasswordModal';

const PageLoadingFallback = () => (
  <div className="flex flex-col items-center justify-center py-28 space-y-4">
    <div className="w-10 h-10 border-4 border-amber-400/20 border-t-amber-400 rounded-full animate-spin"></div>
    <div className="text-xs text-slate-500 font-semibold animate-pulse">
      Đang tải dữ liệu giảng dạy...
    </div>
  </div>
);

export const TeacherLayout: React.FC = () => {
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

  // Active path checking
  const pathname = location.pathname;
  const isCoursesActive = pathname === '/gv' || pathname.startsWith('/gv/khoahoc');
  const isStudentsActive = pathname.startsWith('/gv/hocvien');
  const isAccountActive = pathname.startsWith('/gv/taikhoan');

  return (
    <div className="min-h-screen bg-[#f0f3f8] text-slate-800 flex">
      {/* 1. SIDEBAR DÀNH CHO GIÁO VIÊN - PHONG CÁCH AKKHOR DASHBOARD */}
      <aside
        className={`fixed top-0 left-0 bottom-0 z-40 bg-[#0c1322] border-r border-slate-800 flex flex-col transition-all duration-300 ${
          isCollapsed ? 'w-20' : 'w-72'
        }`}
      >
        {/* Brand Header */}
        <div className="h-20 flex items-center justify-between px-5 border-b border-slate-800/80 bg-[#080d18]">
          
        </div>

        {/* Teacher Bottom Info Card & Logout */}
        <div className="p-3.5 border-t border-slate-800/80 bg-[#080d18]">
          <div
            className={`flex items-center ${
              isCollapsed ? 'justify-center' : 'justify-between'
            } gap-2`}
          >
            {!isCollapsed && (
              <div className="flex items-center gap-2.5 overflow-hidden">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-300 flex items-center justify-center text-slate-950 font-black text-sm shrink-0 shadow-sm">
                  {user.hoVaTen ? user.hoVaTen.charAt(0).toUpperCase() : 'G'}
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-bold text-white truncate">
                    {user.hoVaTen || user.tenDangNhap}
                  </span>
                  <span className="text-[10px] text-amber-400 font-medium truncate">
                    Giáo viên đào tạo #{user.maNguoiDung}
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
        {/* TOP HEADER DÀNH CHO GIÁO VIÊN */}
        <header className="h-20 bg-white border-b border-slate-200/80 px-6 sm:px-8 flex items-center justify-between sticky top-0 z-30 shadow-sm">
          <div className="flex items-center gap-4">
            <div>
              <h2 className="text-base sm:text-lg font-heading font-black text-slate-900 flex items-center gap-2">
                <span>Cổng Quản Lý & Giám Sát Giảng Dạy Lái Xe</span>
                <span className="hidden md:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                  Vai trò: Giáo viên
                </span>
              </h2>
              <p className="text-xs text-slate-400 font-medium hidden sm:block">
                Hệ thống theo dõi tiến độ đào tạo lý thuyết và thực hành chuẩn Sở GTVT
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Quick Profile Pill */}
            <div
              onClick={() => navigate('/gv/taikhoan')}
              className="flex items-center gap-3 p-1.5 pr-3 rounded-2xl hover:bg-slate-50 border border-transparent hover:border-slate-200 cursor-pointer transition-all"
            >
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-400 to-amber-200 flex items-center justify-center font-bold text-slate-900 text-sm shadow-sm">
                {user.hoVaTen ? user.hoVaTen.charAt(0).toUpperCase() : 'G'}
              </div>
              <div className="hidden sm:flex flex-col text-left">
                <span className="text-xs font-bold text-slate-800">
                  {user.hoVaTen || user.tenDangNhap}
                </span>
                <span className="text-[10px] font-semibold text-amber-600">
                  Giáo viên giảng dạy
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
            © 2026 Cổng Quản Lý Giảng Dạy - Trung Tâm Đào Tạo Lái Xe.
          </div>
          <div className="font-semibold text-slate-500">
            Phiên bản Giảng Viên 2.0 (Akkhor Dashboard Architecture)
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

export default TeacherLayout;
