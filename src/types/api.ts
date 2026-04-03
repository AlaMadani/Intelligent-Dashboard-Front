// Shared transport types used by the analytics service layer and DTO definitions.
export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

// Pagination metadata accompanies list endpoints returned by the backend.
export interface PaginationMeta {
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

// ApiResponse matches the raw backend envelope, while ApiEnvelope is the normalized UI shape.
export interface ApiResponse<T> {
  data: T;
  meta?: PaginationMeta | null;
}

export interface ApiEnvelope<T> {
  data: T;
  meta: PaginationMeta | null;
}
