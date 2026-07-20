import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Search } from 'lucide-react';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useLocation } from 'react-router';
import { toast } from 'sonner';
import { studentsApi } from '~/api/students';
import { ColumnToggle } from '~/components/shared/ColumnToggle';
import { ConfirmDialog } from '~/components/shared/ConfirmDialog';
import { CustomInput } from '~/components/shared/CustomInput';
import { DataTable } from '~/components/shared/DataTable';
import { FilterSheet } from '~/components/shared/FilterSheet';
import { Button } from '~/components/ui/button';
import { Action } from '~/config/actions';
import { useCan } from '~/hooks/useCan';
import { useDataTable } from '~/hooks/useDataTable';
import { useDebounce } from '~/hooks/useDebounce';
import { getColumns } from './configs/columns';
import { getStudentFilters } from './configs/filters';
import { useStudentsModals, useStudentsStore } from './store';

const SEARCH_KEY = 'fullName';

export default function StudentsPage() {
  const { t } = useTranslation(['students', 'common']);
  const location = useLocation();
  const queryClient = useQueryClient();
  const { can } = useCan();
  const deleteModal = useStudentsModals((s) => s.delete);

  const { pageNumber, pageSize, search, filters, setPageNumber, setPageSize, setSearch, setFilters, resetFilters } =
    useStudentsStore();

  const debouncedSearch = useDebounce(search);

  const queryFilters = useMemo(
    () => (debouncedSearch ? [{ key: SEARCH_KEY, value: debouncedSearch }, ...filters] : filters),
    [debouncedSearch, filters]
  );

  const {
    data: response,
    isLoading,
    isFetching,
    isError,
  } = useQuery({
    queryKey: ['students', pageNumber, pageSize, debouncedSearch, filters],
    queryFn: () => studentsApi.getAll(pageNumber, pageSize, queryFilters),
    staleTime: 30_000,
  });

  const { mutate: deleteStudent, isPending: isDeletePending } = useMutation({
    mutationFn: (id: number) => studentsApi.delete(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['students'] });
      toast.success(t('actions.deleteSuccess', { defaultValue: 'Удалено' }));
      deleteModal.close();
    },
    onError: () => {
      toast.error(t('actions.deleteError', { defaultValue: 'Ошибка при удалении' }));
    },
  });

  const columns = useMemo(() => getColumns({ t }), [t]);

  const filterConfig = useMemo(() => getStudentFilters(t), [t]);
  const students = useMemo(() => response?.data ?? [], [response?.data]);
  const totalPages = response?.totalPages || 1;

  const { table } = useDataTable({
    columns,
    data: students,
    storageKey: 'students-table-columns',
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
            <FilterSheet config={filterConfig} filters={filters} onApply={setFilters} onReset={resetFilters} />
            <ColumnToggle table={table} />
            {can(Action.STUDENTS_CREATE) && (
              <Button
                render={<Link to="/students/create" state={{ fromPath: location.pathname, fromName: t('title') }} />}
                className="shrink-0 gap-2">
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
          pageNumber={pageNumber}
          pageSize={pageSize}
          totalPages={totalPages}
          onPageChange={setPageNumber}
          onPageSizeChange={setPageSize}
        />
      </div>
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

