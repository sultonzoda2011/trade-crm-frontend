import { Avatar, AvatarFallback, AvatarImage } from '~/components/ui/avatar';
import { UniversalImage } from '~/components/shared/UniversalImage';

interface UserAvatarProps {
  fullName: string;
  imagePath?: string;
  subInfo?: string;
  /**
   * `circle` (по умолчанию) — для людей/маркетов (логотип), как раньше.
   * `square` — для товаров: круглый аватар для фото ТОВАРА был смысловой
   * ошибкой (аватар — это про людей/бренд, а не про вещь на складе).
   * Использует `UniversalImage` — раньше был написан, но нигде не подключён.
   */
  shape?: 'circle' | 'square';
}

/**
 * Аватар/превью + имя + подпись (обычно email/телефон).
 *
 * `min-w-0` на текстовой колонке обязателен: без него `truncate` нечего
 * обрезать — flex-элемент просто раздвигается, и длинный email вылезал за
 * карточку (второй источник этой проблемы после `InfoItem`).
 *
 * Размер — штатные 32px и для круглого, и для квадратного варианта, чтобы
 * строки в таблицах/карточках выравнивались по высоте одинаково.
 */
export function UserAvatar({ fullName, imagePath, subInfo, shape = 'circle' }: UserAvatarProps) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      {shape === 'square' ? (
        <UniversalImage
          src={imagePath}
          alt={fullName}
          containerClassName="bg-muted size-8 shrink-0 rounded-md"
          imgClassName="size-full object-cover"
          fallback={
            <div className="text-muted-foreground flex size-full items-center justify-center text-sm font-medium">
              {fullName.charAt(0).toUpperCase()}
            </div>
          }
        />
      ) : (
        <Avatar size="default">
          <AvatarImage src={imagePath ? imagePath : undefined} className="object-cover" />
          <AvatarFallback>{fullName.charAt(0).toUpperCase()}</AvatarFallback>
        </Avatar>
      )}
      <div className="flex min-w-0 flex-col">
        <span className="truncate text-sm font-semibold">{fullName}</span>
        {subInfo && <span className="text-muted-foreground truncate text-xs">{subInfo}</span>}
      </div>
    </div>
  );
}
