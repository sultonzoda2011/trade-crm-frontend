import { useMutation, useQueryClient } from '@tanstack/react-query';
import { MessageSquareText, Phone } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { debtorsApi } from '~/api/debtors';
import { Button } from '~/components/ui/button';
import { Action } from '~/config/actions';
import { useCan } from '~/hooks/useCan';
import { useNetworkStatus } from '~/hooks/useNetworkStatus';
import { fmtTJS, formatDate } from '~/lib/format';
import { toDialNumber } from '~/lib/phone';
import { queryKeys } from '~/lib/query-keys';
import type { Debtor } from '~/types/debtors';

/**
 * Позвонить / SMS с готовым текстом напоминания. Каждое нажатие ставит на сервере
 * отметку «напомнили» — по ней человек уходит из блока «позвонить сегодня» на пару дней.
 * Отметка — вспомогательная: без сети её просто не ставим, сам звонок или сообщение от этого не зависят.
 */
export function DebtorContactActions({ debtor }: { debtor: Debtor }) {
  const { t } = useTranslation(['debtors', 'common']);
  const queryClient = useQueryClient();
  const { can } = useCan();
  const isOnline = useNetworkStatus();
  const hasDebt = debtor.totalDebtAmount > 0;

  const { mutate: remind } = useMutation({
    mutationFn: () => debtorsApi.remind(debtor.id),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: queryKeys.entity('debtors') }),
  });
  const markReminded = () => {
    if (isOnline && hasDebt && can(Action.DEBTORS_EDIT)) remind();
  };

  const dial = toDialNumber(debtor.phone);
  const message = encodeURIComponent(
    t('contact.message', { name: debtor.name, amount: fmtTJS(debtor.totalDebtAmount) })
  );

  return (
    <div className="space-y-1.5">
      <div className={hasDebt ? 'grid grid-cols-2 gap-2' : 'grid grid-cols-1'}>
        <Button size="lg" variant="secondary" render={<a href={`tel:${dial}`} />} onClick={markReminded}>
          <Phone data-icon="inline-start" />
          {t('contact.call')}
        </Button>
        {hasDebt && (
          <>
            <Button
              size="lg"
              variant="secondary"
              render={<a href={`sms:${dial}?body=${message}`} />}
              onClick={markReminded}>
              <MessageSquareText data-icon="inline-start" />
              {t('contact.sms')}
            </Button>
          </>
        )}
      </div>
      {hasDebt && (
        <p className="text-muted-foreground px-1 text-sm">
          {debtor.lastRemindedAt
            ? t('contact.lastReminded', { date: formatDate(debtor.lastRemindedAt, true) })
            : t('contact.neverReminded')}
        </p>
      )}
    </div>
  );
}
