import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { ClassItem } from '../types';
import {
  UploadCloud,
  FileSpreadsheet,
  FileCode2,
  CheckCircle2,
  AlertCircle,
  Zap,
  ArrowRight,
  Database,
  Sparkles,
} from 'lucide-react';

export const AutomationUpload: React.FC = () => {
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<number>(0);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any | null>(null);
  const [alertMsg, setAlertMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    api.getClasses().then((data) => {
      setClasses(data);
      if (data.length > 0) setSelectedClassId(data[0].MaLopHoc);
    });
  }, []);

  const showAlert = (text: string, type: 'success' | 'error') => {
    setAlertMsg({ text, type });
    setTimeout(() => setAlertMsg(null), 5000);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setResult(null);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !selectedClassId) {
      showAlert('Vui lòng chọn lớp học và tệp báo cáo hợp lệ (.xlsx, .xls hoặc .xml).', 'error');
      return;
    }

    setLoading(true);
    setResult(null);
    try {
      const data = await api.uploadReportFile(selectedClassId, file);
      setResult(data);
      showAlert('Tự động hóa bóc tách và nạp dữ liệu học viên thành công!', 'success');
      setFile(null);
    } catch (err: any) {
      showAlert(err.message || 'Lỗi bóc tách tệp dữ liệu.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {alertMsg && (
        <div
          className={`flex items-center gap-2 p-4 rounded-xl text-sm font-medium border ${
            alertMsg.type === 'success'
              ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
              : 'bg-rose-500/10 text-rose-300 border-rose-500/30'
          }`}
        >
          {alertMsg.type === 'success' ? <CheckCircle2 className="w-5 h-5 shrink-0" /> : <AlertCircle className="w-5 h-5 shrink-0" />}
          <span>{alertMsg.text}</span>
        </div>
      )}

      {/* Header */}
      <div>
        <h2 className="text-xl font-bold font-heading text-white flex items-center gap-2">
          <Zap className="w-5 h-5 text-amber-400" /> Tự động hóa Dữ liệu Báo cáo (AUTO_MOD)
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Tiếp nhận file báo cáo cứng (XML/Excel), tự động tạo tài khoản hàng loạt và gán toàn bộ lộ trình bài giảng đào tạo
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upload Form */}
        <div className="lg:col-span-2 glass-panel p-6 rounded-2xl border border-slate-800 space-y-5">
          <form onSubmit={handleUpload} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-200 mb-2">
                1. Chọn Lớp đào tạo tiếp nhận học viên *
              </label>
              <select
                value={selectedClassId}
                onChange={(e) => setSelectedClassId(Number(e.target.value))}
                className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700/80 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
              >
                {classes.map((c) => (
                  <option key={c.MaLopHoc} value={c.MaLopHoc}>
                    {c.TenLopHoc} ({c.MaLopHocCode}) - Hạng {c.MaHangGPLX}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-200 mb-2">
                2. Tải lên Tệp báo cáo chuẩn (.xlsx, .xls hoặc .xml) *
              </label>

              <div className="border-2 border-dashed border-slate-700/80 hover:border-indigo-500/60 rounded-2xl p-8 text-center transition-all bg-slate-900/40 relative">
                <input
                  type="file"
                  accept=".xlsx,.xls,.xml"
                  onChange={handleFileChange}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                />
                <div className="flex flex-col items-center">
                  <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mb-3 ring-1 ring-indigo-500/20">
                    <UploadCloud className="w-7 h-7" />
                  </div>
                  {file ? (
                    <div>
                      <p className="text-sm font-bold text-white">{file.name}</p>
                      <p className="text-xs text-slate-400 mt-1">{(file.size / 1024).toFixed(1)} KB - Nhấp để thay đổi</p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-sm font-medium text-slate-300">
                        Kéo thả file vào đây hoặc <span className="text-indigo-400 font-semibold underline">Duyệt tệp tin</span>
                      </p>
                      <p className="text-xs text-slate-500 mt-1">Hỗ trợ định dạng Microsoft Excel (.xlsx, .xls) và Báo cáo XML (.xml)</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !file}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-medium text-sm transition-all shadow-lg shadow-indigo-600/25 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {loading ? (
                <span>Đang bóc tách và nạp CSDL...</span>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" /> Bắt đầu Phân tích & Khởi tạo Tự động
                </>
              )}
            </button>
          </form>

          {/* Result view */}
          {result && (
            <div className="mt-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 space-y-2">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                <CheckCircle2 className="w-5 h-5" /> Tự động hóa hoàn tất
              </div>
              <p className="text-xs text-slate-300">
                Đã xử lý: <strong className="text-white">{result.tongSoHocVienXuLy}</strong> học viên từ tệp báo cáo.
              </p>
              <div className="text-xs text-slate-400 font-mono bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
                {JSON.stringify(result.ketQua, null, 2)}
              </div>
            </div>
          )}
        </div>

        {/* Instructions & Specs */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
          <h3 className="text-sm font-bold font-heading text-white flex items-center gap-2">
            <Database className="w-4 h-4 text-indigo-400" /> Quy trình tự động hóa (ETL)
          </h3>
          <ul className="space-y-3 text-xs text-slate-300">
            <li className="flex items-start gap-2">
              <span className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">1</span>
              <span><strong>Bóc tách ngầm:</strong> Trích xuất dữ liệu họ tên, số CCCD, điện thoại, email từ các cột chuẩn.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">2</span>
              <span><strong>Tạo tài khoản:</strong> Tự động sinh tài khoản học viên (vai trò `STUDENT`) với mật khẩu khởi tạo an toàn.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">3</span>
              <span><strong>Gán lộ trình học:</strong> Đối chiếu bài giảng mẫu từ `COURSE_MOD` và khởi tạo bản ghi tiến độ học tập sẵn sàng.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">4</span>
              <span><strong>Toàn vẹn Transaction:</strong> Đảm bảo 100% dữ liệu được thực thi trong một giao dịch duy nhất tại DB.</span>
            </li>
          </ul>

          <div className="pt-3 border-t border-slate-800/80">
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">Định dạng cột Excel hỗ trợ</div>
            <div className="text-xs text-slate-300 bg-slate-900/80 p-2.5 rounded-lg border border-slate-800 space-y-1 font-mono">
              <div>Họ và tên | Họ tên</div>
              <div>Số CCCD | CCCD | CMND</div>
              <div>Số điện thoại | Phone</div>
              <div>Email</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
