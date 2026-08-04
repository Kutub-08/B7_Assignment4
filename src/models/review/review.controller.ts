import { NextFunction, Request, Response } from "express";
import { easycontroller } from "../../utils/easyController";
import { reviewService } from "./review.service";
import httpStatus from "http-status"
import { sendResponse } from "../../utils/sendResponse";

const createReview =easycontroller(async (req: Request, res: Response, next: NextFunction) => {
    const payload = req.body;
    const userId = req.user?.id as string;
    const result = await reviewService.createReviewIntoDB(userId, payload)
    sendResponse(res, {statusCode:httpStatus.CREATED, success:true, message:"Review created successfully", data:result})
})


export const reviewController = {
    createReview
}