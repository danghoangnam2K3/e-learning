import { PaginationFooter } from './common/PaginationFooter';
import { SortableHeader } from './common/SortableHeader';
import { useClientPagination } from '../hooks/useClientPagination';
import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { UserItem } from '../types';
import {
  GraduationCap,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  BookOpen,
  Award,
  Calendar,
  AlertCircle,
  Layers,
  FileCheck,
  FileText,
  FileDown,
  Printer,
  Building,
  UserCheck,
  Phone,
  RefreshCw,
} from 'lucide-react';

export const StudentProgressReportView: React.FC = () => {
  const [students, setStudents] = useState<UserItem[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null);
  const [reportData, setReportData] = useState<{
    tongQuanHocVien: any;
    chiTietBaiGiang: any[];
    bangMonHoc?: any[];
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [exportingDocx, setExportingDocx] = useState(false);
  const [studentSearch, setStudentSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'tongQuanMon' | 'chiTietBai'>('tongQuanMon');

  // Tải danh sách học viên
  useEffect(() => {
    api.getUsers({ maVaiTro: 'STUDENT', soBanGhiMoiTrang: 100 }).then((res) => {
      const list = res.danhSach || [];
      setStudents(list);
      if (list.length > 0 && !selectedStudentId) {
        setSelectedStudentId(list[0].MaNguoiDung);
      }
    });
  }, []);

  // Tải báo cáo chi tiết khi đổi học viên
  const fetchStudentReport = async (studentId: number) => {
    setLoading(true);
    try {
      const data = await api.getStudentReport(studentId);
      setReportData(data);
    } catch (err) {
      console.error('Lỗi khi lấy báo cáo học viên:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedStudentId) {
      fetchStudentReport(selectedStudentId);
    }
  }, [selectedStudentId]);

  const selectedStudent = students.find((s) => s.MaNguoiDung === selectedStudentId);

  const filteredStudents = students.filter(
    (s) =>
      s.HoVaTen.toLowerCase().includes(studentSearch.toLowerCase()) ||
      (s.SoCCCD && s.SoCCCD.includes(studentSearch)) ||
      s.TenDangNhap.toLowerCase().includes(studentSearch.toLowerCase())
  );

  const tongQuan = reportData?.tongQuanHocVien;
  const chiTiet = reportData?.chiTietBaiGiang || [];
  const bangMonHoc = reportData?.bangMonHoc || [];

  const {
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    sortField,
    sortDirection,
    handleSort,
    paginatedData: paginatedChiTiet,
    totalItems: totalChiTietCount,
  } = useClientPagination({
    data: chiTiet,
    initialPageSize: 10,
    initialSortField: 'SoThuTu',
    initialSortDirection: 'ASC',
  });

  // Kiểm tra điều kiện tốt nghiệp
  const isQualified =
    tongQuan?.ketLuan === 'Đáp ứng' ||
    tongQuan?.TrangThaiHocTap === 'Đủ điều kiện thi' ||
    tongQuan?.TiLeHoanThanh >= 100;

  // Xuất file Word (.docx) theo chuẩn báo cáo chi tiết học viên.docx
  const handleExportWord = async () => {
    if (!selectedStudentId) return;
    setExportingDocx(true);
    try {
      const studentNameClean = (selectedStudent?.HoVaTen || 'HocVien')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/\s+/g, '_');
      const filename = `Bao_cao_chi_tiet_${studentNameClean}_${selectedStudent?.SoCCCD || selectedStudentId}.docx`;
      await api.downloadStudentReportDocx(selectedStudentId, filename);
    } catch (err: any) {
      alert(err.message || 'Lỗi khi xuất file Word báo cáo học viên.');
    } finally {
      setExportingDocx(false);
    }
  };

  // In báo cáo (Print / Save as PDF)
  const handlePrint = () => {
    window.print();
  };

  const todayStr = new Date().toLocaleDateString('vi-VN');

  return (
    <div className="space-y-6">
      {/* 1. Header & Quick Export Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-black font-heading tracking-tight text-slate-800 uppercase flex items-center gap-2.5">
            <GraduationCap className="w-6 h-6 text-amber-500" />
            <span>Báo Cáo Chi Tiết Quá Trình Đào Tạo Học Viên</span>
          </h2>
          <p className="text-xs text-slate-500 font-medium">
            Quy chuẩn theo mẫu Báo cáo quá trình đào tạo học viên của Tổng Cục ĐBVN / Sở GTVT
          </p>
        </div>

        {/* Nút hành động xuất file Word & In báo cáo */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => selectedStudentId && fetchStudentReport(selectedStudentId)}
            className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition-colors cursor-pointer"
            title="Làm mới dữ liệu"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs transition-colors cursor-pointer shadow-xs"
            title="In trực tiếp hoặc Lưu dưới dạng file PDF"
          >
            <Printer className="w-4 h-4 text-slate-500" />
            <span>In Báo Cáo</span>
          </button>

          <button
            onClick={handleExportWord}
            disabled={exportingDocx || !selectedStudentId}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-all cursor-pointer shadow-md shadow-blue-500/20 disabled:opacity-50"
            title="Tải về tệp Word (.docx) chuẩn theo biểu mẫu quy định"
          >
            <FileDown className={`w-4 h-4 ${exportingDocx ? 'animate-bounce' : ''}`} />
            <span>{exportingDocx ? 'Đang xuất Word...' : 'Xuất file Word (.docx)'}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* CỘT TRÁI: DANH SÁCH CHỌN HỌC VIÊN (4 CỘT) */}
        <div className="lg:col-span-4 akkhor-card p-5 space-y-4 print:hidden">
          <div className="space-y-1">
            <h3 className="font-heading font-bold text-sm text-slate-800">
              Chọn Học Viên Để Xem Báo Cáo
            </h3>
            <p className="text-[11px] text-slate-400">Tìm kiếm nhanh theo tên hoặc số CCCD</p>
          </div>

          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm tên, CCCD..."
              value={studentSearch}
              onChange={(e) => setStudentSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-amber-400"
            />
          </div>

          <div className="max-h-[600px] overflow-y-auto space-y-1.5 pr-1 divide-y divide-slate-100">
            {filteredStudents.map((s) => (
              <div
                key={s.MaNguoiDung}
                onClick={() => setSelectedStudentId(s.MaNguoiDung)}
                className={`p-3 rounded-xl cursor-pointer transition-all flex items-center gap-3 ${
                  selectedStudentId === s.MaNguoiDung
                    ? 'bg-amber-400 text-slate-950 font-bold shadow-md shadow-amber-400/20'
                    : 'hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                    selectedStudentId === s.MaNguoiDung
                      ? 'bg-slate-950 text-amber-400'
                      : 'bg-amber-100 text-amber-700'
                  }`}
                >
                  {s.HoVaTen ? s.HoVaTen.charAt(0).toUpperCase() : 'H'}
                </div>
                <div className="overflow-hidden">
                  <div className="text-xs truncate">{s.HoVaTen}</div>
                  <div
                    className={`text-[10px] font-mono truncate ${
                      selectedStudentId === s.MaNguoiDung ? 'text-slate-800' : 'text-slate-400'
                    }`}
                  >
                    CCCD: {s.SoCCCD || 'Chưa có'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CỘT PHẢI: NỘI DUNG VĂN BẢN BÁO CÁO (8 CỘT) */}
        <div className="lg:col-span-8 space-y-5 print:col-span-12">
          {/* KHUNG TÀI LIỆU BÁO CÁO (Chuẩn theo báo cáo chi tiết học viên.docx) */}
          <div className="akkhor-card p-6 sm:p-8 space-y-6 border border-slate-200 shadow-sm bg-white">
            {/* TIÊU ĐỀ VĂN BẢN BÁO CÁO */}
            <div className="text-center space-y-1 border-b border-slate-100 pb-5">
              <h1 className="text-lg sm:text-xl font-heading font-black text-slate-900 uppercase tracking-tight">
                BÁO CÁO QUÁ TRÌNH ĐÀO TẠO CỦA HỌC VIÊN
              </h1>
              <p className="text-xs text-slate-500 italic">
                (Ngày báo cáo: {todayStr})
              </p>
            </div>

            {/* MỤC I: THÔNG TIN HỌC VIÊN */}
            <div className="space-y-3">
              <h3 className="font-heading font-black text-sm text-slate-900 uppercase flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                <span>I. Thông tin học viên:</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-xs bg-slate-50/70 p-4 rounded-2xl border border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="text-slate-500 font-semibold w-28 shrink-0">1. Họ và tên:</span>
                  <strong className="text-slate-900 text-sm">{tongQuan?.HoVaTen || selectedStudent?.HoVaTen || '---'}</strong>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-slate-500 font-semibold w-28 shrink-0">2. Mã học viên:</span>
                  <span className="font-mono font-bold text-slate-800">{tongQuan?.SoCCCD || selectedStudent?.SoCCCD || `HV-${selectedStudent?.MaNguoiDung}`}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-slate-500 font-semibold w-28 shrink-0">3. Ngày sinh:</span>
                  <span className="font-medium text-slate-800">{tongQuan?.NgaySinh || '01-01-2000'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-slate-500 font-semibold w-28 shrink-0">4. Mã khóa học:</span>
                  <span className="font-bold text-slate-800">{tongQuan?.MaLopHocCode || tongQuan?.TenKhoaHoc || '79172K262024'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-slate-500 font-semibold w-28 shrink-0">5. Hạng đào tạo:</span>
                  <span className="px-2 py-0.5 rounded-md font-black bg-amber-100 text-amber-800 text-[11px] uppercase">
                    {tongQuan?.MaHangGPLX || 'B2'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-slate-500 font-semibold w-28 shrink-0">6. Cơ sở đào tạo:</span>
                  <span className="font-bold text-slate-800">Trung tâm GDNN - Lái Xe An Cư</span>
                </div>
              </div>
            </div>

            {/* MỤC II: THÔNG TIN QUÁ TRÌNH ĐÀO TẠO */}
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <h3 className="font-heading font-black text-sm text-slate-900 uppercase flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                  <span>II. Thông tin quá trình đào tạo:</span>
                </h3>

                {/* Tabs chuyển đổi giữa Bảng 8 Môn Chuẩn và Chi Tiết Bài Học */}
                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-bold print:hidden">
                  <button
                    onClick={() => setActiveTab('tongQuanMon')}
                    className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                      activeTab === 'tongQuanMon'
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Bảng 8 môn học chuẩn
                  </button>
                  <button
                    onClick={() => setActiveTab('chiTietBai')}
                    className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                      activeTab === 'chiTietBai'
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Chi tiết từng bài giảng ({chiTiet.length})
                  </button>
                </div>
              </div>

              {/* TAB 1: BẢNG 8 MÔN HỌC CHUẨN THEO BÁO CÁO CHI TIẾT HỌC VIÊN.DOCX */}
              {activeTab === 'tongQuanMon' && (
                <div className="space-y-4">
                  <div className="overflow-x-auto border border-slate-200 rounded-2xl overflow-hidden">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-100/80 border-b border-slate-200 text-slate-700 font-bold uppercase text-[11px]">
                          <th className="py-3 px-3 text-center w-12">STT</th>
                          <th className="py-3 px-4">Nội dung đào tạo</th>
                          <th className="py-3 px-4 text-center w-36">Thời lượng đào tạo</th>
                          <th className="py-3 px-4 text-center w-28">Tiến độ bài</th>
                          <th className="py-3 px-4 text-center w-28">Đánh giá</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {bangMonHoc.map((sub, idx) => (
                          <tr key={sub.stt} className="hover:bg-slate-50/70 transition-colors">
                            <td className="py-3 px-3 text-center font-bold text-slate-500">{idx + 1}</td>
                            <td className="py-3 px-4 font-semibold text-slate-800">{sub.tenMon}</td>
                            <td className="py-3 px-4 text-center font-mono font-bold text-blue-700">
                              {sub.thoiGianFormat}
                            </td>
                            <td className="py-3 px-4 text-center font-medium text-slate-600">
                              {sub.soBaiDaHoc} / {sub.tongSoBai} bài
                            </td>
                            <td className="py-3 px-4 text-center">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                sub.danhGia === 'Đủ điều kiện'
                                  ? 'bg-emerald-50 text-emerald-700'
                                  : 'bg-amber-50 text-amber-700'
                              }`}>
                                {sub.danhGia}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* TỔNG KẾT & KẾT LUẬN */}
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <div>
                      <span className="font-bold text-slate-700">Tổng số thời gian tích lũy: </span>
                      <strong className="font-mono text-sm font-bold text-blue-700">
                        {tongQuan?.tongThoiGianFormat || '00:00:00'}
                      </strong>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-700">Kết luận: </span>
                      <span className={`px-3 py-1 rounded-full text-xs font-black uppercase ${
                        isQualified
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : 'bg-rose-100 text-rose-800 border border-rose-300'
                      }`}>
                        {tongQuan?.ketLuan || (isQualified ? 'Đáp ứng' : 'Chưa đáp ứng')}
                      </span>
                    </div>
                  </div>

                  {/* KHUNG KÝ XÁC NHẬN (THEO CHUẨN DOCX) */}
                  <div className="pt-8 pb-4 grid grid-cols-2 text-center text-xs">
                    <div className="space-y-1">
                      <div className="font-black text-slate-800 uppercase">
                        XÁC NHẬN CỦA CƠ SỞ ĐÀO TẠO
                      </div>
                      <div className="text-[11px] text-slate-400 italic">
                        (Ký, ghi rõ họ tên và đóng dấu)
                      </div>
                      <div className="h-20"></div>
                      <div className="font-bold text-slate-700">Lãnh Đạo Trung Tâm</div>
                    </div>

                    <div className="space-y-1">
                      <div className="font-black text-slate-800 uppercase">
                        XÁC NHẬN CỦA HỌC VIÊN
                      </div>
                      <div className="text-[11px] text-slate-400 italic">
                        (Ký và ghi rõ họ tên)
                      </div>
                      <div className="h-20"></div>
                      <div className="font-bold text-slate-700">
                        {tongQuan?.HoVaTen || selectedStudent?.HoVaTen || 'Học viên'}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: CHI TIẾT TỪNG BÀI HỌC CỦA HỌC VIÊN */}
              {activeTab === 'chiTietBai' && (
                <div className="space-y-4">
                  <div className="overflow-x-auto border border-slate-200 rounded-2xl overflow-hidden">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                          <SortableHeader
                            field="TenBaiGiang"
                            currentField={sortField}
                            currentDirection={sortDirection}
                            onSort={handleSort}
                          >
                            Bài Giảng
                          </SortableHeader>
                          <SortableHeader
                            field="MonHoc"
                            currentField={sortField}
                            currentDirection={sortDirection}
                            onSort={handleSort}
                          >
                            Môn Học
                          </SortableHeader>
                          <th className="py-3 px-4 text-center">Yêu Cầu</th>
                          <SortableHeader
                            field="ThoiGianHocGiay"
                            align="center"
                            currentField={sortField}
                            currentDirection={sortDirection}
                            onSort={handleSort}
                          >
                            Đã Học
                          </SortableHeader>
                          <SortableHeader
                            field="DaHoanThanh"
                            align="center"
                            currentField={sortField}
                            currentDirection={sortDirection}
                            onSort={handleSort}
                          >
                            Tình Trạng
                          </SortableHeader>
                          <th className="py-3 px-4 text-right">Lần Học Cuối</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {totalChiTietCount === 0 ? (
                          <tr>
                            <td colSpan={6} className="text-center py-10 text-slate-400 font-medium">
                              {loading
                                ? 'Đang tải dữ liệu bài học...'
                                : 'Học viên này chưa bắt đầu bài học nào trên hệ thống E-Learning.'}
                            </td>
                          </tr>
                        ) : (
                          paginatedChiTiet.map((item: any, idx: number) => {
                            const hocGiay = item.ThoiGianHocGiay || 0;
                            const hocPhut = Math.floor(hocGiay / 60);
                            const hocDuGiay = hocGiay % 60;
                            const daXong = item.DaHoanThanh === 1 || item.DaHoanThanh === true;

                            return (
                              <tr key={idx} className="hover:bg-slate-50 transition-colors">
                                <td className="py-3 px-4">
                                  <div className="font-bold text-slate-800">
                                    {item.TenBaiGiang}
                                  </div>
                                  <div className="text-[10px] text-slate-400">
                                    Bài #{item.SoThuTu || idx + 1}
                                  </div>
                                </td>

                                <td className="py-3 px-4 text-slate-600">{item.MonHoc}</td>

                                <td className="py-3 px-4 text-center font-semibold text-slate-700">
                                  {item.ThoiLuongYeuCauPhut || item.ThoiLuongPhut || 45} phút
                                </td>

                                <td className="py-3 px-4 text-center font-mono font-bold text-amber-700">
                                  {hocPhut}p {hocDuGiay}s
                                </td>

                                <td className="py-3 px-4 text-center">
                                  {daXong ? (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700">
                                      <CheckCircle2 className="w-3 h-3" />
                                      <span>Đã hoàn thành</span>
                                    </span>
                                  ) : hocGiay > 0 ? (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700">
                                      <Clock className="w-3 h-3" />
                                      <span>Đang học ({Math.round(item.PhanTramHoanThanh || 0)}%)</span>
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-400">
                                      <span>Chưa học</span>
                                    </span>
                                  )}
                                </td>

                                <td className="py-3 px-4 text-right text-slate-400 text-[11px] font-mono">
                                  {item.LanHocCuoi
                                    ? new Date(item.LanHocCuoi).toLocaleDateString('vi-VN')
                                    : '—'}
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination Footer */}
                  <PaginationFooter
                    currentPage={currentPage}
                    pageSize={pageSize}
                    totalItems={totalChiTietCount}
                    onPageChange={setCurrentPage}
                    onPageSizeChange={setPageSize}
                    pageSizeOptions={[10, 20, 50, -1]}
                    itemName="bài học"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
