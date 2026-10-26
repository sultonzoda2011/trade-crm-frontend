import { useTranslation } from 'react-i18next';
import {
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  Combobox as ComboboxPrimitive,
} from '~/components/ui/combobox';
import { Label } from '~/components/ui/label';
import { useOptionLabelCache } from '~/hooks/useOptionLabelCache';
import { cn } from '~/lib/utils';

export interface CustomSelectOption {
  value: string | number | boolean;
  label: string;
  /** Пункт виден, но выбрать его нельзя (например, несовместим с другим фильтром). */
  disabled?: boolean;
}

export interface CustomSelectProps {
  options: CustomSelectOption[];
  placeholder?: string;
  emptyText?: string;
  label?: string;
  required?: boolean;
  className?: string;
  disabled?: boolean;
  isClearable?: boolean;
  /**
   * Enables server-side (API) search. When provided, the base-ui local filter is disabled
   * (the list shows exactly what `options` contains) and every keystroke is forwarded here —
   * debounce + fetch on the caller side, then feed the results back through `options`.
   * Typically wired via the `useAsyncSelectOptions` hook.
   */
  onSearch?: (query: string) => void;
  /** Show a "loading…" state in the empty slot while an async search request is in flight. */
  loading?: boolean;
  value?: string | number | null;
  onChange?: (value: CustomSelectOption['value'] | null) => void;
}

export function CustomSelect(props: CustomSelectProps) {
  const { t } = useTranslation('common');
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
  } = props;

  const effectivePlaceholder = placeholder ?? t('customSelect.placeholder');
  const effectiveEmptyText = emptyText ?? t('customSelect.emptyText');
  const isAsync = typeof onSearch === 'function';

  const selectedItem = useOptionLabelCache(options, value);

  return (
    <div className={cn(label && 'space-y-1.5', className)}>
      {label && (
        <Label>
          {label}
          {required && <span className="text-muted-foreground ml-0.5">*</span>}
        </Label>
      )}
      <ComboboxPrimitive
        autoHighlight
        items={options}
        value={selectedItem}
        onValueChange={(item: CustomSelectOption | null) => onChange?.(item?.value ?? null)}
        disabled={disabled}
        // Async mode: let the server do the filtering — disable base-ui's local filter so
        // it doesn't hide server results whose label doesn't literally contain the query.
        filter={isAsync ? null : undefined}
        onInputValueChange={isAsync ? (inputValue: string) => onSearch?.(inputValue) : undefined}
        // Reset the query when the popup closes so re-opening any field starts from the
        // default first page instead of the last term typed in another field.
        onOpenChange={
          isAsync
            ? (open: boolean) => {
                if (!open) onSearch?.('');
              }
            : undefined
        }
        itemToStringLabel={(item: CustomSelectOption) => item?.label ?? ''}>
        <ComboboxInput
          placeholder={effectivePlaceholder}
          showClear={isClearable && value !== null && value !== undefined && value !== ''}
          className="w-full"
        />
        <ComboboxContent>
          <ComboboxEmpty>{loading ? t('customSelect.loading') : effectiveEmptyText}</ComboboxEmpty>
          <ComboboxList>
            {options.map((opt) => (
              <ComboboxItem key={String(opt.value)} value={opt} disabled={opt.disabled}>
                {opt.label}
              </ComboboxItem>
            ))}
          </ComboboxList>
        </ComboboxContent>
      </ComboboxPrimitive>
    </div>
  );
}
