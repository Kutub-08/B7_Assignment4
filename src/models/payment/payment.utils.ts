import { Stripe } from "stripe";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/AppError";
import httpStatus from "http-status";

export const handleStripeCheckoutCompleted = async (
  session: Stripe.Checkout.Session,
) => {
  const transactionId = session.metadata?.transactionId;

  if (!transactionId) {
    console.log("Stripe webhook: missing transactionId in metadata");
    return;
  }

  await markPaymentCompleted(transactionId, session);
};

const markPaymentCompleted = async (
  transactionId: string,
  sessionData: Stripe.Checkout.Session,
) => {
  await prisma.$transaction(async (tx) => {
    const payment = await tx.payment.findUnique({
      where: { transactionId },
      include: { booking: true },
    });

    if (!payment) {
      console.log(
        `Stripe webhook: no payment found for transactionId ${transactionId}`,
      );
      return;
    }

    if (payment.status === "COMPLETED") {
      console.log(
        `Stripe webhook: payment ${transactionId} already marked COMPLETED, skipping`,
      );
      return;
    }
    const paymentIntentId =
      typeof sessionData.payment_intent === "string"
        ? sessionData.payment_intent
        : (sessionData.payment_intent?.id ?? null);

    await tx.payment.update({
      where: { id: payment.id },
      data: {
        status: "COMPLETED",
        paidAt: new Date(),
        gatewayMeta: {
          sessionId: sessionData.id,
          paymentIntentId,
          paymentStatus: sessionData.payment_status,
          amountTotal: sessionData.amount_total,
          currency: sessionData.currency,
          customerEmail: sessionData.customer_details?.email ?? null,
        },
      },
    });

    await tx.booking.update({
      where: { id: payment.bookingId },
      data: { status: "PAID" },
    });
  });
};

export const handleStripeCheckoutExpired = async (
  session: Stripe.Checkout.Session,
) => {
  const transactionId = session.metadata?.transactionId;
  if (!transactionId) return;

  await prisma.payment.updateMany({
    where: { transactionId, status: "PENDING" },
    data: {
      status: "FAILED",
      failureReason: "Checkout session expired without payment",
    },
  });
};
