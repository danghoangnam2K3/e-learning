import React, { useState } from 'react';
import { api } from '../services/api';
import { KeyRound, X, CheckCircle2, AlertCircle } from 'lucide-react';

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({ isOpen, onClose }) => {
  const [oldPass, setOldPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPass !== confirmPass) {
      setMsg({ text: 'Mật khẩu xác nhận không trùng khớp.', type: 'error' });
      return;
    }
    setLoading(true);
    setMsg(null);
    try {
      await api.changePassword(oldPass, newPass);
      setMsg({ text: 'Đổi mật khẩu tài khoản thành công!', type: 'success' });
      setTimeout(() => {
        onClose();
        setOldPass('');
        setNewPass('');
        setConfirmPass('');
        setMsg(null);
      }, 1500);
    } catch (err: any) {
      setMsg({ text: err.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="glass-panel w-full max-w-md rounded-2xl border border-slate-700 p-6 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-slate-400 hover:text-white p-1 rounded-lg"
        >
          <X className="w-5 h-5" />
        </button>

        <h3 className="text-lg font-bold font-heading text-white flex items-center gap-2 mb-4">
          <KeyRound className="w-5 h-5 text-indigo-400" /> Đổi Mật Khẩu Tài Khoản
        </h3>

        {msg && (
          <div
            className={`flex items-center gap-2 p-3 rounded-xl text-xs font-medium border mb-4 ${
              msg.type === 'success'
                ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                : 'bg-rose-500/10 text-rose-300 border-rose-500/30'
            }`}
          >
            {msg.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            <span>{msg.text}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-sm">
          <div>
            <label className="block text-slate-300 font-medium mb-1">Mật khẩu hiện tại *</label>
            <input
              type="password"
              required
              value={oldPass}
              onChange={(e) => setOldPass(e.target.value)}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="block text-slate-300 font-medium mb-1">Mật khẩu mới (Tối thiểu 6 ký tự) *</label>
            <input
              type="password"
              required
              minLength={6}
              value={newPass}
              onChange={(e) => setNewPass(e.target.value)}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="block text-slate-300 font-medium mb-1">Xác nhận mật khẩu mới *</label>
            <input
              type="password"
              required
              minLength={6}
              value={confirmPass}
              onChange={(e) => setConfirmPass(e.target.value)}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium shadow-lg shadow-indigo-600/30"
            >
              {loading ? 'Đang cập nhật...' : 'Cập nhật mật khẩu'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
