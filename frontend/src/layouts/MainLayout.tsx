import React, { Suspense } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Sidebar } from '../components/Sidebar';
import { Header } from '../components/Header';
import { ChangePasswordModal } from '../components/ChangePasswordModal';
import { AccountInfoModal } from '../components/AccountInfoModal';

// Loading Spinner phong cách Akkhor
const PageLoadingFallback = () => (
  <div className="flex flex-col items-center justify-center py-28 space-y-4">
    <div className="w-10 h-10 border-4 border-amber-400/20 border-t-amber-400 rounded-full animate-spin"></div>
    <div className="text-xs text-slate-500 font-semibold animate-pulse">
      Đang tải dữ liệu trang...
    </div>
  </div>
);

export const MainLayout: React.FC = () => {
  const {
    user,
    loading,
    isSidebarCollapsed,
    setIsSidebarCollapsed,
    isChangePassModalOpen,
    setIsChangePassModalOpen,
    isAccountInfoModalOpen,
    setIsAccountInfoModalOpen,
    logout,
  } = useAuth();

  // Đang kiểm tra token / profile
  if (loading) {
    return (
      <div className="min-h-screen bg-[#f0f3f8] flex items-center justify-center">
        <PageLoadingFallback />
      </div>
    );
  }

  // Nếu chưa đăng nhập -> Chuyển về màn hình đăng nhập
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Nếu là học viên -> Chuyển sang không gian học trực tuyến LMS
  if (user.maVaiTro === 'STUDENT') {
    return <Navigate to="/hoc" replace />;
  }

  // Nếu là giáo viên -> Chuyển sang không gian giảng dạy Teacher Portal
  if (user.maVaiTro === 'TEACHER') {
    return <Navigate to="/gv" replace />;
  }

  return (
    <div className="min-h-screen bg-[#f0f3f8] text-slate-800 flex">
      {/* 1. SIDEBAR CỐ ĐỊNH BÊN TRÁI */}
      <Sidebar />

      {/* 2. KHU VỰC NỘI DUNG CHÍNH (ĐẨY LÙI THEO ĐỘ RỘNG SIDEBAR) */}
      <div
        className={`flex-1 flex flex-col transition-all duration-300 min-h-screen ${
          isSidebarCollapsed ? 'ml-20' : 'ml-72'
        }`}
      >
        {/* HEADER TOP BAR RIÊNG */}
        <Header />

        {/* CONTAINER CHÍNH CHỨA CÁC TRANG CON TƯƠNG ỨNG VỚI MENU */}
        <main className="flex-1 p-6 space-y-6 max-w-7xl w-full mx-auto">
          <Suspense fallback={<PageLoadingFallback />}>
            <Outlet />
          </Suspense>
        </main>

        {/* FOOTER BẢN QUYỀN */}
        <footer className="py-4 px-6 border-t border-slate-200/80 bg-white text-xs text-slate-400 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            © 2026 Hệ thống Quản trị & E-Learning Trung tâm Đào tạo Lái xe. All rights reserved.
          </div>
          <div className="font-semibold text-slate-500">
            Phiên bản 2.0 (Akkhor Dashboard Edition - Modular Architecture)
          </div>
        </footer>
      </div>

      {/* MODALS TÀI KHOẢN & ĐỔI MẬT KHẨU */}
      <ChangePasswordModal
        isOpen={isChangePassModalOpen}
        onClose={() => setIsChangePassModalOpen(false)}
      />

      <AccountInfoModal
        isOpen={isAccountInfoModalOpen}
        onClose={() => setIsAccountInfoModalOpen(false)}
        user={user}
        onOpenChangePassword={() => {
          setIsAccountInfoModalOpen(false);
          setIsChangePassModalOpen(true);
        }}
      />
    </div>
  );
};

export default MainLayout;
