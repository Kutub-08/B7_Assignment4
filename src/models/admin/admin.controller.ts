import { NextFunction, Request, Response } from "express";
import { easycontroller } from "../../utils/easyController";
import { adminService } from "./admin.service";
import httpStatus from "http-status"
import { sendResponse } from "../../utils/sendResponse";

const createCategory = easycontroller(async (req: Request, res: Response, next: NextFunction) => {
    const payload = req.body;
    const rusult = await adminService.createCategoryInDb(payload);
    sendResponse(res, {statusCode:httpStatus.CREATED, success:true, message:"Category created successfully", data:rusult})
});

const getAllCategory = easycontroller(async (req: Request, res: Response, next: NextFunction) => {
    const result = await adminService.getAllCategory();
    sendResponse(res, {statusCode:httpStatus.OK, success:true, message:"All Categories fetched successfully", data:result})
})

const getAllUsers = easycontroller(async (req: Request, res: Response, next: NextFunction) => {
    const query = req.query
    const result = await adminService.getAllUsersFromDB(query);
    sendResponse(res, {statusCode:httpStatus.OK, success:true, message:"All Users fetched successfully", data:result})
})

const updateUserStatus = easycontroller(async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.params.id as string;
    const payload = req.body;
    const result = await adminService.updateUserStatusIntoDB(userId, payload);
    sendResponse(res, {statusCode:httpStatus.OK, success:true, message:"User status updated successfully", data:result})
})

const getAllBookings = easycontroller(async (req: Request, res: Response, next: NextFunction) => {
    const query = req.query
    const result = await adminService.getAllBookingsFromDB(query);
    sendResponse(res, {statusCode:httpStatus.OK, success:true, message:"All Bookings fetched successfully", data:result})
})

export const adminController = {
    createCategory,
    getAllCategory,
    getAllUsers,
    updateUserStatus,
    getAllBookings
}