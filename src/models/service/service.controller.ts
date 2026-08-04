import { NextFunction, Request, Response } from "express";
import { easycontroller } from "../../utils/easyController";
import httpStatus from "http-status"
import { serviceService } from "./service.service";
import { sendResponse } from "../../utils/sendResponse";

const createService = easycontroller(async (req: Request, res: Response, next: NextFunction) => {
    const payload = req.body;
    const userId = req.user?.id as string;
    const result = await serviceService.createServiceIntoDB(userId as string, payload);
    sendResponse(res, {statusCode:httpStatus.CREATED, success:true, message:"Service created successfully", data:result})
})

const getAllServices = easycontroller(async (req: Request, res: Response, next: NextFunction) => {
    const query = req.query
    const result = await serviceService.getAllServicesFromDB(query);
    sendResponse(res, {statusCode:httpStatus.OK, success:true, message:"Services fetched successfully", data:result})
})

const getServiceById = easycontroller(async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const result = await serviceService.getServiceByIdFromDB(id as string);
    sendResponse(res, {statusCode:httpStatus.OK, success:true, message:"Service fetched successfully", data:result})
})

export const serviceController = {
    createService,
    getAllServices,
    getServiceById
}