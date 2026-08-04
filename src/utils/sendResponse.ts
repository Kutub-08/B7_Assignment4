// utils/sendResponse.ts
import { Response } from "express";

type TSendResponse<T> = {
  success: boolean;
  statusCode: number;
  message: string;
  data?: T;
  meta?: unknown;
  errorDetails?: unknown;
};

export const sendResponse = <T>(res: Response, payload: TSendResponse<T>) => {
  const { success, statusCode, message, data, meta, errorDetails } = payload;

  return res.status(statusCode).json({
    success,
    statusCode,          
    message,
    ...(data !== undefined && { data }),
    ...(meta !== undefined && { meta }),
    ...(errorDetails !== undefined && { errorDetails }),
  });
};