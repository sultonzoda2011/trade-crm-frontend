import { Button as ButtonPrimitive } from '@base-ui/react/button';
import { cva, type VariantProps } from 'class-variance-authority';
import type { ReactNode } from 'react';
import { cn } from '~/lib/utils';

/**
 * Стеклянная кнопка (liquid glass): блик по кромке, смещающийся при наведении,
 * мягкая тень под капсулой и «продавливание» при нажатии. Стили — в
 * `app/styles/glass.css`.
 *
 * Это не замена `Button`. Она для ПЛАВАЮЩИХ контролов поверх фона или картинки
 * («Назад» над страницей, «Изменить» в шапке карточки). Главное действие экрана
 * (сохранить, создать, оплатить) остаётся обычным `Button variant="default"`:
 * по DESING.md для важного нужен контраст, а не прозрачность. Не ставьте много
 * таких кнопок на один экран — каждая тянет backdrop-filter, а на дешёвом
 * Android WebView это заметно.
 *
 * `render` работает как у `Button`: `render={<Link to="…" />}` даёт настоящую
 * ссылку, а не кнопку с onClick.
 */
const glassButtonVariants = cva('glass-button relative isolate cursor-pointer rounded-full transition-all', {
  variants: {
    size: {
      default: 'text-base font-medium',
      sm: 'text-sm font-medium',
      lg: 'text-lg font-medium',
      // Тап-таргет ≥44px на телефоне (как size="icon" у Button).
      icon: 'size-11 md:size-10',
    },
  },
  defaultVariants: { size: 'default' },
});

const glassButtonTextVariants = cva('glass-button-text relative block tracking-tight select-none', {
  variants: {
    size: {
      default: 'px-5 py-3 md:px-6 md:py-3',
      sm: 'px-4 py-2',
      lg: 'px-8 py-4',
      icon: 'flex size-11 items-center justify-center md:size-10',
    },
  },
  defaultVariants: { size: 'default' },
});

type GlassButtonProps = Omit<ButtonPrimitive.Props, 'className' | 'children'> &
  VariantProps<typeof glassButtonVariants> & {
    /** Классы внешней обёртки: отступы, `shrink-0`, видимость по брейкпоинтам. */
    className?: string;
    /** Классы подписи/иконки внутри: цвет (`text-primary`), `gap-*`, `truncate`. */
    contentClassName?: string;
    children?: ReactNode;
  };

function GlassButton({
  className,
  contentClassName,
  size = 'default',
  render,
  nativeButton,
  children,
  ...props
}: GlassButtonProps) {
  return (
    <div className={cn('glass-button-wrap inline-flex max-w-full shrink-0 rounded-full', className)}>
      <ButtonPrimitive
        data-slot="button"
        className={cn(
          glassButtonVariants({ size }),
          'focus-visible:ring-ring/40 min-w-0 outline-none focus-visible:ring-3 disabled:pointer-events-none disabled:opacity-40'
        )}
        render={render}
        nativeButton={nativeButton ?? render === undefined}
        {...props}>
        <span className={cn(glassButtonTextVariants({ size }), contentClassName)}>{children}</span>
      </ButtonPrimitive>
      <div aria-hidden className="glass-button-shadow rounded-full" />
    </div>
  );
}

export { GlassButton, glassButtonVariants };
