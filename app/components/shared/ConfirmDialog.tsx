import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '~/components/ui/dialog';
import { Button } from '~/components/ui/button';
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '~/components/ui/sheet';
import { useIsMobile } from '~/hooks/use-mobile';
import { AlertTriangle, CheckCircle2, Info, Trash2 } from 'lucide-react';
import { cn } from '~/lib/utils';

export type ConfirmType = 'danger' | 'warning' | 'success' | 'info';

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  type?: ConfirmType;
  title?: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  isLoading?: boolean;
}

const typeConfigs = {
  danger: {
    icon: Trash2,
    color: 'text-destructive bg-destructive/12',
    buttonVariant: 'destructive' as const,
  },
  warning: {
    icon: AlertTriangle,
    color: 'text-warning bg-warning/12',
    buttonVariant: 'default' as const,
  },
  success: {
    icon: CheckCircle2,
    color: 'text-success bg-success/12',
    buttonVariant: 'default' as const,
  },
  info: {
    icon: Info,
    color: 'text-primary bg-primary/12',
    buttonVariant: 'default' as const,
  },
};

export function ConfirmDialog({
  open,
  onOpenChange,
  onConfirm,
  type = 'danger',
  title,
  description,
  confirmText,
  cancelText,
  isLoading,
}: ConfirmDialogProps) {
  const { t } = useTranslation('common');
  const isMobile = useIsMobile();
  const config = typeConfigs[type];
  const Icon = config.icon;

  const resolvedTitle = title || t('actions.confirm');
  const resolvedDescription = description || t('actions.areYouSure');
  // The title says "Confirmation"; the button needs a verb — and for a destructive dialog the verb is the action itself.
  const confirmLabel = confirmText || (type === 'danger' ? t('actions.delete') : t('actions.confirmAction'));
  const cancelLabel = cancelText || t('actions.cancel');

  const icon = (
    <div className={cn('flex size-12 items-center justify-center rounded-full', config.color)}>
      <Icon className="size-6" />
    </div>
  );

  // На телефоне подтверждение — нижний «action sheet» как в нативных приложениях:
  // кнопки на всю ширину под большим пальцем, главное действие сверху, отмена снизу,
  // закрывается свайпом вниз. На десктопе — привычный центрированный диалог.
  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="bottom" showCloseButton={false} className="bg-background gap-0 p-0">
          <SheetHeader className="items-center gap-3 px-5 pt-1 pb-2 text-center">
            {icon}
            <SheetTitle className="text-xl leading-tight font-semibold">{resolvedTitle}</SheetTitle>
            <SheetDescription className="leading-relaxed">{resolvedDescription}</SheetDescription>
          </SheetHeader>
          <SheetFooter className="gap-2 px-4 pt-3 pb-4">
            <Button
              type="button"
              size="lg"
              variant={config.buttonVariant}
              className="w-full"
              onClick={onConfirm}
              loading={isLoading}>
              {confirmLabel}
            </Button>
            <Button
              type="button"
              size="lg"
              variant="outline"
              className="w-full"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}>
              {cancelLabel}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-5 p-5 sm:max-w-100">
        <div className="flex flex-col items-center gap-4 text-center">
          {icon}

          <DialogHeader className="gap-2">
            <DialogTitle className="text-xl leading-tight font-semibold">{resolvedTitle}</DialogTitle>
            <DialogDescription className="text-muted-foreground text-sm leading-relaxed">
              {resolvedDescription}
            </DialogDescription>
          </DialogHeader>
        </div>

        <DialogFooter className="mt-2 flex flex-col-reverse gap-2 sm:flex-row sm:justify-center sm:gap-3">
          <Button
            type="button"
            variant="outline"
            className="sm:flex-1"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}>
            {cancelLabel}
          </Button>
          <Button
            type="button"
            variant={config.buttonVariant}
            className="sm:flex-1"
            onClick={onConfirm}
            loading={isLoading}>
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
