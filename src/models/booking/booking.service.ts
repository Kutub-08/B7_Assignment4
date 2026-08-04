// booking.service.ts
import httpStatus from "http-status";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/AppError";
import { ICancelBooking, ICreateBooking, IupdateBookingStatus } from "./booking.interface";
import { th } from "zod/v4/locales/index.js";
import { BookingStatus } from "../../../generated/prisma/enums";

const createBookingIntoDB = async (
  customerId: string,
  payload: ICreateBooking,
) => {
  const { serviceId, scheduledAt, address, notes } = payload;

  const isValidUser = await prisma.user.findUnique({
    where: { id: customerId },
  });

  if (!isValidUser) {
    throw new AppError(httpStatus.NOT_FOUND, "User not found");
  }

  if (isValidUser.status === "BANNED") {
    throw new AppError(httpStatus.FORBIDDEN, "User is blocked");
  }

  if (!serviceId || !scheduledAt || !address) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "serviceId, scheduledAt, and address are required",
    );
  }

  const scheduledDate = new Date(scheduledAt);
  if (isNaN(scheduledDate.getTime())) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "scheduledAt must be a valid date",
    );
  }

  if (scheduledDate <= new Date()) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "scheduledAt must be a future date/time",
    );
  }

  const service = await prisma.service.findUnique({
    where: { id: serviceId },
    include: {
      technician: true,
    },
  });

  if (!service) {
    throw new AppError(httpStatus.NOT_FOUND, "Service not found");
  }

  if (!service.isActive) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "This service is not currently active",
    );
  }

  const technicianLocation = service.technician.location;
  if (technicianLocation) {
    const addressMatches = address
      .toLowerCase()
      .includes(technicianLocation.toLowerCase());
    if (!addressMatches) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        `This technician only serves ${technicianLocation}. Please book a technician in your area.`,
      );
    }
  }

  const customerProfile = await prisma.technicianProfile.findUnique({
    where: { userId: customerId },
  });
  if (customerProfile && customerProfile.id === service.technicianId) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "You cannot book your own service",
    );
  }

  const booking = await prisma.booking.create({
    data: {
      customerId,
      technicianId: service.technicianId,
      serviceId: service.id,
      scheduledAt: scheduledDate,
      address,
      notes,
      priceAtBooking: service.price,
    },
    include: {
      service: {
        include: {
          category: true,
        },
      },
      technician: {
        include: {
          user: {
            select: {
              name: true,
              email: true,
              phone: true,
            },
          },
        },
      },
    },
  });

  return booking;
};

const allowedStatuses: BookingStatus[] = [
  "ACCEPTED",
  "DECLINED",
  "IN_PROGRESS",
  "COMPLETED",
];

const allowedTransitions: Record<BookingStatus, BookingStatus[]> = {
  REQUESTED: ["ACCEPTED", "DECLINED"],
  ACCEPTED: [],
  DECLINED: [],
  PAID: ["IN_PROGRESS"],
  IN_PROGRESS: ["COMPLETED"],
  COMPLETED: [],
  CANCELLED: [],
};

const updateBookingStatusIntoDB = async (
  bookingId: string,
  payload: IupdateBookingStatus,
  technicianId: string,
) => {
  const { status } = payload;

  if (!allowedStatuses.includes(status as BookingStatus)) {
    throw new AppError(httpStatus.BAD_REQUEST, "Invalid status");
  }

  const validatedStatus = status as BookingStatus;

  const validTechnician = await prisma.technicianProfile.findUnique({
    where: { userId: technicianId },
  });

  if (!validTechnician) {
    throw new AppError(httpStatus.NOT_FOUND, "Technician not found");
  }

  const isBookingExists = await prisma.booking.findUnique({
    where: {
      id: bookingId,
    },
  });

  if (!isBookingExists) {
    throw new AppError(httpStatus.NOT_FOUND, "Booking not found");
  }

  if (isBookingExists.technicianId !== validTechnician.id) {
    throw new AppError(
      httpStatus.FORBIDDEN,
      "You are not authorized to update this booking",
    );
  }

  const currentStatus = isBookingExists.status;

  if (currentStatus === validatedStatus) {
    throw new AppError(
      httpStatus.CONFLICT,
      "Booking status is already set to this value",
    );
  }

  const nextAllowed = allowedTransitions[currentStatus];
  if (!nextAllowed.includes(validatedStatus)) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      `Cannot change status from ${currentStatus} to ${validatedStatus}`,
    );
  }

  const updatedBooking = await prisma.booking.update({
    where: {
      id: bookingId,
    },
    data: {
      status: validatedStatus,
    },
  });

  return updatedBooking;
};

