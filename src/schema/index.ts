import { z } from "zod";

//Auth
const baseUserFields = {
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.email("A valid email is required"),
  password: z.string().min(1, "Password must be at least 1 characters"),
  phone: z.string().min(1, "Phone is required"),
  address: z.string().optional(),
  avatarUrl: z.url().optional(),
};

const customerRegisterSchema = z.object({
  role: z.literal("CUSTOMER"),
  ...baseUserFields,
});

const technicianRegisterSchema = z.object({
  role: z.literal("TECHNICIAN"),
  ...baseUserFields,
  bio: z.string().optional(),
  skills: z.array(z.string()).optional(),
  hourlyRate: z.number().positive("hourlyRate must be a positive number").optional(),
  experienceYrs: z.number().nonnegative("experienceYrs must be zero or positive").optional(),
  location: z.string().optional(),
});


export const registerSchema = z.discriminatedUnion("role", [
  customerRegisterSchema,
  technicianRegisterSchema,
]);

export type ICreateUser = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: z.email("A valid email is required"),
  password: z.string().min(1, "Password is required"),
});

export type ILogin = z.infer<typeof loginSchema>;


// Technician
export const updateTechnicianProfileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").optional(),
  phone: z.string().min(1, "Phone is required").optional(),
  address: z.string().optional(),
  avatarUrl: z.url().optional(),
  bio: z.string().optional(),
  skills: z.array(z.string()).optional(),
  hourlyRate: z.number().positive("hourlyRate must be a positive number").optional(),
  experienceYrs: z.number().nonnegative("experienceYrs must be zero or positive").optional(),
  location: z.string().optional(),
});

export type IUpdateTechnicianProfile = z.infer<typeof updateTechnicianProfileSchema>;

const dayOfWeekEnum = z.enum([
  "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY",
]);

const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;

const availabilitySlotSchema = z
  .object({
    dayOfWeek: dayOfWeekEnum,
    startTime: z.string().regex(timeRegex, "startTime must be in HH:mm format"),
    endTime: z.string().regex(timeRegex, "endTime must be in HH:mm format"),
  })
  .refine((slot) => slot.startTime < slot.endTime, {
    message: "startTime must be before endTime",
    path: ["endTime"],
  });

export const updateAvailabilitySchema = z
  .array(availabilitySlotSchema)
  .min(1, "Availability must be a non-empty array of slots");

export type IUpdateAvailability = z.infer<typeof updateAvailabilitySchema>;


// ADMIN
export const createCategorySchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  description: z.string().optional(),
});

export type ICreateCategory = z.infer<typeof createCategorySchema>;

export const updateUserStatusSchema = z.object({
  status: z.enum(["ACTIVE", "BANNED"], {
    error: "status must be either ACTIVE or BANNED",
  }),
});

export type IUpdateUserStatus = z.infer<typeof updateUserStatusSchema>;

// SERVICE
export const createServiceSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().min(1, "Description is required"),
  category: z.string().min(1, "Category is required"),
  price: z.number().positive("Price must be a positive number"),
  durationMins: z.number().positive("durationMins must be a positive number").optional(),
});

export type ICreateService = z.infer<typeof createServiceSchema>;

// BOOKING
export const createBookingSchema = z.object({
  serviceId: z.string().min(1, "serviceId is required"),
  scheduledAt: z
    .iso.datetime({ message: "scheduledAt must be a valid ISO date" })
    .refine((val) => new Date(val) > new Date(), {
      message: "scheduledAt must be a future date/time",
    }),
  address: z.string().min(1, "address is required"),
  notes: z.string().optional(),
});

export type ICreateBooking = z.infer<typeof createBookingSchema>;

export const updateBookingStatusSchema = z.object({
  status: z.enum(["ACCEPTED", "DECLINED", "IN_PROGRESS", "COMPLETED"], {
    error: "Invalid status value",
  }),
});

export type IUpdateBookingStatus = z.infer<typeof updateBookingStatusSchema>;

export const cancelBookingSchema = z.object({
  cancelReason: z.string().optional(),
});

export type ICancelBooking = z.infer<typeof cancelBookingSchema>;

// PAYMENT
export const createPaymentSchema = z.object({
  bookingId: z.string().min(1, "bookingId is required"),
});

export type ICreatePayment = z.infer<typeof createPaymentSchema>;

// REVIEW
export const createReviewSchema = z.object({
  bookingId: z.string().min(1, "bookingId is required"),
  rating: z.number().min(1, "Rating must be at least 1").max(5, "Rating must be at most 5"),
  comment: z.string().optional(),
});

export type ICreateReview = z.infer<typeof createReviewSchema>;