import { Router } from "express";
import { authController } from "./auth.controller";
import auth from "../../middleware/auth";
import { Role } from "../../../generated/prisma/enums";
import { validateRequest } from "../../middleware/validateRequest";
import { loginSchema, registerSchema } from "../../schema";

const router = Router();

// auth.route.ts
router.post("/register", validateRequest(registerSchema), authController.createUser);
router.post("/login", validateRequest(loginSchema), authController.loginUser);
router.get("/me", auth(Role.ADMIN, Role.TECHNICIAN, Role.CUSTOMER), authController.myInfo);


export const authRouter = router