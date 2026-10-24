export type RoleType = 'ADMIN' | 'TEACHER' | 'STUDENT';

export interface AuthUser {
  maNguoiDung: number;
  tenDangNhap: string;
  hoVaTen: string;
  maVaiTro: RoleType;
  tenVaiTro: string;
  soCCCD?: string;
  email?: string;
  soDienThoai?: string;
  trangThai?: boolean;
  avatarUrl?: string;
}

export interface UserItem {
  MaNguoiDung: number;
  TenDangNhap: string;
  HoVaTen: string;
  SoCCCD?: string;
  SoDienThoai?: string;
  Email?: string;
  AvatarUrl?: string;
  MaVaiTro: RoleType;
  TenVaiTro: string;
  TrangThai: boolean;
  NgayTao: string;
  NgayCapNhat: string;
}

export interface PaginationMeta {
  tongSoBanGhi: number;
  trangHienTai: number;
  soBanGhiMoiTrang: number;
  tongSoTrang: number;
}

export interface CourseItem {
  MaKhoaHoc: number;
  MaHangGPLX: string;
  TenKhoaHoc: string;
  MoTa?: string;
  TongSoGioLyThuyet: number;
  TrangThai: boolean;
  TongSoBaiGiang: number;
  NgayTao: string;
}

export interface LessonItem {
  MaBaiGiang: number;
  MaKhoaHoc: number;
  TenBaiGiang: string;
  MonHoc: string;
  SoThuTu: number;
  DuongDanVideo?: string;
  ThoiLuongPhut: number;
  TaiLieuDinhKem?: string;
  TrangThai: boolean;
}

export interface ClassItem {
  MaLopHoc: number;
  MaLopHocCode: string;
  TenLopHoc: string;
  MaKhoaHoc: number;
  TenKhoaHoc: string;
  MaHangGPLX: string;
  MaGiaoVienPhuTrach?: number;
  TenGiaoVien?: string;
  NgayKhaiGiang: string;
  NgayBeGiang: string;
  TrangThai: string;
  SiSoHocVien: number;
}

export interface StudentProgressItem {
  MaBaiGiang: number;
  TenBaiGiang: string;
  MonHoc: string;
  SoThuTu: number;
  ThoiLuongPhut: number;
  DuongDanVideo?: string;
  TaiLieuDinhKem?: string;
  ThoiGianHocGiay: number;
  ThoiGianHocPhut: number;
  DaHoanThanh: boolean;
  LanHocCuoi?: string;
}

export interface StudentProgressSummary {
  TongSoBaiHoc: number;
  SoBaiDaHoanThanh: number;
  TongGioHocLyThuyetTichLuy: number;
  TongGioYeuCau: number;
  PhanTramHoanThanhChung: number;
}

export interface ReportOverviewItem {
  MaLopHoc: number;
  MaLopHocCode: string;
  TenLopHoc: string;
  MaKhoaHoc?: number;
  TenKhoaHoc: string;
  MaHangGPLX: string;
  NgayKhaiGiang: string;
  NgayBeGiang: string;
  TrangThaiLop: string;
  TongSoHocVien: number;
  SoHocVienDuDieuKienThi: number;
  SoHocVienDangHoc: number;
  GioHocTrungBinhTungHocVien: number;
  SoHocVienHoanThanh?: number;
  TyLeHoanThanhTrungBinh?: number;
}

export interface CurriculumSummaryItem {
  MaKhoaHoc: number;
  MaHangGPLX: string;
  TenKhoaHoc: string;
  TongSoGioLyThuyet: number;
  SoChuong: number;
  SoBaiGiang: number;
  TongSoGio: number;
  MoTa?: string;
}

export interface ChapterItem {
  MaChuong: number;
  MaKhoaHoc: number;
  SoThuTu: number;
  TenChuong: string;
  SoGioChuan: number;
  PhanTramYeuCau: number;
  SoBaiGiang?: number;
  danhSachBaiGiang?: LessonItem[];
}

export interface CurriculumDetailResponse {
  khoaHoc: CourseItem;
  danhSachChuong: ChapterItem[];
  baiGiangChuaGanChuong?: LessonItem[];
}

// Interfaces cho Học viên (Student Portal)
export interface StudentEnrolledCourse {
  maLopHoc: number;
  maLopHocCode: string;
  tenLopHoc: string;
  ngayKhaiGiang: string;
  ngayBeGiang: string;
  trangThaiLop: string;
  maKhoaHoc: number;
  tenKhoaHoc: string;
  maHangGPLX: string;
  tongSoGioLyThuyet: number;
  moTa: string;
  ngayGhiDanh: string;
  trangThaiHocTap: string;
  tenGiaoVien: string;
  soDienThoaiGiaoVien: string;
  tongSoBaiHoc: number;
  soBaiDaHoanThanh: number;
  tongThoiGianHocGiay: number;
  tongThoiGianHocPhut: number;
  tongThoiGianHocGio: number;
  tiLeHoanThanh: number;
}

