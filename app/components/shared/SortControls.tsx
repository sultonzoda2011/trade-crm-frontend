import { ArrowDownWideNarrow, ArrowUpWideNarrow } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { CustomSelect } from '~/components/shared/CustomSelect';
import { Button } from '~/components/ui/button';

interface SortControlsProps {
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  onSortByChange: (value: string) => void;
  onSortOrderChange: (value: 'asc' | 'desc') => void;
  options: { value: string; label: string }[];
}

export function SortControls({ sortBy, sortOrder, onSortByChange, onSortOrderChange, options }: SortControlsProps) {
  const { t } = useTranslation('common');

  return (
    <div className="flex items-center gap-1">
      <CustomSelect
        value={sortBy}
        options={options}
        onChange={(v) => onSortByChange(String(v))}
        className="w-[130px]"
        placeholder={t('filters.sortBy')}
      />
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        title={sortOrder === 'asc' ? t('filters.asc') : t('filters.desc')}
        onClick={() => onSortOrderChange(sortOrder === 'asc' ? 'desc' : 'asc')}>
        {sortOrder === 'asc' ? (
          <ArrowUpWideNarrow className="h-4 w-4" />
        ) : (
          <ArrowDownWideNarrow className="h-4 w-4" />
        )}
      </Button>
    </div>
  );
}
