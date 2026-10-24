import React from 'react';
import { useAuth } from '../context/AuthContext';
import { LmsPlayer } from '../components/LmsPlayer';
import { Car } from 'lucide-react';

export const LmsPage: React.FC = () => {
  const { user, logout } = useAuth();

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 flex flex-col">
      <header className="h-16 bg-slate-900 border-b border-slate-800 px-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-bold">
            <Car className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div>
            <h1 className="font-heading font-black text-sm text-white">TRUNG TÂM ĐÀO TẠO LÁI XE</h1>
            <span className="text-[10px] text-amber-400 font-bold">Không Gian Học Trực Tuyến LMS</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-xs font-semibold text-slate-300">
            Xin chào, <strong>{user.hoVaTen || user.tenDangNhap}</strong>
          </span>
          <button
            onClick={logout}
            className="px-3 py-1.5 rounded-lg bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 font-bold text-xs transition-colors cursor-pointer"
          >
            Đăng xuất
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 w-full flex-1">
        <LmsPlayer user={user} />
      </main>
    </div>
  );
};

export default LmsPage;
