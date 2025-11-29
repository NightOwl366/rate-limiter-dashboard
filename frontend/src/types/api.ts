export interface ApiResponse<T = unknown> {
    success: boolean;
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

