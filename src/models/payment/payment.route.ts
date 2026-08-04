import { Router } from "express";
import { paymentController } from "./payment.controller";
import auth from "../../middleware/auth";
import { Role } from "../../../generated/prisma/enums";
import { createPaymentSchema } from "../../schema";
import { validateRequest } from "../../middleware/validateRequest";

const router = Router();

router.post("/create", auth(Role.CUSTOMER),validateRequest(createPaymentSchema), paymentController.createPayment)
router.post("/confirm", paymentController.webhook)
router.get("/", auth(Role.CUSTOMER), paymentController.getMyPayments)
router.get("/:id", auth(Role.CUSTOMER), paymentController.getMyPaymentById)

export const paymentRouter = router