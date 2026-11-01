import { Minus, Plus } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '~/components/ui/button';
import { clampOffset, computeCropArea, cropToFile, loadImage } from '~/lib/image-crop';

interface AvatarCropModalProps {
  /** Выбранный файл; `null` — окно закрыто. */
  file: File | null;
  onCancel: () => void;
  /** Готовый квадрат 512×512 (JPEG). */
  onConfirm: (cropped: File) => void;
  /** Файл не открылся как картинка (например, HEIC в старом WebView). */
  onLoadError: () => void;
}

const MAX_ZOOM = 4;

/**
 * Обрезка фото под круглый аватар: фото двигается пальцем, масштаб — ползунком,
 * кнопками ± или щипком. Полноэкранное окно, а не нижняя шторка: движение вниз
 * в шторке закрывало бы её, а не двигало фото.
 */
export function AvatarCropModal({ file, onCancel, onConfirm, onLoadError }: AvatarCropModalProps) {
  const { t } = useTranslation('profile');
  const frameRef = useRef<HTMLDivElement>(null);
  const [src, setSrc] = useState<string | null>(null);
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  const [frame, setFrame] = useState(280);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [busy, setBusy] = useState(false);

  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const pinchStart = useRef<{ dist: number; zoom: number } | null>(null);

  useEffect(() => {
    if (!file) {
      setSrc(null);
      setImg(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setSrc(url);
    setZoom(1);
    setOffset({ x: 0, y: 0 });
    let cancelled = false;
    loadImage(url)
      .then((loaded) => !cancelled && setImg(loaded))
      .catch(() => !cancelled && onLoadError());
    return () => {
      cancelled = true;
      URL.revokeObjectURL(url);
    };
    // onLoadError приходит новой функцией на каждый рендер родителя — не зависим от неё.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [file]);

  // Рамка занимает почти всю ширину телефона, но не больше 320px.
  useEffect(() => {
    if (!file) return;
    const measure = () => setFrame(Math.min(320, Math.floor(window.innerWidth - 48)));
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [file]);

  const place = useCallback(
    (nextZoom: number, nextOffset: { x: number; y: number }) => {
      if (!img) return;
      const z = Math.min(MAX_ZOOM, Math.max(1, nextZoom));
      setZoom(z);
      setOffset(clampOffset(img.naturalWidth, img.naturalHeight, frame, z, nextOffset));
    },
    [img, frame]
  );

  const onPointerDown = (e: React.PointerEvent) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()];
      pinchStart.current = { dist: Math.hypot(a.x - b.x, a.y - b.y), zoom };
    }
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const prev = pointers.current.get(e.pointerId);
    if (!prev) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (pointers.current.size === 2 && pinchStart.current) {
      const [a, b] = [...pointers.current.values()];
      const dist = Math.hypot(a.x - b.x, a.y - b.y);
      place(pinchStart.current.zoom * (dist / pinchStart.current.dist), offset);
    } else if (pointers.current.size === 1) {
      place(zoom, { x: offset.x + (e.clientX - prev.x), y: offset.y + (e.clientY - prev.y) });
    }
  };

  const onPointerUp = (e: React.PointerEvent) => {
    pointers.current.delete(e.pointerId);
    if (pointers.current.size < 2) pinchStart.current = null;
  };

  const onWheel = (e: React.WheelEvent) => place(zoom - e.deltaY * 0.002, offset);

  const confirm = async () => {
    if (!img || !file) return;
    setBusy(true);
    try {
      const area = computeCropArea(img.naturalWidth, img.naturalHeight, frame, zoom, offset);
      onConfirm(await cropToFile(img, area, file.name));
    } catch {
      onLoadError();
    } finally {
      setBusy(false);
    }
  };

  if (!file || typeof document === 'undefined') return null;

  const baseScale = img ? frame / Math.min(img.naturalWidth, img.naturalHeight) : 1;
  const scale = baseScale * zoom;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={t('crop.title')}
      className="bg-background fixed inset-0 z-[70] flex flex-col"
      style={{ paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)' }}>
      <header className="flex h-14 shrink-0 items-center justify-between px-4">
        <button type="button" onClick={onCancel} className="text-primary -mx-2 h-11 px-2 text-base active:opacity-60">
          {t('crop.cancel')}
        </button>
        <h2 className="text-base font-semibold">{t('crop.title')}</h2>
        <span className="w-16" aria-hidden />
      </header>

      <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-6 px-6">
        <div
          ref={frameRef}
          data-testid="crop-frame"
          className="relative touch-none overflow-hidden rounded-3xl bg-black select-none"
          style={{ width: frame, height: frame }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          onWheel={onWheel}>
          {img && src && (
            <img
              src={src}
              alt=""
              draggable={false}
              className="pointer-events-none absolute max-w-none"
              style={{
                width: img.naturalWidth * scale,
                height: img.naturalHeight * scale,
                left: frame / 2 + offset.x - (img.naturalWidth * scale) / 2,
                top: frame / 2 + offset.y - (img.naturalHeight * scale) / 2,
              }}
            />
          )}
          {/* Круг-«окошко»: всё, что вне круга, на аватар не попадёт. */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{ background: 'radial-gradient(circle closest-side, transparent 98%, rgb(0 0 0 / 0.55) 100%)' }}
          />
          <div aria-hidden className="pointer-events-none absolute inset-0 rounded-full ring-1 ring-white/70 ring-inset" />
        </div>

        <div className="flex w-full max-w-xs items-center gap-3">
          <button
            type="button"
            aria-label={t('crop.zoomOut')}
            onClick={() => place(zoom - 0.25, offset)}
            className="text-muted-foreground flex size-11 items-center justify-center rounded-full active:opacity-60">
            <Minus className="size-5" />
          </button>
          <input
            type="range"
            min={1}
            max={MAX_ZOOM}
            step={0.01}
            value={zoom}
            aria-label={t('crop.zoom')}
            onChange={(e) => place(Number(e.target.value), offset)}
            className="accent-primary h-11 min-w-0 flex-1"
          />
          <button
            type="button"
            aria-label={t('crop.zoomIn')}
            onClick={() => place(zoom + 0.25, offset)}
            className="text-muted-foreground flex size-11 items-center justify-center rounded-full active:opacity-60">
            <Plus className="size-5" />
          </button>
        </div>
        <p className="text-muted-foreground text-center text-sm">{t('crop.hint')}</p>
      </div>

      <div className="shrink-0 px-4 pt-3 pb-4">
        <Button size="lg" className="w-full" loading={busy} disabled={!img} onClick={() => void confirm()}>
          {t('crop.done')}
        </Button>
      </div>
    </div>,
    document.body
  );
}
