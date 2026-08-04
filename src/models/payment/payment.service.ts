import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/AppError";
import { ICreatePayment } from "./payment.interface";
import httpStatus from "http-status";
import { randomUUID } from "crypto";
import { stripe } from "../../lib/stripe";
import config from "../../config";
import { handleStripeCheckoutCompleted, handleStripeCheckoutExpired } from "./payment.utils";
import { Stripe } from "stripe";

const createPayment = async (userId: string, payload: ICreatePayment) => {
  const { bookingId } = payload;

  const { payment, booking, transactionId } = await prisma.$transaction(
    async (tx) => {
      const isBookingExists = await tx.booking.findUnique({
        where: { id: bookingId },
        include: { customer: true, payment: true },
      });

      if (!isBookingExists) {
        throw new AppError(httpStatus.NOT_FOUND, "Booking not found");
      }

      if (isBookingExists.customerId !== userId) {
        throw new AppError(
          httpStatus.FORBIDDEN,
          "You are not authorized to pay for this booking",
        );
      }

      if (isBookingExists.status !== "ACCEPTED") {
        throw new AppError(
          httpStatus.BAD_REQUEST,
          `Payment can only be created for an ACCEPTED booking. Current status: ${isBookingExists.status}`,
        );
      }

      if (isBookingExists.payment?.status === "COMPLETED") {
        throw new AppError(
          httpStatus.CONFLICT,
          "This booking has already been paid for",
        );
      }

      const newTransactionId = `FIXITNOW-${randomUUID()}`;

      const paymentRecord = await tx.payment.upsert({
        where: { bookingId },
        update: {
          transactionId: newTransactionId,
          amount: isBookingExists.priceAtBooking,
          status: "PENDING",
        },
        create: {
          transactionId: newTransactionId,
          amount: isBookingExists.priceAtBooking,
          bookingId,
          customerId: userId,
          status: "PENDING",
        },
      });

      return {
        payment: paymentRecord,
        booking: isBookingExists,
        transactionId: newTransactionId,
      };
    },
  );

  let paymentURL: string | null = null;

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency: "bdt",
          product_data: { name: `FixItNow Booking #${booking.id}` },
          unit_amount: Math.round(Number(booking.priceAtBooking) * 100),
        },
        quantity: 1,
      },
    ],
    success_url: `${config.app_url}/dashboard/bookings`,
    cancel_url: `${config.app_url}/payment/cancel?tran_id=${transactionId}`,
    metadata: {
      bookingId: booking.id,
      transactionId,
      customerId: userId,
      paymentId: payment.id,
    },
  });

  if (!session.url) {
    throw new AppError(
      httpStatus.INTERNAL_SERVER_ERROR,
      "Failed to generate payment link",
    );
  }

  paymentURL = session.url;

  await prisma.payment.update({
    where: { id: payment.id },
    data: { stripeSessionId: session.id },
  });

  return { transactionId, paymentURL };
};

const webhook = async (payload: Buffer, signature: string) => {
  const endpointSecret = config.stripe_webhook_secret;
  const event = stripe.webhooks.constructEvent(
    payload,
    signature,
    endpointSecret,
  );
  switch (event.type) {
    case "checkout.session.completed":
      await handleStripeCheckoutCompleted(
        event.data.object as Stripe.Checkout.Session,
      );
      break;
    case "checkout.session.expired":
      await handleStripeCheckoutExpired(
        event.data.object as Stripe.Checkout.Session,
      );
      break;
    default:
      console.log(`Unhandled stripe event type ${event.type}`);
      break;
  }
};

const getMyPaymentsFromDB = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, status: true },
  });

  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, "User not found");
  }

  if (user.status === "BANNED") {
    throw new AppError(httpStatus.FORBIDDEN, "Your account has been banned");
  }

  const result = await prisma.payment.findMany({
    where: { customerId: userId },
    include: {
      booking: {
        include: { 
            service: true 
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return result;
};

const getMyPaymentByIdFromDB = async (userId: string, paymentId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, status: true },
  });

  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, "User not found");
  }

  if (user.status === "BANNED") {
    throw new AppError(httpStatus.FORBIDDEN, "Your account has been banned");
  }

  const result = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: {
      booking: {
        include: { service: true },
      },
    },
  });

  if (!result) {
    throw new AppError(httpStatus.NOT_FOUND, "Payment not found");
  }

  if (result.customerId !== userId) {
    throw new AppError(httpStatus.FORBIDDEN, "You are not authorized to view this payment");
  }

  return result;
};

export const paymentService = {
  createPayment,
  webhook,
  getMyPaymentsFromDB,
  getMyPaymentByIdFromDB
};
