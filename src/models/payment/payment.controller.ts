import { NextFunction, Request, Response } from "express";
import { easycontroller } from "../../utils/easyController";
import { paymentService } from "./payment.service";
import httpStatus from "http-status"
import { sendResponse } from "../../utils/sendResponse";

const createPayment = easycontroller(async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.user?.id;
    const payload = req.body;
    const result = await paymentService.createPayment(userId as string, payload);
    sendResponse(res, {statusCode:httpStatus.CREATED, success:true, message:"Payment created successfully", data:result})
})

const webhook = easycontroller(async (req: Request, res: Response, next: NextFunction) => {
    const payload = req.body as Buffer;
    const signature = req.headers["stripe-signature"]! as string;
    const result = await paymentService.webhook(payload, signature);
    sendResponse(res,{statusCode:httpStatus.OK, success:true, message:"Payment created successfully", data:result})
})

const getMyPayments = easycontroller(async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.user?.id;
    const result = await paymentService.getMyPaymentsFromDB(userId as string);
    sendResponse(res, { statusCode:httpStatus.OK,success: true, message:"All My Payments fetched successfully", data:result})
})

const getMyPaymentById = easycontroller(async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.user?.id;
    const paymentId = req.params.id as string;
    const result = await paymentService.getMyPaymentByIdFromDB(userId as string, paymentId);
    sendResponse(res, { statusCode:httpStatus.OK, success:true, message: "My Payment fetched successfully", data:result})
})

export const paymentController = {
    createPayment,
    webhook,
    getMyPayments,
    getMyPaymentById
}