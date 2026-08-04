import { type Request, type Response, type NextFunction } from "express";
import rateLimit from "express-rate-limit";

const isTest = process.env.NODE_ENV === "test";

function noop(_req: Request, _res: Response, next: NextFunction) {
  next();
}

const message = {
  success: false,
  error: { code: "RATE_LIMITED", message: "Too many requests, please slow down" },
};

export const globalLimiter = isTest
  ? noop
  : rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 100,
      standardHeaders: true,
      legacyHeaders: false,
      message,
    });

export const authLimiter = isTest
  ? noop
  : rateLimit({
      windowMs: 60 * 1000,
      max: 10,
      standardHeaders: true,
      legacyHeaders: false,
      message,
    });

export const inquiryLimiter = isTest
  ? noop
  : rateLimit({
      windowMs: 60 * 1000,
      max: 10,
      standardHeaders: true,
      legacyHeaders: false,
      message,
    });

export const aiLimiter = isTest
  ? noop
  : rateLimit({
      windowMs: 60 * 1000,
      max: 10,
      standardHeaders: true,
      legacyHeaders: false,
      message: {
        success: false,
        error: { code: "RATE_LIMITED", message: "Too many AI requests, please slow down" },
      },
    });
