export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

export interface PaginationMeta {
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export interface ApiResponse<T> {
  data: T;
  meta?: PaginationMeta | null;
}

export interface ApiEnvelope<T> {
  data: T;
  meta: PaginationMeta | null;
}
