import { type Request } from "express";

export function param(req: Request, name: string): string {
  const v = req.params[name];
  if (Array.isArray(v)) return v[0];
  return v;
}
