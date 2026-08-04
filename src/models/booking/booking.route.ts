import { Router } from "express";
import { bookingController } from "./booking.controller";
import auth from "../../middleware/auth";
import { Role } from "../../../generated/prisma/browser";
import { exportBuffer } from "node:ffi";
import { cancelBookingSchema, createBookingSchema, updateBookingStatusSchema } from "../../schema";
import { validateRequest } from "../../middleware/validateRequest";

const router = Router();

router.post("/create", auth(Role.CUSTOMER), validateRequest(createBookingSchema), bookingController.createBooking);
router.patch("/status/:id", auth(Role.TECHNICIAN),validateRequest(updateBookingStatusSchema), bookingController.updateBookingStatus);
router.get("/", auth(Role.CUSTOMER, Role.TECHNICIAN), bookingController.getMyBookings);
router.get("/:id", auth(Role.CUSTOMER, Role.ADMIN), bookingController.getSingleBooking);
router.patch("/:id/cancel", auth(Role.CUSTOMER),validateRequest(cancelBookingSchema), bookingController.cancelBooking);

export const bookingRouter = router