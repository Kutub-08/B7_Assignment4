import { CategoryWhereInput } from "../../../generated/prisma/models";
import { prisma } from "../../lib/prisma";
import { ICategoryFilters } from "./category.interface";

const getAllCategoryFromDB = async (query: ICategoryFilters) => {
  const { limit = 10, page = 1, search } = query;

  const andCondition: CategoryWhereInput[] = [];

  andCondition.push({ isActive:true });

  if (search) {
    andCondition.push({
      OR: [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ],
    });
  }

  const skip = (Number(page) - 1) * Number(limit);

  const [categories, total] = await Promise.all([
    prisma.category.findMany({
      where: { AND: andCondition },
      include: {
        services: {
            select: {
                title: true,
                description: true,
                price: true,
            }
        },
        _count: {
          select: { services: true },
        },
      },
      orderBy: { name: "desc" },
      skip,
      take: Number(limit),
    }),
    prisma.category.count({ where: { AND: andCondition } }),
  ]);

  return {
    meta: {
      page: Number(page),
      limit: Number(limit),
      total,
      totalPages: Math.ceil(total / Number(limit)),
    },
    data: categories,
  };

};

export const categoryService = {
  getAllCategoryFromDB,
};
