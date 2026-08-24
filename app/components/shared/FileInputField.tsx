import { FileIcon, ImageIcon, Paperclip, Pencil, Upload, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '~/components/ui/button';
import { Label } from '~/components/ui/label';
import { cn } from '~/lib/utils';

export interface FileInputFieldProps {
  value: File | string | null | undefined;
  onChange: (value: File | null) => void;
  onBlur?: () => void;
  error?: string;
  label?: string;
  required?: boolean;
  accept: string;
  aspectRatio: 'video' | 'square';
  /** "dropzone" — drag & drop с preview (default). "simple" — кнопка + имя файла */
  variant?: 'dropzone' | 'simple';
  /** "compact" — без текста, иконки вместо кнопок (для использования в модалках) */
  size?: 'default' | 'compact';
  className?: string;
}

function resolveUrl(value: string): string {
  if (value.startsWith('http') || value.startsWith('blob:') || value.startsWith('data:')) {
    return value;
  }
  return value;
}

function acceptsImages(accept: string) {
  return accept.includes('image');
}

export function FileInputField({
  value,
  onChange,
  onBlur,
  error,
  label,
  required,
  accept,
  aspectRatio,
  variant = 'dropzone',
  size = 'default',
  className,
}: FileInputFieldProps) {
  const { t } = useTranslation('common');
  const inputRef = useRef<HTMLInputElement>(null);
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    if (!(value instanceof File)) {
      setObjectUrl(null);
      return;
    }
    const url = URL.createObjectURL(value);
    setObjectUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [value]);

  const previewUrl = typeof value === 'string' ? resolveUrl(value) : objectUrl;
  const hasPreview = Boolean(previewUrl);
  const showAsImage = hasPreview && acceptsImages(accept);
  const aspectClass = aspectRatio === 'square' ? 'aspect-square' : 'aspect-video';
  // В компактном режиме квадратный превью используется как аватар — без
  // ограничения ширины он растягивается на всю ширину родителя (например,
  // на мобильном, где grid-колонки ещё не разделены по sm:) и превращается
  // в огромный квадрат вместо небольшой миниатюры.
  const compactSizeClass =
    size === 'compact' ? (aspectRatio === 'square' ? 'aspect-square w-28' : 'h-20') : aspectClass;

  const fileName = value instanceof File ? value.name : typeof value === 'string' ? value.split('/').pop() : null;

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    if (file) onChange(file);
    e.target.value = '';
  }

  function handleDrop(e: React.DragEvent<HTMLButtonElement>) {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) onChange(file);
  }

  return (
    <div className={cn('space-y-1.5', className)}>
      {label && (
        <Label>
          {label}
          {required && <span className="text-destructive ml-0.5">*</span>}
        </Label>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={handleInputChange}
        onBlur={onBlur}
      />

      {variant === 'simple' ? (
        // ── Simple variant ────────────────────────────────────────────────
        <div
          className={cn(
            'flex h-8 w-full items-center gap-2 rounded-lg border bg-background px-2.5 text-sm transition-colors',
            'dark:bg-input/30',
            error ? 'border-destructive' : 'border-border',
            !value && 'hover:bg-muted/40 cursor-pointer'
          )}
          onClick={() => !value && inputRef.current?.click()}>
          {value ? (
            <>
              <FileIcon className="text-muted-foreground h-3.5 w-3.5 shrink-0" />
              <span className="text-foreground min-w-0 flex-1 truncate">{fileName}</span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onChange(null);
                }}
                className="text-muted-foreground hover:text-foreground shrink-0 transition-colors">
                <X className="h-3.5 w-3.5" />
              </button>
            </>
          ) : (
            <>
              <Paperclip className="text-muted-foreground h-3.5 w-3.5 shrink-0" />
              <span className="text-muted-foreground">{t('fileInput.selectFile')}</span>
            </>
          )}
        </div>
      ) : (
        // ── Dropzone variant ──────────────────────────────────────────────
        <>
          {hasPreview ? (
            <div className={cn('group bg-muted/40 relative overflow-hidden rounded-xl border', compactSizeClass)}>
              {showAsImage ? (
                <img src={previewUrl!} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full flex-col items-center justify-center gap-2 p-4">
                  <FileIcon className="text-muted-foreground h-10 w-10" />
                  {fileName && size !== 'compact' && (
                    <span className="text-muted-foreground max-w-[80%] truncate text-sm">{fileName}</span>
                  )}
                </div>
              )}
              <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                {size === 'compact' ? (
                  <>
                    <Button
                      type="button"
                      size="icon"
                      variant="secondary"
                      className="h-7 w-7 shadow-md"
                      onClick={() => inputRef.current?.click()}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      type="button"
                      size="icon"
                      variant="destructive"
                      className="h-7 w-7 shadow-md"
                      onClick={() => onChange(null)}>
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      className="gap-1.5 shadow-md"
                      onClick={() => inputRef.current?.click()}>
                      <Pencil className="h-3.5 w-3.5" />
                      {t('fileInput.change')}
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="destructive"
                      className="gap-1.5 shadow-md"
                      onClick={() => onChange(null)}>
                      <X className="h-3.5 w-3.5" />
                      {t('fileInput.delete')}
                    </Button>
                  </>
                )}
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              className={cn(
                'flex w-full items-center justify-center rounded-xl border-2 border-dashed transition-colors',
                'bg-muted/40 text-muted-foreground hover:border-primary/40 hover:bg-muted/60',
                isDragging && 'border-primary bg-primary/5',
                error && 'border-destructive',
                size === 'compact' ? cn(compactSizeClass, 'gap-2') : cn('flex-col gap-3', aspectClass)
              )}>
              <div className={cn('bg-background rounded-full border shadow-sm', size === 'compact' ? 'p-2' : 'p-3')}>
                {acceptsImages(accept) ? (
                  <ImageIcon className={size === 'compact' ? 'h-4 w-4' : 'h-5 w-5'} />
                ) : (
                  <Upload className={size === 'compact' ? 'h-4 w-4' : 'h-5 w-5'} />
                )}
              </div>
              {size !== 'compact' && (
                <div className="space-y-0.5 text-center">
                  <p className="text-sm font-medium">{t('fileInput.dragDrop')}</p>
                  <p className="text-xs">{accept === 'image/*' ? 'PNG, JPG, WEBP, SVG' : accept}</p>
                </div>
              )}
            </button>
          )}
        </>
      )}

      {error && <p className="text-destructive text-sm">{error}</p>}
    </div>
  );
}