const getMyBookingsFromDB = async (userId: string, role: string) => {
  if (role === "CUSTOMER") {
    return prisma.booking.findMany({
      where: { customerId: userId },
      include: {
        service: {
          select: {
            title: true,
            description: true,
            price: true,
            durationMins: true,
            isActive: true,
            category: {
              select: {
                name: true,
                description: true,
              }
            },
          },
        },
        technician: {
          select: {
            user: {
              select: {
                name: true,
                email: true,
                phone: true,
              },
            },
            bio: true,
            location: true,
            experienceYrs: true,
            hourlyRate: true,
            totalReviews: true,
            avgRating: true,
          }
        },
        payment: {
          select: {
            status: true,
            amount: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }
  if (role === "TECHNICIAN") {
    const technicianProfile = await prisma.technicianProfile.findUnique({ where: { userId } });
    if (!technicianProfile) {
      throw new AppError(httpStatus.NOT_FOUND, "Technician profile not found");
    }

    return prisma.booking.findMany({
      where: { technicianId: technicianProfile.id },
      include: { service: true, customer: { select: { name: true, phone: true } } },
      orderBy: { createdAt: "desc" },
    });
  }
  throw new AppError(httpStatus.FORBIDDEN, "Invalid role for this operation");
};

const getSingleBookingFromDB = async (bookingId: string, userId: string, role: string) => {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
        service: {
          select: {
            title: true,
            description: true,
            price: true,
            durationMins: true,
            isActive: true,
            category: {
              select: {
                name: true,
                description: true,
              }
            },
          },
        },
        technician: {
          select: {
            user: {
              select: {
                name: true,
                email: true,
                phone: true,
              },
            },
            bio: true,
            location: true,
            experienceYrs: true,
            hourlyRate: true,
            totalReviews: true,
            avgRating: true,
          }
        },
        payment: {
          select: {
            status: true,
            amount: true,
          },
        },
      },
  });

  if (!booking) {
    throw new AppError(httpStatus.NOT_FOUND, "Booking not found");
  }

  // Admin can see any booking — no ownership check needed
  if (role === "ADMIN") {
    return booking;
  }

  if (role === "CUSTOMER") {
    if (booking.customerId !== userId) {
      throw new AppError(httpStatus.FORBIDDEN, "You are not authorized to view this booking");
    }
    return booking;
  }

  throw new AppError(httpStatus.FORBIDDEN, "Invalid role for this operation");
};

const cancellableStatuses: BookingStatus[] = ["REQUESTED", "ACCEPTED", "PAID"];

const cancelBookingIntoDB = async (
  bookingId: string,
  customerId: string,
  payload: ICancelBooking
) => {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
  });

  if (!booking) {
    throw new AppError(httpStatus.NOT_FOUND, "Booking not found");
  }

  if (booking.customerId !== customerId) {
    throw new AppError(httpStatus.FORBIDDEN, "You are not authorized to cancel this booking");
  }

  if (!cancellableStatuses.includes(booking.status)) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      `Booking cannot be cancelled once it is ${booking.status}`
    );
  }

  const updatedBooking = await prisma.booking.update({
    where: { id: bookingId },
    data: {
      status: "CANCELLED",
      cancelledAt: new Date(),
      cancelReason: payload.cancelReason ?? "Cancelled by customer",
    },
  });

  return updatedBooking;
};

export const bookingService = {
  createBookingIntoDB,
  updateBookingStatusIntoDB,
  getMyBookingsFromDB,
  getSingleBookingFromDB,
  cancelBookingIntoDB,
};
