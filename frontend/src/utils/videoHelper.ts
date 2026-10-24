/**
 * Tiện ích xử lý và tự động nhúng (Embed) video bài giảng YouTube & đa phương tiện
 */

export function getYouTubeVideoId(url?: string | null): string | null {
  if (!url || typeof url !== 'string') return null;
  let trimmed = url.trim();
  if (!trimmed) return null;

  // Nếu người dùng dán cả thẻ <iframe>
  if (trimmed.includes('<iframe') && trimmed.includes('src=')) {
    const srcMatch = trimmed.match(/src=["']([^"']+)["']/i);
    if (srcMatch && srcMatch[1]) {
      trimmed = srcMatch[1].trim();
    }
  }

  // 1. YouTube Shorts: youtube.com/shorts/{id}
  const shortsMatch = trimmed.match(/(?:youtube\.com)\/shorts\/([a-zA-Z0-9_-]{11})/i);
  if (shortsMatch && shortsMatch[1]) return shortsMatch[1];

  // 2. YouTu.be link rút gọn: youtu.be/{id}
  const youtuBeMatch = trimmed.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/i);
  if (youtuBeMatch && youtuBeMatch[1]) return youtuBeMatch[1];

  // 3. YouTube Live: youtube.com/live/{id}
  const liveMatch = trimmed.match(/(?:youtube\.com)\/live\/([a-zA-Z0-9_-]{11})/i);
  if (liveMatch && liveMatch[1]) return liveMatch[1];

  // 4. YouTube chuẩn: watch?v={id}, embed/{id}, v/{id}
  const standardMatch = trimmed.match(/(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|v\/))([a-zA-Z0-9_-]{11})/i);
  if (standardMatch && standardMatch[1]) return standardMatch[1];

  return null;
}

export function isYouTubeUrl(url?: string | null): boolean {
  return getYouTubeVideoId(url) !== null;
}

export function formatVideoEmbedUrl(url?: string | null): string {
  if (!url || typeof url !== 'string') return '';
  let trimmed = url.trim();
  if (!trimmed) return '';

  // Kiểm tra nếu là YouTube -> tự động chuyển sang định dạng Embed chuẩn của YouTube
  const youtubeId = getYouTubeVideoId(trimmed);
  if (youtubeId) {
    return `https://www.youtube.com/embed/${youtubeId}`;
  }

  // Nếu người dùng dán nguyên thẻ iframe của nguồn khác -> trích xuất src
  if (trimmed.includes('<iframe') && trimmed.includes('src=')) {
    const srcMatch = trimmed.match(/src=["']([^"']+)["']/i);
    if (srcMatch && srcMatch[1]) {
      return srcMatch[1].trim();
    }
  }

  return trimmed;
}
