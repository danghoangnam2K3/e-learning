import React from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

export interface PaginationFooterProps {
  currentPage: number;
  pageSize: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  pageSizeOptions?: number[];
  itemName?: string;
  theme?: 'light' | 'dark';
  className?: string;
}

export const PaginationFooter: React.FC<PaginationFooterProps> = ({
  currentPage,
  pageSize,
  totalItems,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 20, 50, 100],
  itemName = 'bản ghi',
  theme = 'light',
  className = '',
}) => {
  const isAll = pageSize === -1;
  const totalPages = isAll ? 1 : Math.max(1, Math.ceil(totalItems / pageSize));
  const safePage = Math.min(Math.max(1, currentPage), totalPages);

  const startItem = totalItems === 0 ? 0 : isAll ? 1 : (safePage - 1) * pageSize + 1;
  const endItem = totalItems === 0 ? 0 : isAll ? totalItems : Math.min(safePage * pageSize, totalItems);

  // Generate page numbers with ellipsis
  const getPageNumbers = () => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const pages: (number | string)[] = [];
    if (safePage <= 4) {
      // 1, 2, 3, 4, 5, ..., totalPages
      pages.push(1, 2, 3, 4, 5, '...', totalPages);
    } else if (safePage >= totalPages - 3) {
      // 1, ..., totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages
      pages.push(1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
    } else {
      // 1, ..., safePage - 1, safePage, safePage + 1, ..., totalPages
      pages.push(1, '...', safePage - 1, safePage, safePage + 1, '...', totalPages);
    }
    return pages;
  };

  const isDark = theme === 'dark';

  return (
    <div
      className={`px-4 py-3.5 border-t flex flex-col md:flex-row items-center justify-between gap-4 text-xs select-none ${
        isDark
          ? 'border-slate-800 bg-[#0d1527] text-slate-400'
          : 'border-slate-100 bg-white/80 text-slate-600'
      } ${className}`}
    >
      {/* Bên trái: Thông tin số lượng & Dropdown chọn số dòng/trang */}
      <div className="flex flex-wrap items-center gap-2.5">
        <span>
          Hiển thị{' '}
          <strong className={isDark ? 'text-white font-bold' : 'text-slate-900 font-bold'}>
            {startItem}
          </strong>{' '}
          đến{' '}
          <strong className={isDark ? 'text-white font-bold' : 'text-slate-900 font-bold'}>
            {endItem}
          </strong>{' '}
          của tổng số{' '}
          <strong className={isDark ? 'text-amber-400 font-bold' : 'text-amber-600 font-bold'}>
            {totalItems}
          </strong>{' '}
          {itemName}
        </span>

        <span className={isDark ? 'text-slate-600' : 'text-slate-300'}>|</span>

        <div className="flex items-center gap-1.5">
          <label htmlFor="pageSizeSelect" className="text-[11px]">Số dòng/trang:</label>
          <select
            id="pageSizeSelect"
            value={pageSize}
            onChange={(e) => {
              const newSize = Number(e.target.value);
              onPageSizeChange(newSize);
              onPageChange(1); // Reset về trang 1 khi đổi page size theo chuẩn UX
            }}
            className={`px-2 py-1 rounded-lg border text-xs font-semibold focus:outline-none transition-colors cursor-pointer ${
              isDark
                ? 'bg-slate-900 border-slate-700 text-slate-200 focus:border-amber-400'
                : 'bg-slate-50 border-slate-200 text-slate-800 focus:border-amber-400 focus:bg-white'
            }`}
          >
            {pageSizeOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt === -1 ? 'Tất cả' : `${opt} dòng`}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Bên phải: Nút phân trang (<<, <, số trang, >, >>) */}
      <div className="flex items-center gap-1">
        {/* Về trang đầu (<<) */}
        <button
          onClick={() => onPageChange(1)}
          disabled={safePage <= 1}
          title="Trang đầu tiên"
          className={`p-1.5 rounded-lg border transition-all cursor-pointer disabled:cursor-not-allowed disabled:opacity-30 ${
            isDark
              ? 'border-slate-800 bg-slate-900 text-slate-300 hover:bg-slate-800 hover:border-slate-700'
              : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:border-slate-300 shadow-2xs'
          }`}
        >
          <ChevronsLeft className="w-3.5 h-3.5" />
        </button>

        {/* Trang trước (<) */}
        <button
          onClick={() => onPageChange(safePage - 1)}
          disabled={safePage <= 1}
          title="Trang trước"
          className={`p-1.5 rounded-lg border transition-all cursor-pointer disabled:cursor-not-allowed disabled:opacity-30 ${
            isDark
              ? 'border-slate-800 bg-slate-900 text-slate-300 hover:bg-slate-800 hover:border-slate-700'
              : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:border-slate-300 shadow-2xs'
          }`}
        >
          <ChevronLeft className="w-3.5 h-3.5" />
        </button>

        {/* Danh sách các nút số trang */}
        <div className="flex items-center gap-1 mx-0.5">
          {getPageNumbers().map((item, idx) => {
            if (typeof item === 'string') {
              return (
                <span
                  key={`ellipsis-${idx}`}
                  className={`px-1.5 text-xs font-semibold ${isDark ? 'text-slate-600' : 'text-slate-400'}`}
                >
                  ...
                </span>
              );
            }

            const isActive = item === safePage;
            return (
              <button
                key={item}
                onClick={() => onPageChange(item)}
                className={`min-w-7 h-7 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-amber-400 text-slate-950 shadow-sm shadow-amber-400/30'
                    : isDark
                    ? 'text-slate-400 hover:text-slate-100 hover:bg-slate-800'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                {item}
              </button>
            );
          })}
        </div>

        {/* Trang sau (>) */}
        <button
          onClick={() => onPageChange(safePage + 1)}
          disabled={safePage >= totalPages}
          title="Trang tiếp theo"
          className={`p-1.5 rounded-lg border transition-all cursor-pointer disabled:cursor-not-allowed disabled:opacity-30 ${
            isDark
              ? 'border-slate-800 bg-slate-900 text-slate-300 hover:bg-slate-800 hover:border-slate-700'
              : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:border-slate-300 shadow-2xs'
          }`}
        >
          <ChevronRight className="w-3.5 h-3.5" />
        </button>

        {/* Đến trang cuối (>>) */}
        <button
          onClick={() => onPageChange(totalPages)}
          disabled={safePage >= totalPages}
          title="Trang cuối cùng"
          className={`p-1.5 rounded-lg border transition-all cursor-pointer disabled:cursor-not-allowed disabled:opacity-30 ${
            isDark
              ? 'border-slate-800 bg-slate-900 text-slate-300 hover:bg-slate-800 hover:border-slate-700'
              : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:border-slate-300 shadow-2xs'
          }`}
        >
          <ChevronsRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
