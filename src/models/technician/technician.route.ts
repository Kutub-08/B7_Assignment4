import { Router } from "express";
import auth from "../../middleware/auth";
import { Role } from "../../../generated/prisma/enums";
import { technicianController } from "./technician.controller";
import { validateRequest } from "../../middleware/validateRequest";
import { updateAvailabilitySchema, updateTechnicianProfileSchema } from "../../schema";

const router = Router();

router.get("/", technicianController.getAllTechnicians);
router.get("/:id", technicianController.getTechnicianById);
router.patch("/profile", auth(Role.TECHNICIAN),validateRequest(updateTechnicianProfileSchema), technicianController.updateUserProfiole);
router.put("/availability", auth(Role.TECHNICIAN),validateRequest(updateAvailabilitySchema), technicianController.updateAvailability);
export const technicianRouter = router