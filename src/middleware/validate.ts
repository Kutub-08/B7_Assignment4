import { type Request, type Response, type NextFunction } from "express";
import { type ZodSchema, ZodError } from "zod";
import { AppError } from "../utils/AppError.js";

export function validate(schema: ZodSchema, source: "body" | "query" | "params" = "body") {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      const parsed = schema.parse(req[source]);
      if (source === "query" || source === "params") {
        Object.assign(req[source] as Record<string, unknown>, parsed);
      } else {
        (req as unknown as Record<string, unknown>)[source] = parsed;
      }
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        const messages = err.issues.map((e) => `${e.path.join(".")}: ${e.message}`).join("; ");
        throw new AppError(400, "VALIDATION_ERROR", messages);
      }
      next(err);
    }
  };
}
