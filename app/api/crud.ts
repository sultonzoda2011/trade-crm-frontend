import { apiClient } from '~/lib/client';
import { filtersToParams } from '~/lib/filtersToParams';
import type { ActiveFilter } from '~/types/filters';

/**
 * Building blocks for the standard REST surface every list entity exposes.
 *
 * These used to be copy-pasted per module — seven byte-identical `getAll`
 * bodies and seven near-identical create/update pairs — which is how the
 * parameter shape drifted (`getAll` defaulted `limit` to 20 while the table
 * store defaulted to 10) and how `create`/`update` ended up untyped in every
 * module. URLs, verbs and payload shapes are unchanged; there is nothing here
 * the backend can notice.
 */

/** Query options understood by every list endpoint. */
export interface ListOptions {
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/** `GET <base>` — paginated list with active filters flattened into query params. */
export function listRequest<TListRes>(base: string) {
  return async (
    page = 1,
    limit = 20,
    options: ListOptions = {},
    filters: ActiveFilter[] = []
  ): Promise<TListRes> => {
    const { data } = await apiClient.get(base, {
      params: { page, limit, ...options, ...filtersToParams(filters) },
    });
    return data;
  };
}

/** `GET <base>/:id` — the compact detail payload an edit form loads. */
export function detailRequest<TDetailRes>(base: string) {
  return async (id: string): Promise<TDetailRes> => {
    const { data } = await apiClient.get(`${base}/${id}`);
    return data;
  };
}

/**
 * `GET <base>/:id/<segment>` — the enriched payload a detail page loads.
 * `segment` is a parameter because the transactions endpoint calls it `detail`.
 */
export function nestedDetailRequest<TFullRes>(base: string, segment: 'full' | 'detail' = 'full') {
  return async (id: string): Promise<TFullRes> => {
    const { data } = await apiClient.get(`${base}/${id}/${segment}`);
    return data;
  };
}

/** `DELETE <base>/:id` */
export function deleteRequest(base: string) {
  return async (id: string): Promise<void> => {
    await apiClient.delete(`${base}/${id}`);
  };
}

/** `POST`/`PATCH` pair for image-bearing entities — the body is always `FormData`. */
export function multipartWrites(base: string) {
  const headers = { 'Content-Type': 'multipart/form-data' };
  return {
    create: async (formData: FormData): Promise<unknown> => (await apiClient.post(base, formData, { headers })).data,
    update: async ({ formData, id }: { formData: FormData; id: string }): Promise<unknown> =>
      (await apiClient.patch(`${base}/${id}`, formData, { headers })).data,
  };
}

/** `POST`/`PATCH` pair for pure-data entities — the body is a typed JSON request. */
export function jsonWrites<TCreateReq, TUpdateReq = TCreateReq>(base: string) {
  return {
    create: async (request: TCreateReq): Promise<unknown> => (await apiClient.post(base, request)).data,
    update: async ({ request, id }: { request: TUpdateReq; id: string }): Promise<unknown> =>
      (await apiClient.patch(`${base}/${id}`, request)).data,
  };
}
