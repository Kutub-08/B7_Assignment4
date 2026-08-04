import { Request, Response } from "express";
import httpStatus from "http-status";

export const routeNotFoundHandler = (req: Request, res: Response) => {
    res.status(httpStatus.NOT_FOUND).json({
        success: false,
        statusCode: httpStatus.NOT_FOUND,
        message: "Route not found",
        path: req.originalUrl,
        date: Date(),
    })
}