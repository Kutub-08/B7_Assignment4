import { Router } from "express";
import auth from "../../middleware/auth";
import { Role } from "../../../generated/prisma/enums";
import { serviceController } from "./service.controller";
import { validateRequest } from "../../middleware/validateRequest";
import { createServiceSchema } from "../../schema";

const router = Router();

router.post("/", auth(Role.TECHNICIAN), validateRequest(createServiceSchema), serviceController.createService);
router.get("/", serviceController.getAllServices);
router.get("/:id", serviceController.getServiceById);


export const serviceRouter = router