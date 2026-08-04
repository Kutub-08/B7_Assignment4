import { th } from "zod/v4/locales/index.js";
import { Prisma, UserStatus } from "../../../generated/prisma/client";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/AppError";
import {
  IBookingFilters,
  ICreateCategory,
  IUpdateUserStatus,
  IUserFilters,
} from "./admin.interface";
import httpStatus from "http-status";
import { BookingWhereInput } from "../../../generated/prisma/models";

const createCategoryInDb = async (payload: ICreateCategory) => {
  const { name, description, iconUrl } = payload;
  const normalizedName = name.trim();
  const isCategoryExists = await prisma.category.findFirst({
    where: {
      name: {
        equals: normalizedName,
        mode: "insensitive",
      },
    },
  });

  if (isCategoryExists) {
    throw new AppError(httpStatus.CONFLICT, "Category already exists");
  }

  const result = await prisma.category.create({
    data: {
      name: normalizedName,
      description,
      iconUrl,
    },
  });
  return result;
};

const getAllCategory = async () => {
  const result = await prisma.category.findMany({
    include: {
      services: true,
      _count: {
        select: {
          services: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });
  return result;
};

const getAllUsersFromDB = async (filters: IUserFilters) => {
  const { role, status, search, page = 1, limit = 10 } = filters;

  const conditions: Prisma.UserWhereInput[] = [
  { role: { not: "ADMIN" } },
  ];

  if (role) {
    conditions.push({ role });
  }

  if (status) {
    conditions.push({ status });
  }

  if (search) {
    conditions.push({
      OR: [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ],
    });
  }

  const whereClause: Prisma.UserWhereInput =
    conditions.length > 0 ? { AND: conditions } : {};

  const skip = (Number(page) - 1) * Number(limit);

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where: whereClause,
      include: {
        technicianProfile: {
          select: {
            id: true,
            avgRating: true,
            totalReviews: true,
            isVerified: true,
            location: true,
          },
        },
      },
      omit: {
        password: true,
      },
      skip,
      take: Number(limit),
      orderBy: { createdAt: "desc" },
    }),
    prisma.user.count({ where: whereClause }),
  ]);

  return {
    meta: {
      page: Number(page),
      limit: Number(limit),
      total,
      totalPages: Math.ceil(total / Number(limit)),
    },
    data: users,
  };
};

const updateUserStatusIntoDB = async (
  userId: string,
  payload: IUpdateUserStatus,
) => {
  const { status } = payload;

  const allowedStatuses = Object.values(UserStatus);

  const isUserExists = await prisma.user.findUnique({
    where: {
      id: userId,
    },
  });

  if (!isUserExists) {
    throw new AppError(httpStatus.NOT_FOUND, "User not found");
  }

  if (isUserExists.status === status) {
    throw new AppError(
      httpStatus.CONFLICT,
      "User status is same as per request",
    );
  }

  if (isUserExists.role === "ADMIN") {
    throw new AppError(
      httpStatus.FORBIDDEN,
      "Cannot change the status of admin",
    );
  }

  if (!allowedStatuses.includes(status)) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Status must be either ACTIVE or BANNED",
    );
  }

  const result = await prisma.user.update({
    where: {
      id: userId,
    },
    data: {
      status,
    },
    omit: {
      password: true,
    },
  });
  return result;
};

const getAllBookingsFromDB = async (filters: IBookingFilters) => {
  const {
    status,
    customerId,
    technicianId,
    fromDate,
    toDate,
    search,
    page = 1,
    limit = 10,
  } = filters;
  const skip = (Number(page) - 1) * Number(limit);

  const andConditions: BookingWhereInput[] = [];
  if (status) {
    andConditions.push({ status });
  }

  if (customerId) {
    andConditions.push({ customerId });
  }

  if (technicianId) {
    andConditions.push({ technicianId });
  }

  if (fromDate || toDate) {
    andConditions.push({
      scheduledAt: {
        ...(fromDate && { gte: new Date(fromDate) }),
        ...(toDate && { lte: new Date(toDate) }),
      },
    });
  }

  if (search) {
    andConditions.push({
      OR: [
        { customer: { name: { contains: search, mode: "insensitive" } } },
        {
          technician: {
            user: { name: { contains: search, mode: "insensitive" } },
          },
        },
      ],
    });
  }

  const [bookings, total] = await Promise.all([
    prisma.booking.findMany({
      where: {
        AND: andConditions,
      },
      include: {
        customer: {
          select: {
            name: true,
            email: true,
          },
        },
        technician: {
          select: {
            user: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        },
      },
      skip,
      take: Number(limit),
      orderBy: { createdAt: "desc" },
    }),
    prisma.booking.count({
      where: {
        AND: andConditions,
      },
    }),
  ]);

  return {
    meta: {
      page: Number(page),
      limit: Number(limit),
      total,
      totalPages: Math.ceil(total / Number(limit)),
    },
    data: bookings,
  };
};

export const adminService = {
  createCategoryInDb,
  getAllCategory,
  getAllUsersFromDB,
  updateUserStatusIntoDB,
  getAllBookingsFromDB,
};
