import { useTranslation } from 'react-i18next';
import { ConfirmDialog } from '~/components/shared/ConfirmDialog';
import { useArchiveProduct } from '~/hooks/useArchiveProduct';
import { useProductsModals } from '~/routes/(crm)/products/store';

/** Подтверждение «В архив» — общее для списка (свайп) и страницы товара. Вернуть из архива можно без вопросов. */
export function ArchiveProductDialog() {
  const { t } = useTranslation('products');
  const modal = useProductsModals((s) => s.archive);
  const { archive } = useArchiveProduct();

  return (
    <ConfirmDialog
      open={modal.isOpen}
      onOpenChange={(open) => !open && modal.close()}
      type="warning"
      title={t('archive.confirmTitle')}
      description={t('archive.confirmText')}
      confirmText={t('archive.button')}
      isLoading={archive.isPending}
      onConfirm={() => {
        if (!modal.data) return;
        archive.mutate(modal.data, { onSuccess: () => modal.close() });
      }}
    />
  );
}
