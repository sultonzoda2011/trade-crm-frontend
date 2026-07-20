import type { ReactNode } from 'react';
import { cn } from '~/lib/utils';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '~/components/ui/dialog';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
}

/**
 * Базовый компонент для модальных окон.
 *
 * - `modal={false}` — фикс для ComboBox/Select внутри модалки:
 *   Radix Dialog с modal=true ставит inert на всё вне диалога,
 *   что блокирует портал ComboboxContent от получения событий.
 * - Контент скроллируется внутри, header и footer фиксированы.
 * - Overlay остаётся визуально (bg + blur), только focus trap отключён.
 */
export function Modal({ open, onClose, title, children, footer, className }: ModalProps) {
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className={cn('flex max-h-[85vh] flex-col sm:max-w-lg', className)}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <div className={cn('flex-1 overflow-y-visible py-3')}>{children}</div>

        {footer && <DialogFooter>{footer}</DialogFooter>}
      </DialogContent>
    </Dialog>
  );
}
