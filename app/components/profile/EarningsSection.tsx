import { useTranslation } from 'react-i18next';
import { ListEmpty, ListGroup, ListRow } from '~/components/shared/ListGroup';
import { fmtTJS, formatDate } from '~/lib/format';
import { cn } from '~/lib/utils';
import type { ProfileEarnings } from '~/types/profile';

/**
 * «Мой заработок» — только у продавца. Главная цифра — баланс (сколько ему
 * должны выплатить), ниже — за месяц и из чего он сложился. Данные те же, что
 * на странице продавца у владельца (`SellersService.getBalance`), поэтому
 * цифры у обоих всегда сходятся.
 */
export function EarningsSection({ earnings }: { earnings: ProfileEarnings }) {
  const { t } = useTranslation('profile');
  const { balance, month, credits } = earnings;

  return (
    <>
      <section className="bg-card relative overflow-hidden rounded-2xl p-4">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(90% 120% at 100% 0%, color-mix(in srgb, var(--primary) 12%, transparent), transparent 62%)',
          }}
        />
        <p className="text-muted-foreground relative text-xs font-medium tracking-wide uppercase">
          {t('earnings.balance')}
        </p>
        <p
          data-testid="earnings-balance"
          className={cn(
            'relative mt-1 font-mono text-4xl leading-none font-bold tracking-tight tabular-nums',
            balance.balance > 0 && 'text-success',
            balance.balance < 0 && 'text-warning'
          )}>
          {fmtTJS(balance.balance)}
        </p>
        <p className="text-muted-foreground relative mt-2 text-sm">{t('earnings.balanceHint')}</p>
      </section>

      <ListGroup title={t('earnings.title')}>
        <ListRow
          title={t('earnings.thisMonth')}
          subtitle={t('earnings.salesCount', { count: month.salesCount })}
          value={<span className="text-foreground font-mono font-semibold">{fmtTJS(month.earned)}</span>}
        />
        <ListRow title={t('earnings.earned')} value={fmtTJS(balance.earned)} />
        {balance.refunded > 0 && <ListRow title={t('earnings.refunded')} value={`−${fmtTJS(balance.refunded)}`} />}
        <ListRow title={t('earnings.paidOut')} value={fmtTJS(balance.paidOut)} />
      </ListGroup>

      <ListGroup title={t('earnings.payouts')}>
        {credits.length === 0 ? (
          <ListEmpty>{t('earnings.noPayouts')}</ListEmpty>
        ) : (
          credits.map((credit) => {
            // Отмена выплаты — встречная запись с минусом; саму отменённую выплату зачёркиваем.
            const isReversal = !!credit.reversalOfId;
            const cancelled = !!credit.isReversed;
            return (
              <ListRow
                key={credit.id}
                title={
                  <span className={cn(cancelled && 'text-muted-foreground line-through')}>
                    {isReversal ? t('earnings.payoutReversal') : credit.note || t('earnings.payout')}
                    {cancelled && (
                      <span className="text-muted-foreground ml-2 text-xs no-underline">
                        {t('earnings.payoutCancelled')}
                      </span>
                    )}
                  </span>
                }
                subtitle={formatDate(credit.createdAt, true)}
                value={
                  <span
                    className={cn(
                      'font-mono font-semibold',
                      cancelled ? 'text-muted-foreground line-through' : 'text-foreground'
                    )}>
                    {isReversal ? `+${fmtTJS(Math.abs(credit.amount))}` : fmtTJS(credit.amount)}
                  </span>
                }
              />
            );
          })
        )}
      </ListGroup>
    </>
  );
}
