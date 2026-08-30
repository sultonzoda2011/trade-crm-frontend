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
          {/* Было overflow-x-auto — на узких экранах кнопки/бейдж фильтра
             утыкались друг в друга в одну нескролящуюся на вид строку.
             flex-wrap переносит лишние элементы на вторую строку вместо
             того, чтобы сжимать/перекрывать их. */}
          <div className="flex flex-wrap items-center gap-2">{children}</div>
        </div>
      </div>
    </>
  );
}
