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
    color: 'text-destructive bg-destructive/10',
    buttonVariant: 'destructive' as const,
  },
  warning: {
    icon: AlertTriangle,
    color: 'text-warning bg-warning/10',
    buttonVariant: 'default' as const,
  },
  success: {
    icon: CheckCircle2,
    color: 'text-success bg-success/10',
    buttonVariant: 'default' as const,
  },
  info: {
    icon: Info,
    color: 'text-primary bg-primary/10',
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
  const config = typeConfigs[type];
  const Icon = config.icon;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-6 p-6 sm:max-w-100">
        <div className="flex flex-col items-center gap-4 text-center">
          {/* Иконка с красивым фоном */}
          <div className={cn('flex h-14 w-14 items-center justify-center rounded-full', config.color)}>
            <Icon className="h-7 w-7" />
          </div>

          <DialogHeader className="gap-2">
            <DialogTitle className="text-xl leading-tight font-semibold">{title || t('actions.confirm')}</DialogTitle>
            <DialogDescription className="text-muted-foreground text-sm leading-relaxed">
              {description || t('actions.areYouSure')}
            </DialogDescription>
          </DialogHeader>
        </div>

        <DialogFooter className="mt-2 flex flex-row justify-center gap-3 sm:justify-center">
          <Button
            type="button"
            variant="ghost"
            className="hover:bg-muted h-10 flex-1"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}>
            {cancelText || t('actions.cancel')}
          </Button>
          <Button
            type="button"
            variant={config.buttonVariant}
            className="h-10 flex-1"
            onClick={onConfirm}
            disabled={isLoading}>
            {isLoading ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                {confirmText || t('actions.confirm')}...
              </span>
            ) : (
              confirmText || t('actions.confirm')
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
