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
} from 'lucide-react';

export const StudentProgressReportView: React.FC = () => {
  const [students, setStudents] = useState<UserItem[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null);
  const [reportData, setReportData] = useState<{
    tongQuanHocVien: any;
    chiTietBaiGiang: any[];
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [studentSearch, setStudentSearch] = useState('');

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
    tongQuan &&
    (tongQuan.XetTotNghiep === 'ĐỦ ĐIỀU KIỆN' ||
      tongQuan.DuDieuKienSatHach === 1 ||
      tongQuan.TiLeHoanThanh >= 100);

  return (
    <div className="space-y-6">
      {/* 1. Header */}
      <div>
        <h2 className="text-xl font-black font-heading tracking-tight text-slate-800 uppercase flex items-center gap-2.5">
          <GraduationCap className="w-6 h-6 text-amber-500" />
          <span>Báo Cáo Chi Tiết Tiến Độ Từng Học Viên</span>
        </h2>
        <p className="text-xs text-slate-500 font-medium">
          Xem chi tiết từng bài học, thời gian học tích lũy và xét duyệt điều kiện thi tốt nghiệp sát hạch
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* CỘT TRÁI: DANH SÁCH CHỌN HỌC VIÊN (Cột 4) */}
        <div className="lg:col-span-4 akkhor-card p-5 space-y-4">
          <div className="space-y-1">
            <h3 className="font-heading font-bold text-sm text-slate-800">
              Chọn Học Viên Để Xem Báo Cáo
            </h3>
            <p className="text-[11px] text-slate-400">Tìm kiếm theo tên hoặc số CCCD</p>
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

          <div className="max-h-[500px] overflow-y-auto space-y-1.5 pr-1 divide-y divide-slate-100">
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

        {/* CỘT PHẢI: KẾT QUẢ BÁO CÁO CHI TIẾT CỦA HỌC VIÊN (Cột 8) */}
        <div className="lg:col-span-8 space-y-5">
          {/* TỔNG QUAN TIẾN ĐỘ & ĐIỀU KIỆN TỐT NGHIỆP */}
          <div className="akkhor-card p-6 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Hồ Sơ Học Viên
                </span>
                <h3 className="text-lg font-black font-heading text-slate-800">
                  {selectedStudent?.HoVaTen || 'Chưa chọn học viên'}
                </h3>
                <div className="flex items-center gap-3 text-xs text-slate-500 mt-1 font-mono">
                  <span>Mã: #{selectedStudent?.MaNguoiDung}</span>
                  <span>•</span>
                  <span>CCCD: {selectedStudent?.SoCCCD || '—'}</span>
                  <span>•</span>
                  <span>SĐT: {selectedStudent?.SoDienThoai || '—'}</span>
                </div>
              </div>

              {/* BADGE ĐIỀU KIỆN SÁT HẠCH (NỔI BẬT) */}
              <div>
                {isQualified ? (
                  <div className="px-4 py-2 rounded-2xl bg-emerald-500 text-white font-black text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-emerald-500/25">
                    <CheckCircle2 className="w-5 h-5 stroke-[2.5]" />
                    <span>ĐỦ ĐIỀU KIỆN TỐT NGHIỆP</span>
                  </div>
                ) : (
                  <div className="px-4 py-2 rounded-2xl bg-rose-500 text-white font-black text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-rose-500/25">
                    <XCircle className="w-5 h-5 stroke-[2.5]" />
                    <span>CHƯA ĐỦ ĐIỀU KIỆN</span>
                  </div>
                )}
              </div>
            </div>

            {/* 3 Thẻ tóm tắt thông số */}
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Đã hoàn thành</span>
                <div className="text-xl font-black text-slate-800 mt-0.5">
                  {tongQuan?.SoBaiDaHoanThanh || 0} / {tongQuan?.TongSoBaiGiang || chiTiet.length || 0}
                </div>
                <span className="text-[10px] text-slate-500 font-medium">bài giảng lý thuyết</span>
              </div>

              <div className="p-3 rounded-xl bg-amber-50/60 border border-amber-200/60">
                <span className="text-[10px] font-bold text-amber-700 uppercase">Thời gian tích lũy</span>
                <div className="text-xl font-black text-amber-800 mt-0.5">
                  {tongQuan ? Math.round((tongQuan.TongThoiGianHocGiay || 0) / 60) : 0} ph
                </div>
                <span className="text-[10px] text-amber-600 font-medium">
                  ({tongQuan?.TongThoiGianHocGiay || 0} giây thực tế)
                </span>
              </div>

              <div className="p-3 rounded-xl bg-blue-50/60 border border-blue-200/60">
                <span className="text-[10px] font-bold text-blue-700 uppercase">Tỷ lệ tiến độ</span>
                <div className="text-xl font-black text-blue-800 mt-0.5">
                  {tongQuan ? Number(tongQuan.TiLeHoanThanh || 0).toFixed(1) : 0}%
                </div>
                <span className="text-[10px] text-blue-600 font-medium">Yêu cầu tối thiểu 100%</span>
              </div>
            </div>
          </div>

          {/* BẢNG CHI TIẾT TỪNG BÀI HỌC CỦA HỌC VIÊN */}
          <div className="akkhor-card overflow-hidden">
            <div className="p-4 border-b border-slate-100 font-bold text-xs text-slate-800 flex items-center justify-between">
              <span>Chi tiết từng bài giảng đã học:</span>
              <span className="text-slate-400 font-normal">Học viên đã học bài nào và trong bao lâu</span>
            </div>

            <div className="overflow-x-auto">
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
                    paginatedChiTiet.map((item, idx) => {
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

                          <td className="py-3 px-4 text-slate-600">
                            {item.MonHoc}
                          </td>

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
        </div>
      </div>
    </div>
  );
};