export interface StudentLessonItem {
  maBaiGiang: number;
  maChuong: number;
  tenBaiGiang: string;
  monHoc: string;
  soThuTu: number;
  duongDanVideo: string;
  thoiLuongPhut: number;
  taiLieuDinhKem: string;
  thoiGianHocGiay: number;
  thoiGianHocPhut: number;
  phanTramHoanThanh: number;
  daHoanThanh: boolean;
  trangThai: 'HOAN_THANH' | 'DANG_HOC' | 'CHUA_HOC';
  lanHocCuoi?: string;
}

export interface StudentTheoryExam {
  tieuDe: string;
  soCauHoi: number;
  thoiGianLamBaiPhut: number;
  diemDat: number;
  daDat: boolean;
  ghiChu: string;
}

export interface StudentChapterItem {
  maChuong: number;
  tenChuong: string;
  soThuTu: number;
  soGioChuan: number;
  phanTramYeuCau: number;
  soBaiGiang: number;
  soBaiDaHoanThanh: number;
  tiLeHoanThanhChuong: number;
  danhSachBaiHoc: StudentLessonItem[];
  kiemTraLyThuyet: StudentTheoryExam;
}

export interface StudentCurriculumResponse {
  thongTinLop: {
    maLopHoc: number;
    maLopHocCode: string;
    tenLopHoc: string;
    ngayKhaiGiang: string;
    ngayBeGiang: string;
    trangThaiLop: string;
    tenGiaoVien: string;
    soDienThoaiGiaoVien: string;
  };
  thongTinKhoaHoc: {
    maKhoaHoc: number;
    tenKhoaHoc: string;
    maHangGPLX: string;
    tongSoGioLyThuyet: number;
    moTa: string;
  };
  tienDoTongHop: {
    tongSoBai: number;
    soBaiDaHoanThanh: number;
    tongThoiGianHocGiay: number;
    tongThoiGianHocPhut: number;
    tongThoiGianHocGio: number;
    tiLeHoanThanh: number;
    trangThaiHocTap: string;
  };
  danhSachChuong: StudentChapterItem[];
}

export interface StudentProfileResponse {
  thongTinCaNhan: {
    maNguoiDung: number;
    hoVaTen: string;
    tenDangNhap: string;
    soCCCD: string;
    soDienThoai: string;
    email: string;
    ngayTao: string;
    trangThai: boolean;
  };
  danhSachLopHoc: Array<{
    MaLopHoc: number;
    TenLopHoc: string;
    MaLopHocCode: string;
    TenKhoaHoc: string;
    MaHangGPLX: string;
    NgayKhaiGiang: string;
    NgayBeGiang: string;
    NgayGhiDanh: string;
    TrangThaiHocTap: string;
    TenGiaoVien: string;
    SoDienThoaiGiaoVien: string;
  }>;
  coTheSua: boolean;
  ghiChu: string;
}

// Interfaces cho Giáo viên (Teacher Portal)
export interface TeacherClassItem {
  MaLopHoc: number;
  MaLopHocCode: string;
  TenLopHoc: string;
  TenKhoaHoc: string;
  MaHangGPLX: string;
  NgayKhaiGiang: string;
  NgayBeGiang: string;
  TrangThai: string;
  SiSoHocVien: number;
  SoHocVienPhuTrachTrongLop: number;
  LaGiaoVienChuNhiem: number | boolean;
}

export interface TeacherStudentItem {
  MaHocVien: number;
  HoVaTen: string;
  TenDangNhap: string;
  SoCCCD: string;
  SoDienThoai: string;
  Email: string;
  AvatarUrl?: string;
  MaLopHoc: number;
  TenLopHoc: string;
  TenKhoaHoc: string;
  MaHangGPLX: string;
  NgayGhiDanh: string;
  TrangThaiHocTap: string;
  SoBaiDaHoc: number;
  TongThoiGianHocPhut: number;
}

export interface TeacherAssignmentsData {
  thongTinGiaoVien: {
    MaNguoiDung: number;
    HoVaTen: string;
    TenDangNhap: string;
    SoCCCD?: string;
    SoDienThoai?: string;
    Email?: string;
    AvatarUrl?: string;
    TrangThai?: boolean;
    MaVaiTro?: string;
  };
  danhSachLopPhuTrach: TeacherClassItem[];
  danhSachHocVienPhuTrach: TeacherStudentItem[];
  tongSoLop: number;
  tongSoHocVien: number;
}


