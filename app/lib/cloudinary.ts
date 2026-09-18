/**
 * Строит превью-URL из оригинального Cloudinary-адреса, вставляя
 * трансформацию прямо в путь (`/upload/w_96,h_96,c_fill,q_auto,f_auto/...`).
 * Cloudinary сам генерит и кеширует нужный размер на CDN — бэкенд не трогаем,
 * ничего заранее нарезать/хранить не нужно.
 *
 * Не-Cloudinary или пустой src возвращается как есть — безопасно для логотипов
 * из /public и любых будущих источников картинок.
 */
export function cldThumb(
  src?: string | null,
  opts: { w: number; h?: number; crop?: 'fill' | 'fit' | 'thumb' } = { w: 96 }
): string | undefined {
  if (!src) return src ?? undefined;
  if (!src.includes('res.cloudinary.com') || !src.includes('/upload/')) return src;

  const { w, h = w, crop = 'fill' } = opts;
  // q_auto/f_auto — Cloudinary сам подбирает сжатие и формат (webp/avif) под
  // браузер; dpr_auto — отдаёт 2x/3x на retina-экранах вместо всегда-2x.
  const transform = `w_${w},h_${h},c_${crop},q_auto,f_auto,dpr_auto`;

  return src.replace('/upload/', `/upload/${transform}/`);
}
