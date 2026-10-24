import { formatVideoEmbedUrl } from '../../utils/videoHelper';
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { StudentCurriculumResponse, StudentLessonItem } from '../../types';
import {
  ArrowLeft,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
  Clock,
  CheckCircle2,
  FileText,
  Download,
  AlertCircle,
  Sparkles,
  Award,
  Video,
  List,
  RefreshCw,
} from 'lucide-react';

export const StudentStudyWorkspacePage: React.FC = () => {
  const { classId, lessonId } = useParams<{ classId: string; lessonId: string }>();
  const navigate = useNavigate();

  const [curriculum, setCurriculum] = useState<StudentCurriculumResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Video & Heartbeat states
  const [isPlaying, setIsPlaying] = useState(false);
  const [studySeconds, setStudySeconds] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isHeartbeatSyncing, setIsHeartbeatSyncing] = useState(false);
  const [heartbeatNotice, setHeartbeatNotice] = useState<string | null>(null);

  const heartbeatTimerRef = useRef<any>(null);
  const localTimerRef = useRef<any>(null);

  // Load Curriculum
  const loadCurriculum = async () => {
    if (!classId) return;
    try {
      setLoading(true);
      setError(null);
      const res = await api.getCourseCurriculum(Number(classId));
      setCurriculum(res);
    } catch (err: any) {
      console.error('Error loading curriculum for study workspace:', err);
      setError(err.message || 'Không thể tải đề cương bài giảng.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCurriculum();
  }, [classId]);

  // Find Current Lesson, Chapter, and Next/Prev Lessons
  const allLessons: StudentLessonItem[] = [];
  curriculum?.danhSachChuong.forEach((c) => {
    c.danhSachBaiHoc.forEach((l) => allLessons.push(l));
  });

  const currentLessonIndex = allLessons.findIndex(
    (l) => l.maBaiGiang === Number(lessonId)
  );
  const currentLesson = currentLessonIndex !== -1 ? allLessons[currentLessonIndex] : null;
  const prevLesson = currentLessonIndex > 0 ? allLessons[currentLessonIndex - 1] : null;
  const nextLesson =
    currentLessonIndex !== -1 && currentLessonIndex < allLessons.length - 1
      ? allLessons[currentLessonIndex + 1]
      : null;

  const currentChapter = curriculum?.danhSachChuong.find(
    (c) => c.maChuong === currentLesson?.maChuong
  );

  // Reset lesson state when lesson changes
  useEffect(() => {
    if (currentLesson) {
      setStudySeconds(currentLesson.thoiGianHocGiay || 0);
      setIsCompleted(currentLesson.daHoanThanh || false);
      setIsPlaying(true); // Tự động bắt đầu học khi mở bài
    }
  }, [lessonId, currentLesson?.maBaiGiang]);

  // Local second ticker
  useEffect(() => {
    if (isPlaying) {
      localTimerRef.current = setInterval(() => {
        setStudySeconds((prev) => prev + 1);
      }, 1000);
    } else {
      if (localTimerRef.current) clearInterval(localTimerRef.current);
    }

    return () => {
      if (localTimerRef.current) clearInterval(localTimerRef.current);
    };
  }, [isPlaying]);

  // 30-Second Heartbeat to Backend (Strict Business Logic Separation)
  useEffect(() => {
    if (!isPlaying || !currentLesson) return;

    heartbeatTimerRef.current = setInterval(async () => {
      try {
        setIsHeartbeatSyncing(true);
        const res: any = await api.heartbeatProgress(currentLesson.maBaiGiang, 30);
        if (res && res.data) {
          if (res.data.daHoanThanh) {
            setIsCompleted(true);
          }
          setHeartbeatNotice('Đã lưu tiến độ học tập (+30 giây)');
          setTimeout(() => setHeartbeatNotice(null), 3000);
        }
      } catch (err) {
        console.warn('Heartbeat progress sync warning:', err);
      } finally {
        setIsHeartbeatSyncing(false);
      }
    }, 30000);

    return () => {
      if (heartbeatTimerRef.current) clearInterval(heartbeatTimerRef.current);
    };
  }, [isPlaying, currentLesson?.maBaiGiang]);

  const formatTime = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleManualSync = async () => {
    if (!currentLesson) return;
    try {
      setIsHeartbeatSyncing(true);
      const res: any = await api.heartbeatProgress(currentLesson.maBaiGiang, 30);
      if (res?.data?.daHoanThanh) {
        setIsCompleted(true);
      }
      setHeartbeatNotice('Đã đồng bộ thời gian học lên hệ thống!');
      setTimeout(() => setHeartbeatNotice(null), 3500);
      // Refresh curriculum tree
      loadCurriculum();
    } catch (err: any) {
      alert('Không thể đồng bộ: ' + (err.message || 'Lỗi mạng'));
    } finally {
      setIsHeartbeatSyncing(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center space-y-3">
        <div className="w-10 h-10 border-4 border-amber-400/20 border-t-amber-400 rounded-full animate-spin"></div>
        <span className="text-xs font-semibold text-slate-500">Đang khởi tạo không gian bài học...</span>
      </div>
    );
  }

  if (error || !curriculum || !currentLesson) {
    return (
      <div className="p-8 rounded-3xl bg-white border border-slate-200/80 shadow-sm max-w-lg mx-auto text-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center mx-auto">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h3 className="text-base font-bold text-slate-800">Không tìm thấy bài giảng</h3>
        <p className="text-xs text-slate-500">
          Bài giảng không tồn tại hoặc đã được chuyển sang chương trình khác.
        </p>
        <button
          onClick={() => navigate(`/hoc/khoahoc/${classId}`)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-400 text-slate-950 font-bold text-xs hover:bg-amber-300 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Về trang khóa học</span>
        </button>
      </div>
    );
  }

  const lessonDurationSec = (currentLesson.thoiLuongPhut || 45) * 60;
  const progressPercent = Math.min(100, Math.round((studySeconds / lessonDurationSec) * 100));

  return (
    <div className="space-y-4">
      {/* 1. Header Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(`/hoc/khoahoc/${classId}`)}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
            title="Quay lại chi tiết khóa học"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider block">
              {curriculum.thongTinKhoaHoc.tenKhoaHoc} • {curriculum.thongTinLop.tenLopHoc}
            </span>
            <h2 className="text-sm sm:text-base font-heading font-black text-slate-900 truncate">
              {currentChapter?.tenChuong}
            </h2>
          </div>
        </div>

        {/* Sync & Heartbeat Indicator */}
        <div className="flex items-center gap-3">
          {heartbeatNotice && (
            <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 animate-fadeIn">
              {heartbeatNotice}
            </span>
          )}

          <button
            onClick={handleManualSync}
            disabled={isHeartbeatSyncing}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-bold transition-all disabled:opacity-50 cursor-pointer"
            title="Đồng bộ thủ công"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isHeartbeatSyncing ? 'animate-spin' : ''}`} />
            <span>Lưu tiến độ</span>
          </button>
        </div>
      </div>

      {/* 2. Main Study Grid: Left Syllabus Sidebar + Center Video Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* --- CỘT BÊN TRÁI: DANH MỤC CÂY BÀI HỌC CỦA KHÓA HỌC (4 COLUMNS) --- */}
        <div className="lg:col-span-4 bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col h-[750px]">
          <div className="p-4 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <List className="w-4 h-4 text-amber-500" />
              <h3 className="text-xs font-heading font-black text-slate-800 uppercase tracking-wider">
                Đề cương khóa học
              </h3>
            </div>
            <span className="text-[11px] font-bold text-slate-500">
              {curriculum.tienDoTongHop.soBaiDaHoanThanh}/{allLessons.length} bài
            </span>
          </div>

          {/* Scrollable Lesson Tree */}
          <div className="flex-1 overflow-y-auto p-3 space-y-4 scrollbar-thin">
            {curriculum.danhSachChuong.map((ch) => (
              <div key={ch.maChuong} className="space-y-1.5">
                <div className="px-2 py-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                  <span>Chương {ch.soThuTu}</span>
                  <span>{ch.tiLeHoanThanhChuong}%</span>
                </div>
                <div className="text-xs font-black text-slate-800 px-2 pb-1 truncate">
                  {ch.tenChuong}
                </div>

                <div className="space-y-1">
                  {ch.danhSachBaiHoc.map((l) => {
                    const isCurrent = l.maBaiGiang === currentLesson.maBaiGiang;
                    const isDone = l.trangThai === 'HOAN_THANH';

                    return (
                      <button
                        key={l.maBaiGiang}
                        onClick={() =>
                          navigate(`/hoc/khoahoc/${classId}/baihoc/${l.maBaiGiang}`)
                        }
                        className={`w-full text-left p-2.5 rounded-xl text-xs font-semibold flex items-center gap-2.5 transition-all cursor-pointer ${
                          isCurrent
                            ? 'bg-amber-400 text-slate-950 font-bold shadow-md shadow-amber-400/20'
                            : isDone
                            ? 'bg-emerald-50/60 text-slate-700 hover:bg-emerald-50 border border-emerald-100'
                            : 'text-slate-600 hover:bg-slate-100/80'
                        }`}
                      >
                        <div className="shrink-0">
                          {isDone ? (
                            <CheckCircle2
                              className={`w-4 h-4 ${
                                isCurrent ? 'text-slate-950' : 'text-emerald-600'
                              }`}
                            />
                          ) : (
                            <Play
                              className={`w-3.5 h-3.5 ${
                                isCurrent ? 'text-slate-950' : 'text-slate-400'
                              }`}
                            />
                          )}
                        </div>

                        <span className="flex-1 truncate">{l.tenBaiGiang}</span>
                        <span
                          className={`text-[10px] shrink-0 font-medium ${
                            isCurrent ? 'text-slate-900' : 'text-slate-400'
                          }`}
                        >
                          {l.thoiLuongPhut}p
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* --- KHU VỰC CHÍNH GIỮA: LESSON WORKSPACE & VIDEO PLAYER (8 COLUMNS) --- */}
        <div className="lg:col-span-8 space-y-5">
          {/* Video Player Box */}
          <div className="bg-[#0b101c] rounded-3xl overflow-hidden shadow-2xl border border-slate-800 flex flex-col">
            {/* Player Container */}
            <div className="relative aspect-video w-full bg-slate-950 flex items-center justify-center group overflow-hidden">
              {currentLesson.duongDanVideo && currentLesson.duongDanVideo.trim().length > 0 ? (
                (() => {
                  const embedUrl = formatVideoEmbedUrl(currentLesson.duongDanVideo);
                  if (embedUrl.match(/\.(mp4|webm|ogg)($|\?)/i)) {
                    return (
                      <video
                        src={embedUrl}
                        controls
                        className="w-full h-full object-contain"
                        onPlay={() => setIsPlaying(true)}
                        onPause={() => setIsPlaying(false)}
                      />
                    );
                  }
                  return (
                    <iframe
                      src={embedUrl}
                      title={currentLesson.tenBaiGiang}
                      className="w-full h-full border-0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowFullScreen
                    ></iframe>
                  );
                })()
              ) : (
                /* Rich HTML5 Graphic Simulated Player */
                <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center bg-gradient-to-tr from-slate-950 via-[#0e1628] to-slate-900 relative">
                  <div className="absolute inset-0 bg-[radial-gradient(#f59e0b_1px,transparent_1px)] [background-size:24px_24px] opacity-10"></div>

                  <div className="relative z-10 space-y-4 max-w-md">
                    <div className="w-20 h-20 rounded-full bg-amber-400/20 border-2 border-amber-400/40 flex items-center justify-center mx-auto text-amber-400 shadow-xl shadow-amber-400/10">
                      {isPlaying ? (
                        <Video className="w-10 h-10 animate-pulse text-amber-400" />
                      ) : (
                        <Play className="w-10 h-10 translate-x-0.5 text-amber-400" />
                      )}
                    </div>

                    <div>
                      <span className="text-[11px] font-bold text-amber-400 uppercase tracking-widest block mb-1">
                        Video Bài Giảng Lý Thuyết Sát Hạch
                      </span>
                      <h3 className="text-lg font-heading font-black text-white leading-snug">
                        {currentLesson.tenBaiGiang}
                      </h3>
                      <p className="text-xs text-slate-400 mt-1">
                        Hệ thống đang tích lũy thời gian học trực tuyến theo chuẩn đào tạo
                      </p>
                    </div>

                    <div className="flex items-center justify-center gap-3 pt-2">
                      <button
                        onClick={() => setIsPlaying(!isPlaying)}
                        className="px-6 py-2.5 rounded-full bg-amber-400 text-slate-950 font-bold text-xs hover:bg-amber-300 transition-all flex items-center gap-2 shadow-lg shadow-amber-400/20 cursor-pointer"
                      >
                        {isPlaying ? (
                          <>
                            <Pause className="w-4 h-4 fill-slate-950" />
                            <span>Tạm dừng video</span>
                          </>
                        ) : (
                          <>
                            <Play className="w-4 h-4 fill-slate-950" />
                            <span>Tiếp tục học</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Status Badge in Top-Right */}
              <div className="absolute top-4 right-4 z-20">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1.5 shadow-md ${
                    isCompleted
                      ? 'bg-emerald-500 text-white'
                      : isPlaying
                      ? 'bg-amber-400 text-slate-950'
                      : 'bg-slate-800 text-slate-300 border border-slate-700'
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      isCompleted ? 'bg-white' : isPlaying ? 'bg-slate-950 animate-ping' : 'bg-slate-400'
                    }`}
                  ></span>
                  {isCompleted ? 'Đã hoàn thành' : isPlaying ? 'Đang phát' : 'Tạm dừng'}
                </span>
              </div>
            </div>

            {/* Video Player Controls & Progress Info */}
            <div className="p-5 bg-[#0e1628] border-t border-slate-800 text-slate-200 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-400" />
                  <span>Thời gian học tích lũy:</span>
                  <strong className="text-white font-mono text-sm">
                    {formatTime(studySeconds)}
                  </strong>
                  <span className="text-slate-400">
                    / {currentLesson.thoiLuongPhut}:00 phút
                  </span>
                </div>

                <span className="font-heading font-black text-amber-400 text-sm">
                  {progressPercent}%
                </span>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-gradient-to-r from-amber-500 to-amber-300 h-full rounded-full transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                ></div>
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                <span>Heartbeat: Tự động ghi nhận thời gian mỗi 30 giây</span>
                {isCompleted && (
                  <span className="text-emerald-400 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Đạt điều kiện bài giảng
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Lesson Navigation Buttons */}
          <div className="flex items-center justify-between gap-4">
            <button
              onClick={() => {
                if (prevLesson) {
                  navigate(`/hoc/khoahoc/${classId}/baihoc/${prevLesson.maBaiGiang}`);
                }
              }}
              disabled={!prevLesson}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Bài trước</span>
            </button>

            <span className="text-xs font-bold text-slate-500">
              Bài {currentLesson.soThuTu} / {allLessons.length}
            </span>

            <button
              onClick={() => {
                if (nextLesson) {
                  navigate(`/hoc/khoahoc/${classId}/baihoc/${nextLesson.maBaiGiang}`);
                }
              }}
              disabled={!nextLesson}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-amber-400 text-slate-950 text-xs font-bold hover:bg-amber-300 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-md shadow-amber-400/20"
            >
              <span>Bài tiếp theo</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Lesson Details Card & Downloadable Material */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <span className="text-xs font-bold text-slate-400">
                  {currentLesson.monHoc || 'Môn học cơ bản'} • Bài số {currentLesson.soThuTu}
                </span>
                <h1 className="text-xl font-heading font-black text-slate-900 mt-0.5">
                  {currentLesson.tenBaiGiang}
                </h1>
              </div>

              {currentLesson.taiLieuDinhKem && (
                <a
                  href={currentLesson.taiLieuDinhKem}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-800 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Tài liệu đính kèm</span>
                </a>
              )}
            </div>

            {/* Theory Tips Notice */}
            <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-200/60 flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
              <div className="text-xs text-slate-700 leading-relaxed space-y-1">
                <strong className="text-slate-900 block font-heading">
                  Lưu ý học tập lý thuyết sát hạch:
                </strong>
                <p>
                  Học viên cần theo dõi video bài giảng tối thiểu 80% thời lượng quy định để được tính là hoàn thành. Hãy tập trung vào các câu hỏi điểm liệt và biển báo giao thông liên quan trong chương.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentStudyWorkspacePage;
