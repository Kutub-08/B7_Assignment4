// middlewares/validateRequest.ts
import { Request, Response, NextFunction } from "express";
import { ZodType } from "zod";
import { AppError } from "../utils/AppError";
import httpStatus from "http-status";

export const validateRequest = (schema: ZodType<any>) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      const errorDetails = result.error.issues.map((issue) => issue.message); 
      throw new AppError(httpStatus.BAD_REQUEST, errorDetails.join(", "));
    }

    req.body = result.data;
    next();
  };
};