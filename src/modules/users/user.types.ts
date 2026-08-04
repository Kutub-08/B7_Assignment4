export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: "TENANT" | "LANDLORD" | "ADMIN";
  phone: string;
  createdAt: Date;
}

export interface UpdateUserInput {
  name?: string;
  phone?: string;
}
