import { useState, useMemo } from 'react';
import { SortDirection } from '../components/common/SortableHeader';

export interface UseClientPaginationOptions<T> {
  data: T[];
  initialPageSize?: number;
  initialSortField?: keyof T | string | null;
  initialSortDirection?: SortDirection;
}

export function useClientPagination<T>({
  data,
  initialPageSize = 10,
  initialSortField = null,
  initialSortDirection = null,
}: UseClientPaginationOptions<T>) {
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(initialPageSize);
  const [sortField, setSortField] = useState<string | null>(initialSortField as string | null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(initialSortDirection);

  const handleSort = (field: string, direction: SortDirection) => {
    setSortField(direction === null ? null : field);
    setSortDirection(direction);
    setCurrentPage(1); // Reset to page 1 on sort change
  };

  const sortedData = useMemo(() => {
    if (!sortField || !sortDirection) {
      return data;
    }

    return [...data].sort((a: any, b: any) => {
      let valA = a[sortField];
      let valB = b[sortField];

      // Handle null or undefined
      if (valA === null || valA === undefined) return 1;
      if (valB === null || valB === undefined) return -1;

      // Handle strings
      if (typeof valA === 'string' && typeof valB === 'string') {
        const cmp = valA.localeCompare(valB, 'vi', { sensitivity: 'base', numeric: true });
        return sortDirection === 'ASC' ? cmp : -cmp;
      }

      // Handle numbers or dates
      if (valA < valB) return sortDirection === 'ASC' ? -1 : 1;
      if (valA > valB) return sortDirection === 'ASC' ? 1 : -1;
      return 0;
    });
  }, [data, sortField, sortDirection]);

  const totalItems = sortedData.length;
  const isAll = pageSize === -1;
  const totalPages = isAll ? 1 : Math.max(1, Math.ceil(totalItems / pageSize));

  // Paginated items
  const paginatedData = useMemo(() => {
    if (isAll) return sortedData;
    const safePage = Math.min(Math.max(1, currentPage), totalPages);
    const start = (safePage - 1) * pageSize;
    return sortedData.slice(start, start + pageSize);
  }, [sortedData, currentPage, pageSize, isAll, totalPages]);

  return {
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    sortField,
    sortDirection,
    handleSort,
    paginatedData,
    totalItems,
    totalPages,
  };
}
