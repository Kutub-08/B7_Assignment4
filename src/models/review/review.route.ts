import { Router } from "express";
import { reviewController } from "./review.controller";
import auth from "../../middleware/auth";
import { Role } from "../../../generated/prisma/enums";
import { validateRequest } from "../../middleware/validateRequest";
import { createReviewSchema } from "../../schema";

const router = Router();

router.post("/", auth(Role.CUSTOMER), validateRequest(createReviewSchema), reviewController.createReview)

export const reviewRouter = router