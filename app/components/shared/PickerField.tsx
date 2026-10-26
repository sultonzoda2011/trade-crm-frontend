import { Check, ChevronsUpDown, X } from 'lucide-react';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import type { CustomSelectOption, CustomSelectProps } from '~/components/shared/CustomSelect';
import { PickerSheet } from '~/components/shared/PickerSheet';
import { Label } from '~/components/ui/label';
import { useNetworkStatus } from '~/hooks/useNetworkStatus';
import { useOptionLabelCache } from '~/hooks/useOptionLabelCache';
import { cn } from '~/lib/utils';

export interface PickerFieldProps extends CustomSelectProps {
  /** Подсказка под списком (например, что данные взяты с устройства). */
  note?: React.ReactNode;
  /** Заголовок шторки, если он должен отличаться от подписи поля. */
  title?: string;
}

/** Короткий список целиком помещается на экране — поиск в нём только мешает. */
const SEARCH_FROM = 8;

/**
 * Выбор из списка шторкой снизу — как выбор товара в продаже. Заменяет выпадающий список:
 * крупные строки под палец, не закрывается клавиатурой, поиск не прячется за полем.
 *
 * Те же свойства, что у CustomSelect, поэтому подставляется вместо него без переделки экранов.
 * Для списков с серверным поиском (`onSearch`) каждое нажатие уходит наружу — обычно в
 * `useAsyncSelectOptions`, который без сети и на слабой связи ищет по данным на устройстве;
 * для коротких фиксированных списков фильтрация идёт здесь же.
 */
export function PickerField(props: PickerFieldProps) {
  const { t } = useTranslation('common');
  const { t: tSync } = useTranslation('sync');
  const isOnline = useNetworkStatus();
  const {
    options,
    placeholder,
    emptyText,
    label,
    required,
    className,
    disabled,
    value,
    onChange,
    isClearable = !required,
    onSearch,
    loading,
    note,
    title,
  } = props;

  const [open, setOpen] = React.useState(false);
  const [localQuery, setLocalQuery] = React.useState('');
  const isAsync = typeof onSearch === 'function';

  const hasValue = value !== null && value !== undefined && value !== '';
  const selected = useOptionLabelCache(options, value);
  const searchable = isAsync || options.length >= SEARCH_FROM;

  const visible = React.useMemo(() => {
    if (isAsync) return options; // сервер/устройство уже отфильтровали
    const needle = localQuery.trim().toLowerCase();
    return needle ? options.filter((o) => o.label.toLowerCase().includes(needle)) : options;
  }, [isAsync, options, localQuery]);

  const handleSearch = React.useCallback(
    (query: string) => {
      setLocalQuery(query);
      onSearch?.(query);
    },
    [onSearch]
  );

  const pick = (opt: CustomSelectOption | null) => {
    onChange?.(opt?.value ?? null);
    setOpen(false);
  };

  const clearable = isClearable && hasValue && !disabled;

  return (
    <div className={cn(label && 'space-y-1.5', className)}>
      {label && (
        <Label>
          {label}
          {required && <span className="text-muted-foreground ml-0.5">*</span>}
        </Label>
      )}

      <div className="bg-input relative flex h-12 w-full min-w-0 items-center rounded-[10px] transition-colors has-disabled:opacity-50 md:h-10">
        <button
          type="button"
          disabled={disabled}
          onClick={() => setOpen(true)}
          aria-haspopup="dialog"
          aria-expanded={open}
          className={cn(
            'flex h-full min-w-0 flex-1 items-center gap-2 rounded-[10px] px-3 text-left text-base outline-none md:text-sm',
            'focus-visible:ring-ring/40 focus-visible:ring-2 active:opacity-70',
            clearable ? 'pr-1' : 'pr-2'
          )}>
          <span className={cn('min-w-0 flex-1 truncate', !selected && 'text-muted-foreground')}>
            {selected?.label ?? placeholder ?? t('customSelect.placeholder')}
          </span>
          {!clearable && <ChevronsUpDown className="text-muted-foreground size-4 shrink-0" aria-hidden />}
        </button>
        {clearable && (
          <button
            type="button"
            aria-label={t('filters.reset')}
            onClick={() => onChange?.(null)}
            className="text-muted-foreground active:bg-muted/70 mr-1 flex size-9 shrink-0 items-center justify-center rounded-full md:size-8">
            <X className="size-4" />
          </button>
        )}
      </div>

      <PickerSheet
        title={title ?? label ?? placeholder ?? t('customSelect.placeholder')}
        open={open}
        onOpenChange={setOpen}
        items={visible}
        getKey={(o) => String(o.value)}
        loading={!!loading}
        onSearch={handleSearch}
        searchable={searchable}
        emptyText={!isOnline && visible.length === 0 ? tSync('offlineHint.text') : emptyText}
        note={note ?? (!isOnline && visible.length > 0 ? tSync('pickers.savedData') : undefined)}
        onSelect={pick}
        header={
          isClearable && hasValue ? (
            <button
              type="button"
              onClick={() => pick(null)}
              className="text-muted-foreground active:bg-muted/70 flex min-h-12 w-full items-center px-4 text-left text-base transition-colors">
              {placeholder ?? t('customSelect.placeholder')}
            </button>
          ) : undefined
        }
        renderItem={(opt) => {
          const isSelected = hasValue && String(opt.value) === String(value);
          return (
            <>
              <span className={cn('min-w-0 flex-1 text-base leading-snug', isSelected && 'font-semibold')}>
                {opt.label}
              </span>
              {isSelected && <Check className="text-primary size-5 shrink-0" aria-hidden />}
            </>
          );
        }}
      />
    </div>
  );
}
