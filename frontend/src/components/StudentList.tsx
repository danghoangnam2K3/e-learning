import { getMediaUrl } from '../services/api';
import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { UserItem, PaginationMeta } from '../types';
import { useDebounce } from '../hooks/useDebounce';
import { StudentDetailModal } from './StudentDetailModal';
import {
  GraduationCap,
  Search,
  Plus,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Trash2,
  Edit2,
  ChevronLeft,
  ChevronRight,
  Shield,
  Phone,
  Mail,
  CreditCard,
  KeyRound,
  X,
  AlertTriangle,
  Lock,
  UserCheck,
} from 'lucide-react';

export const StudentList: React.FC = () => {
  const [students, setStudents] = useState<UserItem[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta>({
    trangHienTai: 1,
    soBanGhiMoiTrang: 10,
    tongSoBanGhi: 0,
    tongSoTrang: 1,
  });
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'LOCKED'>('ALL');
  const debouncedSearch = useDebounce(searchTerm, 350);

  // Modal xem chi tiết học viên (bài học đã học & thời gian học)
  const [viewingStudentId, setViewingStudentId] = useState<number | null>(null);

  // Modal tạo học viên mới
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    tenDangNhap: '',
    matKhau: '123456',
    hoVaTen: '',
    soCCCD: '',
    soDienThoai: '',
    email: '',
  });

  // Modal chỉnh sửa học viên (theo đúng quyền admin trong skill_admin.md)
  const [editingStudent, setEditingStudent] = useState<UserItem | null>(null);
  const [editFormData, setEditFormData] = useState({
    hoVaTen: '',
    tenDangNhap: '',
    soCCCD: '',
    soDienThoai: '',
    email: '',
    matKhau: '',
    trangThai: true,
  });

  // Modal đặt lại mật khẩu nhanh (Reset Password)
  const [resetPassStudent, setResetPassStudent] = useState<UserItem | null>(null);
  const [newResetPassword, setNewResetPassword] = useState('123456');

  // Modal xác nhận xóa
  const [deleteModalStudent, setDeleteModalStudent] = useState<UserItem | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchStudents = async (
    page: number = 1,
    keyword: string = debouncedSearch,
    status: 'ALL' | 'ACTIVE' | 'LOCKED' = statusFilter
  ) => {
    setLoading(true);
    try {
      const trangThaiParam = status === 'ACTIVE' ? 1 : status === 'LOCKED' ? 0 : undefined;
      const res = await api.getUsers({
        maVaiTro: 'STUDENT',
        tuKhoa: keyword || undefined,
        trangThai: trangThaiParam,
        trangHienTai: page,
        soBanGhiMoiTrang: 10,
      });
      setStudents(res.danhSach || []);
      setPagination(res.phanTrang);
    } catch (err) {
      console.error('Lỗi khi lấy danh sách học viên:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents(1, debouncedSearch, statusFilter);
  }, [debouncedSearch, statusFilter]);

  // Chuyển đổi trạng thái học tập nhanh (Đang học / Tạm khóa)
  const handleToggleStatus = async (user: UserItem) => {
    const newStatus = !user.TrangThai;
    setStudents((prev) =>
      prev.map((item) =>
        item.MaNguoiDung === user.MaNguoiDung ? { ...item, TrangThai: newStatus } : item
      )
    );
    try {
      await api.changeUserStatus(user.MaNguoiDung, newStatus);
    } catch (err) {
      setStudents((prev) =>
        prev.map((item) =>
          item.MaNguoiDung === user.MaNguoiDung ? { ...item, TrangThai: user.TrangThai } : item
        )
      );
      alert('Không thể đổi trạng thái học viên.');
    }
  };

  // Thêm học viên mới
  const handleCreateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.createUser({
        ...formData,
        maVaiTro: 'STUDENT',
      });
      setIsAddModalOpen(false);
      setFormData({
        tenDangNhap: '',
        matKhau: '123456',
        hoVaTen: '',
        soCCCD: '',
        soDienThoai: '',
        email: '',
      });
      fetchStudents(1);
      alert('Đã thêm học viên mới thành công!');
    } catch (err: any) {
      alert(err.message || 'Lỗi khi tạo học viên.');
    } finally {
      setSubmitting(false);
    }
  };

  // Mở modal sửa thông tin học viên (Admin có quyền sửa: Họ tên, Tên đăng nhập, CCCD, SĐT, Email, Mật khẩu, Trạng thái)
  const handleOpenEdit = (student: UserItem) => {
    setEditingStudent(student);
    setEditFormData({
      hoVaTen: student.HoVaTen,
      tenDangNhap: student.TenDangNhap,
      soCCCD: student.SoCCCD || '',
      soDienThoai: student.SoDienThoai || '',
      email: student.Email || '',
      matKhau: '',
      trangThai: student.TrangThai,
    });
  };

  // Lưu thông tin học viên đã sửa
  const handleUpdateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent) return;
    setSubmitting(true);
    try {
      await api.updateUser(editingStudent.MaNguoiDung, {
        hoVaTen: editFormData.hoVaTen,
        tenDangNhap: editFormData.tenDangNhap !== editingStudent.TenDangNhap ? editFormData.tenDangNhap : undefined,
        soCCCD: editFormData.soCCCD || undefined,
        soDienThoai: editFormData.soDienThoai || undefined,
        email: editFormData.email || undefined,
        matKhau: editFormData.matKhau.trim() ? editFormData.matKhau.trim() : undefined,
        trangThai: editFormData.trangThai,
        maVaiTro: 'STUDENT',
      });
      setEditingStudent(null);
      fetchStudents(pagination.trangHienTai);
      alert('Đã cập nhật đầy đủ thông tin học viên thành công!');
    } catch (err: any) {
      alert(err.message || 'Lỗi khi cập nhật học viên.');
    } finally {
      setSubmitting(false);
    }
  };

  // Xác nhận đặt lại mật khẩu cho học viên
  const handleConfirmResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetPassStudent) return;
    if (!newResetPassword.trim()) {
      alert('Vui lòng nhập mật khẩu mới.');
      return;
    }
    setSubmitting(true);
    try {
      await api.updateUser(resetPassStudent.MaNguoiDung, {
        hoVaTen: resetPassStudent.HoVaTen,
        matKhau: newResetPassword.trim(),
        maVaiTro: 'STUDENT',
      });
      alert(`Đã đặt lại mật khẩu cho học viên "${resetPassStudent.HoVaTen}" thành công! Mật khẩu mới: ${newResetPassword}`);
      setResetPassStudent(null);
      setNewResetPassword('123456');
    } catch (err: any) {
      alert(err.message || 'Lỗi khi đặt lại mật khẩu.');
    } finally {
      setSubmitting(false);
    }
  };

  // Xác nhận xóa mềm học viên
  const handleConfirmDelete = async () => {
    if (!deleteModalStudent) return;
    setSubmitting(true);
    try {
      await api.deleteUser(deleteModalStudent.MaNguoiDung);
      setDeleteModalStudent(null);
      fetchStudents(pagination.trangHienTai);
      alert('Đã xóa học viên thành công!');
    } catch (err: any) {
      alert(err.message || 'Lỗi khi xóa học viên.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-black font-heading tracking-tight text-slate-800 uppercase flex items-center gap-2.5">
            <GraduationCap className="w-6 h-6 text-amber-500" />
            <span>Danh Sách Toàn Bộ Học Viên</span>
          </h2>
          <p className="text-xs text-slate-500 font-medium">
            Toàn quyền Thêm, Sửa (Họ tên, Username, CCCD, SĐT, Email, Mật khẩu, Trạng thái), Reset mật khẩu và Xóa học viên
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchStudents(pagination.trangHienTai)}
            className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition-colors cursor-pointer shadow-xs"
            title="Làm mới dữ liệu"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-500 text-slate-950 font-bold text-xs shadow-md shadow-amber-400/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ Thêm học viên mới</span>
          </button>
        </div>
      </div>

      {/* 2. Search & Status Filter Bar */}
      <div className="akkhor-card p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex-1 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm kiếm theo họ tên, CCCD, tên đăng nhập, SĐT..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-amber-400 focus:bg-white transition-all font-medium"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:border-amber-400"
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="ACTIVE">Đang học (Hoạt động)</option>
            <option value="LOCKED">Tạm khóa tài khoản</option>
          </select>
        </div>

        <div className="text-xs text-slate-500 font-semibold shrink-0">
          Tổng số: <strong className="text-slate-800">{pagination.tongSoBanGhi}</strong> học viên
        </div>
      </div>

      {/* 3. Students Table (Akkhor Style) */}
      <div className="akkhor-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                <th className="py-3 px-4">Học Viên</th>
                <th className="py-3 px-4">Tên Đăng Nhập</th>
                <th className="py-3 px-4">Số CCCD</th>
                <th className="py-3 px-4">Liên Hệ</th>
                <th className="py-3 px-4 text-center">Trạng Thái Học Tập</th>
                <th className="py-3 px-4 text-right">Thao Tác Quản Trị</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {students.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400 font-medium">
                    {loading ? 'Đang tải danh sách học viên...' : 'Không tìm thấy học viên nào phù hợp.'}
                  </td>
                </tr>
              ) : (
                students.map((student) => (
                  <tr key={student.MaNguoiDung} className="hover:bg-slate-50/80 transition-colors group">
                    {/* Học viên: Avatar + Tên */}
                    <td className="py-3.5 px-4">
                      <div
                        onClick={() => setViewingStudentId(student.MaNguoiDung)}
                        className="flex items-center gap-3 cursor-pointer group/student hover:opacity-95 transition-opacity"
                        title="Nhấn để xem chi tiết các bài học và thời gian học của học viên"
                      >
                        {student.AvatarUrl ? (
                          <img
                            src={getMediaUrl(student.AvatarUrl)}
                            alt={student.HoVaTen}
                            className="w-9 h-9 rounded-full object-cover shrink-0 border border-amber-300 group-hover/student:scale-105 group-hover/student:border-amber-400 group-hover/student:shadow-xs transition-all"
                          />
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-amber-100 text-amber-800 font-bold flex items-center justify-center shrink-0 border border-amber-200 group-hover/student:scale-105 group-hover/student:border-amber-400 group-hover/student:shadow-xs transition-all">
                            {student.HoVaTen ? student.HoVaTen.charAt(0).toUpperCase() : 'H'}
                          </div>
                        )}
                        <div>
                          <div className="font-bold text-slate-800 text-sm group-hover/student:text-amber-600 group-hover/student:underline transition-colors flex items-center gap-1.5">
                            <span>{student.HoVaTen}</span>
                          </div>
                          <div className="text-[10px] text-slate-400 font-medium">
                            Mã số: #{student.MaNguoiDung} • <span className="text-amber-600/80 font-semibold">Xem chi tiết bài học</span>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Tên đăng nhập */}
                    <td className="py-3.5 px-4 font-mono font-semibold text-slate-700">
                      {student.TenDangNhap}
                    </td>

                    {/* CCCD */}
                    <td className="py-3.5 px-4 text-slate-600 font-mono">
                      {student.SoCCCD || '—'}
                    </td>

                    {/* Liên hệ: SĐT & Email */}
                    <td className="py-3.5 px-4 space-y-0.5">
                      <div className="flex items-center gap-1.5 text-slate-600 font-medium">
                        <Phone className="w-3 h-3 text-slate-400" />
                        <span>{student.SoDienThoai || 'Chưa cập nhật'}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-400 text-[11px]">
                        <Mail className="w-3 h-3 text-slate-400" />
                        <span className="truncate max-w-[160px]">{student.Email || '—'}</span>
                      </div>
                    </td>

                    {/* Trạng thái học tập */}
                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={() => handleToggleStatus(student)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold cursor-pointer transition-colors ${
                          student.TrangThai
                            ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                            : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                        }`}
                        title="Click để chuyển đổi trạng thái"
                      >
                        {student.TrangThai ? (
                          <>
                            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                            <span>Đang học (Hoạt động)</span>
                          </>
                        ) : (
                          <>
                            <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                            <span>Tạm khóa</span>
                          </>
                        )}
                      </button>
                    </td>

                    {/* Thao tác Quản trị viên: Sửa, Reset MK, Khóa/Mở, Xóa */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Nút Sửa thông tin */}
                        <button
                          onClick={() => handleOpenEdit(student)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                          title="Sửa thông tin học viên (Họ tên, Username, CCCD, SĐT, Email, Mật khẩu, Trạng thái)"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>

                        {/* Nút Đặt lại mật khẩu nhanh */}
                        <button
                          onClick={() => {
                            setResetPassStudent(student);
                            setNewResetPassword('123456');
                          }}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-amber-600 hover:bg-amber-50 transition-colors cursor-pointer"
                          title="Reset / Đổi mật khẩu đăng nhập"
                        >
                          <KeyRound className="w-4 h-4" />
                        </button>

                        {/* Nút Khóa / Mở khóa nhanh */}
                        <button
                          onClick={() => handleToggleStatus(student)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors cursor-pointer"
                          title={student.TrangThai ? 'Tạm khóa tài khoản' : 'Mở khóa tài khoản'}
                        >
                          {student.TrangThai ? (
                            <XCircle className="w-4 h-4 text-rose-500" />
                          ) : (
                            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                          )}
                        </button>

                        {/* Nút Xóa */}
                        <button
                          onClick={() => setDeleteModalStudent(student)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                          title="Xóa học viên (Xóa mềm an toàn)"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {pagination.tongSoTrang > 1 && (
          <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500">
              Trang {pagination.trangHienTai} / {pagination.tongSoTrang}
            </span>
            <div className="flex items-center gap-1">
              <button
                disabled={pagination.trangHienTai <= 1}
                onClick={() => fetchStudents(pagination.trangHienTai - 1)}
                className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                disabled={pagination.trangHienTai >= pagination.tongSoTrang}
                onClick={() => fetchStudents(pagination.trangHienTai + 1)}
                className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 4. MODAL THÊM HỌC VIÊN MỚI */}
      {/* ========================================================================= */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200">
            <div className="px-6 py-4 bg-[#042954] text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-amber-400" />
                <h3 className="font-heading font-black text-sm uppercase">Thêm Học Viên Mới</h3>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateStudent} className="p-6 space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1 uppercase tracking-wider">
                  Họ và tên học viên <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Nguyễn Văn A"
                  value={formData.hoVaTen}
                  onChange={(e) => setFormData({ ...formData, hoVaTen: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-semibold focus:outline-none focus:border-amber-400 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1 uppercase tracking-wider">
                    Tên đăng nhập <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="hv_nguyenvana"
                    value={formData.tenDangNhap}
                    onChange={(e) => setFormData({ ...formData, tenDangNhap: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-800 focus:outline-none focus:border-amber-400 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1 uppercase tracking-wider">
                    Mật khẩu khởi tạo <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.matKhau}
                    onChange={(e) => setFormData({ ...formData, matKhau: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-800 focus:outline-none focus:border-amber-400 focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1 uppercase tracking-wider">
                  Số CCCD / CMND
                </label>
                <input
                  type="text"
                  placeholder="079201001234"
                  value={formData.soCCCD}
                  onChange={(e) => setFormData({ ...formData, soCCCD: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-800 focus:outline-none focus:border-amber-400 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1 uppercase tracking-wider">
                    Số điện thoại
                  </label>
                  <input
                    type="tel"
                    placeholder="0901234567"
                    value={formData.soDienThoai}
                    onChange={(e) => setFormData({ ...formData, soDienThoai: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-amber-400 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1 uppercase tracking-wider">
                    Email
                  </label>
                  <input
                    type="email"
                    placeholder="hocvien@gmail.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-amber-400 focus:bg-white"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold transition-colors cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-500 text-slate-950 font-bold transition-colors cursor-pointer shadow-md disabled:opacity-50"
                >
                  {submitting ? 'Đang tạo...' : 'Tạo Học Viên'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. MODAL CHỈNH SỬA TOÀN DIỆN THÔNG TIN HỌC VIÊN (THEO SKILL_ADMIN.MD) */}
      {/* ========================================================================= */}
      {editingStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200">
            <div className="px-6 py-4 bg-[#042954] text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-amber-400" />
                <div>
                  <h3 className="font-heading font-black text-sm uppercase">Cập Nhật Thông Tin Học Viên</h3>
                  <p className="text-[10px] text-amber-300">Admin toàn quyền sửa Họ tên, Username, CCCD, Mật khẩu & Trạng thái</p>
                </div>
              </div>
              <button
                onClick={() => setEditingStudent(null)}
                className="p-1 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateStudent} className="p-6 space-y-3.5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Họ và tên */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1 uppercase tracking-wider">
                    Họ và tên học viên <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={editFormData.hoVaTen}
                    onChange={(e) => setEditFormData({ ...editFormData, hoVaTen: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-semibold focus:outline-none focus:border-amber-400 focus:bg-white"
                  />
                </div>

                {/* Tên đăng nhập (Cho phép Admin chỉnh sửa trực tiếp) */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1 uppercase tracking-wider">
                    Tên đăng nhập <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={editFormData.tenDangNhap}
                    onChange={(e) => setEditFormData({ ...editFormData, tenDangNhap: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-800 font-semibold focus:outline-none focus:border-amber-400 focus:bg-white"
                  />
                </div>
              </div>

              {/* Mật khẩu mới / Đổi mật khẩu */}
              <div className="p-3 bg-amber-50/60 border border-amber-200/60 rounded-xl space-y-1.5">
                <label className="block font-bold text-amber-950 uppercase tracking-wider flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-amber-600" />
                  <span>Đổi mật khẩu mới (Nếu có nhu cầu)</span>
                </label>
                <input
                  type="text"
                  placeholder="Để trống nếu muốn giữ nguyên mật khẩu hiện tại"
                  value={editFormData.matKhau}
                  onChange={(e) => setEditFormData({ ...editFormData, matKhau: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-amber-300 rounded-lg font-mono text-slate-800 placeholder-slate-400 focus:outline-none focus:border-amber-500"
                />
                <span className="text-[10px] text-amber-800/80">Nhập mật khẩu mới vào ô trên nếu học viên yêu cầu đặt lại mật khẩu.</span>
              </div>

              {/* CCCD */}
              <div>
                <label className="block font-bold text-slate-700 mb-1 uppercase tracking-wider">
                  Số CCCD / CMND
                </label>
                <input
                  type="text"
                  value={editFormData.soCCCD}
                  onChange={(e) => setEditFormData({ ...editFormData, soCCCD: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-800 focus:outline-none focus:border-amber-400 focus:bg-white"
                />
              </div>

              {/* Số điện thoại & Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1 uppercase tracking-wider">
                    Số điện thoại
                  </label>
                  <input
                    type="tel"
                    value={editFormData.soDienThoai}
                    onChange={(e) => setEditFormData({ ...editFormData, soDienThoai: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-amber-400 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1 uppercase tracking-wider">
                    Email
                  </label>
                  <input
                    type="email"
                    value={editFormData.email}
                    onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-amber-400 focus:bg-white"
                  />
                </div>
              </div>

              {/* Trạng thái học tập */}
              <div>
                <label className="block font-bold text-slate-700 mb-1 uppercase tracking-wider">
                  Trạng thái học tập
                </label>
                <select
                  value={editFormData.trangThai ? 'ACTIVE' : 'LOCKED'}
                  onChange={(e) => setEditFormData({ ...editFormData, trangThai: e.target.value === 'ACTIVE' })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-semibold focus:outline-none focus:border-amber-400 focus:bg-white"
                >
                  <option value="ACTIVE">Đang học (Hoạt động bình thường)</option>
                  <option value="LOCKED">Tạm khóa tài khoản</option>
                </select>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setEditingStudent(null)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold transition-colors cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-xl bg-[#042954] hover:bg-[#031e3e] text-amber-400 font-bold transition-colors cursor-pointer shadow-md disabled:opacity-50"
                >
                  {submitting ? 'Đang lưu...' : 'Lưu Cập Nhật'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. MODAL RESET / ĐẶT LẠI MẬT KHẨU NHANH CHO HỌC VIÊN */}
      {/* ========================================================================= */}
      {resetPassStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-amber-300">
            <div className="px-6 py-4 bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <KeyRound className="w-5 h-5" />
                <h3 className="font-heading font-black text-sm uppercase">Đặt Lại Mật Khẩu Học Viên</h3>
              </div>
              <button
                onClick={() => setResetPassStudent(null)}
                className="p-1 rounded-lg hover:bg-black/10 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmResetPassword} className="p-6 space-y-4 text-xs">
              <div className="p-3 bg-amber-50 rounded-xl space-y-1 text-slate-700 border border-amber-200">
                <div>Học viên: <strong className="text-slate-900">{resetPassStudent.HoVaTen}</strong></div>
                <div>Tên đăng nhập: <span className="font-mono font-bold text-amber-900">{resetPassStudent.TenDangNhap}</span></div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1 uppercase tracking-wider">
                  Mật khẩu mới cần cấp <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newResetPassword}
                  onChange={(e) => setNewResetPassword(e.target.value)}
                  placeholder="123456"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-sm font-bold text-slate-800 focus:outline-none focus:border-amber-500 focus:bg-white"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Gợi ý: Mặc định là <code>123456</code>. Học viên có thể tự đổi lại sau khi đăng nhập.
                </span>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setResetPassStudent(null)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold transition-colors cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-500 text-slate-950 font-bold transition-colors cursor-pointer shadow-md disabled:opacity-50"
                >
                  {submitting ? 'Đang cấp...' : 'Xác Nhận Đổi Mật Khẩu'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 7. MODAL XÁC NHẬN XÓA HỌC VIÊN */}
      {/* ========================================================================= */}
      {deleteModalStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4 border border-rose-200">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <h4 className="font-heading font-black text-sm text-slate-800 uppercase">
                  Xác Nhận Xóa Học Viên
                </h4>
                <p className="text-[11px] text-slate-500 font-medium">Hành động này sẽ ẩn học viên khỏi danh sách đào tạo</p>
              </div>
            </div>

            <div className="p-3.5 bg-rose-50/60 border border-rose-100 rounded-xl text-xs space-y-1 text-slate-700">
              <div>Họ tên: <strong className="text-rose-700">{deleteModalStudent.HoVaTen}</strong></div>
              <div>Tên đăng nhập: <span className="font-mono font-bold">{deleteModalStudent.TenDangNhap}</span></div>
              <div>CCCD: <span className="font-mono">{deleteModalStudent.SoCCCD || 'Chưa cập nhật'}</span></div>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              Bạn có chắc chắn muốn xóa học viên này không? Dữ liệu tiến độ học tập và lịch sử đào tạo sẽ được lưu trữ an toàn trong hệ thống theo quy định.
            </p>

            <div className="pt-2 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setDeleteModalStudent(null)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={handleConfirmDelete}
                className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md shadow-rose-600/20 transition-all cursor-pointer disabled:opacity-50"
              >
                {submitting ? 'Đang xóa...' : 'Đồng ý xóa'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. Modal Chi Tiết Học Viên (Bài học & Thời gian học) */}
      <StudentDetailModal
        studentId={viewingStudentId}
        onClose={() => setViewingStudentId(null)}
      />
    </div>
  );
};
