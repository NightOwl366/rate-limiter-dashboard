import { Response } from "express";
import { Types } from "mongoose";

interface BaseResponse {
    success: boolean;
    timestamp: string;
}

interface SuccessResponse<T = unknown> extends BaseResponse {
    success: true;
    message: string;
    data?: T;
}

interface ErrorResponse extends BaseResponse {
    success: false;
    error: string;
    required?: string[];
}

export const sendSuccess = <T = unknown>(
    res: Response,
    statusCode: number,
    message: string,
    data?: T
): Response<SuccessResponse<T>> => {
    const response: SuccessResponse<T> = {
        success: true,
        message,
        timestamp: new Date().toISOString(),
    };

    if (data !== undefined && data !== null) {
        response.data = data;
    }

    return res.status(statusCode).json(response);
};

export const sendError = (
    res: Response,
    statusCode: number,
    error: string,
    required?: string[]
): Response<ErrorResponse> => {
    const response: ErrorResponse = {
        success: false,
        error,
        timestamp: new Date().toISOString(),
    };

    if (required !== undefined && required.length > 0) {
        response.required = required;
    }

    return res.status(statusCode).json(response);
};

export const isValidObjectId = (id: unknown): boolean => {
  if (!id) return false;

  if (typeof id === "string") {
    return Types.ObjectId.isValid(id) && new Types.ObjectId(id).toString() === id;
  }

  if (id instanceof Types.ObjectId) {
    return true;
  }

  return false;
};
