import React, { useState, useEffect, useRef } from 'react';
import { api } from '../services/api';
import { CurriculumSummaryItem, CurriculumDetailResponse, ChapterItem, LessonItem } from '../types';
import { useDebounce } from '../hooks/useDebounce';
import {
  BookOpen,
  Plus,
  Search,
  Clock,
  Layers,
  FileText,
  Play,
  MoreVertical,
  Edit2,
  Trash2,
  ArrowLeft,
  Settings,
  Award,
  AlertCircle,
  Save,
  ChevronDown,
  ChevronUp,
  GraduationCap,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';

interface LessonManagementProps {
  initialCourseId?: number;
}

export const LessonManagement: React.FC<LessonManagementProps> = ({ initialCourseId }) => {
  // Chế độ hiển thị: 'summary' (bảng tổng hợp các khóa) hoặc 'detail' (chi tiết chương & bài giảng)
  const [viewMode, setViewMode] = useState<'summary' | 'detail'>(initialCourseId ? 'detail' : 'summary');
  
  // Dữ liệu bảng tổng hợp
  const [summaryList, setSummaryList] = useState<CurriculumSummaryItem[]>([]);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 300);

  // Dropdown "..." menu đang mở ở hàng nào
  const [openActionDropdownId, setOpenActionDropdownId] = useState<number | null>(null);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  // Dữ liệu chi tiết của Khóa đang chỉnh sửa
  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(initialCourseId || null);
  const [curriculumDetail, setCurriculumDetail] = useState<CurriculumDetailResponse | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // State mở rộng/thu gọn các Accordion Chương
  const [expandedChapters, setExpandedChapters] = useState<Record<number, boolean>>({});

  // Modal Yêu cầu khóa học
  const [courseRequirementData, setCourseRequirementData] = useState({
    tongSoGioLyThuyet: 180,
    moTa: '',
  });
  const [savingRequirement, setSavingRequirement] = useState(false);

  // Modal Thêm / Sửa Chương
  const [chapterModalState, setChapterModalState] = useState<{
    isOpen: boolean;
    mode: 'add' | 'edit';
    chapterId?: number;
    soThuTu: number;
    tenChuong: string;
    soGioChuan: number;
    phanTramYeuCau: number;
  }>({
    isOpen: false,
    mode: 'add',
    soThuTu: 1,
    tenChuong: '',
    soGioChuan: 20,
    phanTramYeuCau: 80,
  });

  // Modal Thêm / Sửa Bài giảng
  const [lessonModalState, setLessonModalState] = useState<{
    isOpen: boolean;
    mode: 'add' | 'edit';
    chapterId: number;
    lessonId?: number;
    tenBaiGiang: string;
    monHoc: string;
    soThuTu: number;
    thoiLuongPhut: number;
    duongDanVideo: string;
    taiLieuDinhKem: string;
  }>({
    isOpen: false,
    mode: 'add',
    chapterId: 0,
    tenBaiGiang: '',
    monHoc: 'Lý thuyết chuyên đề',
    soThuTu: 1,
    thoiLuongPhut: 45,
    duongDanVideo: '',
    taiLieuDinhKem: '',
  });

  // Modal Thêm Khung Bài Giảng Mẫu Mới (Khóa học mẫu mới)
  const [courseModalState, setCourseModalState] = useState<{
    isOpen: boolean;
    maHangGPLX: string;
    tenKhoaHoc: string;
    tongSoGioLyThuyet: number;
    moTa: string;
  }>({
    isOpen: false,
    maHangGPLX: 'C',
    tenKhoaHoc: '',
    tongSoGioLyThuyet: 180,
    moTa: '',
  });

  // Thông báo / Toast feedback
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  // 1. Tải bảng tổng hợp từ Backend
  const loadSummary = async () => {
    setLoadingSummary(true);
    try {
      const data = await api.getCurriculumSummary(true);
      setSummaryList(data || []);
    } catch (err: any) {
      showToast(err.message || 'Lỗi khi tải bảng tổng hợp bài giảng.', 'error');
    } finally {
      setLoadingSummary(false);
    }
  };

  useEffect(() => {
    loadSummary();
    if (initialCourseId) {
      setSelectedCourseId(initialCourseId);
      setViewMode('detail');
      loadCurriculumDetail(initialCourseId);
    }
  }, [initialCourseId]);

  // Xử lý đóng dropdown "..." khi click bên ngoài
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpenActionDropdownId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 2. Tải chi tiết Khóa học khi vào chế độ 'detail'
  const loadCurriculumDetail = async (courseId: number) => {
    setLoadingDetail(true);
    try {
      const detail = await api.getCurriculumDetail(courseId, true);
      setCurriculumDetail(detail);
      if (detail?.khoaHoc) {
        setCourseRequirementData({
          tongSoGioLyThuyet: detail.khoaHoc.TongSoGioLyThuyet || 0,
          moTa: detail.khoaHoc.MoTa || '',
        });
      }
      // Tự động mở rộng chương đầu tiên
      if (detail?.danhSachChuong && detail.danhSachChuong.length > 0) {
        const initialExpanded: Record<number, boolean> = {};
        detail.danhSachChuong.forEach((c, idx) => {
          initialExpanded[c.MaChuong] = idx === 0;
        });
        setExpandedChapters(initialExpanded);
      }
    } catch (err: any) {
      showToast(err.message || 'Lỗi khi tải chi tiết chương trình đào tạo.', 'error');
    } finally {
      setLoadingDetail(false);
    }
  };

  // Mở màn hình Chỉnh sửa khóa học
  const handleOpenEdit = (courseId: number) => {
    setSelectedCourseId(courseId);
    setViewMode('detail');
    setOpenActionDropdownId(null);
    loadCurriculumDetail(courseId);
  };

  // Xóa khóa học
  const handleDeleteCourse = async (course: CurriculumSummaryItem) => {
    setOpenActionDropdownId(null);
    const confirmed = window.confirm(
      `Bạn có chắc chắn muốn xóa khóa học [Hạng ${course.MaHangGPLX}] "${course.TenKhoaHoc}" không?\nThao tác này sẽ ẩn toàn bộ bài giảng và chương của khóa.`
    );
    if (!confirmed) return;

    try {
      await api.deleteCourse(course.MaKhoaHoc);
      showToast(`Đã xóa thành công khóa học Hạng ${course.MaHangGPLX}`);
      loadSummary();
    } catch (err: any) {
      showToast(err.message || 'Lỗi khi xóa khóa học.', 'error');
    }
  };

  // Tạo Khung Bài Giảng Mẫu Mới
  const handleCreateCourseTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createCourse({
        maHangGPLX: courseModalState.maHangGPLX,
        tenKhoaHoc: courseModalState.tenKhoaHoc,
        tongSoGioLyThuyet: Number(courseModalState.tongSoGioLyThuyet),
        moTa: courseModalState.moTa,
      });
      showToast('Đã tạo khung bài giảng mẫu mới thành công!');
      setCourseModalState({
        isOpen: false,
        maHangGPLX: 'C',
        tenKhoaHoc: '',
        tongSoGioLyThuyet: 180,
        moTa: '',
      });
      loadSummary();
    } catch (err: any) {
      showToast(err.message || 'Lỗi khi tạo khung bài giảng mẫu.', 'error');
    }
  };

  // Cập nhật yêu cầu khóa học
  const handleSaveCourseRequirement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourseId) return;
    setSavingRequirement(true);
    try {
      await api.updateCourseRequirement(selectedCourseId, {
        tongSoGioLyThuyet: Number(courseRequirementData.tongSoGioLyThuyet),
        moTa: courseRequirementData.moTa,
      });
      showToast('Đã lưu yêu cầu thời lượng khóa học thành công!');
      loadCurriculumDetail(selectedCourseId);
    } catch (err: any) {
      showToast(err.message || 'Lỗi khi cập nhật yêu cầu khóa học.', 'error');
    } finally {
      setSavingRequirement(false);
    }
  };

  // Accordion toggle
  const toggleChapterExpand = (chapterId: number) => {
    setExpandedChapters((prev) => ({
      ...prev,
      [chapterId]: !prev[chapterId],
    }));
  };

  // Mở modal Thêm Chương
  const handleOpenAddChapter = () => {
    const nextOrder = (curriculumDetail?.danhSachChuong?.length || 0) + 1;
    setChapterModalState({
      isOpen: true,
      mode: 'add',
      soThuTu: nextOrder,
      tenChuong: '',
      soGioChuan: 20,
      phanTramYeuCau: 80,
    });
  };

  // Mở modal Sửa Chương
  const handleOpenEditChapter = (chapter: ChapterItem) => {
    setChapterModalState({
      isOpen: true,
      mode: 'edit',
      chapterId: chapter.MaChuong,
      soThuTu: chapter.SoThuTu,
      tenChuong: chapter.TenChuong,
      soGioChuan: Number(chapter.SoGioChuan),
      phanTramYeuCau: Number(chapter.PhanTramYeuCau),
    });
  };

  // Lưu Chương (Thêm hoặc Sửa)
  const handleSaveChapter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourseId) return;

    try {
      if (chapterModalState.mode === 'add') {
        await api.createChapter(selectedCourseId, {
          tenChuong: chapterModalState.tenChuong,
          soThuTu: Number(chapterModalState.soThuTu),
          soGioChuan: Number(chapterModalState.soGioChuan),
          phanTramYeuCau: Number(chapterModalState.phanTramYeuCau),
        });
        showToast('Đã thêm chương mới thành công!');
      } else if (chapterModalState.chapterId) {
        await api.updateChapter(chapterModalState.chapterId, {
          tenChuong: chapterModalState.tenChuong,
          soThuTu: Number(chapterModalState.soThuTu),
          soGioChuan: Number(chapterModalState.soGioChuan),
          phanTramYeuCau: Number(chapterModalState.phanTramYeuCau),
        });
        showToast('Đã cập nhật chương thành công!');
      }
      setChapterModalState((prev) => ({ ...prev, isOpen: false }));
      loadCurriculumDetail(selectedCourseId);
    } catch (err: any) {
      showToast(err.message || 'Lỗi khi lưu chương.', 'error');
    }
  };

  // Xóa Chương
  const handleDeleteChapter = async (chapter: ChapterItem) => {
    const confirmed = window.confirm(
      `Bạn có chắc muốn xóa "${chapter.TenChuong}"?\nCác bài giảng thuộc chương này sẽ không còn gắn với chương nữa.`
    );
    if (!confirmed || !selectedCourseId) return;

    try {
      await api.deleteChapter(chapter.MaChuong);
      showToast('Đã xóa chương thành công!');
      loadCurriculumDetail(selectedCourseId);
    } catch (err: any) {
      showToast(err.message || 'Lỗi khi xóa chương.', 'error');
    }
  };

  // Mở modal Thêm Bài Giảng vào Chương
  const handleOpenAddLesson = (chapter: ChapterItem) => {
    const nextOrder = (chapter.danhSachBaiGiang?.length || 0) + 1;
    setLessonModalState({
      isOpen: true,
      mode: 'add',
      chapterId: chapter.MaChuong,
      tenBaiGiang: '',
      monHoc: chapter.TenChuong,
      soThuTu: nextOrder,
      thoiLuongPhut: 45,
      duongDanVideo: '',
      taiLieuDinhKem: '',
    });
  };

  // Mở modal Sửa Bài Giảng
  const handleOpenEditLesson = (lesson: LessonItem, chapterId: number) => {
    setLessonModalState({
      isOpen: true,
      mode: 'edit',
      chapterId,
      lessonId: lesson.MaBaiGiang,
      tenBaiGiang: lesson.TenBaiGiang,
      monHoc: lesson.MonHoc || '',
      soThuTu: lesson.SoThuTu,
      thoiLuongPhut: lesson.ThoiLuongPhut || 45,
      duongDanVideo: lesson.DuongDanVideo || '',
      taiLieuDinhKem: lesson.TaiLieuDinhKem || '',
    });
  };

  // Lưu Bài Giảng (Thêm vào chương hoặc Sửa)
  const handleSaveLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourseId) return;

    try {
      if (lessonModalState.mode === 'add') {
        await api.createLessonInChapter(selectedCourseId, lessonModalState.chapterId, {
          tenBaiGiang: lessonModalState.tenBaiGiang,
          soThuTu: Number(lessonModalState.soThuTu),
          thoiLuongPhut: Number(lessonModalState.thoiLuongPhut),
          duongDanVideo: lessonModalState.duongDanVideo,
          taiLieuDinhKem: lessonModalState.taiLieuDinhKem,
        });
        showToast('Đã thêm bài giảng vào chương thành công!');
      } else if (lessonModalState.lessonId) {
        await api.updateLesson(lessonModalState.lessonId, {
          tenBaiGiang: lessonModalState.tenBaiGiang,
          monHoc: lessonModalState.monHoc,
          soThuTu: Number(lessonModalState.soThuTu),
          thoiLuongPhut: Number(lessonModalState.thoiLuongPhut),
          duongDanVideo: lessonModalState.duongDanVideo,
          taiLieuDinhKem: lessonModalState.taiLieuDinhKem,
        });
        showToast('Đã cập nhật bài giảng thành công!');
      }
      setLessonModalState((prev) => ({ ...prev, isOpen: false }));
      loadCurriculumDetail(selectedCourseId);
    } catch (err: any) {
      showToast(err.message || 'Lỗi khi lưu bài giảng.', 'error');
    }
  };

  // Xóa Bài Giảng
  const handleDeleteLesson = async (lesson: LessonItem) => {
    const confirmed = window.confirm(`Bạn có chắc muốn xóa bài giảng "${lesson.TenBaiGiang}"?`);
    if (!confirmed || !selectedCourseId) return;

    try {
      await api.deleteLesson(lesson.MaBaiGiang);
      showToast('Đã xóa bài giảng thành công!');
      loadCurriculumDetail(selectedCourseId);
    } catch (err: any) {
      showToast(err.message || 'Lỗi khi xóa bài giảng.', 'error');
    }
  };

  // Filter bảng tổng hợp
  const filteredSummary = summaryList.filter(
    (item) =>
      item.TenKhoaHoc.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      item.MaHangGPLX.toLowerCase().includes(debouncedSearch.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-xs font-bold transition-all ${
            toastMessage.type === 'success'
              ? 'bg-emerald-600 text-white'
              : 'bg-rose-600 text-white'
          }`}
        >
          {toastMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4" />
          ) : (
            <AlertCircle className="w-4 h-4" />
          )}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 1: BẢNG TỔNG HỢP CÁC KHÓA HỌC (Khóa | Chương | Bài giảng | Giờ | ...)  */}
      {/* ========================================================================= */}
      {viewMode === 'summary' && (
        <>
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-xl font-black font-heading tracking-tight text-slate-800 uppercase flex items-center gap-2.5">
                <BookOpen className="w-6 h-6 text-amber-500" />
                <span>Khung Đào Tạo & Bài Giảng Theo Khóa Học</span>
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Quản lý số lượng chương, bài giảng và quy định số giờ lý thuyết chuẩn cho từng hạng GPLX
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-xs text-slate-500 font-semibold bg-white border border-slate-200 px-3.5 py-2.5 rounded-xl shadow-sm">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>Tổng số khung mẫu: <strong className="text-slate-800">{summaryList.length}</strong></span>
              </div>

              <button
                onClick={() => setCourseModalState((prev) => ({ ...prev, isOpen: true }))}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-500 text-slate-950 font-bold text-xs shadow-md shadow-amber-400/20 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>+ Thêm Khung Mẫu Mới</span>
              </button>
            </div>
          </div>

          {/* Banner hướng dẫn nghiệp vụ */}
          <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200/80 flex items-start gap-3 text-xs text-amber-950">
            <div className="w-8 h-8 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-black shrink-0 mt-0.5">
              💡
            </div>
            <div>
              <strong className="font-bold">Khung bài giảng mẫu dùng để làm gì?</strong>
              <p className="text-[11px] text-amber-900/80 mt-0.5 leading-relaxed">
                Đây là bài giảng mẫu chuẩn (ví dụ: <strong>B số sàn</strong>, <strong>B số tự động</strong>, <strong>C1</strong>). Khi add tệp <strong>Báo cáo 1 (.XML)</strong>, hệ thống sẽ tự động đối chiếu: nếu khóa tạo ra là <em>B số sàn</em> thì tự động lấy khung bài giảng B số sàn; nếu là <em>B số tự động</em> thì tự động lấy khung bài giảng B số tự động và khởi tạo cho học viên.
              </p>
            </div>
          </div>

          {/* Search bar */}
          <div className="akkhor-card p-4">
            <div className="relative max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Tìm theo hạng GPLX (B2, B1, C1...) hoặc tên khóa..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-amber-400 focus:bg-white transition-all font-medium"
              />
            </div>
          </div>

          {/* Data Table Bảng tổng hợp theo yêu cầu người dùng */}
          <div className="akkhor-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                    <th className="py-4 px-6 font-extrabold">Khóa</th>
                    <th className="py-4 px-6 text-center font-extrabold">Chương</th>
                    <th className="py-4 px-6 text-center font-extrabold">Bài giảng</th>
                    <th className="py-4 px-6 text-center font-extrabold">Giờ</th>
                    <th className="py-4 px-6 text-right font-extrabold">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {loadingSummary ? (
                    <tr>
                      <td colSpan={5} className="text-center py-12 text-slate-400 font-medium">
                        Đang tải danh sách chương trình đào tạo từ cơ sở dữ liệu...
                      </td>
                    </tr>
                  ) : filteredSummary.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-12 text-slate-400 font-medium">
                        Không tìm thấy khóa học nào phù hợp.
                      </td>
                    </tr>
                  ) : (
                    filteredSummary.map((item) => (
                      <tr
                        key={item.MaKhoaHoc}
                        className="hover:bg-amber-50/20 transition-colors group"
                      >
                        {/* Cột 1: Khóa */}
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <span className="w-10 h-10 rounded-xl bg-amber-400 text-slate-950 font-black flex items-center justify-center text-sm shadow-sm">
                              {item.MaHangGPLX}
                            </span>
                            <div>
                              <div className="font-bold text-slate-800 text-sm group-hover:text-amber-600 transition-colors">
                                {item.TenKhoaHoc}
                              </div>
                              <div className="text-[11px] text-slate-400">
                                Mã khóa: #{item.MaKhoaHoc}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Cột 2: Chương */}
                        <td className="py-4 px-6 text-center">
                          <span className="inline-flex items-center justify-center px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-700 font-bold text-xs border border-indigo-100">
                            {item.SoChuong}
                          </span>
                        </td>

                        {/* Cột 3: Bài giảng */}
                        <td className="py-4 px-6 text-center">
                          <span className="inline-flex items-center justify-center px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 font-bold text-xs border border-blue-100">
                            {item.SoBaiGiang}
                          </span>
                        </td>

                        {/* Cột 4: Giờ */}
                        <td className="py-4 px-6 text-center">
                          <span className="inline-flex items-center justify-center px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 font-bold text-xs border border-emerald-100">
                            {item.TongSoGio}
                          </span>
                        </td>

                        {/* Cột 5: Nút "..." Dropdown với 2 lựa chọn [Chỉnh sửa] & [Xóa] */}
                        <td className="py-4 px-6 text-right relative">
                          <div className="inline-block text-left" ref={openActionDropdownId === item.MaKhoaHoc ? dropdownRef : null}>
                            <button
                              onClick={() =>
                                setOpenActionDropdownId((prev) =>
                                  prev === item.MaKhoaHoc ? null : item.MaKhoaHoc
                                )
                              }
                              className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all cursor-pointer"
                              title="Thao tác"
                            >
                              <MoreVertical className="w-5 h-5" />
                            </button>

                            {openActionDropdownId === item.MaKhoaHoc && (
                              <div className="absolute right-6 top-12 z-40 w-44 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 text-xs text-left animate-in fade-in zoom-in-95 duration-150">
                                <button
                                  onClick={() => handleOpenEdit(item.MaKhoaHoc)}
                                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-slate-700 hover:bg-amber-50 hover:text-amber-800 font-semibold cursor-pointer transition-colors"
                                >
                                  <Edit2 className="w-4 h-4 text-amber-500" />
                                  <span>Chỉnh sửa</span>
                                </button>
                                <button
                                  onClick={() => handleDeleteCourse(item)}
                                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-rose-600 hover:bg-rose-50 font-semibold cursor-pointer transition-colors"
                                >
                                  <Trash2 className="w-4 h-4 text-rose-500" />
                                  <span>Xóa</span>
                                </button>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* ========================================================================= */}
      {/* VIEW 2: GIAO DIỆN CHỈNH SỬA CHI TIẾT (CHƯƠNG, BÀI GIẢNG & YÊU CẦU KHÓA)   */}
      {/* ========================================================================= */}
      {viewMode === 'detail' && (
        <>
          {/* Header chuyển về + Tên khóa học */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  setViewMode('summary');
                  loadSummary();
                }}
                className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-all cursor-pointer shadow-sm"
                title="Quay lại danh sách tổng hợp"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>

              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-md bg-amber-400 text-slate-950 font-black text-xs">
                    Hạng {curriculumDetail?.khoaHoc?.MaHangGPLX}
                  </span>
                  <h2 className="text-xl font-black font-heading tracking-tight text-slate-800">
                    {curriculumDetail?.khoaHoc?.TenKhoaHoc}
                  </h2>
                </div>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Thiết lập yêu cầu hoàn thành theo từng chương, giờ chuẩn và các bài giảng tương ứng
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                onClick={handleOpenAddChapter}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-500 text-slate-950 font-bold text-xs shadow-md shadow-amber-400/20 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>+ Thêm chương mới</span>
              </button>
            </div>
          </div>

          {/* 1. KHUNG ĐIỀU CHỈNH YÊU CẦU CỦA KHÓA HỌC */}
          <div className="akkhor-card p-5">
            <div className="flex items-center gap-2 pb-3 mb-4 border-b border-slate-100">
              <Settings className="w-4 h-4 text-amber-500" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                1. Cấu hình yêu cầu chuẩn của Khóa học
              </h3>
            </div>

            <form onSubmit={handleSaveCourseRequirement} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
              <div className="md:col-span-3 space-y-1">
                <label className="block text-[11px] font-bold text-slate-600 uppercase">
                  Tổng số giờ lý thuyết chuẩn (Giờ):
                </label>
                <div className="relative">
                  <Clock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="number"
                    min="1"
                    max="1000"
                    step="0.5"
                    value={courseRequirementData.tongSoGioLyThuyet}
                    onChange={(e) =>
                      setCourseRequirementData((prev) => ({
                        ...prev,
                        tongSoGioLyThuyet: Number(e.target.value),
                      }))
                    }
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-amber-400"
                    required
                  />
                </div>
              </div>

              <div className="md:col-span-7 space-y-1">
                <label className="block text-[11px] font-bold text-slate-600 uppercase">
                  Mô tả / Yêu cầu khóa học:
                </label>
                <input
                  type="text"
                  placeholder="Nhập ghi chú yêu cầu đào tạo cho học viên..."
                  value={courseRequirementData.moTa}
                  onChange={(e) =>
                    setCourseRequirementData((prev) => ({
                      ...prev,
                      moTa: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="md:col-span-2">
                <button
                  type="submit"
                  disabled={savingRequirement}
                  className="w-full flex items-center justify-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{savingRequirement ? 'Đang lưu...' : 'Lưu yêu cầu'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* 2. DANH SÁCH CÁC CHƯƠNG & BÀI GIẢNG TƯƠNG ỨNG */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-amber-500" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  2. Danh sách các Chương & Bài giảng ({curriculumDetail?.danhSachChuong?.length || 0} chương)
                </h3>
              </div>
              <span className="text-xs text-slate-400 font-medium">
                Mỗi chương có số giờ và % yêu cầu hoàn thành riêng biệt
              </span>
            </div>

            {loadingDetail ? (
              <div className="akkhor-card p-12 text-center text-slate-400 text-xs font-medium">
                Đang tải cấu trúc chương và bài giảng...
              </div>
            ) : !curriculumDetail?.danhSachChuong || curriculumDetail.danhSachChuong.length === 0 ? (
              <div className="akkhor-card p-12 text-center text-slate-400 text-xs font-medium space-y-3">
                <p>Khóa học này hiện chưa có chương nào.</p>
                <button
                  onClick={handleOpenAddChapter}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-amber-400 text-slate-950 rounded-xl text-xs font-bold cursor-pointer hover:bg-amber-500"
                >
                  <Plus className="w-4 h-4" />
                  <span>Tạo Chương Đầu Tiên</span>
                </button>
              </div>
            ) : (
              curriculumDetail.danhSachChuong.map((chapter) => {
                const isExpanded = !!expandedChapters[chapter.MaChuong];
                const lessonList = chapter.danhSachBaiGiang || [];

                return (
                  <div
                    key={chapter.MaChuong}
                    className="akkhor-card overflow-hidden border border-slate-200 transition-all hover:border-amber-300"
                  >
                    {/* Header của Chương */}
                    <div className="p-4 bg-slate-50/70 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3">
                      <div
                        onClick={() => toggleChapterExpand(chapter.MaChuong)}
                        className="flex items-center gap-3 cursor-pointer flex-1 select-none"
                      >
                        <button className="text-slate-400 hover:text-slate-700">
                          {isExpanded ? (
                            <ChevronUp className="w-5 h-5 text-amber-500" />
                          ) : (
                            <ChevronDown className="w-5 h-5" />
                          )}
                        </button>

                        <div>
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded-md bg-slate-800 text-white font-extrabold text-[11px]">
                              Chương {chapter.SoThuTu}
                            </span>
                            <span className="font-bold text-slate-800 text-sm">
                              {chapter.TenChuong}
                            </span>
                          </div>

                          {/* Quy định số giờ và % hoàn thành */}
                          <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs">
                            <span className="inline-flex items-center gap-1 text-slate-600">
                              <Clock className="w-3.5 h-3.5 text-amber-500" />
                              Thời lượng chuẩn: <strong className="text-slate-800">{chapter.SoGioChuan} giờ</strong>
                            </span>
                            <span className="text-slate-300">•</span>
                            <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md font-semibold border border-emerald-200/60">
                              <Award className="w-3.5 h-3.5 text-emerald-600" />
                              Yêu cầu hoàn thành: <strong>{chapter.PhanTramYeuCau}%</strong> số giờ của chương
                            </span>
                            <span className="text-slate-300">•</span>
                            <span className="text-slate-500 font-medium">
                              Số bài: <strong className="text-blue-700">{lessonList.length}</strong> bài giảng
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Nút thao tác trên Chương */}
                      <div className="flex items-center gap-2 self-end md:self-center">
                        <button
                          onClick={() => handleOpenAddLesson(chapter)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-400 hover:bg-amber-500 text-slate-950 rounded-lg text-xs font-bold transition-all shadow-sm cursor-pointer"
                          title="Thêm bài giảng vào chương này"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Thêm bài giảng</span>
                        </button>

                        <button
                          onClick={() => handleOpenEditChapter(chapter)}
                          className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-amber-600 hover:bg-amber-50 transition-colors cursor-pointer"
                          title="Chỉnh sửa chương"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => handleDeleteChapter(chapter)}
                          className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                          title="Xóa chương"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Nội dung danh sách bài giảng bên trong Chương (Khi Expand) */}
                    {isExpanded && (
                      <div className="p-4 bg-white">
                        {lessonList.length === 0 ? (
                          <div className="py-6 text-center text-slate-400 text-xs font-medium space-y-2">
                            <p>Chương này chưa có bài giảng nào.</p>
                            <button
                              onClick={() => handleOpenAddLesson(chapter)}
                              className="text-amber-600 hover:text-amber-700 font-bold underline cursor-pointer"
                            >
                              + Thêm bài giảng ngay
                            </button>
                          </div>
                        ) : (
                          <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse text-xs">
                              <thead>
                                <tr className="border-b border-slate-100 text-slate-400 uppercase text-[10px] font-bold">
                                  <th className="py-2.5 px-3 w-12 text-center">STT</th>
                                  <th className="py-2.5 px-3">Tên bài giảng</th>
                                  <th className="py-2.5 px-3">Thời lượng</th>
                                  <th className="py-2.5 px-3">Đường dẫn Video</th>
                                  <th className="py-2.5 px-3 text-right">Thao tác</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100">
                                {lessonList.map((lesson) => (
                                  <tr
                                    key={lesson.MaBaiGiang}
                                    className="hover:bg-slate-50 transition-colors"
                                  >
                                    <td className="py-2.5 px-3 text-center font-bold text-slate-500">
                                      #{lesson.SoThuTu}
                                    </td>
                                    <td className="py-2.5 px-3 font-semibold text-slate-800">
                                      {lesson.TenBaiGiang}
                                    </td>
                                    <td className="py-2.5 px-3">
                                      <span className="inline-flex items-center gap-1 text-slate-600 font-medium">
                                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                                        {lesson.ThoiLuongPhut} phút
                                      </span>
                                    </td>
                                    <td className="py-2.5 px-3">
                                      {lesson.DuongDanVideo ? (
                                        <span className="text-[11px] font-mono text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                                          {lesson.DuongDanVideo}
                                        </span>
                                      ) : (
                                        <span className="text-slate-400 italic">Chưa có</span>
                                      )}
                                    </td>
                                    <td className="py-2.5 px-3 text-right">
                                      <div className="flex items-center justify-end gap-1.5">
                                        <button
                                          onClick={() => handleOpenEditLesson(lesson, chapter.MaChuong)}
                                          className="p-1 rounded text-slate-400 hover:text-amber-600 hover:bg-amber-50 cursor-pointer"
                                          title="Sửa bài giảng"
                                        >
                                          <Edit2 className="w-3.5 h-3.5" />
                                        </button>
                                        <button
                                          onClick={() => handleDeleteLesson(lesson)}
                                          className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
                                          title="Xóa bài giảng"
                                        >
                                          <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                      </div>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </>
      )}

      {/* ========================================================================= */}
      {/* MODAL: THÊM / SỬA CHƯƠNG                                                  */}
      {/* ========================================================================= */}
      {chapterModalState.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-800 uppercase flex items-center gap-2">
                <Layers className="w-4 h-4 text-amber-500" />
                <span>
                  {chapterModalState.mode === 'add' ? 'Thêm Chương Mới' : 'Chỉnh Sửa Chương'}
                </span>
              </h3>
              <button
                onClick={() => setChapterModalState((prev) => ({ ...prev, isOpen: false }))}
                className="text-slate-400 hover:text-slate-700 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveChapter} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="block font-bold text-slate-700">Số thứ tự:</label>
                  <input
                    type="number"
                    min="1"
                    value={chapterModalState.soThuTu}
                    onChange={(e) =>
                      setChapterModalState((prev) => ({ ...prev, soThuTu: Number(e.target.value) }))
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:outline-none focus:border-amber-400"
                    required
                  />
                </div>

                <div className="col-span-2 space-y-1">
                  <label className="block font-bold text-slate-700">Tên chương:</label>
                  <input
                    type="text"
                    placeholder="Ví dụ: Pháp luật giao thông đường bộ"
                    value={chapterModalState.tenChuong}
                    onChange={(e) =>
                      setChapterModalState((prev) => ({ ...prev, tenChuong: e.target.value }))
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-amber-400"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="space-y-1">
                  <label className="block font-bold text-slate-700">
                    Số giờ chuẩn của chương:
                  </label>
                  <div className="relative">
                    <Clock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="number"
                      min="1"
                      max="200"
                      step="0.5"
                      value={chapterModalState.soGioChuan}
                      onChange={(e) =>
                        setChapterModalState((prev) => ({
                          ...prev,
                          soGioChuan: Number(e.target.value),
                        }))
                      }
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:outline-none focus:border-amber-400"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block font-bold text-slate-700">
                    % Yêu cầu hoàn thành (%):
                  </label>
                  <div className="relative">
                    <Award className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={chapterModalState.phanTramYeuCau}
                      onChange={(e) =>
                        setChapterModalState((prev) => ({
                          ...prev,
                          phanTramYeuCau: Number(e.target.value),
                        }))
                      }
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:outline-none focus:border-amber-400"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="p-3 bg-amber-50 rounded-xl text-[11px] text-amber-900 leading-relaxed border border-amber-200/80">
                💡 <strong>Quy tắc nghiệp vụ:</strong> Học viên cần hoàn thành tối thiểu{' '}
                <strong>{chapterModalState.phanTramYeuCau}%</strong> của{' '}
                <strong>{chapterModalState.soGioChuan} giờ</strong> thì hệ thống mới xác nhận hoàn thành
                chương này.
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setChapterModalState((prev) => ({ ...prev, isOpen: false }))}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-400 hover:bg-amber-500 text-slate-950 font-bold transition-all shadow-sm cursor-pointer"
                >
                  {chapterModalState.mode === 'add' ? 'Tạo chương' : 'Lưu thay đổi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: THÊM / SỬA BÀI GIẢNG VÀO CHƯƠNG                                     */}
      {/* ========================================================================= */}
      {lessonModalState.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-800 uppercase flex items-center gap-2">
                <FileText className="w-4 h-4 text-amber-500" />
                <span>
                  {lessonModalState.mode === 'add' ? 'Thêm Bài Giảng Vào Chương' : 'Chỉnh Sửa Bài Giảng'}
                </span>
              </h3>
              <button
                onClick={() => setLessonModalState((prev) => ({ ...prev, isOpen: false }))}
                className="text-slate-400 hover:text-slate-700 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveLesson} className="p-6 space-y-4 text-xs">
              <div className="space-y-1">
                <label className="block font-bold text-slate-700">Tên bài giảng:</label>
                <input
                  type="text"
                  placeholder="Ví dụ: Bài 1: Khái niệm và quy tắc giao thông cơ bản"
                  value={lessonModalState.tenBaiGiang}
                  onChange={(e) =>
                    setLessonModalState((prev) => ({ ...prev, tenBaiGiang: e.target.value }))
                  }
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-amber-400 font-medium"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block font-bold text-slate-700">Số thứ tự:</label>
                  <input
                    type="number"
                    min="1"
                    value={lessonModalState.soThuTu}
                    onChange={(e) =>
                      setLessonModalState((prev) => ({ ...prev, soThuTu: Number(e.target.value) }))
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:outline-none focus:border-amber-400"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="block font-bold text-slate-700">Thời lượng (Phút):</label>
                  <input
                    type="number"
                    min="1"
                    max="300"
                    value={lessonModalState.thoiLuongPhut}
                    onChange={(e) =>
                      setLessonModalState((prev) => ({
                        ...prev,
                        thoiLuongPhut: Number(e.target.value),
                      }))
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:outline-none focus:border-amber-400"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block font-bold text-slate-700">Đường dẫn Video bài giảng:</label>
                <input
                  type="text"
                  placeholder="Ví dụ: /videos/b2_chuong1_bai1.mp4"
                  value={lessonModalState.duongDanVideo}
                  onChange={(e) =>
                    setLessonModalState((prev) => ({
                      ...prev,
                      duongDanVideo: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-[11px] focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="space-y-1">
                <label className="block font-bold text-slate-700">Tài liệu học tập đính kèm (URL):</label>
                <input
                  type="text"
                  placeholder="Ví dụ: /docs/tai-lieu-chuong1.pdf"
                  value={lessonModalState.taiLieuDinhKem}
                  onChange={(e) =>
                    setLessonModalState((prev) => ({
                      ...prev,
                      taiLieuDinhKem: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-[11px] focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setLessonModalState((prev) => ({ ...prev, isOpen: false }))}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-400 hover:bg-amber-500 text-slate-950 font-bold transition-all shadow-sm cursor-pointer"
                >
                  {lessonModalState.mode === 'add' ? 'Thêm bài giảng' : 'Lưu thay đổi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: THÊM KHUNG BÀI GIẢNG MẪU MỚI (CHO ADMIN)                           */}
      {/* ========================================================================= */}
      {courseModalState.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-800 uppercase flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-amber-500" />
                <span>Tạo Khung Bài Giảng Mẫu Mới</span>
              </h3>
              <button
                onClick={() => setCourseModalState((prev) => ({ ...prev, isOpen: false }))}
                className="text-slate-400 hover:text-slate-700 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateCourseTemplate} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="block font-bold text-slate-700">Mã hạng GPLX *</label>
                  <select
                    value={courseModalState.maHangGPLX}
                    onChange={(e) =>
                      setCourseModalState((prev) => ({ ...prev, maHangGPLX: e.target.value }))
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:outline-none focus:border-amber-400"
                  >
                    <option value="B1">Hạng B1</option>
                    <option value="B2">Hạng B2</option>
                    <option value="C">Hạng C</option>
                    <option value="C1">Hạng C1</option>
                    <option value="D">Hạng D</option>
                    <option value="E">Hạng E</option>
                    <option value="FC">Hạng FC</option>
                  </select>
                </div>

                <div className="col-span-2 space-y-1">
                  <label className="block font-bold text-slate-700">Tên khung bài giảng mẫu *</label>
                  <input
                    type="text"
                    placeholder="Ví dụ: C1 - Xe tải chuyên dụng"
                    value={courseModalState.tenKhoaHoc}
                    onChange={(e) =>
                      setCourseModalState((prev) => ({ ...prev, tenKhoaHoc: e.target.value }))
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-amber-400 font-medium"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block font-bold text-slate-700">Tổng số giờ lý thuyết chuẩn (Giờ) *</label>
                <div className="relative">
                  <Clock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="number"
                    min="1"
                    max="1000"
                    step="0.5"
                    value={courseModalState.tongSoGioLyThuyet}
                    onChange={(e) =>
                      setCourseModalState((prev) => ({
                        ...prev,
                        tongSoGioLyThuyet: Number(e.target.value),
                      }))
                    }
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:outline-none focus:border-amber-400"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block font-bold text-slate-700">Mô tả tóm tắt khung mẫu:</label>
                <textarea
                  rows={3}
                  placeholder="Nhập thông tin mục tiêu đào tạo, quy chuẩn áp dụng..."
                  value={courseModalState.moTa}
                  onChange={(e) =>
                    setCourseModalState((prev) => ({ ...prev, moTa: e.target.value }))
                  }
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-amber-400 text-xs"
                />
              </div>

              <div className="p-3 bg-amber-50 rounded-xl text-[11px] text-amber-900 border border-amber-200/80 leading-relaxed">
                💡 <strong>Ghi chú:</strong> Sau khi tạo khung mẫu, Admin có thể nhấn <strong>Chỉnh sửa</strong> để thiết lập số chương và thêm các bài giảng mẫu chi tiết vào khung này.
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setCourseModalState((prev) => ({ ...prev, isOpen: false }))}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-400 hover:bg-amber-500 text-slate-950 font-bold transition-all shadow-sm cursor-pointer"
                >
                  Tạo Khung Mẫu
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
