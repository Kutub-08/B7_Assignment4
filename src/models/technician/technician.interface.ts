import { DayOfWeek } from "../../../generated/prisma/enums";

export interface IupdateTechnicianProfile {
    name?: string;
    phone?: string;
    address?: string;
    avatarUrl?: string;
    skills?: string[];
    hourlyRate?: number;
    bio?: string;
    experienceYrs?: number;
    location?: string;
}

export interface ITechnicianFilters {
  skill?: string;
  location?: string;
  minRating?: number;
  minExperience?: number;
  search?: string;
  category?: string;
  page?: number;
  limit?: number;
}

export interface IAvailabilitySlot {
  dayOfWeek: DayOfWeek;
  startTime: string; 
  endTime: string;   
}

export type IUpdateAvailability = IAvailabilitySlot[];
