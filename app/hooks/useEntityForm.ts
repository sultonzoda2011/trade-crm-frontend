import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router';
import { buildMultipart } from '~/lib/form-data';
import { queryKeys, type Entity } from '~/lib/query-keys';

export interface EntityFormApi {
  create: (formData: FormData) => Promise<unknown>;
  update: (args: { formData: FormData; id: string }) => Promise<unknown>;
}

interface UseEntityFormArgs<TValues, TDetail> {
  /** Registry entity — decides the detail key and the invalidation prefix. */
  entity: Entity;
  /** Edit pages pass the route param; without it the load query stays disabled. */
  id?: string;
  /** Loads the record the edit form seeds itself from. */
  fetcher?: (id: string) => Promise<{ data?: TDetail } | undefined>;
  api: EntityFormApi;
  /** Detail → form values. */
  toForm?: (detail: TDetail) => Partial<TValues>;
  /** Form values → the plain object that becomes the multipart body. */
  toPayload: (values: TValues) => Record<string, unknown>;
  /** `reset` from `useForm`, so loading the record can seed the form. */
  reset?: (values: Partial<TValues>) => void;
  /** Where to go after a successful save. */
  redirectTo: (id?: string) => string;
  /** Extra reason to keep submit disabled — e.g. an otherwise-empty form. */
  fileKey?: string;
}

/**
 * The create/edit round-trip: load the record, seed the form, build the
 * multipart body, save, invalidate, navigate.
 *
 * Thirteen form pages each re-wrote this — the same `useQuery` with
 * `enabled: !!id`, the same `useEffect(() => reset(...))`, the same
 * invalidate → navigate chain, the same `if (data.image instanceof File)`
 * guard, and often an `onSubmit(data) { mutate(data) }` pass-through and an
 * empty `onError: () => {}` on top.
 *
 * Invalidation deliberately uses the entity *prefix*: after the key registry
 * landed, a detail page's `['users','full',id]` and an edit page's
 * `['users','detail',id]` both sit under `['users']`, so one call refreshes
 * whatever read that entity — including a detail page the user came from,
 * which used to keep showing the pre-save values.
 */
export function useEntityForm<TValues, TDetail>({
  entity,
  id,
  fetcher,
  api,
  toForm,
  toPayload,
  reset,
  redirectTo,
  fileKey,
}: UseEntityFormArgs<TValues, TDetail>) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: response, isLoading } = useQuery({
    queryKey: queryKeys.detail(entity, id),
    queryFn: () => fetcher?.(id!),
    enabled: !!id && !!fetcher,
    staleTime: 30_000,
  });

  const detail = response?.data;

  // `toForm` and `reset` are read through refs so this effect only re-runs when
  // the loaded record itself changes — an inline `toForm` arrow would otherwise
  // get a new identity every render and reset the form in a loop.
  const toFormRef = useRef(toForm);
  toFormRef.current = toForm;
  const resetRef = useRef(reset);
  resetRef.current = reset;

  useEffect(() => {
    if (!detail || !toFormRef.current || !resetRef.current) return;
    resetRef.current(toFormRef.current(detail));
  }, [detail]);

  const { mutate, isPending } = useMutation({
    mutationFn: (values: TValues) => {
      const formData = buildMultipart(toPayload(values), fileKey);
      return id ? api.update({ formData, id }) : api.create(formData);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.entity(entity) });
      navigate(redirectTo(id));
    },
  });

  /**
   * Give this to `handleSubmit`. `mutate` cannot be passed directly — its second
   * parameter is react-query's `MutateOptions`, which collides with the submit
   * event react-hook-form forwards, and that collision is the only reason all
   * eighteen form pages wrote their own `onSubmit(data) { mutate(data) }`.
   */
  const submit = (values: TValues) => {
    mutate(values);
  };

  return { detail, isLoading, mutate, submit, isPending };
}
