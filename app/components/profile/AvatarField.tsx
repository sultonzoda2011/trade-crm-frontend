import { Camera, Trash2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { AvatarCropModal } from '~/components/profile/AvatarCropModal';
import { EntityAvatar } from '~/components/shared/EntityAvatar';
import { Button } from '~/components/ui/button';

const MAX_SOURCE_BYTES = 25 * 1024 * 1024;

interface AvatarFieldProps {
  name: string;
  /** Текущее фото: адрес с сервера, только что обрезанный файл или `null`. */
  value: File | string | null;
  onChange: (value: File | string | null) => void;
}

/**
 * Фото профиля: выбрать (галерея или камера) → обрезать по кругу → предпросмотр.
 * Ничего не уходит на сервер, пока не нажато «Сохранить» на самой странице.
 */
export function AvatarField({ name, value, onChange }: AvatarFieldProps) {
  const { t } = useTranslation('profile');
  const inputRef = useRef<HTMLInputElement>(null);
  const [picked, setPicked] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    if (!(value instanceof File)) {
      setPreview(null);
      return;
    }
    const url = URL.createObjectURL(value);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [value]);

  const image = value instanceof File ? preview : value;

  const onPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error(t('avatarNotImage'));
      return;
    }
    if (file.size > MAX_SOURCE_BYTES) {
      toast.error(t('avatarTooLarge'));
      return;
    }
    setPicked(file);
  };

  return (
    <div className="flex flex-col items-center gap-4 py-2">
      <EntityAvatar name={name || '?'} image={image} size="xl" className="size-28 text-5xl" />

      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={onPick} data-testid="avatar-input" />

      <div className="flex w-full max-w-xs flex-col gap-2">
        <Button type="button" variant="secondary" onClick={() => inputRef.current?.click()}>
          <Camera />
          {image ? t('avatarChange') : t('avatarAdd')}
        </Button>
        {image && (
          <Button type="button" variant="destructive" onClick={() => onChange(null)}>
            <Trash2 />
            {t('avatarRemove')}
          </Button>
        )}
      </div>

      <AvatarCropModal
        file={picked}
        onCancel={() => setPicked(null)}
        onConfirm={(cropped) => {
          setPicked(null);
          onChange(cropped);
        }}
        onLoadError={() => {
          setPicked(null);
          toast.error(t('avatarUnreadable'));
        }}
      />
    </div>
  );
}
