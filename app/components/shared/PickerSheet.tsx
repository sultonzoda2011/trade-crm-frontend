import { Search } from 'lucide-react';
import { useEffect, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { CustomInput } from '~/components/shared/CustomInput';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '~/components/ui/sheet';

interface PickerSheetProps<T> {
  title: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: T[];
  getKey: (item: T) => string;
  renderItem: (item: T) => ReactNode;
  onSelect: (item: T) => void;
  loading: boolean;
  onSearch: (query: string) => void;
  /** Строка над списком — например «+ Новый должник». */
  header?: ReactNode;
}

/**
 * Нижняя шторка выбора из списка с поиском (товар, должник). На телефоне это
 * быстрее выпадающего списка: крупные строки, видно больше, не закрывается
 * клавиатурой. Одна шторка на страницу — какое поле сейчас выбирает, решает
 * вызывающая сторона.
 */
export function PickerSheet<T>({
  title,
  open,
  onOpenChange,
  items,
  getKey,
  renderItem,
  onSelect,
  loading,
  onSearch,
  header,
}: PickerSheetProps<T>) {
  const { t } = useTranslation('common');
  const [query, setQuery] = useState('');

  // Закрыли (в том числе программно после выбора) — следующий вызов начинает
  // с пустого поиска, а не с запроса прошлого раза.
  useEffect(() => {
    if (!open) {
      setQuery('');
      onSearch('');
    }
  }, [open, onSearch]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="bg-background flex h-[88dvh] flex-col gap-0 p-0 md:mx-auto md:max-w-lg">
        <SheetHeader className="shrink-0 space-y-3 px-4 pt-2 pb-3">
          <SheetTitle className="text-center text-lg">{title}</SheetTitle>
          <CustomInput
            startIcon={<Search className="text-muted-foreground size-4" />}
            placeholder={`${t('filters.search')}...`}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              onSearch(e.target.value);
            }}
            className="h-10"
          />
        </SheetHeader>

        <div className="flex-1 space-y-3 overflow-y-auto px-4 pb-6">
          {header && <div className="bg-card overflow-hidden rounded-2xl">{header}</div>}
          {items.length === 0 ? (
            <p className="text-muted-foreground py-10 text-center text-sm">
              {loading ? t('customSelect.loading') : t('customSelect.emptyText')}
            </p>
          ) : (
            <div className="bg-card divide-border divide-y overflow-hidden rounded-2xl">
              {items.map((item) => (
                <button
                  key={getKey(item)}
                  type="button"
                  onClick={() => onSelect(item)}
                  className="active:bg-muted/70 flex min-h-14 w-full items-center gap-3 px-4 py-2.5 text-left transition-colors">
                  {renderItem(item)}
                </button>
              ))}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
