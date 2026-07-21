export enum Status {
  Inactive = 0,
  Active = 1,
  Completed = 2,
}
export enum Role {
  Admin = 'ADMIN',
  Owner = 'OWNER',
  Seller = 'SELLER',
}
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  timestamp: string;
}

export interface PaginatedData<T> {
  data: T[];
  meta: PaginationMeta;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}
