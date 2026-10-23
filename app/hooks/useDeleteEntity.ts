import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { TFunction } from 'i18next';
import { useState } from 'react';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';
import { queryKeys, type Entity } from '~/lib/query-keys';

interface UseDeleteEntityArgs {
  /** Registry entity — decides which cached reads are dropped and invalidated. */
  entity: Entity;
  api: { delete: (id: string) => Promise<unknown> };
  id: string | undefined;
  /** The page's translated `t`, so the toasts keep the entity namespace. */
  t: TFunction;
  /** Where to go once the record is gone — the entity's list. */
  redirectTo: string;
  /** Other entities whose numbers move with this one (a deleted sale returns stock). */
  alsoInvalidate?: Entity[];
}

/**
 * Delete from a detail page: confirm → delete → forget the record → refresh lists → back to the list.
 *
 * The list pages do the same through `useEntityList`, but a detail page is still
 * mounted when the request succeeds. If the record's own cached reads stayed, the
 * invalidation below would refetch them and the page would flash a 404 for the
 * record it just deleted, so they are dropped first. Only reads keyed by this id
 * go — the entity's lists stay, because they are also the offline copy.
 *
 * `networkMode: 'always'`: delete is not an offline mutation. With the default
 * mode, a request made offline would sit paused behind a spinner that never ends;
 * this way it fails at once with the usual "no connection" toast.
 */
export function useDeleteEntity({ entity, api, id, t, redirectTo, alsoInvalidate = [] }: UseDeleteEntityArgs) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  const { mutate, isPending } = useMutation({
    networkMode: 'always',
    mutationFn: () => api.delete(id!),
    onSuccess: () => {
      queryClient.removeQueries({
        predicate: (query) => query.queryKey[0] === entity && query.queryKey[2] === id,
      });
      for (const key of [entity, ...alsoInvalidate]) {
        void queryClient.invalidateQueries({ queryKey: queryKeys.entity(key) });
      }
      toast.success(t('actions.deleteSuccess'));
      setOpen(false);
      navigate(redirectTo, { replace: true });
    },
    onError: () => {
      toast.error(t('actions.deleteError'));
    },
  });

  return {
    /** Hand to `manage.onDelete`. */
    requestDelete: () => setOpen(true),
    /** Spread straight onto `<ConfirmDialog>`. */
    deleteDialog: {
      open,
      onOpenChange: setOpen,
      onConfirm: () => mutate(),
      isLoading: isPending,
      title: t('actions.confirm'),
      description: t('actions.areYouSure'),
    },
  };
}
