import { BookingStatus, Role, UserStatus } from "../../../generated/prisma/enums";

export interface ICreateCategory {
    name : string;
    description ?: string;
    iconUrl : string;
}

export interface IUserFilters {
  role?: Role
  status?: UserStatus;
  search?: string;
  page?: number;
  limit?: number;
}

export interface IUpdateUserStatus {
    status : UserStatus;
}

export interface IBookingFilters {
  status?: BookingStatus;
  customerId?: string;
  technicianId?: string;
  fromDate?: string;
  toDate?: string;
  search?: string;
  page?: number;
  limit?: number;
}