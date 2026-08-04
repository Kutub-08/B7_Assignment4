import { Role } from "../../../generated/prisma/enums";

export type ICreateUser =
  | {
      role: "CUSTOMER";
      name: string;
      email: string;
      password: string;
      phone: string;
      address?: string;
      avatarUrl?: string;
    }
  |{
      role: "TECHNICIAN";
      name: string;
      email: string;
      password: string;
      phone: string;
      address?: string;
      avatarUrl?: string;
      skills?: string[];
      hourlyRate?: number;
      bio?: string;
      experienceYrs?: number;
      location?: string;
    };


    export interface ILoginUser {
    email: string,
    password: string
}