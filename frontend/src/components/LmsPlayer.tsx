import React, { useState, useEffect, useRef } from 'react';
import { api } from '../services/api';
import { AuthUser, StudentProgressItem, StudentProgressSummary } from '../types';
import {
  Play,
  Pause,
  Clock,
  CheckCircle2,
  BookOpen,
  Award,
  Video,
  FileText,
  AlertCircle,
  BarChart3,
  Sparkles,
} from 'lucide-react';

interface LmsPlayerProps {
  user: AuthUser;
}

export const LmsPlayer: React.FC<LmsPlayerProps> = ({ user }) => {
  const [lessons, setLessons] = useState<StudentProgressItem[]>([]);
  const [summary, setSummary] = useState<StudentProgressSummary | null>(null);
  const [currentLesson, setCurrentLesson] = useState<StudentProgressItem | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [sessionSeconds, setSessionSeconds] = useState(0);
  const [loading, setLoading] = useState(false);
  const [alertMsg, setAlertMsg] = useState<string | null>(null);

  // Heartbeat interval timer
  const heartbeatTimerRef = useRef<any>(null);
  const secondTimerRef = useRef<any>(null);

  const fetchProgress = async () => {
    setLoading(true);
    try {
      const res = await api.getProgress();
      if (res.danhSachBaiHoc) {
        setLessons(res.danhSachBaiHoc);
        if (res.danhSachBaiHoc.length > 0 && !currentLesson) {
          setCurrentLesson(res.danhSachBaiHoc[0]);
        }
      }
      if (res.thongKeTongHop) {
        setSummary(res.thongKeTongHop);
      }
    } catch (err: any) {
      setAlertMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProgress();
  }, []);

  // Heartbeat mechanism - sends progress every 30 seconds when isPlaying is true
  useEffect(() => {
    if (isPlaying && currentLesson) {
      // 1. Đồng hồ đếm giây thực tế hiển thị
      secondTimerRef.current = setInterval(() => {
        setSessionSeconds((prev) => prev + 1);
      }, 1000);

      // 2. Gửi Heartbeat lên Backend mỗi 30 giây để cập nhật DB
      heartbeatTimerRef.current = setInterval(async () => {
        try {
          await api.heartbeatProgress(currentLesson.MaBaiGiang, 30);
          fetchProgress();
        } catch (e) {
          console.error('Lỗi gửi heartbeat:', e);
        }
      }, 30000);
    } else {
      if (secondTimerRef.current) clearInterval(secondTimerRef.current);
      if (heartbeatTimerRef.current) clearInterval(heartbeatTimerRef.current);
    }

    return () => {
      if (secondTimerRef.current) clearInterval(secondTimerRef.current);
      if (heartbeatTimerRef.current) clearInterval(heartbeatTimerRef.current);
    };
  }, [isPlaying, currentLesson]);

  const togglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  const selectLesson = (l: StudentProgressItem) => {
    if (isPlaying) {
      setIsPlaying(false);
    }
    setCurrentLesson(l);
    setSessionSeconds(0);
  };

  const formatSeconds = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6">
      {/* Header & Stats Cards */}
      <div>
        <h2 className="text-xl font-bold font-heading text-white flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-indigo-400" /> Không gian Học tập Trực tuyến & Theo dõi Tiến độ
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Học viên: <strong className="text-slate-200">{user.hoVaTen}</strong> | Tích lũy giờ học lý thuyết chuẩn theo quy định
        </p>
      </div>

      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="glass-panel p-4 rounded-2xl border border-slate-800 space-y-1">
            <div className="text-xs text-slate-400 flex items-center justify-between">
              <span>Tiến độ tổng quát</span>
              <BarChart3 className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="text-2xl font-bold text-white font-heading">
              {summary.PhanTramHoanThanhChung}%
            </div>
            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden mt-2">
              <div
                className="bg-gradient-to-r from-indigo-500 to-cyan-400 h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, summary.PhanTramHoanThanhChung)}%` }}
              ></div>
            </div>
          </div>

          <div className="glass-panel p-4 rounded-2xl border border-slate-800 space-y-1">
            <div className="text-xs text-slate-400 flex items-center justify-between">
              <span>Bài học hoàn thành</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-bold text-white font-heading">
              {summary.SoBaiDaHoanThanh} <span className="text-sm font-normal text-slate-400">/ {summary.TongSoBaiHoc} bài</span>
            </div>
            <p className="text-[11px] text-emerald-400 mt-1">Đạt yêu cầu &ge; 90% thời lượng</p>
          </div>

          <div className="glass-panel p-4 rounded-2xl border border-slate-800 space-y-1">
            <div className="text-xs text-slate-400 flex items-center justify-between">
              <span>Giờ học tích lũy</span>
              <Clock className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="text-2xl font-bold text-white font-heading">
              {summary.TongGioHocLyThuyetTichLuy} <span className="text-sm font-normal text-slate-400">giờ</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Chuẩn đào tạo: {summary.TongGioYeuCau} giờ</p>
          </div>

          <div className="glass-panel p-4 rounded-2xl border border-slate-800 space-y-1">
            <div className="text-xs text-slate-400 flex items-center justify-between">
              <span>Chứng chỉ dự thi</span>
              <Award className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl font-bold text-amber-400 font-heading">
              {summary.SoBaiDaHoanThanh >= summary.TongSoBaiHoc && summary.TongSoBaiHoc > 0
                ? 'Đủ điều kiện thi'
                : 'Đang đào tạo'}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Tự động xét duyệt khi đủ giờ</p>
          </div>
        </div>
      )}

      {/* Main Learning Classroom */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Video Player & Heartbeat Tracker */}
        <div className="lg:col-span-2 space-y-4">
          <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
            {currentLesson ? (
              <>
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-xs font-semibold text-indigo-400 uppercase tracking-wider">
                      {currentLesson.MonHoc}
                    </span>
                    <h3 className="text-lg font-bold text-white mt-1">
                      {currentLesson.TenBaiGiang}
                    </h3>
                  </div>
                  {currentLesson.DaHoanThanh && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      <CheckCircle2 className="w-4 h-4" /> Đã hoàn thành
                    </span>
                  )}
                </div>

                {/* Simulated E-learning Player Screen */}
                <div className="aspect-video w-full rounded-2xl bg-slate-900 border border-slate-800/80 flex flex-col items-center justify-center relative overflow-hidden group shadow-2xl">
                  {/* Decorative backdrop */}
                  <div className="absolute inset-0 bg-gradient-to-tr from-indigo-950/40 via-slate-900/60 to-slate-950/80"></div>

                  <div className="relative z-10 text-center px-4 space-y-3">
                    <div className="w-16 h-16 rounded-full bg-indigo-600/20 text-indigo-400 ring-1 ring-indigo-500/30 flex items-center justify-center mx-auto shadow-xl">
                      <Video className="w-8 h-8" />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-white">{currentLesson.TenBaiGiang}</h4>
                      <p className="text-xs text-slate-400 mt-0.5">Thời lượng bài học: {currentLesson.ThoiLuongPhut} phút</p>
                    </div>

                    {/* Timer Status */}
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs font-mono text-cyan-400">
                      <Clock className="w-3.5 h-3.5 animate-pulse" />
                      <span>Thời gian phiên học: {formatSeconds(sessionSeconds)}</span>
                    </div>
                  </div>

                  {/* Player Controls Bar */}
                  <div className="absolute bottom-0 inset-x-0 p-4 bg-gradient-to-t from-black/90 via-black/50 to-transparent flex items-center justify-between z-20">
                    <button
                      onClick={togglePlay}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
                    >
                      {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                      <span>{isPlaying ? 'Tạm dừng học' : 'Bắt đầu học'}</span>
                    </button>

                    <div className="text-xs text-slate-300 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                      <span>Heartbeat đồng bộ mỗi 30s</span>
                    </div>
                  </div>
                </div>

                {/* Progress Details */}
                <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-400 border-t border-slate-800/80">
                  <div>
                    Đã tích lũy bài này: <strong className="text-white">{currentLesson.ThoiGianHocPhut} phút</strong> / {currentLesson.ThoiLuongPhut} phút
                  </div>
                  <div>
                    Lần học gần nhất: {currentLesson.LanHocCuoi ? new Date(currentLesson.LanHocCuoi).toLocaleString('vi-VN') : 'Mới bắt đầu'}
                  </div>
                </div>
              </>
            ) : (
              <div className="p-8 text-center text-slate-400 text-sm">
                Đang tải dữ liệu bài học...
              </div>
            )}
          </div>
        </div>

        {/* Right: Lesson Curriculum List */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-3 flex flex-col max-h-[640px]">
          <h3 className="text-sm font-bold font-heading text-white flex items-center justify-between">
            <span>Danh mục Bài giảng ({lessons.length})</span>
            <span className="text-xs text-indigo-400 font-normal">Lộ trình chuẩn</span>
          </h3>

          <div className="overflow-y-auto flex-1 space-y-2 pr-1">
            {lessons.map((l) => {
              const isSelected = currentLesson?.MaBaiGiang === l.MaBaiGiang;
              return (
                <div
                  key={l.MaBaiGiang}
                  onClick={() => selectLesson(l)}
                  className={`p-3 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-indigo-600/20 border-indigo-500/50 shadow-md'
                      : 'bg-slate-900/60 border-slate-800/80 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-xs font-medium text-white line-clamp-1 leading-snug">
                      Bài {l.SoThuTu}: {l.TenBaiGiang}
                    </span>
                    {l.DaHoanThanh ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    ) : (
                      <span className="text-[10px] text-slate-400 shrink-0">{l.ThoiLuongPhut}p</span>
                    )}
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2">
                    <span className="truncate max-w-[140px]">{l.MonHoc}</span>
                    <span className={l.DaHoanThanh ? 'text-emerald-400' : 'text-slate-400'}>
                      {l.ThoiGianHocPhut}p / {l.ThoiLuongPhut}p
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
