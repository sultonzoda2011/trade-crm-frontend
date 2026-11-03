import { useMutation } from '@tanstack/react-query';
import { Check, Copy } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { sellersApi } from '~/api/sellers';
import { Modal } from '~/components/shared/Modal';
import { ModalFooterActions } from '~/components/shared/ModalFooterActions';
import { Button } from '~/components/ui/button';
import { useInvalidateSeller } from '~/hooks/useSellerActions';
import { useSellersModals } from '~/routes/(crm)/sellers/store';

/**
 * Сброс пароля продавца в два шага: подтверждение → новый пароль на экране. Сервер отдаёт пароль
 * один раз и больше не хранит его открытым, поэтому закрыть шторку без копирования нельзя
 * не заметив: пароль крупно, рядом кнопка «Скопировать», внизу предупреждение.
 */
export function ResetPasswordModal() {
  const { t } = useTranslation(['sellers', 'common']);
  const modal = useSellersModals((s) => s.reset);
  const invalidate = useInvalidateSeller();
  const seller = modal.data;
  const [password, setPassword] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Пароль живёт только пока шторка открыта: при закрытии стираем из памяти.
  useEffect(() => {
    if (!modal.isOpen) {
      setPassword(null);
      setCopied(false);
    }
  }, [modal.isOpen]);

  const { mutate, isPending } = useMutation({
    networkMode: 'always',
    mutationFn: (id: string) => sellersApi.resetPassword(id),
    onSuccess: (response, id) => {
      setPassword(response.data.password);
      invalidate(id);
    },
  });

  const copy = async () => {
    if (!password) return;
    try {
      await navigator.clipboard.writeText(password);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error(t('resetPassword.copyFailed'));
    }
  };

  return (
    <Modal
      open={modal.isOpen}
      onClose={modal.close}
      title={t('resetPassword.title')}
      footer={
        password ? (
          <Button size="lg" className="w-full" onClick={modal.close}>
            {t('resetPassword.done')}
          </Button>
        ) : (
          <ModalFooterActions
            formId="reset-seller-password-form"
            onCancel={modal.close}
            submitLabel={t('resetPassword.confirm')}
            isLoading={isPending}
          />
        )
      }>
      {password ? (
        <div className="space-y-3">
          <p className="text-muted-foreground text-sm">{t('resetPassword.newFor', { name: seller?.name ?? '' })}</p>
          <div className="bg-muted/60 flex items-center justify-between gap-3 rounded-2xl px-4 py-3">
            <span className="font-mono text-2xl font-semibold tracking-wider break-all select-all">{password}</span>
            <Button variant="secondary" size="icon" aria-label={t('resetPassword.copy')} onClick={copy}>
              {copied ? <Check /> : <Copy />}
            </Button>
          </div>
          <p className="text-warning text-xs leading-relaxed">{t('resetPassword.once')}</p>
        </div>
      ) : (
        <form
          id="reset-seller-password-form"
          className="space-y-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (seller) mutate(seller.id);
          }}>
          <p className="text-sm leading-relaxed">{t('resetPassword.text', { name: seller?.name ?? '' })}</p>
          <p className="text-muted-foreground text-xs leading-relaxed">{t('resetPassword.hint')}</p>
        </form>
      )}
    </Modal>
  );
}
