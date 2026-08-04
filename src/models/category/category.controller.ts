import { NextFunction, Request, Response } from "express";
import { easycontroller } from "../../utils/easyController";
import { categoryService } from "./category.service";
import httpStatus from "http-status"
import { sendResponse } from "../../utils/sendResponse";

const getAllCategory = easycontroller (async (req: Request, res: Response, next: NextFunction) => {
   const query = req.query
   const result = await categoryService.getAllCategoryFromDB(query)
   sendResponse(res,{ success:true, statusCode: httpStatus.OK, message: "Categories fetched successfully", data:result})
})

export const categoryController = {
    getAllCategory
}

