import { useTranslation } from 'react-i18next';
import { ConfirmDialog } from '~/components/shared/ConfirmDialog';
import { useSellerAccess } from '~/hooks/useSellerActions';
import { useSellersModals } from '~/routes/(crm)/sellers/store';

export function DeactivateSellerDialog() {
  const { t } = useTranslation('sellers');
  const modal = useSellersModals((s) => s.deactivate);
  const { deactivate } = useSellerAccess(modal.close);
  const seller = modal.data;

  return (
    <ConfirmDialog
      open={modal.isOpen}
      onOpenChange={(open) => !open && modal.close()}
      type="warning"
      title={t('access.deactivateTitle', { name: seller?.name ?? '' })}
      description={t('access.deactivateText')}
      confirmText={t('access.deactivate')}
      isLoading={deactivate.isPending}
      onConfirm={() => seller && deactivate.mutate(seller.id)}
    />
  );
}
