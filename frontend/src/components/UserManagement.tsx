import React, { useState, useEffect } from 'react';
import {api } from '../services/api';
import { UserItem, PaginationMeta } from '../types';
import { useDebounce } from '../hooks/useDebounce';
import { StudentDetailModal } from './StudentDetailModal';
import { TeacherDetailModal } from './TeacherDetailModal';
import {
  Search,
  Plus,
  RefreshCw,
  Lock,
  Unlock,
  Trash2,
  Edit2,
  ChevronLeft,
  ChevronRight,
  Filter,
  Users,
  ShieldCheck,
  Shield,
  GraduationCap,
  UserCheck,
  KeyRound,
  X,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  Phone,
  Mail,
  CreditCard,
  ArrowUpDown,
  Camera,
  Loader2,
} from 'lucide-react';

export const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta>({
    tongSoBanGhi: 0,
    trangHienTai: 1,
    soBanGhiMoiTrang: 10,
    tongSoTrang: 1,
  });

  // Modal chi tiết theo vai trò
  const [viewingStudentId, setViewingStudentId] = useState<number | null>(null);
  const [viewingTeacherId, setViewingTeacherId] = useState<number | null>(null);

  // Query filters
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 350);
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortBy, setSortBy] = useState('NgayTao');
  const [sortDir, setSortDir] = useState<'ASC' | 'DESC'>('DESC');
  const [loading, setLoading] = useState(false);
  const [alertMsg, setAlertMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserItem | null>(null);
  const [resetPassUser, setResetPassUser] = useState<UserItem | null>(null);
  const [newPassword, setNewPassword] = useState('123456');
  const [deleteConfirmUser, setDeleteConfirmUser] = useState<UserItem | null>(null);

  // Avatar Upload State cho Admin
  const [uploadingAvatarUserId, setUploadingAvatarUserId] = useState<number | null>(null);

  const handleAvatarUpload = async (userId: number, file: File) => {
    if (!file) return;
    if (!file.type.match(/\/(jpeg|png|webp|jpg)$/i)) {
      showAlert('Chỉ chấp nhận hình ảnh định dạng JPG, PNG hoặc WEBP.', 'error');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      showAlert('Dung lượng hình ảnh tối đa là 2MB.', 'error');
      return;
    }

    setUploadingAvatarUserId(userId);
    try {
      const res = await api.uploadUserAvatar(userId, file);
      showAlert(`Cập nhật ảnh đại diện cho tài khoản #${userId} thành công!`, 'success');
      
      // Cập nhật ngay trên bảng danh sách
      setUsers((prev) =>
        prev.map((u) => (u.MaNguoiDung === userId ? { ...u, AvatarUrl: res.avatarUrl } : u))
      );

      // Cập nhật nếu đang mở modal chỉnh sửa
      if (editingUser && editingUser.MaNguoiDung === userId) {
        setEditingUser((prev) => (prev ? { ...prev, AvatarUrl: res.avatarUrl } : null));
      }
    } catch (err: any) {
      showAlert(err.message || 'Lỗi khi cập nhật ảnh đại diện người dùng.', 'error');
    } finally {
      setUploadingAvatarUserId(null);
    }
  };

  // Form data for Add / Edit
  const [formData, setFormData] = useState({
    tenDangNhap: '',
    matKhau: '',
    hoVaTen: '',
    soCCCD: '',
    soDienThoai: '',
    email: '',
    maVaiTro: 'TEACHER',
    trangThai: true,
  });

  const showAlert = (text: string, type: 'success' | 'error') => {
    setAlertMsg({ text, type });
    setTimeout(() => setAlertMsg(null), 4000);
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await api.getUsers({
        tuKhoa: debouncedSearchTerm || undefined,
        maVaiTro: roleFilter || undefined,
        trangThai: statusFilter !== '' ? Number(statusFilter) : undefined,
        trangHienTai: pagination.trangHienTai,
        soBanGhiMoiTrang: pagination.soBanGhiMoiTrang,
        sapXepTheo: sortBy,
        huongSapXep: sortDir,
      });
      setUsers(res.danhSach || []);
      setPagination(res.phanTrang);
    } catch (err: any) {
      showAlert(err.message || 'Lỗi tải danh sách người dùng.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setPagination((prev) => (prev.trangHienTai === 1 ? prev : { ...prev, trangHienTai: 1 }));
  }, [debouncedSearchTerm, roleFilter, statusFilter]);

  useEffect(() => {
    fetchUsers();
  }, [
    debouncedSearchTerm,
    pagination.trangHienTai,
    pagination.soBanGhiMoiTrang,
    roleFilter,
    statusFilter,
    sortBy,
    sortDir,
  ]);

  // Quick Status Toggle (Optimistic Update)
  const handleToggleStatus = async (user: UserItem) => {
    const prevUsers = [...users];
    const nextStatus = !user.TrangThai;

    setUsers((current) =>
      current.map((u) => (u.MaNguoiDung === user.MaNguoiDung ? { ...u, TrangThai: nextStatus } : u)),
    );
    showAlert(nextStatus ? 'Đã kích hoạt tài khoản.' : 'Đã tạm khóa tài khoản.', 'success');

    try {
      await api.changeUserStatus(user.MaNguoiDung, nextStatus);
    } catch (err: any) {
      setUsers(prevUsers);
      showAlert(err.message || 'Thao tác thất bại. Đã khôi phục trạng thái cũ.', 'error');
    }
  };

  // Open Edit Modal with user data
  const openEditModal = (user: UserItem) => {
    setEditingUser(user);
    setFormData({
      tenDangNhap: user.TenDangNhap,
      matKhau: '',
      hoVaTen: user.HoVaTen,
      soCCCD: user.SoCCCD || '',
      soDienThoai: user.SoDienThoai || '',
      email: user.Email || '',
      maVaiTro: user.MaVaiTro,
      trangThai: user.TrangThai,
    });
    setIsAddModalOpen(true);
  };

  // Save (Create or Update)
  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingUser) {
        await api.updateUser(editingUser.MaNguoiDung, {
          hoVaTen: formData.hoVaTen.trim(),
          tenDangNhap: formData.tenDangNhap.trim(),
          soCCCD: formData.soCCCD.trim() || undefined,
          soDienThoai: formData.soDienThoai.trim() || undefined,
          email: formData.email.trim() || undefined,
          maVaiTro: formData.maVaiTro,
          matKhau: formData.matKhau.trim() || undefined,
          trangThai: formData.trangThai,
        });
        showAlert('Cập nhật tài khoản & phân quyền thành công!', 'success');
      } else {
        if (!formData.matKhau.trim()) {
          showAlert('Vui lòng nhập mật khẩu khởi tạo!', 'error');
          return;
        }
        await api.createUser({
          tenDangNhap: formData.tenDangNhap.trim(),
          matKhau: formData.matKhau.trim(),
          hoVaTen: formData.hoVaTen.trim(),
          soCCCD: formData.soCCCD.trim() || undefined,
          soDienThoai: formData.soDienThoai.trim() || undefined,
          email: formData.email.trim() || undefined,
          maVaiTro: formData.maVaiTro,
        });
        showAlert('Tạo mới tài khoản thành công!', 'success');
      }
      setIsAddModalOpen(false);
      setEditingUser(null);
      fetchUsers();
    } catch (err: any) {
      showAlert(err.message || 'Lỗi lưu thông tin người dùng.', 'error');
    }
  };

  // Quick Reset Password
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetPassUser) return;
    if (!newPassword.trim() || newPassword.length < 6) {
      showAlert('Mật khẩu mới phải từ 6 ký tự trở lên!', 'error');
      return;
    }

    try {
      await api.updateUser(resetPassUser.MaNguoiDung, { matKhau: newPassword.trim() });
      showAlert(`Đã cấp lại mật khẩu cho tài khoản "${resetPassUser.TenDangNhap}" thành công!`, 'success');
      setResetPassUser(null);
      setNewPassword('123456');
    } catch (err: any) {
      showAlert(err.message || 'Lỗi đặt lại mật khẩu.', 'error');
    }
  };

  // Soft Delete
  const handleConfirmDelete = async () => {
    if (!deleteConfirmUser) return;
    try {
      await api.deleteUser(deleteConfirmUser.MaNguoiDung);
      showAlert(`Đã xóa tài khoản "${deleteConfirmUser.TenDangNhap}" thành công. Dữ liệu đã được lưu trữ an toàn.`, 'success');
      setDeleteConfirmUser(null);
      fetchUsers();
    } catch (err: any) {
      showAlert(err.message || 'Lỗi khi xóa người dùng.', 'error');
    }
  };

  // Helper badge color
  const getRoleBadge = (maVaiTro: string, tenVaiTro: string) => {
    switch (maVaiTro) {
      case 'ADMIN':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200">
            <Shield className="w-3.5 h-3.5" />
            {tenVaiTro || 'Quản trị viên'}
          </span>
        );
      case 'TEACHER':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
            <UserCheck className="w-3.5 h-3.5" />
            {tenVaiTro || 'Giáo viên'}
          </span>
        );
      case 'STUDENT':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <GraduationCap className="w-3.5 h-3.5" />
            {tenVaiTro || 'Học viên'}
          </span>
        );
    }
  };

  // Stats calculation
  const totalUsers = pagination.tongSoBanGhi;
  const adminCount = users.filter((u) => u.MaVaiTro === 'ADMIN').length;
  const teacherCount = users.filter((u) => u.MaVaiTro === 'TEACHER').length;
  const studentCount = users.filter((u) => u.MaVaiTro === 'STUDENT').length;

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {alertMsg && (
        <div
          className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold shadow-xl border animate-in fade-in slide-in-from-top-4 ${
            alertMsg.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-rose-50 text-rose-800 border-rose-200'
          }`}
        >
          {alertMsg.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          )}
          <span>{alertMsg.text}</span>
          <button onClick={() => setAlertMsg(null)} className="ml-2 text-slate-400 hover:text-slate-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header & Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
            <span>Tài khoản</span>
            <span>/</span>
            <span className="text-amber-500">Quản lý tài khoản</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 font-heading flex items-center gap-2.5">
            <ShieldCheck className="w-7 h-7 text-amber-500" />
            Quản lý Tài khoản & Phân quyền
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Toàn quyền tra cứu, tạo mới, chỉnh sửa, phân quyền vai trò (Admin, Giáo viên, Học viên) và kiểm soát đăng nhập.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchUsers()}
            disabled={loading}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs shadow-sm transition-all cursor-pointer"
            title="Làm mới danh sách"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-amber-500' : ''}`} />
            <span>Làm mới</span>
          </button>

          <button
            onClick={() => {
              setEditingUser(null);
              setFormData({
                tenDangNhap: '',
                matKhau: '123456',
                hoVaTen: '',
                soCCCD: '',
                soDienThoai: '',
                email: '',
                maVaiTro: 'TEACHER',
                trangThai: true,
              });
              setIsAddModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-500 text-slate-950 font-bold text-xs shadow-md shadow-amber-400/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm tài khoản mới</span>
          </button>
        </div>
      </div>

      {/* Thống kê nhanh */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="akkhor-card p-4 rounded-2xl flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700 shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] text-slate-500 font-semibold uppercase">Tổng tài khoản</div>
            <div className="text-xl font-black text-slate-900">{totalUsers}</div>
          </div>
        </div>

        <div className="akkhor-card p-4 rounded-2xl flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600 shrink-0">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] text-purple-600 font-semibold uppercase">Quản trị (Admin)</div>
            <div className="text-xl font-black text-slate-900">{adminCount} / {users.length} trang</div>
          </div>
        </div>

        <div className="akkhor-card p-4 rounded-2xl flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
            <UserCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] text-blue-600 font-semibold uppercase">Giáo viên</div>
            <div className="text-xl font-black text-slate-900">{teacherCount} / {users.length} trang</div>
          </div>
        </div>

        <div className="akkhor-card p-4 rounded-2xl flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] text-emerald-600 font-semibold uppercase">Học viên</div>
            <div className="text-xl font-black text-slate-900">{studentCount} / {users.length} trang</div>
          </div>
        </div>
      </div>

      {/* Bộ lọc & Tìm kiếm */}
      <div className="akkhor-card p-4 rounded-2xl space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Ô tìm kiếm */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm theo họ tên, username, CCCD..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-amber-400 focus:bg-white transition-all font-medium"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Lọc theo Vai trò (Role Filter) */}
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 focus-within:border-amber-400 focus-within:bg-white transition-all">
            <Filter className="w-4 h-4 text-slate-400 shrink-0" />
            <select
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value);
                setPagination((p) => ({ ...p, trangHienTai: 1 }));
              }}
              className="w-full bg-transparent text-xs text-slate-800 font-medium focus:outline-none cursor-pointer"
            >
              <option value="">Tất cả vai trò</option>
              <option value="ADMIN">Quản trị viên (ADMIN)</option>
              <option value="TEACHER">Giáo viên (TEACHER)</option>
              <option value="STUDENT">Học viên (STUDENT)</option>
            </select>
          </div>

          {/* Lọc theo Trạng thái */}
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 focus-within:border-amber-400 focus-within:bg-white transition-all">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPagination((p) => ({ ...p, trangHienTai: 1 }));
              }}
              className="w-full bg-transparent text-xs text-slate-800 font-medium focus:outline-none cursor-pointer"
            >
              <option value="">Tất cả trạng thái</option>
              <option value="1">Đang hoạt động</option>
              <option value="0">Đã tạm khóa</option>
            </select>
          </div>

          {/* Sắp xếp */}
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 focus-within:border-amber-400 focus-within:bg-white transition-all">
            <ArrowUpDown className="w-4 h-4 text-slate-400 shrink-0" />
            <select
              value={`${sortBy}-${sortDir}`}
              onChange={(e) => {
                const [sb, sd] = e.target.value.split('-');
                setSortBy(sb);
                setSortDir(sd as 'ASC' | 'DESC');
              }}
              className="w-full bg-transparent text-xs text-slate-800 font-medium focus:outline-none cursor-pointer"
            >
              <option value="NgayTao-DESC">Mới tạo nhất</option>
              <option value="NgayTao-ASC">Cũ nhất</option>
              <option value="HoVaTen-ASC">Họ và tên (A - Z)</option>
              <option value="HoVaTen-DESC">Họ và tên (Z - A)</option>
              <option value="TenDangNhap-ASC">Tên đăng nhập (A - Z)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Bảng danh sách tài khoản */}
      <div className="akkhor-card rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200/80 bg-slate-50/80 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                <th className="py-3.5 px-4">Tài khoản & Người dùng</th>
                <th className="py-3.5 px-4">Phân quyền (Vai trò)</th>
                <th className="py-3.5 px-4">Định danh / Liên hệ</th>
                <th className="py-3.5 px-4">Email</th>
                <th className="py-3.5 px-4 text-center">Trạng thái</th>
                <th className="py-3.5 px-4 text-right">Thao tác Admin</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    <div className="inline-block w-6 h-6 border-2 border-amber-400 border-t-transparent rounded-full animate-spin mb-2"></div>
                    <div>Đang tải danh sách tài khoản...</div>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    Không tìm thấy tài khoản phù hợp với điều kiện tìm kiếm.
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.MaNguoiDung} className="hover:bg-slate-50/60 transition-colors">
                    {/* User info */}
                    <td className="py-3.5 px-4">
                      <div
                        onClick={() => {
                          if (u.MaVaiTro === 'STUDENT') setViewingStudentId(u.MaNguoiDung);
                          else if (u.MaVaiTro === 'TEACHER') setViewingTeacherId(u.MaNguoiDung);
                        }}
                        className={`flex items-center gap-3 ${
                          u.MaVaiTro === 'STUDENT' || u.MaVaiTro === 'TEACHER'
                            ? 'cursor-pointer group/user hover:opacity-95'
                            : ''
                        }`}
                        title={
                          u.MaVaiTro === 'STUDENT'
                            ? 'Nhấn để xem chi tiết bài học & thời gian học của học viên'
                            : u.MaVaiTro === 'TEACHER'
                            ? 'Nhấn để xem các lớp và học viên giáo viên đang phụ trách'
                            : undefined
                        }
                      >
                        <div className="relative group/avatar shrink-0" title="Admin: Nhấn vào biểu tượng camera để đổi ảnh đại diện">
  {u.AvatarUrl ? (
    <img
      src={u.AvatarUrl}
      alt={u.HoVaTen}
      className="w-10 h-10 rounded-xl object-cover shrink-0 border border-slate-200 group-hover/avatar:ring-2 group-hover/avatar:ring-amber-400 transition-all shadow-xs"
    />
  ) : (
    <div
      className={`w-10 h-10 rounded-xl border flex items-center justify-center text-xs font-bold shrink-0 uppercase transition-all ${
        u.MaVaiTro === 'TEACHER'
          ? 'bg-blue-50 text-blue-700 border-blue-200'
          : u.MaVaiTro === 'STUDENT'
          ? 'bg-amber-50 text-amber-800 border-amber-200'
          : 'bg-purple-50 text-purple-700 border-purple-200'
      }`}
    >
      {u.HoVaTen ? u.HoVaTen.charAt(0) : 'U'}
    </div>
  )}

  {/* Camera Overlay Badge cho Admin */}
  <label
    className="absolute inset-0 bg-slate-950/65 rounded-xl flex items-center justify-center opacity-0 group-hover/avatar:opacity-100 transition-opacity cursor-pointer shadow-sm"
    onClick={(e) => e.stopPropagation()}
    title="Tải ảnh đại diện mới cho tài khoản này"
  >
    {uploadingAvatarUserId === u.MaNguoiDung ? (
      <Loader2 className="w-4 h-4 text-amber-400 animate-spin" />
    ) : (
      <Camera className="w-4 h-4 text-white hover:text-amber-300 transition-colors" />
    )}
    <input
      type="file"
      accept="image/jpeg,image/png,image/webp"
      className="hidden"
      disabled={uploadingAvatarUserId === u.MaNguoiDung}
      onChange={(e) => {
        const file = e.target.files?.[0];
        if (file) handleAvatarUpload(u.MaNguoiDung, file);
        e.target.value = '';
      }}
    />
  </label>
