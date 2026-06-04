export interface ApiResponse<T> {
  success: true;
  data: T;
  timestamp: string;
}

export interface ApiErrorResponse {
  success: false;
  code: string;
  message: string;
  errors?: ValidationError[];
  timestamp: string;
  path: string;
  requestId?: string;
}

export interface ValidationError {
  field: string;
  message: string;
  annotation: string;
  params: Record<string, unknown>;
}
