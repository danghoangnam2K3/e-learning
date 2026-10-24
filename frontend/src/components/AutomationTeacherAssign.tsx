import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { ClassItem } from '../types';
import {
  FileSpreadsheet,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  Users,
  UserCheck,
  Zap,
  ArrowRight,
  ShieldAlert,
  ShieldCheck,
  FileCheck,
  RefreshCw,
  Search,
  ExternalLink,
  UserPlus,
  AlertTriangle,
  X,
  CreditCard,
  Phone,
} from 'lucide-react';

interface TeacherStatus {
  tenExcel: string;
  tonTaiTrongHeThong: boolean;
  thongTinGV: {
    MaNguoiDung: number;
    HoVaTen: string;
    TenDangNhap: string;
  } | null;
}

interface AssignmentItem {
  rowNum: number;
  hoTenHocVienExcel: string;
  soCCCDExcel: string;
  soDienThoaiExcel: string;
  tenGiaoVienExcel: string;
  giaoVienHopLe: boolean;
  thongTinGiaoVien: {
    maGiaoVien: number;
    hoVaTen: string;
    tenDangNhap: string;
  } | null;
  hocVienTrongLop: {
    maHocVien: number;
    maDangKy: number;
    hoVaTen: string;
    soCCCD: string;
    tenGiaoVienHienTai: string;
  } | null;
  trangThaiKhopHocVien: boolean;
}

interface PreviewResult {
  lopHoc: any;
  tongSoPhanCongExcel: number;
  tongSoHocVienTrongLop: number;
  soHocVienKhop: number;
  danhSachGiaoVienTrongFile: TeacherStatus[];
  giaoVienChuaCoTaiKhoan: string[];
  hopLe: boolean;
  thongBao: string;
  chiTietPhanCong: AssignmentItem[];
}

