import type { ReactNode } from 'react';
import { Search } from 'lucide-react';
import { CustomInput } from '~/components/shared/CustomInput';
import { PageHeader } from '~/components/layout/PageHeader';

interface ListPageToolbarProps {
  title: string;
  searchPlaceholder: string;
  searchValue: string;
  onSearchChange: (value: string) => void;
  children?: ReactNode;
}

export function ListPageToolbar({
  title,
  searchPlaceholder,
  searchValue,
  onSearchChange,
  children,
}: ListPageToolbarProps) {
  return (
    <>
      <PageHeader title={title} />
      <div className="space-y-2">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <CustomInput
            placeholder={`${searchPlaceholder}...`}
            className="w-full sm:max-w-96"
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            startIcon={<Search className="text-muted-foreground h-4 w-4" />}
          />
          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">{children}</div>
        </div>
      </div>
    </>
  );
}
