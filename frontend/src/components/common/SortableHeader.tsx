import React from 'react';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';

export type SortDirection = 'ASC' | 'DESC' | null;

export interface SortableHeaderProps {
  field: string;
  currentField?: string | null;
  currentDirection?: SortDirection | string | null;
  onSort: (field: string, direction: SortDirection) => void;
  children: React.ReactNode;
  align?: 'left' | 'center' | 'right';
  className?: string;
  theme?: 'light' | 'dark';
}

export const SortableHeader: React.FC<SortableHeaderProps> = ({
  field,
  currentField,
  currentDirection,
  onSort,
  children,
  align = 'left',
  className = '',
  theme = 'light',
}) => {
  const isCurrent = currentField === field;
  const normalizedDirection: SortDirection = isCurrent
    ? currentDirection === 'ASC' || currentDirection === 'asc'
      ? 'ASC'
      : currentDirection === 'DESC' || currentDirection === 'desc'
      ? 'DESC'
      : null
    : null;

  // 3-step cycle: null -> ASC -> DESC -> null
  const handleClick = () => {
    if (!isCurrent || normalizedDirection === null) {
      onSort(field, 'ASC');
    } else if (normalizedDirection === 'ASC') {
      onSort(field, 'DESC');
    } else {
      onSort(field, null);
    }
  };

  const isDark = theme === 'dark';

  const alignClass =
    align === 'center'
      ? 'justify-center text-center'
      : align === 'right'
      ? 'justify-end text-right'
      : 'justify-start text-left';

  return (
    <th
      onClick={handleClick}
      className={`py-3.5 px-4 cursor-pointer select-none group transition-colors ${
        isDark
          ? 'hover:bg-slate-800/60 text-slate-300'
          : 'hover:bg-slate-100/70 text-slate-600'
      } ${className}`}
      title={
        normalizedDirection === 'ASC'
          ? 'Đang sắp xếp tăng dần. Nhấn để chuyển sang giảm dần'
          : normalizedDirection === 'DESC'
          ? 'Đang sắp xếp giảm dần. Nhấn để hủy sắp xếp'
          : 'Nhấn để sắp xếp cột này'
      }
    >
      <div className={`inline-flex items-center gap-1.5 font-bold uppercase tracking-wider text-[11px] ${alignClass}`}>
        <span className={isCurrent && normalizedDirection ? 'text-amber-500 font-extrabold' : ''}>
          {children}
        </span>
        <span className="inline-flex items-center">
          {normalizedDirection === 'ASC' ? (
            <ArrowUp className="w-3.5 h-3.5 text-amber-500 stroke-[2.5]" />
          ) : normalizedDirection === 'DESC' ? (
            <ArrowDown className="w-3.5 h-3.5 text-amber-500 stroke-[2.5]" />
          ) : (
            <ArrowUpDown
              className={`w-3.5 h-3.5 opacity-40 group-hover:opacity-100 transition-opacity ${
                isDark ? 'text-slate-400' : 'text-slate-500'
              }`}
            />
          )}
        </span>
      </div>
    </th>
  );
};
