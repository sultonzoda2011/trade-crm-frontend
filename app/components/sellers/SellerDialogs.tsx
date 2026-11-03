import { PayoutSellerModal } from '~/components/modals/PayoutSellerModal';
import { DeactivateSellerDialog } from '~/components/sellers/DeactivateSellerDialog';
import { ResetPasswordModal } from '~/components/sellers/ResetPasswordModal';
import { ReverseCreditModal } from '~/components/sellers/ReverseCreditModal';

/** Все шторки и диалоги продавцов одним местом: список и карточка открывают одни и те же. */
export function SellerDialogs() {
  return (
    <>
      <PayoutSellerModal />
      <ReverseCreditModal />
      <ResetPasswordModal />
      <DeactivateSellerDialog />
    </>
  );
}
