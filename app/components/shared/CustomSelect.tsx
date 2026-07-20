import * as React from 'react';
import { useTranslation } from 'react-i18next';
import {
  ComboboxChip,
  ComboboxChips,
  ComboboxChipsInput,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  Combobox as ComboboxPrimitive,
  ComboboxValue,
  useComboboxAnchor,
} from '~/components/ui/combobox';
import { Label } from '~/components/ui/label';
import { cn } from '~/lib/utils';

export interface CustomSelectOption {
  value: string | number | boolean;
  label: string;
}

interface CustomSelectSharedProps {
  options: CustomSelectOption[];
  placeholder?: string;
  emptyText?: string;
  label?: string;
  required?: boolean;
  className?: string;
  disabled?: boolean;
  isClearable?: boolean;
}

export interface CustomSelectSingleProps extends CustomSelectSharedProps {
  isMulti?: false;
  value?: string | number | null;
  onChange?: (value: string | number | null) => void;
}

export interface CustomSelectMultiProps extends CustomSelectSharedProps {
  isMulti: true;
  value?: (string | number)[] | null;
  onChange?: (value: (string | number)[]) => void;
}

export type CustomSelectProps = CustomSelectSingleProps | CustomSelectMultiProps;

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
    isMulti,
    value,
    onChange,
    isClearable = true,
  } = props;

  const effectivePlaceholder = placeholder ?? t('customSelect.placeholder');
  const effectiveEmptyText = emptyText ?? t('customSelect.emptyText');

  const anchor = useComboboxAnchor();

  const selectedItems = React.useMemo(() => {
    if (isMulti) {
      const vals = (value as (string | number)[]) ?? [];
      return options.filter((opt) => vals.some((v) => String(v) === String(opt.value)));
    }
    return options.find((opt) => String(opt.value) === String(value)) ?? null;
  }, [value, options, isMulti]);

  return (
    <div className={cn(label && 'space-y-1.5', className)}>
      {label && (
        <Label>
          {label}
          {required && <span className="text-destructive ml-0.5">*</span>}
        </Label>
      )}
      <ComboboxPrimitive
        multiple={isMulti as any}
        autoHighlight
        items={options}
        value={selectedItems}
        onValueChange={(newItem: any) => {
          if (isMulti) {
            const vals = (newItem as CustomSelectOption[]).map((i) => i.value);
            (onChange as any)?.(vals);
          } else {
            const val = (newItem as CustomSelectOption | null)?.value ?? null;
            (onChange as any)?.(val);
          }
        }}
        disabled={disabled}
        itemToStringLabel={(item: CustomSelectOption) => item?.label ?? ''}>
        {isMulti ? (
          <ComboboxChips ref={anchor} className="w-full">
            <ComboboxValue>
              {(items: CustomSelectOption[]) => (
                <React.Fragment>
                  {(items ?? []).map((item) => (
                    <ComboboxChip key={String(item.value)} showRemove={isClearable}>
                      {item.label}
                    </ComboboxChip>
                  ))}
                  <ComboboxChipsInput placeholder={effectivePlaceholder} />
                </React.Fragment>
              )}
            </ComboboxValue>
          </ComboboxChips>
        ) : (
          <ComboboxInput
            placeholder={effectivePlaceholder}
            showClear={isClearable && value !== null && value !== undefined && value !== ''}
            className="w-full"
          />
        )}
        <ComboboxContent anchor={isMulti ? anchor : undefined}>
          <ComboboxEmpty>{effectiveEmptyText}</ComboboxEmpty>
          <ComboboxList>
            {(isMulti
              ? options.filter((opt) => {
                  const vals = (value as (string | number)[]) ?? [];
                  return !vals.some((v) => String(v) === String(opt.value));
                })
              : options
            ).map((opt) => (
              <ComboboxItem key={String(opt.value)} value={opt}>
                {opt.label}
              </ComboboxItem>
            ))}
          </ComboboxList>
        </ComboboxContent>
      </ComboboxPrimitive>
    </div>
  );
}
