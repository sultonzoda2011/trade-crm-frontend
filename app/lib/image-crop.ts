/** Квадрат, который нужно вырезать из исходного фото, в пикселях исходника. */
export interface CropArea {
  x: number;
  y: number;
  size: number;
}

/** Грузит файл как картинку. Браузер сам учитывает EXIF-поворот телефонных снимков. */
export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('IMAGE_LOAD_FAILED'));
    img.src = src;
  });
}

/**
 * Вырезает квадрат и сжимает до `output`×`output` JPEG. Аватару хватает 512px:
 * снимок с телефона на 4–8 МБ превращается в ~60 КБ, и загрузка на мобильной
 * сети не висит.
 */
export async function cropToFile(
  img: HTMLImageElement,
  area: CropArea,
  fileName: string,
  output = 512
): Promise<File> {
  const canvas = document.createElement('canvas');
  canvas.width = output;
  canvas.height = output;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('CANVAS_UNAVAILABLE');
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, area.x, area.y, area.size, area.size, 0, 0, output, output);

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.9));
  if (!blob) throw new Error('CANVAS_EXPORT_FAILED');

  const base = fileName.replace(/\.[^.]+$/, '') || 'avatar';
  return new File([blob], `${base}.jpg`, { type: 'image/jpeg' });
}

/**
 * Положение фото в рамке → квадрат в исходнике.
 *
 * Рамка `frame`×`frame`; фото «закрывает» её целиком (cover) и увеличено в
 * `zoom` раз; `offset` — сдвиг центра фото от центра рамки в px рамки.
 */
export function computeCropArea(
  naturalWidth: number,
  naturalHeight: number,
  frame: number,
  zoom: number,
  offset: { x: number; y: number }
): CropArea {
  const scale = (frame / Math.min(naturalWidth, naturalHeight)) * zoom;
  const size = frame / scale;
  const x = (naturalWidth * scale) / 2 - offset.x - frame / 2;
  const y = (naturalHeight * scale) / 2 - offset.y - frame / 2;
  return { x: x / scale, y: y / scale, size };
}

/** Сдвиг нельзя уводить так, чтобы в рамке появилась пустота. */
export function clampOffset(
  naturalWidth: number,
  naturalHeight: number,
  frame: number,
  zoom: number,
  offset: { x: number; y: number }
): { x: number; y: number } {
  const scale = (frame / Math.min(naturalWidth, naturalHeight)) * zoom;
  const maxX = Math.max(0, (naturalWidth * scale - frame) / 2);
  const maxY = Math.max(0, (naturalHeight * scale - frame) / 2);
  return {
    x: Math.min(maxX, Math.max(-maxX, offset.x)),
    y: Math.min(maxY, Math.max(-maxY, offset.y)),
  };
}
