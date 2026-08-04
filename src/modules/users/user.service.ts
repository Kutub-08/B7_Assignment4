import { prisma } from "../../lib/prisma.js";
import { AppError } from "../../utils/AppError.js";
import type { UserProfile } from "./user.types.js";

const publicSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  phone: true,
  createdAt: true,
};

export async function getUser(id: string): Promise<UserProfile> {
  const user = await prisma.user.findUnique({
    where: { id },
    select: publicSelect,
  });
  if (!user) throw new AppError(404, "NOT_FOUND", "User not found");
  return user;
}

export async function updateUser(id: string, data: { name?: string; phone?: string }) {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) throw new AppError(404, "NOT_FOUND", "User not found");
  return prisma.user.update({
    where: { id },
    data,
    select: publicSelect,
  });
}

export async function getUserListings(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  if (!user) throw new AppError(404, "NOT_FOUND", "User not found");
  if (user.role !== "LANDLORD") {
    throw new AppError(400, "BAD_REQUEST", "User is not a landlord");
  }
  return prisma.listing.findMany({
    where: { landlordId: userId },
    include: { images: { select: { id: true, imageUrl: true, isPrimary: true } } },
    orderBy: { createdAt: "desc" },
  });
}
