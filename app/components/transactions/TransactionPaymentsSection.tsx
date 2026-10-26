import type { TFunction } from 'i18next';
import { EntityAvatar } from '~/components/shared/EntityAvatar';
import { ListEmpty, ListGroup } from '~/components/shared/ListGroup';
import { Avatar, AvatarFallback, AvatarImage } from '~/components/ui/avatar';
import { fmtNum, fmtTJS, formatDate } from '~/lib/format';
import type { Payment } from '~/types/transactions';

interface TransactionPaymentsSectionProps {
  payments: Payment[];
  t: TFunction;
}

/**
 * Список платежей по транзакции: мобильные строки и десктопная таблица.
 */
export function TransactionPaymentsSection({ payments, t }: TransactionPaymentsSectionProps) {
  const hasPayments = payments.length > 0;

  return (
    <ListGroup title={t('fields.payments')}>
      {hasPayments ? (
        <>
          {payments.map((p) => (
            <div key={p.id} className="flex min-h-14 items-center gap-3 px-4 py-2.5 md:hidden">
              <EntityAvatar name={p.createdBy?.name ?? '?'} image={p.createdBy?.image} size="md" />
              <div className="min-w-0 flex-1">
                <p className="text-base leading-snug font-medium break-words">{p.createdBy?.name || '-'}</p>
                <p className="text-muted-foreground text-sm leading-snug break-words">
                  {formatDate(p.createdAt, true)}
                  {p.note && ` · ${p.note}`}
                </p>
              </div>
              <span className="text-success shrink-0 font-mono text-base font-semibold">+{fmtNum(p.amount)}</span>
            </div>
          ))}
          <div className="scrollbar-thin hidden max-h-72 overflow-x-auto overflow-y-auto md:block">
            <table className="w-full text-left text-sm">
              <thead className="text-muted-foreground bg-card sticky top-0 z-10 border-b text-xs">
                <tr>
                  <th className="px-4 py-2.5 font-medium">{t('fields.amount')}</th>
                  <th className="px-3 py-2.5 font-medium">{t('fields.note')}</th>
                  <th className="px-3 py-2.5 font-medium">{t('fields.createdBy')}</th>
                  <th className="px-4 py-2.5 text-right font-medium">{t('fields.createdAt')}</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {payments.map((p) => (
                  <tr key={p.id}>
                    <td className="text-success px-4 py-2.5 font-mono font-semibold">+{fmtTJS(p.amount)}</td>
                    <td className="text-muted-foreground px-3 py-2.5">{p.note || '-'}</td>
                    <td className="px-3 py-2.5">
                      <span className="flex items-center gap-2">
                        <Avatar size="sm" className="shrink-0">
                          {p.createdBy?.image ? (
                            <AvatarImage src={p.createdBy.image} alt={p.createdBy.name} />
                          ) : null}
                          <AvatarFallback>{(p.createdBy?.name ?? '?').charAt(0).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <span className="break-words">{p.createdBy?.name || '-'}</span>
                      </span>
                    </td>
                    <td className="text-muted-foreground px-4 py-2.5 text-right text-xs">
                      {formatDate(p.createdAt, true)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <ListEmpty>{t('table.noData', { ns: 'common' })}</ListEmpty>
      )}
    </ListGroup>
  );
}
