import { type Request, type Response, type NextFunction } from "express";
import { AppError } from "../utils/AppError.js";

export function isSelf(req: Request, _res: Response, next: NextFunction) {
  const userId = req.user?.id;
  if (!userId) {
    throw new AppError(401, "UNAUTHORIZED", "Authentication required");
  }
  if (req.params.id !== userId) {
    throw new AppError(403, "FORBIDDEN", "You can only modify your own profile");
  }
  next();
}
