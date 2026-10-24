import { getMediaUrl } from '../services/api';
import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  GraduationCap,
  UserCheck,
  BookOpen,
  Zap,
  FileBarChart,
  User,
  ChevronDown,
  Menu,
  Car,
  List,
  Video,
  FileText,
  Users,
  KeyRound,
  Info,
  LogOut,
  ShieldCheck,
} from 'lucide-react';

interface SidebarProps {
  activeTab?: string;
  activeSubTab?: string;
  onSelectMenu?: (tab: string, subTab?: string) => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  onLogout?: () => void;
  onOpenChangePassword?: () => void;
  onOpenAccountInfo?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = (props) => {
  const location = useLocation();
  const navigate = useNavigate();
  const auth = useAuth();

  const isCollapsed = props.isCollapsed ?? auth.isSidebarCollapsed;
  const onToggleCollapse = props.onToggleCollapse || (() => auth.setIsSidebarCollapsed(!auth.isSidebarCollapsed));
  const onLogout = props.onLogout || auth.logout;
  const onOpenChangePassword = props.onOpenChangePassword || (() => auth.setIsChangePassModalOpen(true));
  const onOpenAccountInfo = props.onOpenAccountInfo || (() => auth.setIsAccountInfoModalOpen(true));

  const pathname = location.pathname;

  // Active state matching URL paths
  const isDashboardActive = pathname === '/' || pathname === '/dashboard';
  const isStudentsActive = pathname === '/hocvien';
  const isTeachersActive = pathname === '/giaovien';
  const isCourseListActive = pathname === '/khoahoc';
  const isLessonsActive = pathname === '/baigiang';
  const isCoursesGroupActive = isCourseListActive || isLessonsActive;

  const isReport1Active = pathname === '/tudonghoa/baocao1';
  const isAssignActive = pathname === '/tudonghoa/phancong';
  const isAutomationGroupActive = isReport1Active || isAssignActive;

  const isCourseReportActive = pathname === '/baocao/khoahoc';
  const isStudentReportActive = pathname === '/baocao/hocvien';
  const isReportsGroupActive = isCourseReportActive || isStudentReportActive;

  const isAccountManagementActive = pathname === '/taikhoan/quanly';
  const isAccountGroupActive = isAccountManagementActive;

  // Accordion state
  const [openSubMenus, setOpenSubMenus] = useState<Record<string, boolean>>({
    courses: isCoursesGroupActive,
    automation: isAutomationGroupActive,
    reports: isReportsGroupActive,
    account: isAccountGroupActive,
  });

  useEffect(() => {
    if (isCoursesGroupActive) setOpenSubMenus((prev) => ({ ...prev, courses: true }));
    if (isAutomationGroupActive) setOpenSubMenus((prev) => ({ ...prev, automation: true }));
    if (isReportsGroupActive) setOpenSubMenus((prev) => ({ ...prev, reports: true }));
    if (isAccountGroupActive) setOpenSubMenus((prev) => ({ ...prev, account: true }));
  }, [pathname]);

  const toggleSubMenu = (menuKey: string) => {
    if (isCollapsed) {
      onToggleCollapse();
    }
    setOpenSubMenus((prev) => ({
      ...prev,
      [menuKey]: !prev[menuKey],
    }));
  };

  const handleNav = (path: string, legacyTab?: string, legacySubTab?: string) => {
    if (props.onSelectMenu && legacyTab) {
      props.onSelectMenu(legacyTab, legacySubTab);
    }
    navigate(path);
  };

  return (
    <aside
      className={`fixed top-0 left-0 h-screen bg-[#042954] text-slate-200 z-40 transition-all duration-300 flex flex-col shadow-2xl ${
        isCollapsed ? 'w-20' : 'w-72'
      }`}
    >
      {/* 1. Header Sidebar: Logo & Nút Thu Gọn */}
      <div className="h-20 flex items-center justify-between px-4 border-b border-white/10 bg-[#031e3e]">
        {!isCollapsed && (
          <div
            onClick={() => handleNav('/', 'dashboard')}
            className="flex items-center gap-3 overflow-hidden cursor-pointer"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-400 to-amber-500 flex items-center justify-center shadow-lg shadow-amber-500/20 text-slate-900 shrink-0">
              <Car className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div className="truncate">
              <h1 className="font-heading font-black text-sm tracking-tight text-white uppercase leading-tight truncate">
                ĐÀO TẠO LÁI XE
              </h1>
              <span className="text-[10px] text-amber-400 font-bold tracking-wider uppercase">
                Hệ thống Quản trị
              </span>
            </div>
          </div>
        )}

        {isCollapsed && (
          <div
            onClick={() => handleNav('/', 'dashboard')}
            className="w-full flex justify-center cursor-pointer"
          >
            <div className="w-10 h-10 rounded-xl bg-amber-400 flex items-center justify-center text-slate-900 shadow-md">
              <Car className="w-6 h-6 stroke-[2.5]" />
            </div>
          </div>
        )}

        <button
          onClick={onToggleCollapse}
          title={isCollapsed ? 'Mở rộng Menu' : 'Thu gọn Menu'}
          className={`p-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer ${
            isCollapsed ? 'hidden' : 'block'
          }`}
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>

      {/* 2. Danh mục Menu cuộn */}
      <div className="flex-1 overflow-y-auto py-5 px-3 space-y-1.5 scrollbar-thin">
        {/* Nút toggle khi đang thu gọn */}
        {isCollapsed && (
          <div className="flex justify-center mb-4">
            <button
              onClick={onToggleCollapse}
              title="Mở rộng thanh menu"
              className="p-2.5 rounded-xl bg-white/10 text-white hover:bg-white/20 transition-all cursor-pointer"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* --- MENU 1: DASHBOARD --- */}
        <div>
          <button
            onClick={() => handleNav('/', 'dashboard')}
            className={`w-full flex items-center gap-3.5 px-3.5 py-3 rounded-xl font-medium text-sm transition-all cursor-pointer ${
              isDashboardActive
                ? 'bg-amber-400 text-slate-950 font-bold shadow-lg shadow-amber-400/20'
                : 'text-slate-300 hover:bg-white/10 hover:text-white'
            }`}
            title="Dashboard Tổng quan"
          >
            <LayoutDashboard className="w-5 h-5 shrink-0" />
            {!isCollapsed && <span>Dashboard</span>}
          </button>
        </div>

        {/* --- MENU 2: HỌC VIÊN --- */}
        <div>
          <button
            onClick={() => handleNav('/hocvien', 'students')}
            className={`w-full flex items-center gap-3.5 px-3.5 py-3 rounded-xl font-medium text-sm transition-all cursor-pointer ${
              isStudentsActive
                ? 'bg-amber-400 text-slate-950 font-bold shadow-lg shadow-amber-400/20'
                : 'text-slate-300 hover:bg-white/10 hover:text-white'
            }`}
            title="Danh sách toàn bộ học viên"
          >
            <GraduationCap className="w-5 h-5 shrink-0" />
            {!isCollapsed && <span>Học viên</span>}
          </button>
        </div>

        {/* --- MENU 3: GIÁO VIÊN --- */}
        <div>
          <button
            onClick={() => handleNav('/giaovien', 'teachers')}
            className={`w-full flex items-center gap-3.5 px-3.5 py-3 rounded-xl font-medium text-sm transition-all cursor-pointer ${
              isTeachersActive
                ? 'bg-amber-400 text-slate-950 font-bold shadow-lg shadow-amber-400/20'
                : 'text-slate-300 hover:bg-white/10 hover:text-white'
            }`}
            title="Danh sách toàn bộ giáo viên"
          >
            <UserCheck className="w-5 h-5 shrink-0" />
            {!isCollapsed && <span>Giáo viên</span>}
          </button>
        </div>

        {/* --- MENU 4: KHÓA HỌC (Accordion) --- */}
        <div className="space-y-1">
          <button
            onClick={() => toggleSubMenu('courses')}
            className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl font-medium text-sm transition-all cursor-pointer ${
              isCoursesGroupActive
                ? 'bg-white/15 text-white'
                : 'text-slate-300 hover:bg-white/10 hover:text-white'
            }`}
            title="Khóa học & Bài giảng"
          >
            <div className="flex items-center gap-3.5">
              <BookOpen className="w-5 h-5 shrink-0" />
              {!isCollapsed && <span>Khóa học</span>}
            </div>
            {!isCollapsed && (
              <ChevronDown
                className={`w-4 h-4 transition-transform duration-200 ${
                  openSubMenus.courses ? 'rotate-180' : ''
                }`}
              />
            )}
          </button>

          {!isCollapsed && openSubMenus.courses && (
            <div className="pl-6 pr-1 py-1 space-y-1 bg-black/15 rounded-xl">
              <button
                onClick={() => handleNav('/khoahoc', 'courses', 'course-list')}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  isCourseListActive
                    ? 'text-amber-400 font-bold bg-white/10'
                    : 'text-slate-300 hover:text-white hover:bg-white/5'
                }`}
              >
                <List className="w-3.5 h-3.5" />
                <span>Danh sách khóa học</span>
              </button>
              <button
                onClick={() => handleNav('/baigiang', 'courses', 'lessons')}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  isLessonsActive
                    ? 'text-amber-400 font-bold bg-white/10'
                    : 'text-slate-300 hover:text-white hover:bg-white/5'
                }`}
              >
                <Video className="w-3.5 h-3.5" />
                <span>Bài giảng</span>
              </button>
            </div>
          )}
        </div>

        {/* --- MENU 5: TỰ ĐỘNG HÓA (Accordion) --- */}
        <div className="space-y-1">
          <button
            onClick={() => toggleSubMenu('automation')}
            className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl font-medium text-sm transition-all cursor-pointer ${
              isAutomationGroupActive
                ? 'bg-white/15 text-white'
                : 'text-slate-300 hover:bg-white/10 hover:text-white'
            }`}
            title="Tự động hóa dữ liệu XML / Excel"
          >
            <div className="flex items-center gap-3.5">
              <Zap className="w-5 h-5 shrink-0 text-amber-400" />
              {!isCollapsed && <span>Tự động hóa</span>}
            </div>
            {!isCollapsed && (
              <ChevronDown
                className={`w-4 h-4 transition-transform duration-200 ${
                  openSubMenus.automation ? 'rotate-180' : ''
                }`}
              />
            )}
          </button>

