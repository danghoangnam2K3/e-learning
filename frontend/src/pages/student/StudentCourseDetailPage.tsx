import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { StudentCurriculumResponse, StudentChapterItem } from '../../types';
import {
  ArrowLeft,
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock,
  PlayCircle,
  Award,
  ChevronDown,
  ChevronRight,
  FileQuestion,
  UserCheck,
  Phone,
  HelpCircle,
  FileText,
  AlertCircle,
  RefreshCw,
  Sparkles,
} from 'lucide-react';

export const StudentCourseDetailPage: React.FC = () => {
  const { classId } = useParams<{ classId: string }>();
  const navigate = useNavigate();

  const [curriculum, setCurriculum] = useState<StudentCurriculumResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedChapters, setExpandedChapters] = useState<Record<number, boolean>>({});

  const loadCurriculum = async () => {
    if (!classId) return;
    try {
      setLoading(true);
      setError(null);
      const res = await api.getCourseCurriculum(Number(classId));
      setCurriculum(res);

      // Auto expand all chapters initially
      const initialExp: Record<number, boolean> = {};
      res.danhSachChuong?.forEach((ch) => {
        initialExp[ch.maChuong] = true;
      });
      setExpandedChapters(initialExp);
    } catch (err: any) {
      console.error('Error loading course curriculum:', err);
      setError(err.message || 'Không thể tải đề cương bài giảng. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCurriculum();
  }, [classId]);

  const toggleChapter = (maChuong: number) => {
    setExpandedChapters((prev) => ({
      ...prev,
      [maChuong]: !prev[maChuong],
    }));
  };

  const expandAll = () => {
    const next: Record<number, boolean> = {};
    curriculum?.danhSachChuong.forEach((c) => (next[c.maChuong] = true));
    setExpandedChapters(next);
  };

  const collapseAll = () => {
    setExpandedChapters({});
  };

  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center space-y-3">
        <div className="w-10 h-10 border-4 border-amber-400/20 border-t-amber-400 rounded-full animate-spin"></div>
        <span className="text-xs font-semibold text-slate-500">Đang chuẩn bị đề cương học tập...</span>
      </div>
    );
  }

  if (error || !curriculum) {
    return (
      <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-sm max-w-xl mx-auto text-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center mx-auto">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h3 className="text-base font-bold text-slate-800">Không tìm thấy thông tin khóa học</h3>
        <p className="text-xs text-slate-500 leading-relaxed">
          {error || 'Lớp học không tồn tại hoặc bạn chưa được phân quyền vào lớp học này.'}
        </p>
        <button
          onClick={() => navigate('/hoc/khoahoc')}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-400 text-slate-950 font-bold text-xs hover:bg-amber-300 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Quay lại Khóa học của tôi</span>
        </button>
      </div>
    );
  }

  const { thongTinLop, thongTinKhoaHoc, tienDoTongHop, danhSachChuong } = curriculum;

  return (
    <div className="space-y-6">
      {/* 1. Top Navigation & Breadcrumb */}
      <div className="flex items-center justify-between gap-4">
        <button
          onClick={() => navigate('/hoc/khoahoc')}
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-amber-600 transition-colors cursor-pointer group"
        >
          <div className="p-2 rounded-xl bg-white border border-slate-200 group-hover:border-amber-300 group-hover:bg-amber-50 transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </div>
          <span>Quay lại danh sách khóa học</span>
        </button>

        <button
          onClick={loadCurriculum}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Đồng bộ tiến độ</span>
        </button>
      </div>

      {/* 2. Course Hero Banner */}
      <div className="bg-gradient-to-br from-[#0c1322] via-[#162035] to-[#1e293b] rounded-3xl p-6 sm:p-8 text-white shadow-xl border border-slate-700/50 relative overflow-hidden">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-xl bg-amber-400 text-slate-950 font-black text-xs shadow-sm">
                Hạng {thongTinKhoaHoc.maHangGPLX}
              </span>
              <span className="px-2.5 py-0.5 rounded-lg bg-white/10 text-slate-300 font-bold text-xs border border-white/10">
                Lớp: {thongTinLop.tenLopHoc} ({thongTinLop.maLopHocCode})
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-heading font-black tracking-tight text-white">
              {thongTinKhoaHoc.tenKhoaHoc}
            </h1>

            <p className="text-xs text-slate-300 leading-relaxed">
              {thongTinKhoaHoc.moTa ||
                'Toàn bộ giáo trình lý thuyết bám sát bộ đề 600 câu hỏi sát hạch lái xe cơ giới đường bộ của Cục Đường bộ Việt Nam.'}
            </p>

            {/* Teacher Info */}
            <div className="pt-2 flex flex-wrap items-center gap-4 text-xs">
              <div className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-xl border border-white/10">
                <UserCheck className="w-4 h-4 text-amber-400" />
                <span className="text-slate-300">
                  Giáo viên: <strong className="text-white">{thongTinLop.tenGiaoVien}</strong>
                </span>
              </div>
              {thongTinLop.soDienThoaiGiaoVien && (
                <div className="flex items-center gap-1.5 text-slate-300">
                  <Phone className="w-3.5 h-3.5 text-amber-400" />
                  <span>{thongTinLop.soDienThoaiGiaoVien}</span>
                </div>
              )}
            </div>
          </div>

          {/* Quick Progress Dial / Card */}
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/15 min-w-[280px] space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300">Tiến độ hoàn thành</span>
              <span className="text-xl font-heading font-black text-amber-400">
                {tienDoTongHop.tiLeHoanThanh}%
              </span>
            </div>

            <div className="w-full bg-slate-900/60 h-2.5 rounded-full overflow-hidden">
              <div
                className="bg-gradient-to-r from-amber-500 to-amber-300 h-full rounded-full transition-all duration-700"
                style={{ width: `${Math.min(100, tienDoTongHop.tiLeHoanThanh)}%` }}
              ></div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1 text-center text-xs">
              <div className="p-2 rounded-xl bg-black/20">
                <span className="text-slate-400 block text-[10px]">Bài hoàn thành</span>
                <span className="font-bold text-white text-sm">
                  {tienDoTongHop.soBaiDaHoanThanh} / {tienDoTongHop.tongSoBai}
                </span>
              </div>
              <div className="p-2 rounded-xl bg-black/20">
                <span className="text-slate-400 block text-[10px]">Thời gian học</span>
                <span className="font-bold text-amber-300 text-sm">
                  {tienDoTongHop.tongThoiGianHocGio}h / {thongTinKhoaHoc.tongSoGioLyThuyet}h
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Section Header & Tree Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-heading font-black text-slate-900 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-amber-500" />
            <span>Chương Trình Đào Tạo & Danh Sách Bài Học</span>
          </h2>
          <p className="text-xs text-slate-500">
            Gồm {danhSachChuong.length} chương chuyên đề và {tienDoTongHop.tongSoBai} bài giảng điện tử
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={expandAll}
            className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors"
          >
            Mở rộng tất cả
          </button>
          <button
            onClick={collapseAll}
            className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors"
          >
            Thu gọn tất cả
          </button>
        </div>
      </div>

      {/* 4. Syllabus Accordion (Chapters & Lessons Tree) */}
      <div className="space-y-4">
        {danhSachChuong.map((chapter) => {
          const isExpanded = !!expandedChapters[chapter.maChuong];
          const isChapterComplete = chapter.tiLeHoanThanhChuong >= 100;

          return (
            <div
              key={chapter.maChuong}
              className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden transition-all"
            >
              {/* Chapter Header Accordion Button */}
              <div
                onClick={() => toggleChapter(chapter.maChuong)}
                className="p-5 flex items-center justify-between gap-4 cursor-pointer hover:bg-slate-50/80 transition-colors select-none"
              >
                <div className="flex items-center gap-3.5 flex-1 min-w-0">
                  <div
                    className={`w-9 h-9 rounded-2xl flex items-center justify-center font-bold text-sm shrink-0 ${
                      isChapterComplete
                        ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                        : 'bg-amber-50 text-amber-600 border border-amber-200'
                    }`}
                  >
                    {isChapterComplete ? (
                      <CheckCircle2 className="w-5 h-5" />
                    ) : (
                      chapter.soThuTu
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-0.5">
                      <span className="text-xs font-bold text-slate-400">
                        Chương {chapter.soThuTu}
                      </span>
                      <span className="text-xs text-slate-400">•</span>
                      <span className="text-xs font-medium text-slate-500">
                        {chapter.soBaiGiang} bài giảng
                      </span>
                      {chapter.soGioChuan > 0 && (
                        <>
                          <span className="text-xs text-slate-400">•</span>
                          <span className="text-xs font-medium text-slate-500">
                            {chapter.soGioChuan} giờ chuẩn
                          </span>
                        </>
                      )}
                    </div>
                    <h3 className="font-heading font-black text-slate-900 text-sm sm:text-base truncate">
                      {chapter.tenChuong}
                    </h3>
                  </div>
                </div>

                <div className="flex items-center gap-4 shrink-0">
                  {/* Chapter Progress Indicator */}
                  <div className="hidden sm:flex flex-col items-end">
                    <span className="text-xs font-black text-slate-800">
                      {chapter.tiLeHoanThanhChuong}%
                    </span>
                    <span className="text-[10px] text-slate-400 font-semibold">
                      {chapter.soBaiDaHoanThanh}/{chapter.soBaiGiang} hoàn thành
                    </span>
                  </div>

                  <div
                    className={`p-2 rounded-xl bg-slate-100 text-slate-500 transition-transform duration-200 ${
                      isExpanded ? 'rotate-180' : ''
                    }`}
                  >
                    <ChevronDown className="w-4 h-4" />
                  </div>
                </div>
              </div>

              {/* Chapter Lessons List & Theory Exam */}
              {isExpanded && (
                <div className="border-t border-slate-100 bg-slate-50/40 p-4 sm:p-5 space-y-2.5">
                  {chapter.danhSachBaiHoc.length === 0 ? (
                    <div className="py-6 text-center text-xs text-slate-400 font-medium">
                      Chương này hiện chưa có bài giảng nào được cấu hình.
                    </div>
                  ) : (
                    chapter.danhSachBaiHoc.map((lesson) => {
                      const isLessonDone = lesson.trangThai === 'HOAN_THANH';
                      const isLessonActive = lesson.trangThai === 'DANG_HOC';

                      return (
                        <div
                          key={lesson.maBaiGiang}
                          onClick={() =>
                            navigate(`/hoc/khoahoc/${thongTinLop.maLopHoc}/baihoc/${lesson.maBaiGiang}`)
                          }
                          className="bg-white p-4 rounded-2xl border border-slate-200/80 hover:border-amber-400 hover:shadow-md transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
                        >
                          <div className="flex items-center gap-3.5 flex-1 min-w-0">
                            <div
                              className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 ${
                                isLessonDone
                                  ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                                  : isLessonActive
                                  ? 'bg-amber-400 text-slate-950 font-bold shadow-sm'
                                  : 'bg-slate-100 text-slate-400 border border-slate-200'
                              }`}
                            >
                              {isLessonDone ? (
                                <CheckCircle2 className="w-5 h-5 stroke-[2.5]" />
                              ) : isLessonActive ? (
                                <PlayCircle className="w-5 h-5" />
                              ) : (
                                <PlayCircle className="w-5 h-5 text-slate-400" />
                              )}
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-0.5">
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                                  Bài {lesson.soThuTu}
                                </span>
                                {lesson.monHoc && (
                                  <span className="text-[10px] font-semibold text-slate-400">
                                    • {lesson.monHoc}
                                  </span>
                                )}
                              </div>
                              <h4 className="text-sm font-bold text-slate-900 group-hover:text-amber-600 transition-colors truncate">
                                {lesson.tenBaiGiang}
                              </h4>
                            </div>
                          </div>

                          {/* Lesson Stats & Action */}
                          <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100">
                            <div className="flex items-center gap-3 text-xs">
                              <span className="flex items-center gap-1 text-slate-500 font-medium">
                                <Clock className="w-3.5 h-3.5 text-slate-400" />
                                {lesson.thoiLuongPhut} phút
                              </span>
                              <span className="text-slate-300">|</span>
                              <span className="text-slate-500 font-medium">
                                Đã học: <strong>{lesson.thoiGianHocPhut}p</strong>
                              </span>
                            </div>

                            <span
                              className={`px-3 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1 ${
                                isLessonDone
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : isLessonActive
                                  ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                  : 'bg-slate-100 text-slate-600'
                              }`}
                            >
                              {isLessonDone ? 'Đã xong' : isLessonActive ? 'Đang học' : 'Chưa học'}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}

                  {/* Mục Kiểm tra lý thuyết cuối chương */}
                  {chapter.kiemTraLyThuyet && (
                    <div className="mt-4 p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-amber-400/5 to-transparent border border-amber-300/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-bold shrink-0 shadow-sm">
                          <FileQuestion className="w-5 h-5 stroke-[2.5]" />
                        </div>
                        <div>
                          <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider block">
                            Đánh giá kiến thức chương
                          </span>
                          <h4 className="text-sm font-black text-slate-900">
                            {chapter.kiemTraLyThuyet.tieuDe}
                          </h4>
                          <p className="text-xs text-slate-500 mt-0.5">
                            {chapter.kiemTraLyThuyet.soCauHoi} câu hỏi trắc nghiệm • Thời gian:{' '}
                            {chapter.kiemTraLyThuyet.thoiGianLamBaiPhut} phút • Điểm đạt:{' '}
                            {chapter.kiemTraLyThuyet.diemDat}/{chapter.kiemTraLyThuyet.soCauHoi}
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          alert(
                            `Hệ thống thi thử trắc nghiệm ${chapter.kiemTraLyThuyet.tieuDe} đang được kết nối với ngân hàng 600 câu hỏi sát hạch!`
                          );
                        }}
                        className="px-4 py-2 rounded-xl bg-slate-900 text-amber-400 hover:bg-slate-800 text-xs font-bold transition-all cursor-pointer shrink-0 shadow-sm"
                      >
                        Làm bài kiểm tra
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default StudentCourseDetailPage;
