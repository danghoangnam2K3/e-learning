import {
  AuthUser,
  UserItem,
  PaginationMeta,
  CourseItem,
  LessonItem,
  ClassItem,
  ReportOverviewItem,
  StudentProgressItem,
  StudentProgressSummary,
  CurriculumSummaryItem,
  ChapterItem,
  CurriculumDetailResponse,
  StudentEnrolledCourse,
  StudentCurriculumResponse,
  StudentProfileResponse,
  TeacherAssignmentsData,
} from '../types';
import { clientCache } from './cache';

const BASE_URL = (import.meta.env.VITE_API_URL as string) || '/api/v1';

export function getMediaUrl(path?: string | null): string {
  if (!path) return '';
  if (path.startsWith('data:')) return path;
  if (path.startsWith('http://') || path.startsWith('https://')) {
    if (path.includes('ngrok') && !path.includes('ngrok-skip-browser-warning')) {
      const sep = path.includes('?') ? '&' : '?';
      return `${path}${sep}ngrok-skip-browser-warning=true`;
    }
    return path;
  }

  const envUrl = (import.meta.env.VITE_API_URL as string) || '';
  const cleanPath = path.startsWith('/') ? path : `/${path}`;

  if (envUrl.startsWith('http://') || envUrl.startsWith('https://')) {
    try {
      const parsed = new URL(envUrl);
      let fullUrl = `${parsed.origin}${cleanPath}`;
      if (fullUrl.includes('ngrok') && !fullUrl.includes('ngrok-skip-browser-warning')) {
        const sep = fullUrl.includes('?') ? '&' : '?';
        fullUrl = `${fullUrl}${sep}ngrok-skip-browser-warning=true`;
      }
      return fullUrl;
    } catch {}
  }

  return cleanPath;
}


class ApiService {
  private token: string | null = null;

  constructor() {
    this.token = sessionStorage.getItem('lms_token');
  }

  setToken(token: string | null) {
    this.token = token;
    if (token) {
      sessionStorage.setItem('lms_token', token);
    } else {
      sessionStorage.removeItem('lms_token');
      clientCache.invalidate(); // XÃ³a sáº¡ch cache khi Ä‘Äƒng xuáº¥t
    }
  }

  invalidateCache(pattern?: string) {
    clientCache.invalidate(pattern);
  }

  getToken(): string | null {
    return this.token;
  }

