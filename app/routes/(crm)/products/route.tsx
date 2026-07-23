import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Search } from 'lucide-react';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { productsApi } from '~/api/products';
import { CreateProductModal } from '~/components/modals/CreateProductModal';
import { EditProductModal } from '~/components/modals/EditProductModal';
import { ColumnToggle } from '~/components/shared/ColumnToggle';
import { ConfirmDialog } from '~/components/shared/ConfirmDialog';
import { CustomInput } from '~/components/shared/CustomInput';
import { DataTable } from '~/components/shared/DataTable';
import { Button } from '~/components/ui/button';
import { Action } from '~/config/actions';
import { useCan } from '~/hooks/useCan';
import { useDataTable } from '~/hooks/useDataTable';
import { useDebounce } from '~/hooks/useDebounce';
import { getColumns } from './configs/columns';
import { useProductsModals, useProductsStore } from './store';

const SEARCH_KEY = 'Name';

export default function ProductsPage() {
  const { t } = useTranslation(['products', 'common']);
  const queryClient = useQueryClient();
  const { can } = useCan();
  const deleteModal = useProductsModals((s) => s.delete);
  const createModal = useProductsModals((s) => s.create);

  const { page, limit, search, filters, setPage, setLimit, setSearch } = useProductsStore();

  const debouncedSearch = useDebounce(search);

  const queryFilters = useMemo(
    () => (debouncedSearch ? [{ key: 'search', value: debouncedSearch }, ...filters] : filters),
    [debouncedSearch, filters]
  );

  const {
    data: response,
    isLoading,
    isFetching,
    isError,
  } = useQuery({
    queryKey: ['products', page, limit, debouncedSearch, filters],
    queryFn: () => productsApi.getAll(page, limit, queryFilters),
    staleTime: 30_000,
  });

  const { mutate: deleteStudent, isPending: isDeletePending } = useMutation({
    mutationFn: (id: string) => productsApi.delete(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success(t('actions.deleteSuccess', { defaultValue: 'Удалено' }));
      deleteModal.close();
    },
    onError: () => {
      toast.error(t('actions.deleteError', { defaultValue: 'Ошибка при удалении' }));
    },
  });

  const columns = useMemo(() => getColumns({ t }), [t]);

  const products = useMemo(() => response?.data?.data ?? [], [response]);
  const totalPages = response?.data?.meta?.totalPages || 1;

  const { table } = useDataTable({
    columns,
    data: products,
    storageKey: 'products-table-columns',
  });

  return (
    <div className="flex-1 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">{t('title')}</h1>
      </div>
      <div className="space-y-2">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <CustomInput
            placeholder={`${t('filters.search')}...`}
            className="w-full sm:max-w-96"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            startIcon={<Search className="text-muted-foreground h-4 w-4" />}
          />
          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
            <ColumnToggle table={table} />
            {can(Action.PRODUCTS_CREATE) && (
              <Button className="shrink-0 gap-2" onClick={() => createModal.open()}>
                <Plus className="h-4 w-4" data-icon="inline-start" />
                <span className="hidden sm:inline">{t('create')}</span>
              </Button>
            )}
          </div>
        </div>
        <DataTable
          table={table}
          pinLastColumn
          isLoading={isLoading}
          isFetching={isFetching}
          isError={isError}
          page={page}
          limit={limit}
          totalPages={totalPages}
          onPageChange={setPage}
          onlimitChange={setLimit}
        />
      </div>
      <CreateProductModal />
      <EditProductModal />
      <ConfirmDialog
        open={deleteModal.isOpen}
        onOpenChange={(open) => !open && deleteModal.close()}
        onConfirm={() => deleteModal.data != null && deleteStudent(deleteModal.data)}
        isLoading={isDeletePending}
        title={t('actions.confirm')}
        description={t('actions.areYouSure')}
      />
    </div>
  );
}
