import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/AppError";
import { ICreateReview } from "./review.interface";
import httpStatus from "http-status";

const createReviewIntoDB = async (customerId: string, payload: ICreateReview) => {
  const { bookingId, rating, comment } = payload;

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { review: true },
  });

  if (!booking) {
    throw new AppError(httpStatus.NOT_FOUND, "Booking not found");
  }

  if (booking.customerId !== customerId) {
    throw new AppError(httpStatus.FORBIDDEN, "You are not authorized to review this booking");
  }

  if (booking.status !== "COMPLETED") {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      `Reviews can only be submitted after a booking is COMPLETED. Current status: ${booking.status}`
    );
  }

  if (booking.review) {
    throw new AppError(httpStatus.CONFLICT, "You have already reviewed this booking");
  }

  if (rating < 1 || rating > 5) {
    throw new AppError(httpStatus.BAD_REQUEST, "Rating must be between 1 and 5");
  }

  const result = await prisma.$transaction(async (tx) => {
    const review = await tx.review.create({
      data: {
        bookingId,
        customerId,
        technicianId: booking.technicianId,
        rating,
        comment,
      },
    });

    const stats = await tx.review.aggregate({
      where: { technicianId: booking.technicianId },
      _avg: { rating: true },
      _count: { rating: true },
    });

    await tx.technicianProfile.update({
      where: { id: booking.technicianId },
      data: {
        avgRating: stats._avg.rating ?? 0,
        totalReviews: stats._count.rating,
      },
    });

    return review;
  });

  return result;
};

export const reviewService = {
    createReviewIntoDB
}