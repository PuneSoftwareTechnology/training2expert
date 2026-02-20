export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data: T;
}

export interface ApiError {
  success: false;
  message: string;
}

export interface PaginatedResponse<T> {
  success: true;
  message: string;
  data: {
    items: T[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
