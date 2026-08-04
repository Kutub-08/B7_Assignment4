import { type Request, type Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { success } from "../../utils/apiResponse.js";
import { param } from "../../utils/param.js";
import * as aiService from "./ai.service.js";

export const recommend = asyncHandler(async (req: Request, res: Response) => {
  const { query } = req.body;
  const result = await aiService.recommend(query);
  success(res, result);
});

export const findSimilar = asyncHandler(async (req: Request, res: Response) => {
  const listings = await aiService.findSimilar(param(req, "listingId"));
  success(res, listings);
});
