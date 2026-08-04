import { Router } from "express";
import { adminController } from "./admin.controller";
import auth from "../../middleware/auth";
import { Role } from "../../../generated/prisma/enums";
import { validateRequest } from "../../middleware/validateRequest";
import { createCategorySchema, updateUserStatusSchema } from "../../schema";

const router = Router();

router.post("/categories", auth(Role.ADMIN),validateRequest(createCategorySchema), adminController.createCategory);
router.get("/categories", auth(Role.ADMIN), adminController.getAllCategory);
router.get("/allUsers", auth(Role.ADMIN), adminController.getAllUsers);
router.get("/bookings", auth(Role.ADMIN), adminController.getAllBookings);
router.patch("/user/:id", auth(Role.ADMIN), validateRequest(updateUserStatusSchema), adminController.updateUserStatus);

export const adminRouter = router