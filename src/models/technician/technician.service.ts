import { email } from "zod";
import { TechnicianProfileWhereInput } from "../../../generated/prisma/models";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/AppError";
import {
  ITechnicianFilters,
} from "./technician.interface";
import httpStatus from "http-status";
import { DayOfWeek } from "../../../generated/prisma/enums";
import { IUpdateAvailability, IUpdateTechnicianProfile } from "../../schema";

const updateTEchnicianProfileINDB = async (
  userId: string,
  payload: IUpdateTechnicianProfile,
) => {
  const {
    name,
    phone,
    address,
    avatarUrl,
    skills,
    hourlyRate,
    bio,
    experienceYrs,
    location,
  } = payload;
  const isUserExists = await prisma.user.findUnique({
    where: {
      id: userId,
    },
  });

  if (!isUserExists) {
    throw new AppError(httpStatus.NOT_FOUND, "User not found");
  }

  if (isUserExists.status === "BANNED") {
    throw new AppError(httpStatus.FORBIDDEN, "User is blocked");
  }
  const updatedUser = await prisma.user.update({
    where: {
      id: userId,
    },
    data: {
      name,
      phone,
      address,
      avatarUrl,
      technicianProfile: {
        update: {
          skills,
          hourlyRate,
          bio,
          experienceYrs,
          location,
        },
      },
    },
    omit: {
      password: true,
    },
    include: {
      technicianProfile: true,
    },
  });
  return updatedUser;
};

const getAllTechniciansFromDB = async (query: ITechnicianFilters) => {
  const {
    category,
    limit = 10,
    location,
    minExperience,
    minRating,
    page = 1,
    search,
    skill,
  } = query;
  const andCondition: TechnicianProfileWhereInput[] = [];
  const skip = (Number(page) - 1) * Number(limit);

  if (location) {
    andCondition.push({
      location: {
        contains: location,
        mode: "insensitive",
      },
    });
  }

  if (skill) {
    andCondition.push({
      skills: {
        has: skill,
      },
    });
  }

  if (minExperience !== undefined) {
    andCondition.push({
      experienceYrs: {
        gte: Number(minExperience),
      },
    });
  }

  if (minRating !== undefined) {
    andCondition.push({
      avgRating: {
        gte: Number(minRating),
      },
    });
  }

  if (search) {
    andCondition.push({
      OR: [
        {
          user: {
            name: {
              contains: search,
              mode: "insensitive",
            },
          },
        },
        {
          bio: {
            contains: search,
            mode: "insensitive",
          },
        },
      ],
    });
  }

  andCondition.push({
    isVerified: true,
  });

  if (category) {
    andCondition.push({
      services: {
        some: {
          category: {
            name: {
              equals: category,
              mode: "insensitive",
            },
          },
        },
      },
    });
  }

  const [technician, total] = await Promise.all([
    prisma.technicianProfile.findMany({
      where: {
        AND: andCondition,
      },
      include: {
      user: {
        select: {
          name: true,
          avatarUrl: true,
          address: true,
          phone: true,
          email: true,
          status: true
        }
      },
      services: {
        where: {
          isActive: true
        }
      },
      bookings: {
        select: {
          status: true,
          priceAtBooking: true,
          payment: {
            select: {
              status: true,
            }
          },
          customer: {
            select: {
              name: true,
              phone: true,
              email: true,
              avatarUrl: true,
            }
          }
        }
      },
      reviews: {
        select: {
          rating: true,
          comment: true,
        }
      },
      _count: {
        select: {
          services: true,
          reviews: true,
          bookings: true
        },
      },
    },
      orderBy: {
        avgRating: "desc",
      },
      take: Number(limit),
      skip,
    }),

    prisma.technicianProfile.count({
      where: {
        AND: andCondition,
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
    data: technician,
  };
};

const getTechnicianByIdFromDB = async (technicianID : string) => {
  const technician = await prisma.technicianProfile.findUnique({
    where: {
      id: technicianID,
    },
    include: {
      user: {
        select: {
          name: true,
          avatarUrl: true,
          address: true,
          phone: true,
          email: true,
          status: true
        }
      },
      services: {
        where: {
          isActive: true
        }
      },
      bookings: {
        select: {
          status: true,
          priceAtBooking: true,
          payment: {
            select: {
              status: true,
            }
          },
          customer: {
            select: {
              name: true,
              phone: true,
              email: true,
              avatarUrl: true,
            }
          }
        }
      },
      reviews: {
        select: {
          rating: true,
          comment: true,
        }
      },
      _count: {
        select: {
          services: true,
          reviews: true,
          bookings: true
        },
      },
    },
  });

  if (!technician) {
    throw new AppError(httpStatus.NOT_FOUND, "Technician not found");
  }
  return technician
}

const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/; 
const allowedDays = Object.values(DayOfWeek);

const updateAvailabilityInDB = async (userId: string, payload: IUpdateAvailability) => {
  if (!Array.isArray(payload) || payload.length === 0) {
    throw new AppError(httpStatus.BAD_REQUEST, "Availability must be a non-empty array of slots");
  }

  const technicianProfile = await prisma.technicianProfile.findUnique({
    where: { userId },
  });

  if (!technicianProfile) {
    throw new AppError(httpStatus.NOT_FOUND, "Technician profile not found");
  }

  for (const slot of payload) {
    const { dayOfWeek, startTime, endTime } = slot;

    if (!allowedDays.includes(dayOfWeek)) {
      throw new AppError(httpStatus.BAD_REQUEST, `Invalid dayOfWeek: ${dayOfWeek}`);
    }

    if (!timeRegex.test(startTime) || !timeRegex.test(endTime)) {
      throw new AppError(httpStatus.BAD_REQUEST, "startTime and endTime must be in HH:mm format");
    }

    if (startTime >= endTime) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        `startTime must be before endTime for ${dayOfWeek}`
      );
    }
  }

  const result = await prisma.$transaction(async (tx) => {
    await tx.technicianAvailability.deleteMany({
      where: { technicianId: technicianProfile.id },
    });

    await tx.technicianAvailability.createMany({
      data: payload.map((slot) => ({
        technicianId: technicianProfile.id,
        dayOfWeek: slot.dayOfWeek,
        startTime: slot.startTime,
        endTime: slot.endTime,
      })),
    });

    return tx.technicianAvailability.findMany({
      where: { technicianId: technicianProfile.id },
      orderBy: { dayOfWeek: "asc" },
    });
  });

  return result;
};

export const technicianService = {
  updateTEchnicianProfileINDB,
  getAllTechniciansFromDB,
  getTechnicianByIdFromDB,
  updateAvailabilityInDB
};
