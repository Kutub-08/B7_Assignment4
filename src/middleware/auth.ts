import { NextFunction, Request, Response } from "express";
import { easycontroller } from "../utils/easyController";
import { Role } from "../../generated/prisma/enums";
import { AppError } from "../utils/AppError";
import { jwtUtils } from "../utils/jwtutils";
import config from "../config";
import { JwtPayload } from "jsonwebtoken";
import httpStatus from "http-status";
import { prisma } from "../lib/prisma";

const auth =  (...requiredRoles : Role[]) => {
    return easycontroller(async (req: Request, res: Response, next: NextFunction) => {

        const token = req.cookies.accessToken ? req.cookies.accessToken:
        req.headers.authorization?.startsWith("Bearer")? req.headers.authorization.split(" ")[1] : req.headers.authorization;

        if (!token) {
            throw new AppError(httpStatus.UNAUTHORIZED, "Unauthorized");
        }

        const verifyToken = jwtUtils.verifyToken(token, config.jwt_access_secret);

        if (!verifyToken.success) {
            throw new AppError(httpStatus.UNAUTHORIZED, verifyToken.error);
        }

        const {id, name, email, role, status} = verifyToken.data as JwtPayload;

        if (!requiredRoles.includes(role)) {
            throw new AppError(httpStatus.FORBIDDEN, "Forbidden access");
        }

        const user = await prisma.user.findUnique({
            where: {
                id,
                email,
                name,
                role,
                status
            }
        });

        if (!user) {
            throw new AppError(httpStatus.BAD_REQUEST, "User not found");
        }

        if (user.status === "BANNED") {
            throw new AppError(httpStatus.FORBIDDEN, "Your account has beem blocked. Please contact with support team");
        }

        req.user = {
            id,
            name,
            email,
            role,
            status
        }

        next();
        
    })
}

export default auth