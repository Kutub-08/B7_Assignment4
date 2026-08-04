import { ServiceWhereInput } from "../../../generated/prisma/models";

export interface ICreateService {
    title: string;
    description: string;
    price: number;
    durationMins: number;
    category : string
}

export interface IGetAllServiceFilters  {
  category?: string;
  location?: string;
  minRating?: number;
  minPrice?: number;
  maxPrice?: number;
  search?: string;
  page?: number;
  limit?: number;
  sortOrder?: string
}