import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Car,
  ShieldCheck,
  GraduationCap,
  UserCheck,
  ArrowRight,
} from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login, quickLogin, loginLoading, loginError } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('Admin@123456');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const user = await login(username, password);
      if (user.maVaiTro === 'STUDENT') {
        navigate('/hoc');
      } else {
        navigate('/');
      }
    } catch {
      // Handled in context
    }
  };

  const handleQuick = async (uname: string) => {
    setUsername(uname);
    setPassword('Admin@123456');
    try {
      const user = await quickLogin(uname);
      if (user.maVaiTro === 'STUDENT') {
        navigate('/hoc');
      } else {
        navigate('/');
      }
    } catch {
      // Handled in context
    }
  };

  return (
    <div className="min-h-screen bg-[#f0f3f8] flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden">
      {/* Glow Effects */}
      <div className="absolute top-1/4 -left-40 w-96 h-96 bg-blue-300/30 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 -right-40 w-96 h-96 bg-amber-300/30 rounded-full blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-md relative z-10 space-y-6">
        {/* Logo & Headline */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#042954] shadow-xl text-amber-400 mb-2">
            <Car className="w-9 h-9 stroke-[2.5]" />
          </div>
          <h1 className="text-2xl font-black font-heading tracking-tight text-slate-800 uppercase">
            Hệ Thống Đào Tạo Lái Xe
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            E-Learning & Tự Động Hóa Báo Cáo Sát Hạch GPLX
          </p>
        </div>

        {/* Login Card */}
        <div className="akkhor-card p-8 border border-slate-200/80 space-y-6">
          <h2 className="text-base font-bold font-heading text-slate-800 text-center">
            Đăng Nhập Quản Trị Hệ Thống
          </h2>

          {loginError && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
              {loginError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                Tên đăng nhập
              </label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="admin"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:border-amber-400 focus:bg-white transition-colors"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                Mật khẩu
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:border-amber-400 focus:bg-white transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={loginLoading}
              className="w-full py-3 px-4 rounded-xl bg-[#042954] hover:bg-[#031e3e] text-amber-400 font-bold text-xs transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loginLoading ? (
                <span>Đang xác thực...</span>
              ) : (
                <>
                  <span>Đăng nhập ngay</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Test Accounts */}
          <div className="pt-4 border-t border-slate-100 space-y-2">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider text-center">
              Đăng nhập nhanh tài khoản mẫu:
            </div>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleQuick('admin')}
                className="p-2.5 rounded-xl bg-slate-50 hover:bg-amber-50 border border-slate-200 text-[11px] text-slate-700 font-bold transition-colors cursor-pointer text-center flex flex-col items-center gap-1"
              >
                <ShieldCheck className="w-4 h-4 text-rose-500" />
                <span>Admin</span>
              </button>
              <button
                type="button"
                onClick={() => handleQuick('gv_nguyenvana')}
                className="p-2.5 rounded-xl bg-slate-50 hover:bg-blue-50 border border-slate-200 text-[11px] text-slate-700 font-bold transition-colors cursor-pointer text-center flex flex-col items-center gap-1"
              >
                <UserCheck className="w-4 h-4 text-blue-500" />
                <span>Giáo viên</span>
              </button>
              <button
                type="button"
                onClick={() => handleQuick('hv_lequangc')}
                className="p-2.5 rounded-xl bg-slate-50 hover:bg-emerald-50 border border-slate-200 text-[11px] text-slate-700 font-bold transition-colors cursor-pointer text-center flex flex-col items-center gap-1"
              >
                <GraduationCap className="w-4 h-4 text-emerald-500" />
                <span>Học viên</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