</div>
                        <div>
                          <div
                            className={`font-bold text-slate-900 text-sm transition-colors ${
                              u.MaVaiTro === 'STUDENT' || u.MaVaiTro === 'TEACHER'
                                ? 'group-hover/user:text-amber-600 group-hover/user:underline'
                                : ''
                            }`}
                          >
                            {u.HoVaTen}
                          </div>
                          <div className="text-[11px] font-mono text-slate-500 flex items-center gap-1.5 mt-0.5">
                            <span className="text-amber-600 font-semibold">@{u.TenDangNhap}</span>
                            <span className="text-slate-300">•</span>
                            <span>ID: #{u.MaNguoiDung}</span>
                            {u.MaVaiTro === 'STUDENT' && (
                              <span className="text-[10px] text-amber-600 font-sans font-semibold ml-1">• Chi tiết bài học</span>
                            )}
                            {u.MaVaiTro === 'TEACHER' && (
                              <span className="text-[10px] text-blue-600 font-sans font-semibold ml-1">• Lớp & học viên</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Role / Phân quyền */}
                    <td className="py-3.5 px-4">
                      {getRoleBadge(u.MaVaiTro, u.TenVaiTro)}
                    </td>

                    {/* Contact & CCCD */}
                    <td className="py-3.5 px-4 text-slate-700">
                      <div className="flex items-center gap-1.5 font-medium">
                        <CreditCard className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{u.SoCCCD || 'Chưa cập nhật'}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-500 mt-1">
                        <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{u.SoDienThoai || 'Chưa cập nhật'}</span>
                      </div>
                    </td>

                    {/* Email */}
                    <td className="py-3.5 px-4 text-slate-600">
                      <div className="flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate max-w-[180px]">{u.Email || 'Chưa cập nhật'}</span>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={() => handleToggleStatus(u)}
                        title={u.TrangThai ? 'Click để tạm khóa' : 'Click để kích hoạt'}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                          u.TrangThai
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                            : 'bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100'
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${u.TrangThai ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
                        {u.TrangThai ? 'Hoạt động' : 'Tạm khóa'}
                      </button>
                    </td>

                    {/* Admin Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <label
                          title="Admin: Đổi ảnh đại diện tài khoản"
                          className="p-1.5 rounded-lg text-slate-600 hover:text-amber-600 hover:bg-amber-50 transition-colors cursor-pointer border border-transparent hover:border-amber-200 flex items-center justify-center relative"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {uploadingAvatarUserId === u.MaNguoiDung ? (
                            <Loader2 className="w-4 h-4 text-amber-500 animate-spin" />
                          ) : (
                            <Camera className="w-4 h-4" />
                          )}
                          <input
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            className="hidden"
                            disabled={uploadingAvatarUserId === u.MaNguoiDung}
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleAvatarUpload(u.MaNguoiDung, file);
                              e.target.value = '';
                            }}
                          />
                        </label>
                        <button
                          onClick={() => openEditModal(u)}
                          title="Chỉnh sửa & Phân quyền"
                          className="p-1.5 rounded-lg text-slate-600 hover:text-amber-600 hover:bg-amber-50 transition-colors cursor-pointer border border-transparent hover:border-amber-200"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => {
                            setResetPassUser(u);
                            setNewPassword('123456');
                          }}
                          title="Cấp lại mật khẩu nhanh"
                          className="p-1.5 rounded-lg text-slate-600 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer border border-transparent hover:border-blue-200"
                        >
                          <KeyRound className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => handleToggleStatus(u)}
                          title={u.TrangThai ? 'Khóa tài khoản' : 'Mở khóa tài khoản'}
                          className={`p-1.5 rounded-lg transition-colors cursor-pointer border border-transparent ${
                            u.TrangThai
                              ? 'text-slate-600 hover:text-amber-600 hover:bg-amber-50 hover:border-amber-200'
                              : 'text-amber-600 hover:text-emerald-600 hover:bg-emerald-50 hover:border-emerald-200'
                          }`}
                        >
                          {u.TrangThai ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                        </button>

                        <button
                          onClick={() => setDeleteConfirmUser(u)}
                          title="Xóa tài khoản (Lưu trữ an toàn)"
                          className="p-1.5 rounded-lg text-slate-600 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer border border-transparent hover:border-rose-200"
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

        {/* Phân trang */}
        <div className="p-4 border-t border-slate-200/80 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <span>Hiển thị</span>
            <select
              value={pagination.soBanGhiMoiTrang}
              onChange={(e) => {
                setPagination((p) => ({
                  ...p,
                  soBanGhiMoiTrang: Number(e.target.value),
                  trangHienTai: 1,
                }));
              }}
              className="bg-white border border-slate-200 text-slate-800 rounded-lg px-2.5 py-1 text-xs font-semibold focus:outline-none focus:border-amber-400 cursor-pointer"
            >
              <option value="10">10 dòng</option>
              <option value="20">20 dòng</option>
              <option value="50">50 dòng</option>
              <option value="-1">Tất cả</option>
            </select>
            <span>trên tổng số <strong className="text-slate-900 font-bold">{pagination.tongSoBanGhi}</strong> tài khoản</span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              disabled={pagination.trangHienTai <= 1}
              onClick={() => setPagination((p) => ({ ...p, trangHienTai: p.trangHienTai - 1 }))}
              className="p-2 rounded-lg border border-slate-200 hover:bg-white text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all shadow-xs"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 py-1 font-bold text-slate-800">
              Trang {pagination.trangHienTai} / {pagination.tongSoTrang || 1}
            </span>
            <button
              disabled={pagination.trangHienTai >= pagination.tongSoTrang}
              onClick={() => setPagination((p) => ({ ...p, trangHienTai: p.trangHienTai + 1 }))}
              className="p-2 rounded-lg border border-slate-200 hover:bg-white text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all shadow-xs"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* MODAL 1: THÊM / CẬP NHẬT TÀI KHOẢN & PHÂN QUYỀN */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-lg rounded-2xl border border-slate-200 p-6 shadow-2xl relative animate-in zoom-in-95 duration-200">
            <button
              onClick={() => setIsAddModalOpen(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-amber-400/20 text-amber-600 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold font-heading text-slate-900">
                  {editingUser ? 'Cập nhật Tài khoản & Phân quyền' : 'Thêm mới Tài khoản'}
                </h3>
                <p className="text-xs text-slate-500">
                  {editingUser
                    ? `Đang chỉnh sửa tài khoản ID #${editingUser.MaNguoiDung} (@${editingUser.TenDangNhap})`
                    : 'Thiết lập tài khoản người dùng và vai trò phân quyền'}
                </p>
              </div>
            </div>

            <form onSubmit={handleSaveUser} className="space-y-4 text-xs font-medium">
              {/* Khu vực đổi ảnh đại diện dành cho Admin */}
              {editingUser && (
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/90 flex items-center gap-4">
                  <div className="relative shrink-0">
                    {editingUser.AvatarUrl ? (
                      <img
                        src={editingUser.AvatarUrl}
                        alt={editingUser.HoVaTen}
                        className="w-14 h-14 rounded-2xl object-cover border-2 border-amber-400 shadow-sm"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-800 font-black text-xl flex items-center justify-center border border-amber-300">
                        {editingUser.HoVaTen ? editingUser.HoVaTen.charAt(0).toUpperCase() : 'U'}
                      </div>
                    )}
                    {uploadingAvatarUserId === editingUser.MaNguoiDung && (
                      <div className="absolute inset-0 bg-slate-900/60 rounded-2xl flex items-center justify-center">
                        <Loader2 className="w-5 h-5 text-amber-400 animate-spin" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold text-slate-800 flex items-center gap-2">
                      <span>Ảnh đại diện tài khoản</span>
                      <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold">Admin Quyền</span>
                    </div>
                    <p className="text-[11px] text-slate-500 mb-2">
                      Cho phép Admin thay đổi ảnh đại diện của tài khoản này (JPG, PNG, WEBP tối đa 2MB).
                    </p>
                    <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 text-xs font-semibold shadow-xs cursor-pointer transition-all">
                      <Camera className="w-3.5 h-3.5 text-amber-500" />
                      <span>{uploadingAvatarUserId === editingUser.MaNguoiDung ? 'Đang tải lên...' : 'Tải ảnh đại diện mới'}</span>
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        className="hidden"
                        disabled={uploadingAvatarUserId === editingUser.MaNguoiDung}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleAvatarUpload(editingUser.MaNguoiDung, file);
                          e.target.value = '';
                        }}
                      />
                    </label>
                  </div>
                </div>
              )}
              {/* Họ tên */}
              <div>
                <label className="block text-slate-700 font-bold mb-1">Họ và tên *</label>
                <input
                  type="text"
                  required
                  value={formData.hoVaTen}
                  onChange={(e) => setFormData({ ...formData, hoVaTen: e.target.value })}
                  placeholder="Ví dụ: Nguyễn Văn An"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-amber-400 focus:bg-white transition-all text-xs"
                />
              </div>

              {/* Username & Vai trò (Phân quyền) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Tên đăng nhập (Username) *</label>
                  <input
                    type="text"
                    required
                    value={formData.tenDangNhap}
                    onChange={(e) => setFormData({ ...formData, tenDangNhap: e.target.value })}
                    placeholder="nguyenvan_a"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-amber-400 focus:bg-white transition-all text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Phân quyền vai trò *</label>
                  <select
                    value={formData.maVaiTro}
                    onChange={(e) => setFormData({ ...formData, maVaiTro: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-semibold focus:outline-none focus:border-amber-400 focus:bg-white transition-all text-xs cursor-pointer"
                  >
                    <option value="TEACHER">Giáo viên (TEACHER)</option>
                    <option value="ADMIN">Quản trị viên (ADMIN)</option>
                    <option value="STUDENT">Học viên (STUDENT)</option>
                  </select>
                </div>
              </div>

              {/* Mật khẩu */}
              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  {editingUser ? 'Mật khẩu mới (Để trống nếu giữ nguyên)' : 'Mật khẩu khởi tạo *'}
                </label>
                <input
                  type="password"
                  required={!editingUser}
                  value={formData.matKhau}
                  onChange={(e) => setFormData({ ...formData, matKhau: e.target.value })}
                  placeholder={editingUser ? 'Nhập mật khẩu mới nếu muốn đổi...' : 'Tối thiểu 6 ký tự'}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-amber-400 focus:bg-white transition-all text-xs"
                />
              </div>

              {/* CCCD & SĐT */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Số CCCD / CMND</label>
                  <input
                    type="text"
                    value={formData.soCCCD}
                    onChange={(e) => setFormData({ ...formData, soCCCD: e.target.value })}
                    placeholder="0010..."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-amber-400 focus:bg-white transition-all text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Số điện thoại</label>
                  <input
                    type="text"
                    value={formData.soDienThoai}
                    onChange={(e) => setFormData({ ...formData, soDienThoai: e.target.value })}
                    placeholder="09..."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-amber-400 focus:bg-white transition-all text-xs font-mono"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-slate-700 font-bold mb-1">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="user@laixe.edu.vn"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-amber-400 focus:bg-white transition-all text-xs"
                />
              </div>

              {/* Trạng thái nếu đang edit */}
              {editingUser && (
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Trạng thái đăng nhập</label>
                  <div className="flex items-center gap-4 pt-1">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="trangThai"
                        checked={formData.trangThai === true}
                        onChange={() => setFormData({ ...formData, trangThai: true })}
                        className="text-amber-500 focus:ring-amber-400"
                      />
                      <span className="text-slate-800 font-medium">Hoạt động bình thường</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="trangThai"
                        checked={formData.trangThai === false}
                        onChange={() => setFormData({ ...formData, trangThai: false })}
                        className="text-amber-500 focus:ring-amber-400"
                      />
                      <span className="text-slate-800 font-medium">Tạm khóa tài khoản</span>
                    </label>
                  </div>
                </div>
              )}

              <div className="pt-4 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-400 hover:bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-400/20 cursor-pointer transition-all"
                >
                  {editingUser ? 'Lưu thay đổi' : 'Tạo tài khoản'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: CẤP LẠI MẬT KHẨU NHANH */}
      {resetPassUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-2xl border border-slate-200 p-6 shadow-2xl relative animate-in zoom-in-95 duration-200">
            <button
              onClick={() => setResetPassUser(null)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <KeyRound className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold font-heading text-slate-900">
                  Cấp lại mật khẩu
                </h3>
                <p className="text-xs text-slate-500">
                  Tài khoản: <strong className="text-slate-800">@{resetPassUser.TenDangNhap}</strong> ({resetPassUser.HoVaTen})
                </p>
              </div>
            </div>

            <form onSubmit={handleResetPassword} className="space-y-4 text-xs font-medium">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Mật khẩu mới *</label>
                <input
                  type="text"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Nhập mật khẩu mới..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white transition-all text-xs font-mono font-semibold"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Mật khẩu mặc định khuyến nghị: <span className="font-mono font-bold text-slate-600">123456</span>
                </p>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setResetPassUser(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-md shadow-blue-600/20 cursor-pointer transition-all"
                >
                  Xác nhận đổi mật khẩu
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: XÁC NHẬN XÓA TÀI KHOẢN (SOFT DELETE) */}
      {deleteConfirmUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-2xl border border-slate-200 p-6 shadow-2xl relative animate-in zoom-in-95 duration-200">
            <button
              onClick={() => setDeleteConfirmUser(null)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold font-heading text-slate-900">
                  Xác nhận xóa tài khoản
                </h3>
                <p className="text-xs text-slate-500">Hành động này thực hiện xóa mềm (bảo lưu dữ liệu)</p>
              </div>
            </div>

            <div className="p-3 bg-rose-50/60 rounded-xl border border-rose-100 text-xs text-rose-800 space-y-1 mb-4">
              <div>
                Bạn có chắc chắn muốn xóa tài khoản{' '}
                <strong className="font-bold">@{deleteConfirmUser.TenDangNhap}</strong> (
                {deleteConfirmUser.HoVaTen}) thuộc vai trò{' '}
                <strong className="font-bold">{deleteConfirmUser.TenVaiTro || deleteConfirmUser.MaVaiTro}</strong>?
              </div>
              <div className="text-[11px] text-rose-600">
                Tài khoản sẽ bị ẩn khỏi hệ thống và vô hiệu hóa đăng nhập. Lịch sử đào tạo và dữ liệu vẫn được lưu trữ đối soát.
              </div>
            </div>

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmUser(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold cursor-pointer text-xs"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold shadow-md shadow-rose-600/20 cursor-pointer text-xs transition-all"
              >
                Xác nhận xóa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Chi tiết Học Viên */}
      <StudentDetailModal
        studentId={viewingStudentId}
        onClose={() => setViewingStudentId(null)}
      />

      {/* Modal Chi tiết Phân công Giáo Viên */}
      <TeacherDetailModal
        teacherId={viewingTeacherId}
        onClose={() => setViewingTeacherId(null)}
      />
    </div>
  );
};

export default UserManagement;
