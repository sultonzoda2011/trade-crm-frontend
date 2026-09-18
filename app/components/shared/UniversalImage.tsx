import { useEffect, useMemo, useState, type ImgHTMLAttributes, type ReactNode } from 'react';
import { cldThumb } from '~/lib/cloudinary';
import { cn } from '~/lib/utils';

type ImageStatus = 'empty' | 'loading' | 'loaded' | 'error';

interface UniversalImageProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'src'> {
  src?: string | null;
  containerClassName?: string;
  imgClassName?: string;
  fallback?: ReactNode | ((status: ImageStatus) => ReactNode);
  loadedClassName?: string;
  loadingClassName?: string;
  /** Ширина/высота Cloudinary-превью в px (квадрат). Все текущие места
   * использования — маленькие превью 24-32px, retina покрыта запасом. */
  thumbSize?: number;
}

export function UniversalImage({
  src,
  alt,
  containerClassName,
  imgClassName,
  fallback,
  className,
  onLoad,
  onError,
  loadedClassName = 'opacity-100',
  loadingClassName = 'opacity-0',
  thumbSize = 96,
  ...imgProps
}: UniversalImageProps) {
  const [status, setStatus] = useState<ImageStatus>(src ? 'loading' : 'empty');
  const thumbSrc = useMemo(() => cldThumb(src, { w: thumbSize }), [src, thumbSize]);

  useEffect(() => {
    setStatus(src ? 'loading' : 'empty');
  }, [src]);

  const fallbackNode = useMemo(() => {
    if (!fallback) {
      return <div className="bg-muted h-full w-full" />;
    }
    return typeof fallback === 'function' ? fallback(status) : fallback;
  }, [fallback, status]);

  return (
    <div className={cn('relative overflow-hidden', containerClassName)}>
      {src && status !== 'error' && (
        <img
          {...imgProps}
          src={thumbSrc}
          alt={alt}
          onLoad={(e) => {
            setStatus('loaded');
            onLoad?.(e);
          }}
          onError={(e) => {
            setStatus('error');
            onError?.(e);
          }}
          className={cn(
            className,
            imgClassName,
            'h-full w-full object-cover transition-all duration-500',
            status === 'loaded' ? loadedClassName : loadingClassName
          )}
        />
      )}

      {status !== 'loaded' && <div className="absolute inset-0">{fallbackNode}</div>}
    </div>
  );
}
