export interface ApiSuccess<T = unknown> {
    success: true;
    message: string;
    timestamp: string;
    data?: T;
}

export interface ApiError {
    success: false;
    error: string;
    timestamp: string;
    required?: string[];
}

export type ApiResponse<T = unknown> = ApiSuccess<T> | ApiError;