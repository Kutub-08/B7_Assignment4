import { NextFunction, Request, Response } from "express";
import { easycontroller } from "../../utils/easyController";
import { technicianService } from "./technician.service";
import httpStatus from "http-status"
import { sendResponse } from "../../utils/sendResponse";

const updateUserProfiole = easycontroller(async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.user?.id
    const payload = req.body;
    const result = await technicianService.updateTEchnicianProfileINDB(userId as string, payload)
    sendResponse(res, {statusCode:httpStatus.OK, success:true, message:"Technician profile updated successfully", data:result})
})

const getAllTechnicians = easycontroller(async (req: Request, res: Response, next: NextFunction) => {
    const query = req.query;
    const result = await technicianService.getAllTechniciansFromDB(query)
    sendResponse(res, {statusCode:httpStatus.OK, success:true, message:"Technicians fetched successfully", data:result})
})

const getTechnicianById = easycontroller(async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.params.id;
    const result = await technicianService.getTechnicianByIdFromDB(userId as string)
    sendResponse(res, {statusCode:httpStatus.OK, success:true, message:"Technician fetched successfully", data:result})
})

const updateAvailability = easycontroller(async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.user?.id;
    const payload = req.body;
    const result = await technicianService.updateAvailabilityInDB(userId as string, payload)
    sendResponse(res, {statusCode:httpStatus.OK, success:true, message:"Availability updated successfully", data:result})
})


export const technicianController = {
    updateUserProfiole,
    getAllTechnicians,
    getTechnicianById,
    updateAvailability
}