export const AutomationTeacherAssign: React.FC = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<number>(0);
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [loading, setLoading] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [alertMsg, setAlertMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [previewData, setPreviewData] = useState<PreviewResult | null>(null);

  // Filter trong bảng preview
  const [filterTeacher, setFilterTeacher] = useState<string>('ALL');
  const [previewSearch, setPreviewSearch] = useState<string>('');

  // Ngăn chặn trình duyệt mở file mặc định khi kéo thả ở bất cứ đâu trên trang
  useEffect(() => {
    const handleWindowDragOver = (e: DragEvent) => {
      e.preventDefault();
    };
    const handleWindowDrop = (e: DragEvent) => {
      e.preventDefault();
    };
    window.addEventListener('dragover', handleWindowDragOver);
    window.addEventListener('drop', handleWindowDrop);
    return () => {
      window.removeEventListener('dragover', handleWindowDragOver);
      window.removeEventListener('drop', handleWindowDrop);
    };
  }, []);

  const fetchClasses = async () => {
    try {
      const data = await api.getClasses(true);
      setClasses(data);
      if (data.length > 0 && selectedClassId === 0) {
        setSelectedClassId(data[0].MaLopHoc);
      }
    } catch (err: any) {
      showAlert(err.message || 'Lỗi tải danh sách lớp học.', 'error');
    }
  };

  useEffect(() => {
    fetchClasses();
  }, []);

  // Tự động phân tích file khi file hoặc lớp học thay đổi
  useEffect(() => {
    if (file && selectedClassId) {
      handleAnalyzeFile(file, selectedClassId);
    }
  }, [selectedClassId]);

  const showAlert = (text: string, type: 'success' | 'error') => {
    setAlertMsg({ text, type });
    setTimeout(() => setAlertMsg(null), 6000);
  };

  // Gọi API phân tích và đối soát file Excel
  const handleAnalyzeFile = async (uploadedFile: File, classId: number) => {
    setPreviewLoading(true);
    setPreviewData(null);
    try {
      const res: any = await api.previewTeacherAssign(classId, uploadedFile);
      // api.request đã tự unwrap json.data, xử lý an toàn cho cả hai trường hợp
      const data: PreviewResult =
        res && res.hopLe !== undefined ? res : (res?.data ?? res);

      setPreviewData(data);
      if (data && !data.hopLe && data.giaoVienChuaCoTaiKhoan && data.giaoVienChuaCoTaiKhoan.length > 0) {
        showAlert(
          `Không tìm thấy giáo viên phụ trách: ${data.giaoVienChuaCoTaiKhoan.map((t: string) => `"${t}"`).join(', ')}. Vui lòng tạo tài khoản giáo viên trước khi phân công!`,
          'error',
        );
      } else {
        showAlert('Đã đối soát tệp Excel thành công! Toàn bộ giáo viên đều hợp lệ.', 'success');
      }
    } catch (err: any) {
      showAlert(err.message || 'Lỗi đọc tệp Excel phân công.', 'error');
    } finally {
      setPreviewLoading(false);
    }
  };

  // Xử lý tệp đã chọn từ cả 2 nguồn (Click chọn file hoặc Kéo thả Dropzone)
  const processSelectedFile = (selected: File) => {
    const ext = selected.name.toLowerCase();
    if (!ext.endsWith('.xlsx') && !ext.endsWith('.xls')) {
      showAlert('Vui lòng chọn đúng tệp Excel định dạng .xlsx hoặc .xls (ví dụ: PHAN_GIAO_VIEN.xlsx).', 'error');
      return;
    }
    setFile(selected);
    if (selectedClassId) {
      handleAnalyzeFile(selected, selectedClassId);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processSelectedFile(e.target.files[0]);
    }
    e.target.value = '';
  };

  // Xác nhận & lưu phân công vào CSDL
  const handleExecuteAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !selectedClassId) {
      showAlert('Vui lòng chọn lớp học và tệp Excel phân công.', 'error');
      return;
    }

    if (previewData && !previewData.hopLe) {
      showAlert(
        `Không tìm thấy giáo viên phụ trách: ${previewData.giaoVienChuaCoTaiKhoan.map((t: string) => `"${t}"`).join(', ')}. Vui lòng tạo tài khoản giáo viên trước khi phân công!`,
        'error',
      );
      return;
    }

    setLoading(true);
    try {
      const res: any = await api.assignTeachersExcel(selectedClassId, file);
      const data = res && res.thongBao !== undefined ? res : (res?.data ?? res);
      showAlert(
        data?.thongBao || 'Hệ thống đã tự động phân công học viên cho từng giáo viên theo đúng file Excel!',
        'success',
      );
      // Refresh lại preview sau khi lưu
      handleAnalyzeFile(file, selectedClassId);
      fetchClasses();
    } catch (err: any) {
      showAlert(err.message || 'Lỗi xử lý file phân công Excel.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Lọc danh sách phân công an toàn tránh null
  const filteredAssignments = (previewData?.chiTietPhanCong || []).filter((item) => {
    const matchTeacher = filterTeacher === 'ALL' || item.tenGiaoVienExcel === filterTeacher;
    const s = (previewSearch || '').trim().toLowerCase();
    const matchSearch =
      !s ||
      (item.hoTenHocVienExcel && item.hoTenHocVienExcel.toLowerCase().includes(s)) ||
      (item.soCCCDExcel && String(item.soCCCDExcel).toLowerCase().includes(s)) ||
      (item.tenGiaoVienExcel && item.tenGiaoVienExcel.toLowerCase().includes(s));
    return matchTeacher && matchSearch;
  });

  const selectedClass = classes.find((c) => c.MaLopHoc === selectedClassId);

  return (
    <div className="space-y-6">
      {/* 1. Header & Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
            <span>Tự động hóa</span>
            <span>/</span>
            <span className="text-amber-500">Phân công giáo viên (Excel)</span>
          </div>
          <h1 className="text-2xl font-black font-heading text-slate-900 tracking-tight flex items-center gap-2.5">
            <FileSpreadsheet className="w-7 h-7 text-amber-500" />
            <span>Tự Động Hóa - Phân Công Giáo Viên Qua Excel</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Nạp tệp Excel (chuẩn bảng kê như <strong className="text-slate-700 font-mono">PHAN_GIAO_VIEN.xlsx</strong>) để tự động phân bổ giáo viên phụ trách học viên và lưu vào CSDL.
          </p>
        </div>

        <button
          onClick={() => {
            if (file && selectedClassId) handleAnalyzeFile(file, selectedClassId);
            fetchClasses();
          }}
          disabled={loading || previewLoading}
          className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs shadow-sm transition-all cursor-pointer self-start sm:self-auto"
        >
          <RefreshCw className={`w-4 h-4 ${previewLoading ? 'animate-spin text-amber-500' : ''}`} />
          <span>Làm mới đối soát</span>
        </button>
      </div>

      {/* Thông báo Alert */}
      {alertMsg && (
        <div
          className={`flex items-center justify-between gap-3 p-4 rounded-xl text-xs font-semibold border shadow-md animate-in fade-in slide-in-from-top-2 ${
            alertMsg.type === 'success'
              ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
              : 'bg-rose-50 text-rose-900 border-rose-200'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {alertMsg.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            )}
            <span>{alertMsg.text}</span>
          </div>
          <button onClick={() => setAlertMsg(null)} className="text-slate-400 hover:text-slate-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Cảnh báo lỗi thiếu giáo viên phụ trách */}
      {previewData && !previewData.hopLe && previewData.giaoVienChuaCoTaiKhoan.length > 0 && (
        <div className="p-5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 shadow-sm space-y-3">
          <div className="flex items-start gap-3">
            <ShieldAlert className="w-6 h-6 text-rose-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h3 className="text-sm font-bold font-heading text-rose-900">
                Phát hiện giáo viên chưa có tài khoản trên hệ thống!
              </h3>
              <p className="text-xs text-rose-700 leading-relaxed">
                Tệp Excel chỉ định phân công cho các giáo viên:{' '}
                {previewData.giaoVienChuaCoTaiKhoan.map((name, idx) => (
                  <span
                    key={idx}
                    className="inline-block mx-1 px-2 py-0.5 rounded-lg bg-rose-200/70 text-rose-900 font-bold font-mono text-xs"
                  >
                    {name}
                  </span>
                ))}{' '}
                nhưng hệ thống không tìm thấy tài khoản giáo viên tương ứng trong CSDL.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-1 pl-9">
            <button
              onClick={() => navigate('/giaovien')}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-sm transition-all cursor-pointer"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Đến trang Giáo viên để tạo tài khoản</span>
            </button>
            <button
              onClick={() => navigate('/taikhoan/quanly')}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-rose-300 bg-white hover:bg-rose-50 text-rose-800 font-semibold text-xs transition-all cursor-pointer"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Quản lý tài khoản</span>
            </button>
          </div>
        </div>
      )}

      {/* Grid 2 cột: Upload Form & Live Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* CỘT TRÁI (5 Cột): Form Tải Lên & Danh Sách Giáo Viên Trong File */}
        <div className="lg:col-span-5 space-y-5">
          <div className="akkhor-card p-6 space-y-5">
            <form onSubmit={handleExecuteAssignment} className="space-y-5">
              {/* Bước 1: Chọn Khóa / Lớp học */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  1. Chọn Khóa / Lớp học cần áp dụng phân công *
                </label>
                <select
                  value={selectedClassId}
                  onChange={(e) => setSelectedClassId(Number(e.target.value))}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-amber-400 focus:bg-white transition-all cursor-pointer"
                >
                  {classes.map((c) => (
                    <option key={c.MaLopHoc} value={c.MaLopHoc}>
                      {c.TenLopHoc} ({c.MaLopHocCode}) - Hạng {c.MaHangGPLX} ({c.SiSoHocVien || 0} học viên)
                    </option>
                  ))}
                </select>

                {selectedClass && (
                  <div className="mt-2 p-2.5 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between text-[11px] text-slate-600">
                    <span>
                      Sĩ số lớp: <strong className="text-slate-900">{selectedClass.SiSoHocVien || 0}</strong> học viên
                    </span>
                    <span>
                      GV phụ trách chính:{' '}
                      <strong className="text-amber-600">{selectedClass.TenGiaoVien || 'Chưa gán'}</strong>
                    </span>
                  </div>
                )}
              </div>

              {/* Bước 2: Tải lên file Excel */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    2. Tải lên Tệp Excel Phân Công (.xlsx hoặc .xls) *
                  </label>
                  {file && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setFile(null);
                        setPreviewData(null);
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
                  className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all relative group cursor-pointer ${
                    isDragging
                      ? 'border-amber-500 bg-amber-100/60 ring-4 ring-amber-400/20 scale-[1.01]'
                      : file
                      ? 'border-emerald-300 bg-emerald-50/30 hover:border-emerald-400'
                      : 'border-slate-300 hover:border-amber-400 bg-slate-50/50 hover:bg-amber-50/20'
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={handleFileInputChange}
                    className="hidden"
                  />

                  <div className="flex flex-col items-center justify-center space-y-2.5 pointer-events-none">
                    <div
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-xs transition-transform group-hover:scale-105 ${
                        file
                          ? 'bg-emerald-100 text-emerald-700'
                          : isDragging
                          ? 'bg-amber-300 text-amber-900 animate-bounce'
                          : 'bg-amber-100 text-amber-600'
                      }`}
                    >
                      {file ? (
                        <FileSpreadsheet className="w-6 h-6" />
                      ) : isDragging ? (
                        <UploadCloud className="w-6 h-6" />
                      ) : (
                        <FileSpreadsheet className="w-6 h-6" />
                      )}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-800">
                        {file
                          ? file.name
                          : isDragging
                          ? 'Thả tệp Excel vào đây ngay'
                          : 'Kéo thả hoặc nhấn để chọn tệp Excel phân công'}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        {file
                          ? `${(file.size / 1024).toFixed(1)} KB - Đã phân tích đối soát (Nhấn để đổi tệp)`
                          : 'Hỗ trợ tệp Bảng kê học viên (PHAN_GIAO_VIEN.xlsx) hoặc danh sách nhóm'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Danh sách giáo viên trong file Excel & trạng thái kiểm tra */}
              {previewData && (
                <div className="space-y-2.5 pt-2 border-t border-slate-100">
                  <div className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center justify-between">
                    <span>3. Đối soát giáo viên trong file</span>
                    <span className="text-[11px] font-semibold text-slate-500">
                      {previewData.danhSachGiaoVienTrongFile.length} giáo viên
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    {previewData.danhSachGiaoVienTrongFile.map((gv, idx) => (
                      <div
                        key={idx}
                        className={`p-2.5 rounded-xl border flex items-center justify-between text-xs transition-all ${
                          gv.tonTaiTrongHeThong
                            ? 'bg-emerald-50/60 border-emerald-200 text-emerald-900'
                            : 'bg-rose-50/60 border-rose-200 text-rose-900'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          {gv.tonTaiTrongHeThong ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          ) : (
                            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                          )}
                          <div>
                            <div className="font-bold">{gv.tenExcel}</div>
                            {gv.tonTaiTrongHeThong && gv.thongTinGV && (
                              <div className="text-[10px] text-emerald-700 font-mono">
                                ID #{gv.thongTinGV.MaNguoiDung} • @{gv.thongTinGV.TenDangNhap}
                              </div>
                            )}
                          </div>
                        </div>

                        <div>
                          {gv.tonTaiTrongHeThong ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                              Hợp lệ
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
                              Chưa có tài khoản
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Nút Thực Thi */}
              <button
                type="submit"
                disabled={loading || previewLoading || !file || (previewData !== null && !previewData.hopLe)}
                className={`w-full py-3 px-4 rounded-xl font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  previewData && !previewData.hopLe
                    ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                    : 'bg-amber-400 hover:bg-amber-500 text-slate-950 shadow-amber-400/20'
                }`}
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></div>
                    <span>Đang cập nhật phân công vào CSDL...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4" />
                    <span>Xác Nhận & Lưu Phân Công Tự Động</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* CỘT PHẢI (7 Cột): Bản Xem Trước Phân Công Chi Tiết */}
        <div className="lg:col-span-7 space-y-5">
          <div className="akkhor-card p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <h3 className="font-heading font-bold text-sm text-slate-900 flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-amber-500" />
                  <span>Bản Xem Trước Phân Công (Preview)</span>
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Kiểm tra đối soát các cặp Học viên - Giáo viên trước khi ghi vào hệ thống
                </p>
              </div>

              {previewData && (
                <div className="flex items-center gap-2 text-xs">
                  <span className="px-2.5 py-1 rounded-lg bg-slate-100 font-bold text-slate-700">
                    {previewData.soHocVienKhop} / {previewData.tongSoHocVienTrongLop} khớp
                  </span>
                  {previewData.hopLe ? (
                    <span className="px-2.5 py-1 rounded-lg bg-emerald-100 font-bold text-emerald-800 flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5" /> Hợp lệ
                    </span>
                  ) : (
                    <span className="px-2.5 py-1 rounded-lg bg-rose-100 font-bold text-rose-800 flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5" /> Cần sửa
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Filter bar trong preview */}
            {previewData && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Tìm theo học viên, CCCD, giáo viên..."
                    value={previewSearch}
                    onChange={(e) => setPreviewSearch(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1">
                  <span className="text-[11px] text-slate-400 shrink-0">Giáo viên:</span>
                  <select
                    value={filterTeacher}
                    onChange={(e) => setFilterTeacher(e.target.value)}
                    className="w-full bg-transparent text-xs text-slate-800 font-medium focus:outline-none cursor-pointer"
                  >
                    <option value="ALL">Tất cả giáo viên</option>
                    {previewData.danhSachGiaoVienTrongFile.map((gv, idx) => (
                      <option key={idx} value={gv.tenExcel}>
                        {gv.tenExcel} {gv.tonTaiTrongHeThong ? '(Hợp lệ)' : '(Chưa có TK)'}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* Loading Skeleton */}
            {previewLoading && (
              <div className="py-16 text-center text-slate-500 space-y-2">
                <div className="w-8 h-8 border-3 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto"></div>
                <div className="text-xs font-semibold text-slate-700">Đang phân tích tệp Excel & đối soát dữ liệu...</div>
              </div>
            )}

            {/* Danh sách phân công chi tiết */}
            {!previewLoading && previewData && (
              <div className="space-y-2 max-h-[520px] overflow-y-auto pr-1">
                {filteredAssignments.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 text-xs">
                    Không tìm thấy cặp phân công nào phù hợp với bộ lọc tìm kiếm.
                  </div>
                ) : (
                  filteredAssignments.map((item, idx) => (
                    <div
                      key={idx}
                      className={`p-3 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs transition-all ${
                        item.giaoVienHopLe && item.trangThaiKhopHocVien
                          ? 'bg-white hover:bg-slate-50/80 border-slate-200/80'
                          : 'bg-rose-50/40 border-rose-200/80'
                      }`}
                    >
                      {/* Học viên */}
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-amber-400/20 text-amber-700 font-bold flex items-center justify-center text-xs shrink-0">
                          {idx + 1}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                            <span>{item.hoTenHocVienExcel}</span>
                            {item.trangThaiKhopHocVien ? (
                              <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                                Khớp lớp
                              </span>
                            ) : (
                              <span className="text-[10px] font-semibold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">
                                Chưa trong lớp
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5 font-mono">
                            <span>CCCD: {item.soCCCDExcel || '—'}</span>
                            {item.soDienThoaiExcel && (
                              <>
                                <span>•</span>
                                <span>ĐT: {item.soDienThoaiExcel}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      <ArrowRight className="w-4 h-4 text-slate-300 hidden sm:block shrink-0" />

                      {/* Giáo viên phụ trách */}
                      <div className="flex items-center gap-2.5 sm:text-right sm:justify-end">
                        <div>
                          <div className="font-bold text-slate-800 flex items-center gap-1.5 sm:justify-end">
                            <span>{item.tenGiaoVienExcel}</span>
                            {item.giaoVienHopLe ? (
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                            ) : (
                              <AlertCircle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                            )}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            {item.giaoVienHopLe && item.thongTinGiaoVien ? (
                              <span className="text-emerald-700 font-medium">
                                Đã liên kết: @{item.thongTinGiaoVien.tenDangNhap} (ID #{item.thongTinGiaoVien.maGiaoVien})
                              </span>
                            ) : (
                              <span className="text-rose-600 font-bold">Chưa có tài khoản trên hệ thống</span>
                            )}
                          </div>
                        </div>
                        <div
                          className={`w-8 h-8 rounded-xl font-bold flex items-center justify-center text-xs shrink-0 ${
                            item.giaoVienHopLe ? 'bg-blue-50 text-blue-700' : 'bg-rose-100 text-rose-700'
                          }`}
                        >
                          GV
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Chưa tải file */}
            {!previewLoading && !previewData && (
              <div className="p-12 text-center text-slate-400 text-xs border border-dashed border-slate-200 rounded-2xl space-y-2">
                <FileSpreadsheet className="w-10 h-10 text-slate-300 mx-auto" />
                <div className="font-semibold text-slate-600">Chưa có tệp Excel nào được chọn</div>
                <p className="max-w-sm mx-auto text-[11px] text-slate-400">
                  Vui lòng chọn khóa học và tải lên tệp Excel phân công (ví dụ: <strong className="text-slate-600">PHAN_GIAO_VIEN.xlsx</strong>) để hệ thống tự động bóc tách và đối soát.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AutomationTeacherAssign;
