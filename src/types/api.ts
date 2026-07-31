// ---- Json Types ----
export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

// ---- Pagination ----
export interface PaginationMeta {
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

// ---- API Envelope ----
export interface ApiResponse<T> {
  data: T;
  meta?: PaginationMeta | null;
}

export interface ApiEnvelope<T> {
  data: T;
  meta: PaginationMeta | null;
}
