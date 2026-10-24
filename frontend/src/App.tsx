import React, { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { MainLayout } from './layouts/MainLayout';
import { StudentLayout } from './layouts/StudentLayout';
import { TeacherLayout } from './layouts/TeacherLayout';

// Code splitting (Lazy loading) cho từng file trang riêng biệt
const LoginPage = lazy(() => import('./pages/LoginPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const StudentPage = lazy(() => import('./pages/StudentPage'));
const TeacherPage = lazy(() => import('./pages/TeacherPage'));
const CourseListPage = lazy(() => import('./pages/CourseListPage'));
const LessonPage = lazy(() => import('./pages/LessonPage'));
const AutomationReport1Page = lazy(() => import('./pages/AutomationReport1Page'));
const AutomationTeacherAssignPage = lazy(() => import('./pages/AutomationTeacherAssignPage'));
const CourseReportPage = lazy(() => import('./pages/CourseReportPage'));
const StudentReportPage = lazy(() => import('./pages/StudentReportPage'));
const AccountManagementPage = lazy(() => import('./pages/AccountManagementPage'));

// Phân hệ Học viên LMS Portal
const StudentMyCoursesPage = lazy(() => import('./pages/student/StudentMyCoursesPage'));
const StudentCourseDetailPage = lazy(() => import('./pages/student/StudentCourseDetailPage'));
const StudentStudyWorkspacePage = lazy(() => import('./pages/student/StudentStudyWorkspacePage'));
const StudentProfilePage = lazy(() => import('./pages/student/StudentProfilePage'));

// Phân hệ Giáo viên Teacher Portal
const TeacherCoursesPage = lazy(() => import('./pages/teacher/TeacherCoursesPage'));
const TeacherStudentsPage = lazy(() => import('./pages/teacher/TeacherStudentsPage'));
const TeacherProfilePage = lazy(() => import('./pages/teacher/TeacherProfilePage'));

const PageFallback = () => (
  <div className="flex flex-col items-center justify-center py-28 space-y-4">
    <div className="w-10 h-10 border-4 border-amber-400/20 border-t-amber-400 rounded-full animate-spin"></div>
    <div className="text-xs text-slate-500 font-semibold animate-pulse">
      Đang tải trang...
    </div>
  </div>
);

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Suspense fallback={<PageFallback />}>
          <Routes>
            {/* 1. MÀN HÌNH ĐĂNG NHẬP */}
            <Route path="/login" element={<LoginPage />} />

            {/* 2. CỔNG HỌC TRỰC TUYẾN DÀNH CHO HỌC VIÊN (AKKHOR LMS PORTAL) */}
            <Route path="/hoc" element={<StudentLayout />}>
              <Route index element={<Navigate to="khoahoc" replace />} />
              <Route path="khoahoc" element={<StudentMyCoursesPage />} />
              <Route path="khoahoc/:classId" element={<StudentCourseDetailPage />} />
              <Route path="khoahoc/:classId/baihoc/:lessonId" element={<StudentStudyWorkspacePage />} />
              <Route path="taikhoan" element={<StudentProfilePage />} />
            </Route>

            {/* 3. CỔNG QUẢN LÝ GIẢNG DẠY DÀNH CHO GIÁO VIÊN (TEACHER PORTAL) */}
            <Route path="/gv" element={<TeacherLayout />}>
              <Route index element={<Navigate to="khoahoc" replace />} />
              <Route path="khoahoc" element={<TeacherCoursesPage />} />
              <Route path="hocvien" element={<TeacherStudentsPage />} />
              <Route path="taikhoan" element={<TeacherProfilePage />} />
            </Route>

            {/* 3. GIAO DIỆN QUẢN TRỊ TRUNG TÂM (CHỨA HEADER & SIDEBAR CHUẨN) */}
            <Route path="/" element={<MainLayout />}>
              {/* Trang Dashboard chính (http://localhost:5173 và http://localhost:5173/dashboard) */}
              <Route index element={<DashboardPage />} />
              <Route path="dashboard" element={<DashboardPage />} />

              {/* Trang Học viên (http://localhost:5173/hocvien) */}
              <Route path="hocvien" element={<StudentPage />} />

              {/* Trang Giáo viên (http://localhost:5173/giaovien) */}
              <Route path="giaovien" element={<TeacherPage />} />

              {/* Phân hệ Khóa học */}
              {/* Danh sách khóa học (http://localhost:5173/khoahoc) */}
              <Route path="khoahoc" element={<CourseListPage />} />
              {/* Bài giảng mẫu & Quản lý chương (http://localhost:5173/baigiang) */}
              <Route path="baigiang" element={<LessonPage />} />

              {/* Phân hệ Tự động hóa */}
              {/* Báo cáo 1 XML (http://localhost:5173/tudonghoa/baocao1) */}
              <Route path="tudonghoa/baocao1" element={<AutomationReport1Page />} />
              {/* Phân công giáo viên Excel (http://localhost:5173/tudonghoa/phancong) */}
              <Route path="tudonghoa/phancong" element={<AutomationTeacherAssignPage />} />

              {/* Phân hệ Báo cáo */}
              {/* Báo cáo theo khóa học (http://localhost:5173/baocao/khoahoc) */}
              <Route path="baocao/khoahoc" element={<CourseReportPage />} />
              {/* Báo cáo theo học viên (http://localhost:5173/baocao/hocvien) */}
              <Route path="baocao/hocvien" element={<StudentReportPage />} />

              {/* Phân hệ Tài khoản */}
              {/* Quản lý tài khoản & Phân quyền (http://localhost:5173/taikhoan/quanly) */}
              <Route path="taikhoan/quanly" element={<AccountManagementPage />} />
            </Route>

            {/* Chuyển hướng các đường dẫn không tồn tại về trang chủ */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
