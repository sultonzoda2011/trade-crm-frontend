import type { ReactNode } from 'react';
import { Search } from 'lucide-react';
import { CustomInput } from '~/components/shared/CustomInput';
import { PageHeader } from '~/components/layout/PageHeader';
import { cn } from '~/lib/utils';

interface ListPageToolbarProps {
  title: string;
  /** Необязательная строка под заголовком (например "Все ваши финансовые операции"
   * на /transactions) — прокидывается как есть в PageHeader.description, у
   * остальных списков просто не передаётся и ничего не меняется. */
  subtitle?: string;
  searchPlaceholder: string;
  searchValue: string;
  onSearchChange: (value: string) => void;
  /** Точечное увеличение инпута поиска на конкретной странице (например
   * /transactions), не трогая дефолтную высоту у остальных списков. */
  searchClassName?: string;
  children?: ReactNode;
}

export function ListPageToolbar({
  title,
  subtitle,
  searchPlaceholder,
  searchValue,
  onSearchChange,
  searchClassName,
  children,
}: ListPageToolbarProps) {
  return (
    <>
      <PageHeader title={title} description={subtitle} />
      <div className="space-y-2">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <CustomInput
            placeholder={`${searchPlaceholder}...`}
            className={cn('h-10 w-full sm:max-w-96', searchClassName)}
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            startIcon={<Search className="text-muted-foreground size-4" />}
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
