import {
  type ColumnDef,
  type VisibilityState,
  type RowData,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { useEffect, useState } from 'react';

interface UseDataTableOptions<TData extends RowData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  /** Persist column visibility to localStorage under this key */
  storageKey?: string;
  /** Initial visibility state if no persisted state exists */
  initialVisibility?: VisibilityState;
}

function loadVisibility(storageKey: string): VisibilityState {
  try {
    const raw = localStorage.getItem(storageKey);
    return raw ? (JSON.parse(raw) as VisibilityState) : {};
  } catch {
    return {};
  }
}

export function useDataTable<TData extends RowData, TValue>({
  columns,
  data,
  storageKey,
  initialVisibility = {},
}: UseDataTableOptions<TData, TValue>) {
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(() => {
    if (storageKey) {
      const persisted = loadVisibility(storageKey);
      return { ...initialVisibility, ...persisted };
    }
    return initialVisibility;
  });

  useEffect(() => {
    if (storageKey) {
      localStorage.setItem(storageKey, JSON.stringify(columnVisibility));
    }
  }, [columnVisibility, storageKey]);

  const table = useReactTable({
    data,
    columns,
    state: { columnVisibility },
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
  });

  return { table };
}
