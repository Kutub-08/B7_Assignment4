import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/AppError";
import { ICreateUser, ILogin } from "../../schema/index";
import bcrypt from "bcryptjs";
import httpStatus from "http-status";
import config from "../../config";
import { jwtUtils } from "../../utils/jwtutils";
import { SignOptions } from "jsonwebtoken";

const allowedRoles = ["CUSTOMER", "TECHNICIAN"];

const createUserIntoDB = async (payload: ICreateUser) => {
  const { name, email, password, phone, role, address, avatarUrl } = payload;

  if (!allowedRoles.includes(role)) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Role must be either CUSTOMER or TECHNICIAN",
    );
  }

  const isUserExists = await prisma.user.findUnique({ where: { email } });
  if (isUserExists) {
    throw new AppError(httpStatus.CONFLICT, "User already exists");
  }

  const hashedPassword = await bcrypt.hash(
    password,
    Number(config.bcrypt_salt_rounds),
  );

  if (payload.role === "TECHNICIAN") {
    const { bio, skills, hourlyRate, experienceYrs, location } = payload;

    const result = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        phone,
        role,
        address,
        avatarUrl,
        technicianProfile: {
          create: {
            bio,
            skills: skills,
            hourlyRate: hourlyRate!,
            experienceYrs: experienceYrs,
            location: location ?? address,
          },
        },
      },
      omit: { password: true },
    });

    return result;
  }

  const result = await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
      phone,
      role,
      address,
      avatarUrl,
    },
    omit: { password: true },
  });

  return result;
};

const loginUser = async (payload: ILogin) => {
  const { email, password } = payload;

  const user = await prisma.user.findUnique({
    where: {
      email,
    },
  });

  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, "User not found");
  }

  if (user.status === "BANNED") {
    throw new AppError(httpStatus.FORBIDDEN, "User is blocked");
  }

  const isPasswordMatch = await bcrypt.compare(password, user.password);

  if (!isPasswordMatch) {
    throw new AppError(httpStatus.UNAUTHORIZED, "Invalid email or password");
  }

  const jwtPayload = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  };

  const accessToken = jwtUtils.createToken(
    jwtPayload,
    config.jwt_access_secret,
    config.jwt_access_expires_in as SignOptions,
  );

  const refreshToken = jwtUtils.createToken(
    jwtPayload,
    config.jwt_refresh_secret,
    config.jwt_refresh_expires_in as SignOptions,
  );

  return {
    accessToken,
    refreshToken,
  };
};

const getMyInfo = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
    include: {
      technicianProfile: true,
    },
    omit: {
      password: true,
    },
  });

  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, "User not found");
  }

  if (user.status === "BANNED") {
    throw new AppError(httpStatus.FORBIDDEN, "User is blocked");
  }

  if (user?.role === "CUSTOMER") {
    const { technicianProfile, ...userInfo } = user;
    return userInfo;
  }
  return user;
};

export const authService = {
  createUserIntoDB,
  loginUser,
  getMyInfo,
};
