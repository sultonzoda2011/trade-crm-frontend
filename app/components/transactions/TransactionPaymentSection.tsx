import dayjs from 'dayjs';
import type { TFunction } from 'i18next';
import { Banknote, CreditCard, HandCoins, UserPlus } from 'lucide-react';
import type { Control } from 'react-hook-form';
import { InitialAvatar } from '~/components/shared/InitialAvatar';
import { ListGroup, ListRow } from '~/components/shared/ListGroup';
import { SegmentedControl } from '~/components/shared/SegmentedControl';
import { FormDateInput } from '~/components/ui/form/FormDateInput';
import { FormInput } from '~/components/ui/form/FormInput';
import { FormTextarea } from '~/components/ui/form/FormTextarea';
import type { Debtor } from '~/types/debtors';
import type { CreateTransactionInput } from '~/validations/transactions';

const QUICK_DUE_DAYS = [7, 14, 30] as const;

interface TransactionPaymentSectionProps {
  canCreateSale: boolean;
  paymentMethod: 'CASH' | 'CARD' | 'DEBT';
  type: CreateTransactionInput['type'];
  selectedDebtor?: Debtor;
  debtorError?: string;
  control: Control<CreateTransactionInput>;
  t: TFunction;
  onPaymentMethodChange: (next: 'CASH' | 'CARD' | 'DEBT') => void;
  onOpenDebtorPicker: () => void;
  onSetDueDate: (date: string) => void;
}

/**
 * Выбор способа оплаты и получателя (должник + срок возврата при «В долг», либо имя покупателя при продаже).
 */
export function TransactionPaymentSection({
  canCreateSale,
  paymentMethod,
  type,
  selectedDebtor,
  debtorError,
  control,
  t,
  onPaymentMethodChange,
  onOpenDebtorPicker,
  onSetDueDate,
}: TransactionPaymentSectionProps) {
  return (
    <div className="order-first space-y-5 lg:order-last">
      {canCreateSale ? (
        <SegmentedControl
          value={paymentMethod}
          onChange={onPaymentMethodChange}
          options={[
            { value: 'CASH', label: t('paymentType.CASH'), icon: Banknote },
            { value: 'CARD', label: t('paymentType.CARD'), icon: CreditCard },
            { value: 'DEBT', label: t('type.DEBT'), icon: HandCoins },
          ]}
        />
      ) : (
        <div className="bg-card flex items-center gap-2 rounded-2xl px-4 py-3 text-base font-medium">
          <HandCoins className="text-warning size-5" />
          {t('type.DEBT')}
        </div>
      )}

      {type === 'DEBT' && (
        <>
          <ListGroup
            title={t('fields.debtor')}
            footer={debtorError ? <span className="text-destructive">{debtorError}</span> : undefined}>
            <ListRow
              leading={
                selectedDebtor ? (
                  <InitialAvatar name={selectedDebtor.name} className="size-10" />
                ) : (
                  <span className="bg-primary/12 text-primary flex size-10 items-center justify-center rounded-full">
                    <UserPlus className="size-5" />
                  </span>
                )
              }
              title={
                selectedDebtor ? (
                  <span className="font-semibold">{selectedDebtor.name}</span>
                ) : (
                  <span className="text-primary font-medium">{t('fields.pickDebtor')}</span>
                )
              }
              subtitle={selectedDebtor?.phone}
              chevron
              onClick={onOpenDebtorPicker}
            />
          </ListGroup>

          <div className="bg-card space-y-3 rounded-2xl p-4">
            <FormDateInput
              control={control}
              name="dueDate"
              placeholder={t('fields.dueDate')}
              minDate={new Date()}
              label={t('fields.dueDate')}
              required
            />
            <div className="flex flex-wrap gap-2 px-1">
              {QUICK_DUE_DAYS.map((days) => (
                <button
                  key={days}
                  type="button"
                  onClick={() => onSetDueDate(dayjs().add(days, 'day').format('YYYY-MM-DD'))}
                  className="bg-primary/12 text-primary h-9 rounded-[10px] px-3.5 text-sm font-semibold active:opacity-60">
                  +{days} {t('daysUnit', { ns: 'common' })}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-card rounded-2xl p-4">
            <FormInput
              control={control}
              name="paidAmount"
              type="number"
              inputMode="decimal"
              label={t('fields.advance')}
              placeholder="0"
            />
            <p className="text-muted-foreground mt-1.5 px-1 text-xs">{t('advanceHint')}</p>
          </div>
        </>
      )}

      {type === 'SALE' && (
        <div className="bg-card rounded-2xl p-4">
          <FormInput
            control={control}
            name="customerName"
            label={t('fields.customer')}
            placeholder={t('fields.customer')}
          />
        </div>
      )}

      <div className="bg-card rounded-2xl p-4">
        <FormTextarea
          control={control}
          name="note"
          rows={2}
          maxLength={500}
          label={t('fields.note')}
          placeholder={t('fields.notePlaceholder')}
        />
      </div>
    </div>
  );
}
