import { AvatarImage } from './AvatarImage';
import { getMediaUrl } from '../services/api';
import React, { useState, useRef, useEffect } from 'react';
import { AuthUser } from '../types';
import {
  Menu,
  Search,
  Bell,
  Mail,
  User,
  KeyRound,
  LogOut,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  AlertCircle,
} from 'lucide-react';

import { useAuth } from '../context/AuthContext';

interface HeaderProps {
  user?: AuthUser;
  isSidebarCollapsed?: boolean;
  onToggleSidebar?: () => void;
  onOpenChangePassword?: () => void;
  onOpenAccountInfo?: () => void;
  onLogout?: () => void;
  searchTerm?: string;
  onSearchChange?: (term: string) => void;
}

export const Header: React.FC<HeaderProps> = (props) => {
  const auth = useAuth();

  const user = props.user || auth.user;
  const isSidebarCollapsed = props.isSidebarCollapsed ?? auth.isSidebarCollapsed;
  const onToggleSidebar = props.onToggleSidebar || (() => auth.setIsSidebarCollapsed(!auth.isSidebarCollapsed));
  const onOpenChangePassword = props.onOpenChangePassword || (() => auth.setIsChangePassModalOpen(true));
  const onOpenAccountInfo = props.onOpenAccountInfo || (() => auth.setIsAccountInfoModalOpen(true));
  const onLogout = props.onLogout || auth.logout;
  const searchTerm = props.searchTerm;
  const onSearchChange = props.onSearchChange;

  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isMsgOpen, setIsMsgOpen] = useState(false);

  const profileRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const msgRef = useRef<HTMLDivElement>(null);

  // Đóng dropdown khi click ra ngoài
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setIsProfileOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setIsNotifOpen(false);
      }
      if (msgRef.current && !msgRef.current.contains(e.target as Node)) {
        setIsMsgOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="h-20 bg-white border-b border-slate-200/80 px-6 flex items-center justify-between sticky top-0 z-30 shadow-xs">
      {/* 1. Left: Hamburger Toggle & Global Search Bar */}
      <div className="flex items-center gap-4 flex-1 max-w-xl">
        <button
          onClick={onToggleSidebar}
          title={isSidebarCollapsed ? 'Mở rộng Sidebar' : 'Thu gọn Sidebar'}
          className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer shrink-0"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Global Search Input (Akkhor Style) */}
        <div className="relative w-full max-w-md hidden sm:block">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Tìm kiếm học viên, khóa học, giáo viên . . ."
            value={searchTerm || ''}
            onChange={(e) => onSearchChange?.(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-100/80 border border-slate-200 rounded-full text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-amber-400 focus:bg-white transition-all"
          />
        </div>
      </div>

      {/* 2. Right: Action Bar (Messages, Notifications, User Profile) */}
      <div className="flex items-center gap-3">
        {/* Messages Dropdown */}
        <div className="relative" ref={msgRef}>
          <button
            onClick={() => setIsMsgOpen(!isMsgOpen)}
            className="relative p-2.5 rounded-full hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer"
            title="Tin nhắn hệ thống"
          >
            <Mail className="w-5 h-5" />
            <span className="absolute top-1 right-1 w-4 h-4 bg-emerald-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
              3
            </span>
          </button>

          {isMsgOpen && (
            <div className="absolute right-0 mt-3 w-80 bg-white border border-slate-200 rounded-2xl shadow-xl py-3 z-50 text-xs">
              <div className="px-4 py-2 border-b border-slate-100 font-bold text-slate-800 flex items-center justify-between">
                <span>Tin nhắn mới</span>
                <span className="text-[10px] px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full font-semibold">
                  3 chưa đọc
                </span>
              </div>
              <div className="divide-y divide-slate-100 max-h-64 overflow-y-auto">
                <div className="p-3 hover:bg-slate-50 transition-colors cursor-pointer flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs shrink-0">
                    GV
                  </div>
                  <div>
                    <div className="font-semibold text-slate-800">Thầy Nguyễn Văn A</div>
                    <p className="text-[11px] text-slate-500 line-clamp-1">Đã hoàn thành phân công lớp B2-K24</p>
                    <span className="text-[10px] text-slate-400">10 phút trước</span>
                  </div>
                </div>
                <div className="p-3 hover:bg-slate-50 transition-colors cursor-pointer flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center font-bold text-xs shrink-0">
                    HV
                  </div>
                  <div>
                    <div className="font-semibold text-slate-800">Lê Quang C</div>
                    <p className="text-[11px] text-slate-500 line-clamp-1">Yêu cầu mở lại bài giảng số 3</p>
                    <span className="text-[10px] text-slate-400">1 giờ trước</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Notifications Dropdown */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setIsNotifOpen(!isNotifOpen)}
            className="relative p-2.5 rounded-full hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer"
            title="Thông báo"
          >
            <Bell className="w-5 h-5" />
            <span className="absolute top-1 right-1 w-4 h-4 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
              2
            </span>
          </button>

          {isNotifOpen && (
            <div className="absolute right-0 mt-3 w-80 bg-white border border-slate-200 rounded-2xl shadow-xl py-3 z-50 text-xs">
              <div className="px-4 py-2 border-b border-slate-100 font-bold text-slate-800 flex items-center justify-between">
                <span>Thông báo đào tạo</span>
                <span className="text-[10px] px-2 py-0.5 bg-rose-100 text-rose-700 rounded-full font-semibold">
                  Mới
                </span>
              </div>
              <div className="divide-y divide-slate-100 max-h-64 overflow-y-auto">
                <div className="p-3 hover:bg-slate-50 transition-colors cursor-pointer flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-semibold text-slate-800">Hạn nộp Báo cáo 1 Sở GTVT</div>
                    <p className="text-[11px] text-slate-500">Khóa B2-2026/01 cần nộp trước ngày 28/10</p>
                    <span className="text-[10px] text-rose-500 font-medium">Quan trọng</span>
                  </div>
                </div>
                <div className="p-3 hover:bg-slate-50 transition-colors cursor-pointer flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-semibold text-slate-800">Tự động bóc tách XML</div>
                    <p className="text-[11px] text-slate-500">Đã nạp thành công danh sách 150 học viên</p>
                    <span className="text-[10px] text-slate-400">2 giờ trước</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* User Profile Dropdown (Akkhor Style) */}
        <div className="relative pl-2 border-l border-slate-200" ref={profileRef}>
          <button
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="flex items-center gap-3 p-1.5 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer text-left"
          >
            <AvatarImage
              src={user?.avatarUrl}
              alt={user?.hoVaTen}
              className="w-10 h-10 rounded-full object-cover border-2 border-amber-400 shadow-md"
              fallback={
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#042954] to-indigo-700 flex items-center justify-center text-white font-bold text-sm shadow-md">
                  {user?.hoVaTen ? user.hoVaTen.charAt(0).toUpperCase() : 'A'}
                </div>
              }
            />
            <div className="hidden md:block">
              <div className="font-bold text-xs text-slate-800 leading-tight">
                {user?.hoVaTen || user?.tenDangNhap || 'Tài khoản'}
              </div>
              <div className="text-[10px] font-semibold text-amber-600 uppercase tracking-wider flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" />
                <span>{user?.tenVaiTro || user?.maVaiTro || 'Quản trị viên'}</span>
              </div>
            </div>
          </button>

          {isProfileOpen && (
            <div className="absolute right-0 mt-3 w-56 bg-white border border-slate-200 rounded-2xl shadow-xl py-2 z-50 text-xs">
              <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/50">
                <p className="font-bold text-slate-800">{user?.hoVaTen || user?.tenDangNhap}</p>
                <p className="text-[11px] text-slate-500 truncate">{user?.email || user?.tenDangNhap}</p>
              </div>

              <div className="py-1">
                <button
                  onClick={() => {
                    setIsProfileOpen(false);
                    onOpenAccountInfo();
                  }}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  <User className="w-4 h-4 text-slate-500" />
                  <span>Thông tin tài khoản</span>
                </button>

                <button
                  onClick={() => {
                    setIsProfileOpen(false);
                    onOpenChangePassword();
                  }}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  <KeyRound className="w-4 h-4 text-slate-500" />
                  <span>Đổi mật khẩu</span>
                </button>
              </div>

              <div className="pt-1 border-t border-slate-100">
                <button
                  onClick={() => {
                    setIsProfileOpen(false);
                    onLogout();
                  }}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-rose-600 hover:bg-rose-50 font-semibold transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Đăng xuất</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
