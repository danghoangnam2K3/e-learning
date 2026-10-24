import { useState, useEffect } from 'react';

/**
 * Custom hook hoãn cập nhật giá trị (Debounce) theo khoảng thời gian chỉ định (toiuhoatocdo.md - Mục 2.B)
 * Giúp tránh spam request API xuống CSDL và tối ưu hóa hiệu năng render khi người dùng nhập tìm kiếm.
 * @param value Giá trị cần debounce (từ khóa tìm kiếm, bộ lọc...)
 * @param delay Thời gian chờ tính bằng ms (mặc định: 350ms)
 */
export function useDebounce<T>(value: T, delay: number = 350): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}
