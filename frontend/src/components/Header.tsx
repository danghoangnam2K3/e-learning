import { AvatarImage } from './AvatarImage';
import { getMediaUrl } from '../services/api';
import React, { useState, useRef, useEffect } from 'react';
import { AuthUser } from '../types';
import {
  Menu,
  Search,
  User,
  KeyRound,
  LogOut,
  ShieldCheck,
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

  const profileRef = useRef<HTMLDivElement>(null);

  // Đóng dropdown khi click ra ngoài
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setIsProfileOpen(false);
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
        {/* User Profile Dropdown (Akkhor Style) */}
        <div className="relative" ref={profileRef}>
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
