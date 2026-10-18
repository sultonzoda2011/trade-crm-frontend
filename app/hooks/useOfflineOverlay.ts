import { useMutationState } from '@tanstack/react-query';
import { useMemo } from 'react';
import { getClientUser } from '~/lib/auth-utils';
import {
  mergeDebtorRows,
  mergeTransactionRows,
  pendingDebtors,
  pendingStockUsage,
  toOverlayOp,
  type OverlayOp,
} from '~/lib/offline-overlay';
import { isQueueMutation } from '~/lib/offline-queue';
import type { Debtor } from '~/types/debtors';
import type { ActiveFilter } from '~/types/filters';
import type { DebtorRow, TransactionRow } from '~/types/pending';
import type { TransactionListItem } from '~/types/transactions';

/** Все операции очереди (и недавно отправленные) в виде, пригодном для оверлея. Обновляется сам. */
export function useOverlayOps(): OverlayOp[] {
  const rows = useMutationState({
    filters: { predicate: (mutation) => isQueueMutation(mutation as never) },
    select: (mutation) => toOverlayOp(mutation as never),
  });
  return useMemo(() => rows.filter((op): op is OverlayOp => op !== null), [rows]);
}

interface RowsOptions {
  page: number;
  search?: string;
  filters?: ActiveFilter[];
  /** `useQuery().dataUpdatedAt` того же списка — по нему оверлей понимает, что сервер уже догнал очередь. */
  dataUpdatedAt: number;
}

/** Должники сервера + должники из очереди + пересчитанный долг. */
export function useDebtorRows(server: Debtor[], { page, search, filters, dataUpdatedAt }: RowsOptions): DebtorRow[] {
  const ops = useOverlayOps();
  const user = useMemo(() => getClientUser(), []);
  return useMemo(
    () => mergeDebtorRows(server, ops, { page, search, filters, dataUpdatedAt, user }),
    [server, ops, page, search, filters, dataUpdatedAt, user]
  );
}

/** Транзакции сервера + транзакции из очереди + пересчитанные остатки после оплат. */
export function useTransactionRows(
  server: TransactionListItem[],
  { page, search, filters, dataUpdatedAt }: RowsOptions
): TransactionRow[] {
  const ops = useOverlayOps();
  const user = useMemo(() => getClientUser(), []);
  return useMemo(
    () => mergeTransactionRows(server, ops, { page, search, filters, dataUpdatedAt, user }),
    [server, ops, page, search, filters, dataUpdatedAt, user]
  );
}

/** Должники из очереди, доступные для выбора в форме продажи. */
export function usePendingDebtors(dataUpdatedAt: number): DebtorRow[] {
  const ops = useOverlayOps();
  const user = useMemo(() => getClientUser(), []);
  return useMemo(() => pendingDebtors(ops, user, dataUpdatedAt), [ops, user, dataUpdatedAt]);
}

/** Сколько каждого товара уже занято продажами из очереди. */
export function usePendingStock(dataUpdatedAt: number): Record<string, number> {
  const ops = useOverlayOps();
  return useMemo(() => pendingStockUsage(ops, dataUpdatedAt), [ops, dataUpdatedAt]);
}
