// Envelope handling for PowerAPI responses.
//
// Every school endpoint answers with a StatusMessage:
//   { status, code, message, metadata, data, errorMessages }
// so unwrapping, error normalisation and list-query building all live here
// instead of being repeated in each service module.

import axios from "axios";
import { api } from "./api";
import type { PaginationMetadata } from "@/types/school";

/** Casing is not uniform across PowerAPI controllers — read both spellings. */
const field = <T = unknown>(source: unknown, key: string): T | undefined => {
  if (!source || typeof source !== "object") return undefined;
  const bag = source as Record<string, unknown>;
  const lower = key.charAt(0).toLowerCase() + key.slice(1);
  const upper = key.charAt(0).toUpperCase() + key.slice(1);
  const hit = bag[key] ?? bag[lower] ?? bag[upper];
  return hit === null ? undefined : (hit as T);
};

/**
 * A failed request, already reduced to something displayable.
 * `errors` carries PowerAPI's per-field `errorMessages` when present.
 */
export class ApiError extends Error {
  readonly status?: number;
  readonly errors: string[];

  constructor(message: string, status?: number, errors: string[] = []) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.errors = errors;
  }

  /** Field errors joined onto the summary, for a single toast. */
  get detail(): string {
    return this.errors.length > 0
      ? `${this.message} ${this.errors.join(" ")}`
      : this.message;
  }
}

const EMPTY_METADATA: PaginationMetadata = {
  currentPage: 1,
  totalCount: 0,
  totalPages: 0,
  hasPrevious: false,
  hasNext: false,
};

const readMetadata = (body: unknown): PaginationMetadata => {
  const raw = field<Record<string, unknown>>(body, "metadata");
  if (!raw) return EMPTY_METADATA;

  return {
    currentPage: field<number>(raw, "currentPage") ?? 1,
    totalCount: field<number>(raw, "totalCount") ?? 0,
    totalPages: field<number>(raw, "totalPages") ?? 0,
    hasPrevious: field<boolean>(raw, "hasPrevious") ?? false,
    hasNext: field<boolean>(raw, "hasNext") ?? false,
  };
};

const readErrors = (body: unknown): string[] => {
  const raw = field<unknown>(body, "errorMessages");
  return Array.isArray(raw) ? raw.filter((e): e is string => typeof e === "string") : [];
};

/** Turns anything thrown by axios into an ApiError with a usable message. */
export const toApiError = (error: unknown, fallback: string): ApiError => {
  if (error instanceof ApiError) return error;

  if (axios.isAxiosError(error)) {
    if (!error.response) {
      return new ApiError("Cannot reach the server. Check your connection.");
    }

    const body = error.response.data;
    const message =
      field<string>(body, "message") ?? field<string>(body, "title") ?? fallback;

    return new ApiError(message, error.response.status, readErrors(body));
  }

  return new ApiError(error instanceof Error ? error.message : fallback);
};

/**
 * A `status: "Failed"` body can arrive with a 200, so the envelope has to be
 * checked even on success.
 */
const assertOk = (body: unknown, fallback: string): void => {
  const status = field<string>(body, "status") ?? "";
  if (status && !/success/i.test(status)) {
    throw new ApiError(
      field<string>(body, "message") ?? fallback,
      undefined,
      readErrors(body)
    );
  }
};

export interface ListResult<T> {
  items: T[];
  metadata: PaginationMetadata;
}

export interface ListQuery {
  page?: number;
  itemsPerPage?: number;
  searchTerm?: string;
  sortProperty?: string;
  sortDirection?: "Ascending" | "Descending";
  /** Serialised as JSON — PowerAPI deserialises it into List<FilterCriteria>. */
  filters?: unknown[];
}

/**
 * Maps a ListQuery onto the query string PowerAPI's FilterRequest binds from.
 * Empty values are dropped so the server's own defaults apply.
 */
export const buildListParams = (query: ListQuery = {}): Record<string, string> => {
  const params: Record<string, string> = {};

  if (query.page) params["Pagination.Page"] = String(query.page);
  if (query.itemsPerPage) params["Pagination.ItemsPerPage"] = String(query.itemsPerPage);

  const term = query.searchTerm?.trim();
  if (term) params["SearchParams.SearchTerm"] = term;

  if (query.sortProperty) {
    params.SortProperty = query.sortProperty;
    params.SortDirection = query.sortDirection ?? "Ascending";
  }

  if (query.filters && query.filters.length > 0) {
    params.Filters = JSON.stringify(query.filters);
  }

  return params;
};

/** GET a paged list, returning its rows and pagination metadata. */
export const getList = async <T>(
  url: string,
  query: ListQuery = {},
  fallbackError = "Failed to load records."
): Promise<ListResult<T>> => {
  try {
    const response = await api.get(url, { params: buildListParams(query) });
    assertOk(response.data, fallbackError);

    const data = field<unknown>(response.data, "data");

    return {
      items: Array.isArray(data) ? (data as T[]) : [],
      metadata: readMetadata(response.data),
    };
  } catch (error) {
    throw toApiError(error, fallbackError);
  }
};

/** GET a single record out of the envelope. */
export const getOne = async <T>(
  url: string,
  params: Record<string, string | number | undefined> = {},
  fallbackError = "Failed to load record."
): Promise<T> => {
  try {
    const response = await api.get(url, { params });
    assertOk(response.data, fallbackError);
    return field<T>(response.data, "data") as T;
  } catch (error) {
    throw toApiError(error, fallbackError);
  }
};

export interface MutationResult<T> {
  message: string;
  data: T | null;
}

const mutate = async <T>(
  request: Promise<{ data: unknown }>,
  fallbackError: string
): Promise<MutationResult<T>> => {
  try {
    const response = await request;
    assertOk(response.data, fallbackError);

    return {
      message: field<string>(response.data, "message") ?? "Success",
      data: (field<T>(response.data, "data") ?? null) as T | null,
    };
  } catch (error) {
    throw toApiError(error, fallbackError);
  }
};

export const postOne = <T>(
  url: string,
  body: unknown,
  fallbackError = "Failed to save record."
): Promise<MutationResult<T>> => mutate<T>(api.post(url, body), fallbackError);

export const putOne = <T>(
  url: string,
  body: unknown,
  fallbackError = "Failed to update record."
): Promise<MutationResult<T>> => mutate<T>(api.put(url, body), fallbackError);

export const deleteOne = <T>(
  url: string,
  params: Record<string, string | number | undefined> = {},
  fallbackError = "Failed to delete record."
): Promise<MutationResult<T>> => mutate<T>(api.delete(url, { params }), fallbackError);
