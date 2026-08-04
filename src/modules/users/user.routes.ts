import { Router } from "express";
import { validate } from "../../middleware/validate.js";
import { authenticate } from "../../middleware/auth.js";
import { isSelf } from "../../middleware/isSelf.js";
import { updateUserSchema } from "./user.schema.js";
import * as userController from "./user.controller.js";

const router = Router();

/**
 * @swagger
 * /users/{id}:
 *   get:
 *     summary: Get public user profile
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: User profile (never exposes password_hash)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id: { type: string }
 *                 name: { type: string }
 *                 email: { type: string }
 *                 role: { type: string, enum: [TENANT, LANDLORD, ADMIN] }
 *                 phone: { type: string }
 *                 createdAt: { type: string, format: date-time }
 *       404: { $ref: '#/components/schemas/Error' }
 */
router.get("/:id", userController.getUser);

/**
 * @swagger
 * /users/{id}:
 *   patch:
 *     summary: Update own profile (authenticated, self-only)
 *     tags: [Users]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string, minLength: 2 }
 *               phone: { type: string }
 *     responses:
 *       200: { description: Updated user profile }
 *       401: { $ref: '#/components/schemas/Error' }
 *       403: { $ref: '#/components/schemas/Error' }
 *       404: { $ref: '#/components/schemas/Error' }
 */
router.patch("/:id", authenticate, isSelf, validate(updateUserSchema), userController.updateUser);

/**
 * @swagger
 * /users/{id}/listings:
 *   get:
 *     summary: Get listings by a landlord user
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Array of listings (if user is a landlord)
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items: { $ref: '#/components/schemas/Listing' }
 *       400: { description: User is not a landlord }
 *       404: { $ref: '#/components/schemas/Error' }
 */
router.get("/:id/listings", userController.getUserListings);

export default router;
