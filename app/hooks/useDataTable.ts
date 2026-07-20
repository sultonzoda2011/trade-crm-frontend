import {
  type ColumnDef,
  type VisibilityState,
  type RowSelectionState,
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
  rowSelection?: RowSelectionState;
  onRowSelectionChange?: React.Dispatch<React.SetStateAction<RowSelectionState>>;
  getRowId?: (row: TData) => string;
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
  rowSelection,
  onRowSelectionChange,
  getRowId,
}: UseDataTableOptions<TData, TValue>) {
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(() => {
    if (storageKey) {
      const persisted = loadVisibility(storageKey);
      if (Object.keys(persisted).length > 0) return persisted;
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
    initialState: { columnVisibility: initialVisibility },
    state: {
      columnVisibility,
      ...(rowSelection ? { rowSelection } : {}),
    },
    onColumnVisibilityChange: setColumnVisibility,
    ...(onRowSelectionChange ? { onRowSelectionChange } : {}),
    enableRowSelection: onRowSelectionChange ? true : undefined,
    ...(getRowId ? { getRowId } : {}),
    getCoreRowModel: getCoreRowModel(),
  });

  return { table };
}