          {!isCollapsed && openSubMenus.automation && (
            <div className="pl-6 pr-1 py-1 space-y-1 bg-black/15 rounded-xl">
              <button
                onClick={() => handleNav('/tudonghoa/baocao1', 'automation', 'report1')}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  isReport1Active
                    ? 'text-amber-400 font-bold bg-white/10'
                    : 'text-slate-300 hover:text-white hover:bg-white/5'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Báo cáo 1 (.XML)</span>
              </button>
              <button
                onClick={() => handleNav('/tudonghoa/phancong', 'automation', 'assign')}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  isAssignActive
                    ? 'text-amber-400 font-bold bg-white/10'
                    : 'text-slate-300 hover:text-white hover:bg-white/5'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>Phân công (Excel)</span>
              </button>
            </div>
          )}
        </div>

        {/* --- MENU 6: BÁO CÁO (Accordion) --- */}
        <div className="space-y-1">
          <button
            onClick={() => toggleSubMenu('reports')}
            className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl font-medium text-sm transition-all cursor-pointer ${
              isReportsGroupActive
                ? 'bg-white/15 text-white'
                : 'text-slate-300 hover:bg-white/10 hover:text-white'
            }`}
            title="Báo cáo & Thống kê"
          >
            <div className="flex items-center gap-3.5">
              <FileBarChart className="w-5 h-5 shrink-0" />
              {!isCollapsed && <span>Báo cáo</span>}
            </div>
            {!isCollapsed && (
              <ChevronDown
                className={`w-4 h-4 transition-transform duration-200 ${
                  openSubMenus.reports ? 'rotate-180' : ''
                }`}
              />
            )}
          </button>

          {!isCollapsed && openSubMenus.reports && (
            <div className="pl-6 pr-1 py-1 space-y-1 bg-black/15 rounded-xl">
              <button
                onClick={() => handleNav('/baocao/khoahoc', 'reports', 'course-report')}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  isCourseReportActive
                    ? 'text-amber-400 font-bold bg-white/10'
                    : 'text-slate-300 hover:text-white hover:bg-white/5'
                }`}
              >
                <List className="w-3.5 h-3.5" />
                <span>Chi tiết từng khóa học</span>
              </button>
              <button
                onClick={() => handleNav('/baocao/hocvien', 'reports', 'student-report')}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  isStudentReportActive
                    ? 'text-amber-400 font-bold bg-white/10'
                    : 'text-slate-300 hover:text-white hover:bg-white/5'
                }`}
              >
                <GraduationCap className="w-3.5 h-3.5" />
                <span>Chi tiết từng học viên</span>
              </button>
            </div>
          )}
        </div>

        {/* --- MENU 7: TÀI KHOẢN (Accordion) --- */}
        <div className="space-y-1 pt-3 border-t border-white/10">
          <button
            onClick={() => toggleSubMenu('account')}
            className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl font-medium text-sm transition-all cursor-pointer ${
              isAccountGroupActive || openSubMenus.account
                ? 'bg-white/15 text-white'
                : 'text-slate-300 hover:bg-white/10 hover:text-white'
            }`}
            title="Tài khoản cá nhân & Quản trị"
          >
            <div className="flex items-center gap-3.5">
              <User className="w-5 h-5 shrink-0" />
              {!isCollapsed && <span>Tài khoản</span>}
            </div>
            {!isCollapsed && (
              <ChevronDown
                className={`w-4 h-4 transition-transform duration-200 ${
                  openSubMenus.account ? 'rotate-180' : ''
                }`}
              />
            )}
          </button>

          {!isCollapsed && openSubMenus.account && (
            <div className="pl-6 pr-1 py-1 space-y-1 bg-black/15 rounded-xl">
              <button
                onClick={() => handleNav('/taikhoan/quanly', 'users', 'user-list')}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  isAccountManagementActive
                    ? 'text-amber-400 font-bold bg-white/10'
                    : 'text-slate-300 hover:text-white hover:bg-white/5'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Quản lý tài khoản</span>
              </button>
              <button
                onClick={onOpenAccountInfo}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-slate-300 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
              >
                <Info className="w-3.5 h-3.5" />
                <span>Thông tin tài khoản</span>
              </button>
              <button
                onClick={onOpenChangePassword}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-slate-300 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>Đổi mật khẩu</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 3. Footer Sidebar: Nút Đăng xuất */}
      <div className="p-3 border-t border-white/10 bg-[#031e3e]">
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold text-rose-300 hover:bg-rose-500/20 hover:text-rose-200 transition-colors cursor-pointer"
          title="Đăng xuất khỏi hệ thống"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          {!isCollapsed && <span>Đăng xuất</span>}
        </button>
      </div>
    </aside>
  );
};
