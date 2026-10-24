import React, { useState, useEffect } from 'react';
import { getMediaUrl } from '../services/api';

interface AvatarImageProps {
  src?: string | null;
  alt?: string;
  className?: string;
  fallback?: React.ReactNode;
}

export const AvatarImage: React.FC<AvatarImageProps> = ({
  src,
  alt = '',
  className = '',
  fallback = null,
}) => {
  const [displaySrc, setDisplaySrc] = useState<string | null>(null);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (!src) {
      setDisplaySrc(null);
      setHasError(false);
      return;
    }

    // 1. Nếu là data: URL hoặc blob: URL -> Dùng trực tiếp
    if (src.startsWith('data:') || src.startsWith('blob:')) {
      setDisplaySrc(src);
      setHasError(false);
      return;
    }

    // 2. Fetch ảnh kèm header ngrok-skip-browser-warning để vượt qua cảnh báo ngrok
    const url = getMediaUrl(src);
    let isCancelled = false;
    let createdBlobUrl: string | null = null;

    fetch(url, {
      headers: {
        'ngrok-skip-browser-warning': 'true',
      },
    })
      .then((res) => {
        const contentType = res.headers.get('content-type') || '';
        if (!res.ok || contentType.includes('text/html')) {
          throw new Error('Not an image: ' + contentType);
        }
        return res.blob();
      })
      .then((blob) => {
        if (!isCancelled) {
          createdBlobUrl = URL.createObjectURL(blob);
          setDisplaySrc(createdBlobUrl);
          setHasError(false);
        }
      })
      .catch((err) => {
        if (!isCancelled) {
          console.warn('AvatarImage fetch fallback:', err.message);
          setHasError(true);
        }
      });

    return () => {
      isCancelled = true;
      if (createdBlobUrl) {
        URL.revokeObjectURL(createdBlobUrl);
      }
    };
  }, [src]);

  if (hasError || !displaySrc) {
    return <>{fallback}</>;
  }

  return (
    <img
      src={displaySrc}
      alt={alt}
      className={className}
      onError={() => setHasError(true)}
    />
  );
};

export default AvatarImage;
