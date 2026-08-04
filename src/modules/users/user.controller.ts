import { type Request, type Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { success } from "../../utils/apiResponse.js";
import * as userService from "./user.service.js";

export const getUser = asyncHandler(async (req: Request, res: Response) => {
  const user = await userService.getUser(req.params.id as string);
  success(res, user);
});

export const updateUser = asyncHandler(async (req: Request, res: Response) => {
  const user = await userService.updateUser(req.params.id as string, req.body);
  success(res, user);
});

export const getUserListings = asyncHandler(async (req: Request, res: Response) => {
  const listings = await userService.getUserListings(req.params.id as string);
  success(res, listings);
});