  getMediaUrl(path?: string | null): string {
    return getMediaUrl(path);
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      'ngrok-skip-browser-warning': 'true',
      ...(options.headers as Record<string, string>),
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    if (!(options.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }

    const response = await fetch(`${BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    const json = await response.json();

    if (!response.ok || json.success === false) {
      const errorMsg = json.message || 'YÃªu cáº§u khÃ´ng thÃ nh cÃ´ng.';
      throw new Error(errorMsg);
    }

    return json.data;
  }

  // --- 1. AUTH ---
  async login(username: string, password: string): Promise<{ accessToken: string; user: AuthUser }> {
    const data = await this.request<{ accessToken: string; user: AuthUser }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
    this.setToken(data.accessToken);
    return data;
  }

  async getProfile(): Promise<AuthUser> {
    const raw = await this.request<any>('/auth/profile');
    return {
      maNguoiDung: raw.maNguoiDung || raw.MaNguoiDung,
      tenDangNhap: raw.tenDangNhap || raw.TenDangNhap,
      hoVaTen: raw.hoVaTen || raw.HoVaTen,
      maVaiTro: raw.maVaiTro || raw.MaVaiTro,
      tenVaiTro: raw.tenVaiTro || raw.TenVaiTro,
      soCCCD: raw.soCCCD || raw.SoCCCD,
      soDienThoai: raw.soDienThoai || raw.SoDienThoai,
      email: raw.email || raw.Email,
      avatarUrl: raw.avatarUrl || raw.AvatarUrl || undefined,
      trangThai: raw.trangThai !== undefined ? raw.trangThai : raw.TrangThai,
    };
  }

  logout() {
    this.setToken(null);
  }

  // --- 2. USERS (USER_MOD) ---
  async getUsers(params: {
    tuKhoa?: string;
    maVaiTro?: string;
    trangThai?: number;
    trangHienTai?: number;
    soBanGhiMoiTrang?: number;
    sapXepTheo?: string;
    huongSapXep?: string;
  }): Promise<{ danhSach: UserItem[]; phanTrang: PaginationMeta }> {
    const query = new URLSearchParams();
    if (params.tuKhoa) query.append('tuKhoa', params.tuKhoa);
    if (params.maVaiTro) query.append('maVaiTro', params.maVaiTro);
    if (params.trangThai !== undefined) query.append('trangThai', String(params.trangThai));
    if (params.trangHienTai) query.append('trangHienTai', String(params.trangHienTai));
    if (params.soBanGhiMoiTrang) query.append('soBanGhiMoiTrang', String(params.soBanGhiMoiTrang));
    if (params.sapXepTheo) query.append('sapXepTheo', params.sapXepTheo);
    if (params.huongSapXep) query.append('huongSapXep', params.huongSapXep);

    return this.request<{ danhSach: UserItem[]; phanTrang: PaginationMeta }>(`/users?${query.toString()}`);
  }

  async createUser(data: {
    tenDangNhap: string;
    matKhau: string;
    hoVaTen: string;
    soCCCD?: string;
    soDienThoai?: string;
    email?: string;
    maVaiTro: string;
  }) {
    return this.request('/users', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateUser(id: number, data: {
    hoVaTen?: string;
    soCCCD?: string;
    soDienThoai?: string;
    email?: string;
    maVaiTro?: string;
    tenDangNhap?: string;
    matKhau?: string;
    trangThai?: boolean;
  }) {
    return this.request(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async changeUserStatus(id: number, trangThaiMoi: boolean) {
    return this.request(`/users/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ trangThaiMoi }),
    });
  }

  async deleteUser(id: number) {
    return this.request(`/users/${id}`, {
      method: 'DELETE',
    });
  }

  // --- 3. COURSES & LESSONS (COURSE_MOD) ---
  async getCourses(forceRefresh: boolean = false): Promise<CourseItem[]> {
    const cacheKey = 'cache:courses';
    if (!forceRefresh) {
      const cached = clientCache.get<CourseItem[]>(cacheKey);
      if (cached) return cached;
    }
    const data = await this.request<CourseItem[]>('/courses');
    clientCache.set(cacheKey, data, 300); // LÆ°u cache 5 phÃºt
    return data;
  }

  async createCourse(data: { maHangGPLX: string; tenKhoaHoc: string; moTa?: string; tongSoGioLyThuyet?: number }) {
    const res = await this.request('/courses', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    clientCache.invalidate('cache:courses');
    return res;
  }

  async getLessons(courseId: number, forceRefresh: boolean = false): Promise<LessonItem[]> {
    const cacheKey = `cache:lessons:${courseId}`;
    if (!forceRefresh) {
      const cached = clientCache.get<LessonItem[]>(cacheKey);
      if (cached) return cached;
    }
    const data = await this.request<LessonItem[]>(`/courses/${courseId}/lessons`);
    clientCache.set(cacheKey, data, 300); // LÆ°u cache 5 phÃºt
    return data;
  }

  async createLesson(data: {
    maKhoaHoc: number;
    tenBaiGiang: string;
    monHoc: string;
    soThuTu?: number;
    duongDanVideo?: string;
    thoiLuongPhut?: number;
    taiLieuDinhKem?: string;
  }) {
    const res = await this.request('/courses/lessons', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    clientCache.invalidate(`cache:lessons:${data.maKhoaHoc}`);
    return res;
  }

  async updateLesson(lessonId: number, data: any) {
    const res = await this.request(`/courses/lessons/${lessonId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    clientCache.invalidate('cache:curriculum');
    return res;
  }

  async deleteLesson(lessonId: number) {
    const res = await this.request(`/courses/lessons/${lessonId}`, {
      method: 'DELETE',
    });
    clientCache.invalidate('cache:curriculum');
    return res;
  }

  // --- QUáº¢N TRá»Š BÃ€I GIáº¢NG & CHÆ¯Æ NG THEO KHÃ“A (THEO YÃŠU Cáº¦U Má»šI) ---
  async getCurriculumSummary(forceRefresh: boolean = false): Promise<CurriculumSummaryItem[]> {
    const cacheKey = 'cache:curriculum:summary';
    if (!forceRefresh) {
      const cached = clientCache.get<CurriculumSummaryItem[]>(cacheKey);
      if (cached) return cached;
    }
    const data = await this.request<CurriculumSummaryItem[]>('/courses/curriculum/summary');
    clientCache.set(cacheKey, data, 120);
    return data;
  }

  async getCurriculumDetail(courseId: number, forceRefresh: boolean = false): Promise<CurriculumDetailResponse> {
    const cacheKey = `cache:curriculum:detail:${courseId}`;
    if (!forceRefresh) {
      const cached = clientCache.get<CurriculumDetailResponse>(cacheKey);
      if (cached) return cached;
    }
    const data = await this.request<CurriculumDetailResponse>(`/courses/${courseId}/curriculum/detail`);
    clientCache.set(cacheKey, data, 120);
    return data;
  }

  async createChapter(courseId: number, data: { tenChuong: string; soThuTu?: number; soGioChuan?: number; phanTramYeuCau?: number }) {
    const res = await this.request(`/courses/${courseId}/chapters`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    clientCache.invalidate('cache:curriculum');
    return res;
  }

  async updateChapter(chapterId: number, data: { tenChuong: string; soThuTu?: number; soGioChuan?: number; phanTramYeuCau?: number }) {
    const res = await this.request(`/courses/chapters/${chapterId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    clientCache.invalidate('cache:curriculum');
    return res;
  }

  async deleteChapter(chapterId: number) {
    const res = await this.request(`/courses/chapters/${chapterId}`, {
      method: 'DELETE',
    });
    clientCache.invalidate('cache:curriculum');
    return res;
  }

  async createLessonInChapter(
    courseId: number,
    chapterId: number,
    data: { tenBaiGiang: string; soThuTu?: number; thoiLuongPhut?: number; duongDanVideo?: string; taiLieuDinhKem?: string }
  ) {
    const res = await this.request(`/courses/${courseId}/chapters/${chapterId}/lessons`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    clientCache.invalidate('cache:curriculum');
    return res;
  }

  async updateCourseRequirement(courseId: number, data: { tongSoGioLyThuyet?: number; moTa?: string }) {
    const res = await this.request(`/courses/${courseId}/requirement`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    clientCache.invalidate('cache:curriculum');
    clientCache.invalidate('cache:courses');
    return res;
  }

  async deleteCourse(courseId: number) {
    const res = await this.request(`/courses/${courseId}`, {
      method: 'DELETE',
    });
    clientCache.invalidate('cache:courses');
    clientCache.invalidate('cache:curriculum');
    return res;
  }

  // --- 4. CLASSES (CLASS_MOD) ---
  async getClasses(forceRefresh: boolean = false): Promise<ClassItem[]> {
    const cacheKey = 'cache:classes';
    if (!forceRefresh) {
      const cached = clientCache.get<ClassItem[]>(cacheKey);
      if (cached) return cached;
    }
    const data = await this.request<ClassItem[]>('/classes');
    clientCache.set(cacheKey, data, 180); // LÆ°u cache 3 phÃºt
    return data;
  }

  async createClass(data: {
    maLopHocCode: string;
    tenLopHoc: string;
    maKhoaHoc: number;
    maGiaoVienPhuTrach?: number;
    ngayKhaiGiang: string;
    ngayBeGiang: string;
    trangThai?: string;
  }) {
    const res = await this.request('/classes', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    clientCache.invalidate('cache:classes');
    return res;
  }

  async updateClass(
    classId: number,
    data: {
      tenLopHoc: string;
      maKhoaHoc: number;
      maGiaoVienPhuTrach?: number;
      ngayKhaiGiang: string;
      ngayBeGiang: string;
      trangThai?: string;
      maLopHocCode?: string;
    }
  ) {
    const res = await this.request(`/classes/${classId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    clientCache.invalidate('cache:classes');
    return res;
  }

  async deleteClass(classId: number) {
    const res = await this.request(`/classes/${classId}`, {
      method: 'DELETE',
    });
    clientCache.invalidate('cache:classes');
    return res;
  }

  async assignTeacher(classId: number, maGiaoVienPhuTrach: number) {
    const res = await this.request(`/classes/${classId}/assign-teacher`, {
      method: 'PATCH',
      body: JSON.stringify({ maGiaoVienPhuTrach }),
    });
    clientCache.invalidate('cache:classes');
    return res;
  }

  async getClassStudents(classId: number) {
    return this.request<any[]>(`/classes/${classId}/students`);
  }

  // --- 5. AUTOMATION (AUTO_MOD) ---
  async uploadReportFile(arg1: File | number, arg2?: File | number) {
    let file: File;
    let classId: number | undefined;

    if (arg1 instanceof File) {
      file = arg1;
      classId = typeof arg2 === 'number' ? arg2 : undefined;
    } else {
      classId = arg1;
      file = arg2 as File;
    }

    const formData = new FormData();
    formData.append('file', file);
    const query = classId ? `?classId=${classId}` : '';

    const res = await this.request(`/automation/upload-report${query}`, {
      method: 'POST',
      body: formData,
    });
    clientCache.invalidate('cache:classes');
    clientCache.invalidate('cache:users');
    return res;
  }

  async importStudentsJson(classId: number, danhSachHocVien: any[]) {
    return this.request('/automation/import-students', {
      method: 'POST',
      body: JSON.stringify({ maLopHoc: classId, danhSachHocVien }),
    });
  }

  async previewTeacherAssign(classId: number, file: File) {
    const formData = new FormData();
    formData.append('file', file);
    return this.request<any>(`/automation/preview-teacher-assign?classId=${classId}`, {
      method: 'POST',
      body: formData,
    });
  }

  async assignTeachersExcel(classId: number, file: File) {
    const formData = new FormData();
    formData.append('file', file);
    const res = await this.request<any>(`/automation/assign-teachers-excel?classId=${classId}`, {
      method: 'POST',
      body: formData,
    });
    clientCache.invalidate('cache:classes');
    return res;
  }

  // --- 6. LMS (LMS_MOD) ---
  async getMyCourses(): Promise<StudentEnrolledCourse[]> {
    return this.request<StudentEnrolledCourse[]>('/lms/my-courses');
  }

  async getCourseCurriculum(classId: number): Promise<StudentCurriculumResponse> {
    return this.request<StudentCurriculumResponse>(`/lms/courses/${classId}/curriculum`);
  }

  async getStudentProfile(): Promise<StudentProfileResponse> {
    return this.request<StudentProfileResponse>('/lms/student-profile');
  }

  async heartbeatProgress(maBaiGiang: number, thoiGianCongThemGiay: number = 30) {
    return this.request('/lms/heartbeat-progress', {
      method: 'POST',
      body: JSON.stringify({ maBaiGiang, thoiGianCongThemGiay }),
    });
  }

  async getProgress(classId?: number): Promise<{
    danhSachBaiHoc?: StudentProgressItem[];
    thongKeTongHop?: StudentProgressSummary;
    danhSachHocVien?: any[];
  }> {
    const query = classId ? `?classId=${classId}` : '';
    return this.request(`/lms/progress${query}`);
  }

  async changePassword(matKhauCu: string, matKhauMoi: string) {
    return this.request('/lms/change-password', {
      method: 'POST',
      body: JSON.stringify({ matKhauCu, matKhauMoi }),
    });
  }

  // --- 7. REPORTS (REPORT_MOD) ---
  async getCoursesOverview(courseId?: number, classId?: number): Promise<ReportOverviewItem[]> {
    const query = new URLSearchParams();
    if (courseId) query.append('courseId', String(courseId));
    if (classId) query.append('classId', String(classId));
    return this.request<ReportOverviewItem[]>(`/reports/courses-overview?${query.toString()}`);
  }

  async getStudentReport(studentId: number) {
    return this.request<any>(`/reports/students/${studentId}`);
  }

  async getTeacherAssignments(teacherId: number) {
    return this.request<any>(`/users/${teacherId}/teacher-assignments`);
  }

  async getMyTeacherAssignments(): Promise<TeacherAssignmentsData> {
    return this.request<TeacherAssignmentsData>('/users/me/teacher-assignments');
  }

  // --- 8. AVATAR UPLOAD (QUY_TRINH_LUU_ANH) ---
  async uploadMyAvatar(file: File): Promise<{ avatarUrl: string }> {
    const formData = new FormData();
    formData.append('avatar', file);
    const result = await this.request<{ avatarUrl: string }>('/users/me/avatar', {
      method: 'POST',
      body: formData,
    });
    this.invalidateCache();
    return result;
  }

  async uploadUserAvatar(userId: number, file: File): Promise<{ avatarUrl: string }> {
    const formData = new FormData();
    formData.append('avatar', file);
    const result = await this.request<{ avatarUrl: string }>(`/users/${userId}/avatar`, {
      method: 'POST',
      body: formData,
    });
    this.invalidateCache();
    return result;
  }
}

export const api = new ApiService();


