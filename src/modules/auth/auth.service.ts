import crypto from "node:crypto";
import { prisma } from "../../lib/prisma.js";
import { AppError } from "../../utils/AppError.js";
import { hashPassword, comparePassword, hashToken } from "../../utils/hash.js";
import { generateAccessToken } from "../../utils/jwt.js";
import logger from "../../config/logger.js";
import type { AuthPayload } from "./auth.types.js";

const REFRESH_TOKEN_BYTES = 64;
const REFRESH_TOKEN_DAYS = 7;

function generateRawToken(): string {
  return crypto.randomBytes(REFRESH_TOKEN_BYTES).toString("hex");
}

async function createRefreshTokenRecord(userId: string): Promise<string> {
  const raw = generateRawToken();
  const hashed = hashToken(raw);
  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_DAYS * 24 * 60 * 60 * 1000);
  await prisma.refreshToken.create({
    data: { userId, tokenHash: hashed, expiresAt },
  });
  return raw;
}

async function buildAuthPayload(userId: string): Promise<{ payload: AuthPayload; rawRefreshToken: string }> {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  const accessToken = generateAccessToken({ userId: user.id, role: user.role });
  const rawRefreshToken = await createRefreshTokenRecord(user.id);
  return {
    payload: {
      user: serializeUser(user),
      accessToken,
    },
    rawRefreshToken,
  };
}

function serializeUser(user: {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  isVerified: boolean;
  createdAt: Date;
}): AuthPayload["user"] {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role as "TENANT" | "LANDLORD" | "ADMIN",
    isVerified: user.isVerified,
    createdAt: user.createdAt,
  };
}

export async function register(data: {
  name: string;
  email: string;
  phone: string;
  password: string;
  role: "TENANT" | "LANDLORD";
}) {
  const existing = await prisma.user.findUnique({ where: { email: data.email } });
  if (existing) {
    throw new AppError(409, "EMAIL_TAKEN", "Email is already registered");
  }
  const passwordHash = await hashPassword(data.password);
  const raw = generateRawToken();
  const hashed = hashToken(raw);
  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_DAYS * 24 * 60 * 60 * 1000);

  const user = await prisma.$transaction(async (tx) => {
    const u = await tx.user.create({
      data: {
        name: data.name,
        email: data.email,
        phone: data.phone,
        passwordHash,
        role: data.role,
      },
    });
    await tx.refreshToken.create({
      data: { userId: u.id, tokenHash: hashed, expiresAt },
    });
    return u;
  });

  const accessToken = generateAccessToken({ userId: user.id, role: user.role });
  return {
    payload: {
      user: serializeUser(user),
      accessToken,
    },
    rawRefreshToken: raw,
  };
}

export async function login(email: string, password: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    throw new AppError(401, "INVALID_CREDENTIALS", "Invalid email or password");
  }
  const valid = await comparePassword(password, user.passwordHash);
  if (!valid) {
    throw new AppError(401, "INVALID_CREDENTIALS", "Invalid email or password");
  }
  return buildAuthPayload(user.id);
}

export async function refresh(rawToken: string) {
  const hashed = hashToken(rawToken);
  const record = await prisma.refreshToken.findFirst({
    where: { tokenHash: hashed, revoked: false },
    include: { user: true },
  });
  if (!record) {
    throw new AppError(401, "INVALID_REFRESH_TOKEN", "Refresh token is invalid");
  }
  if (record.expiresAt < new Date()) {
    throw new AppError(401, "REFRESH_TOKEN_EXPIRED", "Refresh token has expired");
  }
  await prisma.refreshToken.update({ where: { id: record.id }, data: { revoked: true } });
  return buildAuthPayload(record.user.id);
}

export async function logout(rawToken: string) {
  const hashed = hashToken(rawToken);
  await prisma.refreshToken.updateMany({
    where: { tokenHash: hashed, revoked: false },
    data: { revoked: true },
  });
}

const RESET_TOKEN_BYTES = 32;
const RESET_TOKEN_MINUTES = 15;

export async function forgotPassword(email: string): Promise<{ message: string }> {
  const user = await prisma.user.findUnique({ where: { email } });

  const message = "If that email is registered, a reset link has been sent";

  if (!user) {
    return { message };
  }

  const raw = crypto.randomBytes(RESET_TOKEN_BYTES).toString("hex");
  const hashed = hashToken(raw);
  const expiresAt = new Date(Date.now() + RESET_TOKEN_MINUTES * 60 * 1000);

  await prisma.passwordResetToken.create({
    data: { userId: user.id, tokenHash: hashed, expiresAt },
  });

  const resetLink = `${process.env.CLIENT_URL}/reset-password?token=${raw}`;
  logger.info(`[DEV] Password reset link for ${email}: ${resetLink}`);

  return { message };
}

export async function resetPassword(token: string, newPassword: string): Promise<{ message: string }> {
  const hashed = hashToken(token);
  const record = await prisma.passwordResetToken.findFirst({
    where: { tokenHash: hashed, usedAt: null, expiresAt: { gte: new Date() } },
  });

  if (!record) {
    throw new AppError(400, "INVALID_RESET_TOKEN", "Reset token is invalid or expired");
  }

  const passwordHash = await hashPassword(newPassword);

  await prisma.$transaction([
    prisma.user.update({
      where: { id: record.userId },
      data: { passwordHash },
    }),
    prisma.passwordResetToken.update({
      where: { id: record.id },
      data: { usedAt: new Date() },
    }),
  ]);

  return { message: "Password has been reset successfully" };
}

export async function getMe(userId: string) {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  return serializeUser(user);
}
