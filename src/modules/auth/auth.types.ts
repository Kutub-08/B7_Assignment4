export interface AuthPayload {
  user: {
    id: string;
    name: string;
    email: string;
    phone: string;
    role: "TENANT" | "LANDLORD" | "ADMIN";
    isVerified: boolean;
    createdAt: Date;
  };
  accessToken: string;
}
