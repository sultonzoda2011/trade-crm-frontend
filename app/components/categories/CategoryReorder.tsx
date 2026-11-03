import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowDown, ArrowUp } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { categoriesApi } from '~/api/categories';
import { CategoryTile } from '~/components/categories/CategoryTile';
import { Button } from '~/components/ui/button';
import { Skeleton } from '~/components/ui/skeleton';
import { haptic } from '~/lib/haptics';
import { invalidateEntityCache, queryKeys } from '~/lib/query-keys';
import { cn } from '~/lib/utils';
import type { Category } from '~/types/products';

interface CategoryReorderProps {
  onDone: () => void;
}

/**
 * Режим «Порядок»: все категории одним списком, у каждой стрелки ↑↓. Перетаскивание не
 * берём — на телефоне оно спорит со скроллом, а стрелки точны и работают одним пальцем.
 * Порядок меняется на экране сразу, на сервер уходит одним запросом по «Готово»;
 * «Отмена» возвращает как было. Этот же порядок видят в выборе товара при продаже.
 */
export function CategoryReorder({ onDone }: CategoryReorderProps) {
  const { t } = useTranslation(['categories', 'common']);
  const queryClient = useQueryClient();

  // Тот же ключ, что у фильтров/выбора в продаже: сервер отдаёт уже в порядке владельца.
  const { data, isLoading } = useQuery({
    queryKey: queryKeys.options('categories', { scope: 'filters', limit: 100 }),
    queryFn: () => categoriesApi.getAll(1, 100, {}, []),
  });

  const [items, setItems] = useState<Category[] | null>(null);
  const [initial, setInitial] = useState<string[]>([]);
  const serverRows = data?.data?.data;

  useEffect(() => {
    if (!serverRows || items) return;
    setItems(serverRows);
    setInitial(serverRows.map((c) => c.id));
  }, [serverRows, items]);

  const save = useMutation({
    networkMode: 'always',
    mutationFn: (ids: string[]) => categoriesApi.reorder(ids),
    onSuccess: () => {
      invalidateEntityCache(queryClient, 'categories');
      toast.success(t('reorder.saved'));
      onDone();
    },
  });

  const move = (index: number, delta: -1 | 1) => {
    setItems((prev) => {
      if (!prev) return prev;
      const target = index + delta;
      if (target < 0 || target >= prev.length) return prev;
      const next = [...prev];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
    haptic('selection');
  };

  const ids = items?.map((c) => c.id) ?? [];
  const changed = ids.length > 0 && ids.some((id, i) => id !== initial[i]);

  return (
    <div className="flex-1 space-y-4">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">{t('reorder.title')}</h1>
        <p className="text-muted-foreground text-sm leading-snug">{t('reorder.hint')}</p>
      </div>

      {isLoading || !items ? (
        <div className="space-y-2">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-[68px] rounded-2xl" />
          ))}
        </div>
      ) : (
        <ol className="bg-card divide-border divide-y overflow-hidden rounded-2xl">
          {items.map((category, index) => (
            <li key={category.id} className="flex items-center gap-3 px-4 py-2.5">
              <span className="text-muted-foreground w-5 shrink-0 text-center text-sm tabular-nums">{index + 1}</span>
              <CategoryTile image={category.image} color={category.color} />
              <span className="line-clamp-2 min-w-0 flex-1 text-base leading-snug font-semibold">{category.name}</span>
              <MoveButton
                label={t('reorder.up', { name: category.name })}
                disabled={index === 0 || save.isPending}
                onClick={() => move(index, -1)}>
                <ArrowUp className="size-5" />
              </MoveButton>
              <MoveButton
                label={t('reorder.down', { name: category.name })}
                disabled={index === items.length - 1 || save.isPending}
                onClick={() => move(index, 1)}>
                <ArrowDown className="size-5" />
              </MoveButton>
            </li>
          ))}
        </ol>
      )}

      <div className="flex flex-col gap-2 sm:flex-row-reverse">
        <Button
          size="lg"
          className="w-full sm:w-auto sm:min-w-40"
          disabled={!changed}
          loading={save.isPending}
          onClick={() => save.mutate(ids)}>
          {t('reorder.done')}
        </Button>
        <Button size="lg" variant="outline" className="w-full sm:w-auto" onClick={onDone} disabled={save.isPending}>
          {t('actions.cancel', { ns: 'common' })}
        </Button>
      </div>
    </div>
  );
}

function MoveButton({
  label,
  disabled,
  onClick,
  children,
}: {
  label: string;
  disabled: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        'bg-muted flex size-11 shrink-0 items-center justify-center rounded-full transition-transform active:scale-90',
        disabled && 'opacity-30'
      )}>
      {children}
    </button>
  );
}
