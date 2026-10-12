// Factory for the school modules' CRUD services.
//
// Every module talks to the same five routes with the same envelope, differing
// only in the URL group, the name of its id query parameter, and the noun in the
// error messages. Building them from one factory keeps twelve service modules
// from being twelve copies of the same file.

import {
  deleteOne,
  getList,
  getOne,
  postOne,
  putOne,
  type ListQuery,
  type ListResult,
  type MutationResult,
} from "@/lib/apiClient";
import type { CrudEndpoints } from "@/utils/apiEndPoints";

export interface CrudService<TRow, TCreate, TUpdate> {
  /** GET the list route with FilterRequest query params. */
  list: (query?: ListQuery) => Promise<ListResult<TRow>>;
  byId: (id: string) => Promise<TRow>;
  create: (payload: TCreate) => Promise<MutationResult<TRow>>;
  update: (payload: TUpdate) => Promise<MutationResult<TRow>>;
  remove: (id: string) => Promise<MutationResult<null>>;
}

export interface CrudConfig {
  endpoints: CrudEndpoints;
  /** Lower-case singular noun used in fallback error messages. */
  label: string;
  /** Name of the id query parameter, e.g. "studentId". */
  idParam: string;
}

export const createCrudService = <TRow, TCreate, TUpdate>({
  endpoints,
  label,
  idParam,
}: CrudConfig): CrudService<TRow, TCreate, TUpdate> => ({
  list: (query: ListQuery = {}) =>
    getList<TRow>(endpoints.list(), query, `Failed to load ${label}s.`),

  byId: (id: string) =>
    getOne<TRow>(endpoints.byId(), { [idParam]: id }, `Failed to load ${label}.`),

  create: (payload: TCreate) =>
    postOne<TRow>(endpoints.create(), payload, `Failed to create ${label}.`),

  update: (payload: TUpdate) =>
    putOne<TRow>(endpoints.update(), payload, `Failed to update ${label}.`),

  remove: (id: string) =>
    deleteOne<null>(
      endpoints.remove(),
      { [idParam]: id },
      `Failed to delete ${label}.`
    ),
});
