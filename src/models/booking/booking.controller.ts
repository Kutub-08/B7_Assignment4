import { NextFunction, Request, Response } from "express";
import { easycontroller } from "../../utils/easyController";
import httpStatus from "http-status"
import { bookingService } from "./booking.service";
import { sendResponse } from "../../utils/sendResponse";

const createBooking = easycontroller(async (req: Request, res: Response, next: NextFunction) => {
    const payload = req.body;
    const userId = req.user?.id
    const result = await bookingService.createBookingIntoDB(userId as string ,payload)
    sendResponse(res, {statusCode:httpStatus.CREATED, success:true, message:"Booking created successfully", data:result})
});

const updateBookingStatus = easycontroller(async (req: Request, res: Response, next: NextFunction) => {
    const bookingId = req.params.id as string;
    const payload = req.body;
    const technicianId = req.user?.id
    const result = await bookingService.updateBookingStatusIntoDB(bookingId, payload, technicianId as string);
    sendResponse(res, {statusCode:httpStatus.OK, success:true, message:"Booking status updated successfully", data:result})
})

const getMyBookings = easycontroller(async (req: Request, res: Response, next: NextFunction) => {
  const userId = req.user?.id as string;
  const role = req.user?.role as string;

  const result = await bookingService.getMyBookingsFromDB(userId, role);

  sendResponse(res, {statusCode:httpStatus.OK, success:true, message:"Bookings fetched successfully", data:result});
});

const getSingleBooking = easycontroller(async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params as { id: string };
  const userId = req.user?.id as string;
  const role = req.user?.role as string;

  const result = await bookingService.getSingleBookingFromDB(id, userId, role);

  sendResponse(res, {statusCode:httpStatus.OK, success:true, message:"Booking fetched successfully", data:result});
});

const cancelBooking = easycontroller(async (req: Request, res: Response, next: NextFunction) => {
  const id  = req.params.id as string;
  const customerId = req.user?.id as string;
  const payload = req.body;

  const result = await bookingService.cancelBookingIntoDB(id, customerId, payload);

  sendResponse(res, {statusCode:httpStatus.OK, success:true, message:"Booking cancelled successfully", data:result});
});

export const bookingController = {
    createBooking,
    updateBookingStatus,
    getMyBookings,
    getSingleBooking,
    cancelBooking
}