import type { ReactNode } from 'react';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '~/components/ui/dialog';
import { Sheet, SheetContent, SheetFooter, SheetHeader, SheetTitle } from '~/components/ui/sheet';
import { useIsMobile } from '~/hooks/use-mobile';
import { cn } from '~/lib/utils';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
}

/**
 * Базовый компонент для модальных окон. Используется всеми 14 модалками в
 * app/components/modals — правка тут применяется сразу везде.
 *
 * - `modal={false}` — фикс для ComboBox/Select внутри модалки:
 *   Radix Dialog с modal=true ставит inert на всё вне диалога,
 *   что блокирует портал ComboboxContent от получения событий.
 * - Контент скроллируется внутри, header и footer фиксированы.
 * - Overlay остаётся визуально (bg + blur), только focus trap отключён.
 * - На мобильном (<768px) рендерится как bottom-sheet вместо центрированного
 *   диалога: легче открыть/закрыть одной рукой, привычный паттерн для
 *   Capacitor-обёртки, плюс не обрезается по бокам на узких экранах.
 */
export function Modal({ open, onClose, title, children, footer, className }: ModalProps) {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={(o) => !o && onClose()} modal={false}>
        <SheetContent side="bottom" className={cn('max-h-[88vh] rounded-t-xl', className)}>
          <SheetHeader className="pb-0">
            <SheetTitle>{title}</SheetTitle>
          </SheetHeader>

          <div className="scrollbar-thin flex-1 overflow-x-hidden overflow-y-auto px-4">{children}</div>

          {footer && <SheetFooter className="pt-0">{footer}</SheetFooter>}
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()} modal={false}>
      <DialogContent className={cn('flex max-h-[85vh] flex-col sm:max-w-lg', className)}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <div className={cn('scrollbar-thin flex-1 overflow-x-hidden overflow-y-auto py-3')}>{children}</div>

        {footer && <DialogFooter>{footer}</DialogFooter>}
      </DialogContent>
    </Dialog>
  );
}
