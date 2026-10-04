import { UserPlus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { InitialAvatar } from '~/components/shared/InitialAvatar';
import { PickerSheet } from '~/components/shared/PickerSheet';
import { fmtNum } from '~/lib/format';
import type { Debtor } from '~/types/debtors';

interface DebtorPickerSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: Debtor[];
  loading: boolean;
  onSearch: (query: string) => void;
  onSelect: (debtor: Debtor) => void;
  onCreateNew?: () => void;
}

/** Выбор должника: имя, телефон и текущий долг — чтобы не перепутать тёзок. */
export function DebtorPickerSheet({
  open,
  onOpenChange,
  items,
  loading,
  onSearch,
  onSelect,
  onCreateNew,
}: DebtorPickerSheetProps) {
  const { t } = useTranslation('transactions');

  return (
    <PickerSheet
      title={t('fields.debtor')}
      open={open}
      onOpenChange={onOpenChange}
      items={items}
      loading={loading}
      onSearch={onSearch}
      getKey={(d) => d.id}
      onSelect={onSelect}
      header={
        onCreateNew && (
          <button
            type="button"
            onClick={onCreateNew}
            className="text-primary active:bg-muted/70 flex min-h-13 w-full items-center gap-3 px-4 text-left text-base font-medium transition-colors">
            <UserPlus className="size-6" strokeWidth={1.75} />
            {t('fields.newDebtor')}
          </button>
        )
      }
      renderItem={(debtor) => (
        <>
          <InitialAvatar name={debtor.name} />
          <span className="min-w-0 flex-1">
            <span className="block break-words text-base leading-snug font-semibold">{debtor.name}</span>
            <span className="text-muted-foreground block break-words text-sm leading-snug">{debtor.phone}</span>
          </span>
          {debtor.totalDebtAmount > 0 && (
            <span className="text-warning shrink-0 font-mono text-base font-semibold">
              {fmtNum(debtor.totalDebtAmount)}
            </span>
          )}
        </>
      )}
    />
  );
}
