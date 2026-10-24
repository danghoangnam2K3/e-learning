import React, { useState, useRef, useEffect } from 'react';
import { api } from '../services/api';
import {
  FileCode2,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  Zap,
  Sparkles,
  Users,
  BookOpen,
  ArrowRight,
  Layers,
  Calendar,
  X,
} from 'lucide-react';

interface AutomationReport1Props {
  onNavigateToCourses?: () => void;
  onNavigateToStudents?: () => void;
  onNavigateToLessons?: (courseId?: number) => void;
}

export const AutomationReport1: React.FC<AutomationReport1Props> = ({
  onNavigateToCourses,
  onNavigateToStudents,
  onNavigateToLessons,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [xmlPreview, setXmlPreview] = useState<{
    tenKhoaHoc: string;
    maKhoaHoc: string;
    hangGPLX: string;
    khungBaiGiangDuKien: string;
    soHocSinh: number;
    ngayKhaiGiang: string;
    ngayBeGiang: string;
  } | null>(null);
  const [result, setResult] = useState<any | null>(null);
  const [alertMsg, setAlertMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    const handleDragOver = (e: DragEvent) => e.preventDefault();
    const handleDrop = (e: DragEvent) => e.preventDefault();
    window.addEventListener('dragover', handleDragOver);
    window.addEventListener('drop', handleDrop);
    return () => {
      window.removeEventListener('dragover', handleDragOver);
      window.removeEventListener('drop', handleDrop);
    };
  }, []);

  const showAlert = (text: string, type: 'success' | 'error') => {
    setAlertMsg({ text, type });
    setTimeout(() => setAlertMsg(null), 6000);
  };

  const processSelectedFile = (selected: File) => {
    if (!selected.name.toLowerCase().endsWith('.xml')) {
      showAlert('Vui lòng chọn đúng tệp định dạng .XML của Báo cáo 1.', 'error');
      return;
    }
    setFile(selected);
    setResult(null);

      // Phân tích nhanh client-side bằng DOMParser tiêu chuẩn của trình duyệt
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const content = event.target?.result as string;
          const parser = new DOMParser();
          const xmlDoc = parser.parseFromString(content, 'text/xml');

          const khoaHocNode = xmlDoc.getElementsByTagName('KHOA_HOC')[0];
          const tenKhoa =
            khoaHocNode?.getElementsByTagName('TEN_KHOA_HOC')[0]?.textContent ||
            'Khóa học từ Báo cáo 1';
          const maKhoa =
            khoaHocNode?.getElementsByTagName('MA_KHOA_HOC')[0]?.textContent ||
            khoaHocNode?.getElementsByTagName('SO_DANG_KY_KHOA_HOC')[0]?.textContent ||
            'Tự động tạo';
          const hang =
            khoaHocNode?.getElementsByTagName('HANG_GPLX')[0]?.textContent ||
            khoaHocNode?.getElementsByTagName('MA_HANG_DAO_TAO')[0]?.textContent ||
            'B2';
          const ngayKg =
            khoaHocNode?.getElementsByTagName('NGAY_KHAI_GIANG')[0]?.textContent || 'Chưa xác định';
          const ngayBg =
            khoaHocNode?.getElementsByTagName('NGAY_BE_GIANG')[0]?.textContent || 'Chưa xác định';
          const soHsDeclared =
            khoaHocNode?.getElementsByTagName('SO_HOC_SINH')[0]?.textContent;
          const hocVienNodes = xmlDoc.getElementsByTagName('NGUOI_LX');
          const soHocSinh = soHsDeclared ? parseInt(soHsDeclared, 10) : hocVienNodes.length;

          let khung = 'B số sàn (Hạng B2)';
          if (tenKhoa.toLowerCase().includes('tự động') || hang === 'B1') {
            khung = 'B số tự động (Hạng B1)';
          } else if (hang === 'C1' || tenKhoa.toLowerCase().includes('c1')) {
            khung = 'C1 (Hạng C1)';
          }

          setXmlPreview({
            tenKhoaHoc: tenKhoa,
            maKhoaHoc: maKhoa,
            hangGPLX: hang,
            khungBaiGiangDuKien: khung,
            soHocSinh,
            ngayKhaiGiang: ngayKg,
            ngayBeGiang: ngayBg,
          });
        } catch (err) {
          console.warn('Không thể parse preview XML:', err);
          setXmlPreview(null);
        }
      };
      reader.readAsText(selected);
  };


  const handleUploadXml = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      showAlert('Vui lòng chọn tệp .xml hợp lệ.', 'error');
      return;
    }

    setLoading(true);
    setResult(null);
    try {
      const data: any = await api.uploadReportFile(file);
      setResult(data);
      showAlert(
        data?.thongBao ||
          'Đã tiếp nhận Báo cáo 1, tự động tạo khóa học mới, gán khung bài giảng và cấp tài khoản học viên thành công!',
        'success'
      );
      setFile(null);
      setXmlPreview(null);
    } catch (err: any) {
      showAlert(err.message || 'Lỗi bóc tách tệp XML Báo cáo 1.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Header */}
      <div>
        <h2 className="text-xl font-black font-heading tracking-tight text-slate-800 uppercase flex items-center gap-2.5">
          <FileCode2 className="w-6 h-6 text-amber-500" />
          <span>Tự Động Hóa - Báo Cáo 1 (.XML)</span>
        </h2>
        <p className="text-xs text-slate-500 font-medium">
          Tiếp nhận tệp XML Báo cáo 1: Tự động khởi tạo khóa học thực tế, liên kết bài giảng mẫu tương ứng (B số sàn hoặc B số tự động) và cấp tài khoản học viên
        </p>
      </div>

      {alertMsg && (
        <div
          className={`flex items-center gap-2.5 p-4 rounded-xl text-xs font-semibold border ${
            alertMsg.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-rose-50 text-rose-800 border-rose-200'
          }`}
        >
          {alertMsg.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span>{alertMsg.text}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Upload Form (Cột 7) */}
        <div className="lg:col-span-7 akkhor-card p-6 space-y-5">
          <form onSubmit={handleUploadXml} className="space-y-5">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Tải lên Tệp Báo Cáo 1 (.XML) *
                </label>
                {file && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setFile(null);
                      setXmlPreview(null);
                      setResult(null);
                    }}
                    className="text-[11px] text-rose-600 hover:text-rose-700 font-semibold cursor-pointer flex items-center gap-1"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Xóa tệp</span>
                  </button>
                )}
              </div>

              <div
                onDragEnter={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsDragging(true);
                }}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (!isDragging) setIsDragging(true);
                }}
                onDragLeave={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (e.currentTarget.contains(e.relatedTarget as Node)) return;
                  setIsDragging(false);
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsDragging(false);
                  if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                    processSelectedFile(e.dataTransfer.files[0]);
                  }
                }}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all relative group cursor-pointer ${
                  isDragging
                    ? 'border-amber-500 bg-amber-100/60 ring-4 ring-amber-400/20 scale-[1.01]'
                    : file
                    ? 'border-emerald-300 bg-emerald-50/30 hover:border-emerald-400'
                    : 'border-slate-300 hover:border-amber-400 bg-slate-50/60 hover:bg-amber-50/20'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xml"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      processSelectedFile(e.target.files[0]);
                    }
                    e.target.value = '';
                  }}
                  className="hidden"
                />

                <div className="flex flex-col items-center justify-center space-y-3 pointer-events-none">
                  <div
                    className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-xs transition-transform group-hover:scale-110 ${
                      file
                        ? 'bg-emerald-100 text-emerald-700'
                        : isDragging
                        ? 'bg-amber-300 text-amber-900 animate-bounce'
                        : 'bg-amber-100 text-amber-700'
                    }`}
                  >
                    <UploadCloud className="w-7 h-7" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-slate-800">
                      {file
                        ? file.name
                        : isDragging
                        ? 'Thả tệp .XML vào đây ngay'
                        : 'Kéo thả hoặc nhấn để chọn tệp .XML'}
                    </div>
                    <div className="text-xs text-slate-400 mt-1">
                      {file
                        ? `${(file.size / 1024).toFixed(1)} KB - Đã đọc và phân tích cấu trúc (Nhấn để đổi)`
                        : 'Hỗ trợ tệp chuẩn XML đăng ký khóa học (ví dụ: baocao1.xml)'}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Xem trước thông tin bóc tách từ file XML */}
            {xmlPreview && (
              <div className="p-4 rounded-xl bg-amber-50/80 border border-amber-200 space-y-2.5 text-xs animate-in fade-in duration-200">
                <div className="font-bold text-slate-800 flex items-center justify-between border-b border-amber-200/80 pb-2">
                  <span className="flex items-center gap-1.5 text-amber-900">
                    <BookOpen className="w-4 h-4 text-amber-600" />
                    <span>Thông tin phát hiện trong tệp XML:</span>
                  </span>
                  <span className="px-2 py-0.5 rounded bg-amber-400 text-slate-950 font-black text-[11px]">
                    Hạng {xmlPreview.hangGPLX}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600">
                  <div>
                    <span className="text-slate-400">Khóa học sẽ tạo:</span>{' '}
                    <strong className="text-slate-800 block text-xs">{xmlPreview.tenKhoaHoc}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400">Mã khóa học:</span>{' '}
                    <strong className="text-slate-800 font-mono block text-xs">{xmlPreview.maKhoaHoc}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400">Khung bài giảng tự động ghép:</span>{' '}
                    <strong className="text-indigo-700 font-bold block text-xs">{xmlPreview.khungBaiGiangDuKien}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400">Số lượng học viên:</span>{' '}
                    <strong className="text-emerald-700 font-bold block text-xs">{xmlPreview.soHocSinh} học viên</strong>
                  </div>
                  <div className="col-span-2 text-slate-500">
                    <Calendar className="w-3.5 h-3.5 inline mr-1 text-slate-400" />
                    Khai giảng: <strong>{xmlPreview.ngayKhaiGiang}</strong> — Bế giảng: <strong>{xmlPreview.ngayBeGiang}</strong>
                  </div>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !file}
              className="w-full py-3 px-4 rounded-xl bg-amber-400 hover:bg-amber-500 disabled:opacity-50 text-slate-950 font-bold text-xs shadow-md shadow-amber-400/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-slate-900 border-t-transparent rounded-full animate-spin"></div>
                  <span>Đang bóc tách XML, tạo khóa học & gán bài giảng...</span>
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4" />
                  <span>Tiến Hành Tạo Khóa Học & Nạp Dữ Liệu Tự Động</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Workflow Info Box (Cột 5) */}
        <div className="lg:col-span-5 space-y-5">
          <div className="akkhor-card p-6 space-y-4">
            <h3 className="font-heading font-bold text-sm text-slate-800 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>Quy Trình Tự Động Hóa Nghiệp Vụ</span>
            </h3>

            <div className="space-y-3 text-xs text-slate-600">
              <div className="p-3 rounded-xl bg-amber-50/60 border border-amber-200/60 flex items-start gap-3">
                <BookOpen className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-800">1. Tạo Khóa học trong Danh sách khóa học:</strong>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Hệ thống đọc thẻ <code>&lt;KHOA_HOC&gt;</code> để sinh ra khóa học thực tế (ví dụ: <em>B số sàn KHÓA 01/2026</em>).
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-indigo-50/60 border border-indigo-200/60 flex items-start gap-3">
                <Layers className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-800">2. Tự động ghép Khung bài giảng mẫu:</strong>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Nếu là <strong>B số sàn</strong> (Hạng B2) sẽ lấy bài giảng mẫu của B số sàn; nếu là <strong>B số tự động</strong> (Hạng B1) sẽ lấy bài giảng mẫu B số tự động.
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-200/60 flex items-start gap-3">
                <Users className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-800">3. Cấp tài khoản học viên & Gán lộ trình:</strong>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Tạo tài khoản học viên (tên đăng nhập là số CCCD/CMT), ghi danh vào khóa học và tự động gán tiến độ học tập cho toàn bộ bài giảng của khung đó.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Kết quả sau khi nạp */}
          {result && (
            <div className="akkhor-card p-5 border-emerald-200 bg-emerald-50/40 space-y-3 animate-in fade-in zoom-in-95 duration-200">
              <div className="flex items-center gap-2 text-emerald-800 font-bold text-xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Nạp Báo Cáo 1 & Khởi Tạo Thành Công!</span>
              </div>
              
              <p className="text-xs text-slate-700 leading-relaxed font-medium">
                {result.thongBao}
              </p>

              {result.chiTietKhoaHoc && (
                <div className="p-3 bg-white rounded-xl border border-emerald-100 text-[11px] space-y-1.5 text-slate-600">
                  <div className="flex justify-between">
                    <span>Khóa học mới:</span>
                    <strong className="text-slate-800">{result.chiTietKhoaHoc.tenKhoaHoc}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Khung bài giảng đã gán:</span>
                    <strong className="text-indigo-700">
                      {result.chiTietKhoaHoc.khungBaiGiangMau?.tenKhung} ({result.chiTietKhoaHoc.khungBaiGiangMau?.tongSoBaiGiang} bài)
                    </strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Số học viên đã cấp tài khoản:</span>
                    <strong className="text-emerald-700">{result.chiTietKhoaHoc.soHocVien} học viên</strong>
                  </div>
                </div>
              )}

              {/* Navigation shortcuts */}
              <div className="pt-2 flex flex-col sm:flex-row items-center gap-2">
                {onNavigateToCourses && (
                  <button
                    onClick={onNavigateToCourses}
                    className="w-full sm:w-auto flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-amber-400 hover:bg-amber-500 text-slate-950 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm"
                  >
                    <span>Xem Danh Sách Khóa Học</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}

                {onNavigateToStudents && (
                  <button
                    onClick={onNavigateToStudents}
                    className="w-full sm:w-auto flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
                  >
                    <span>Xem Học Viên</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
