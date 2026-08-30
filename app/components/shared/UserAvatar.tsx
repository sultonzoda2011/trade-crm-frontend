import { Avatar, AvatarFallback, AvatarImage } from '~/components/ui/avatar';

interface UserAvatarProps {
  fullName: string;
  imagePath?: string;
  subInfo?: string;
}

/**
 * Аватар + имя + подпись (обычно email/телефон).
 *
 * `min-w-0` на текстовой колонке обязателен: без него `truncate` нечего
 * обрезать — flex-элемент просто раздвигается, и длинный email вылезал за
 * карточку (второй источник этой проблемы после `InfoItem`).
 *
 * Размер аватара — штатный `size="default"` (32px) вместо прежнего ручного
 * `h-9 w-9` (36px): ручной класс обходил шкалу `Avatar` (`sm | default | lg` =
 * 24 | 32 | 40), промежуточного значения в ней нет, а все остальные аватарки в
 * приложении уже 32px.
 */
export function UserAvatar({ fullName, imagePath, subInfo }: UserAvatarProps) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <Avatar size="default">
        <AvatarImage src={imagePath ? imagePath : undefined} className="object-cover" />
        <AvatarFallback>{fullName.charAt(0).toUpperCase()}</AvatarFallback>
      </Avatar>
      <div className="flex min-w-0 flex-col">
        <span className="truncate text-sm font-semibold">{fullName}</span>
        {subInfo && <span className="text-muted-foreground truncate text-xs">{subInfo}</span>}
      </div>
    </div>
  );
}
