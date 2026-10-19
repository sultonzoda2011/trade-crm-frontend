import type { ComponentProps } from 'react';
import { cn } from '~/lib/utils';

/**
 * Стеклянная поверхность в языке GlassButton — для крупных плавающих
 * элементов: нижняя навигация и выезжающая панель «Ещё». Это контейнер, а не
 * кнопка: без наклона и бликов при наведении, подложка плотнее, чтобы под ней
 * читался контент. Скругление задаёт вызывающий (`rounded-full`,
 * `rounded-[2rem]`) — кромка и тень его наследуют. Стили — `app/styles/glass.css`.
 *
 * Для обычных карточек не использовать: по DESING.md стекло — акцент.
 */
function GlassSurface({ className, ...props }: ComponentProps<'div'>) {
  return <div data-slot="glass-surface" className={cn('glass-surface', className)} {...props} />;
}

export { GlassSurface };
