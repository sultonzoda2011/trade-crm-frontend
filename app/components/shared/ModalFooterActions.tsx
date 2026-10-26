import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '~/components/ui/button';

interface ModalFooterActionsProps {
  formId: string;
  onCancel: () => void;
  submitLabel: ReactNode;
  isLoading?: boolean;
  disabled?: boolean;
  submitVariant?: 'default' | 'destructive';
}

/**
 * Стандартный подвал модального окна: кнопка «Отмена» и кнопка отправки формы.
 */
export function ModalFooterActions({
  formId,
  onCancel,
  submitLabel,
  isLoading,
  disabled,
  submitVariant = 'default',
}: ModalFooterActionsProps) {
  const { t } = useTranslation('common');

  return (
    <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
      <Button variant="outline" onClick={onCancel}>
        {t('actions.cancel')}
      </Button>
      <Button type="submit" form={formId} variant={submitVariant} loading={isLoading} disabled={disabled}>
        {submitLabel}
      </Button>
    </div>
  );
}
