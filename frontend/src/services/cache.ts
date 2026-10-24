/**
 * Bộ quản lý bộ nhớ đệm phía Client (Client-Side Memory Cache - toiuhoatocdo.md Mục 2.A)
 * Giúp lưu tạm dữ liệu đã tải trong RAM trình duyệt, loại bỏ thời gian chờ khi người dùng
 * chuyển qua lại giữa các tab (0ms response time), giảm thiểu tải truy vấn xuống CSDL.
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttlMs: number;
}

class ClientCache {
  private cache = new Map<string, CacheEntry<any>>();

  /**
   * Lấy dữ liệu từ cache nếu còn hạn (valid)
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const isExpired = Date.now() - entry.timestamp > entry.ttlMs;
    if (isExpired) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  /**
   * Lưu dữ liệu vào cache với thời gian sống TTL
   * @param key Khóa cache
   * @param data Dữ liệu cần cache
   * @param ttlSeconds Thời gian sống tính theo giây (mặc định: 180s = 3 phút)
   */
  set<T>(key: string, data: T, ttlSeconds: number = 180): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttlMs: ttlSeconds * 1000,
    });
  }

  /**
   * Xóa một key cụ thể hoặc các key chứa tiền tố pattern
   */
  invalidate(pattern?: string): void {
    if (!pattern) {
      this.cache.clear();
      return;
    }

    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
      }
    }
  }
}

export const clientCache = new ClientCache();
