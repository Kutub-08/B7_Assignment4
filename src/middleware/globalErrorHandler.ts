import type { Request, Response, NextFunction } from "express";
import httpStatus from "http-status";
import { Prisma } from "../../generated/prisma/client";
import { ZodError } from "zod";
import { AppError } from "../utils/AppError";
import { sendResponse } from "../utils/sendResponse";

const globalHandler = (err: unknown, req: Request, res: Response, next: NextFunction) => {
  console.log("Error:", err);

  let statusCode: number = httpStatus.INTERNAL_SERVER_ERROR;
  let message = "Something went wrong. Please try again later.";
  let errorDetails: unknown;

  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
    errorDetails = err.errorDetails ?? err.stack; 
  }

  else if (err instanceof ZodError) {
    statusCode = httpStatus.BAD_REQUEST;
    message = "Validation failed";
    errorDetails = err.flatten().fieldErrors;
  }

  else if (err instanceof Prisma.PrismaClientValidationError) {
    statusCode = httpStatus.BAD_REQUEST;
    message = "You have provided an incorrect field type or a missing required field";
    errorDetails = { name: err.name, reason: message };
  }

  else if (err instanceof Prisma.PrismaClientKnownRequestError) {
    switch (err.code) {
      case "P2002":
        statusCode = httpStatus.CONFLICT;
        message = `Duplicate value for field(s): ${(err.meta?.target as string[])?.join(", ") ?? "unknown"}`;
        break;
      case "P2003":
        statusCode = httpStatus.BAD_REQUEST;
        message = "Foreign key constraint failed — related record does not exist";
        break;
      case "P2025":
        statusCode = httpStatus.NOT_FOUND;
        message = "The requested record was not found";
        break;
      default:
        statusCode = httpStatus.BAD_REQUEST;
        message = `Database error (code: ${err.code})`;
    }
    errorDetails = { name: err.name, prismaCode: err.code, meta: err.meta ?? {} };
  }

  else if (err instanceof Prisma.PrismaClientInitializationError) {
    statusCode = httpStatus.INTERNAL_SERVER_ERROR;
    message = "Database initialization error";
    errorDetails = { name: err.name, errorCode: err.errorCode ?? "UNKNOWN" };
  }

  else if (err instanceof Error) {
    errorDetails = { name: err.name, message: err.message };
  }

  else {
    errorDetails = { message: String(err) };
  }

  if (process.env.NODE_ENV === "development" && err instanceof Error) {
    errorDetails =
      typeof errorDetails === "object" && errorDetails !== null
        ? { ...errorDetails, stack: err.stack }
        : { message: errorDetails, stack: err.stack };
  }

  return sendResponse(res, {
    success: false,
    statusCode,
    message,
    errorDetails,
  });
};

export default globalHandler;