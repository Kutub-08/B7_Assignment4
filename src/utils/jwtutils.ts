import { JwtPayload, SignOptions } from "jsonwebtoken";
import jwt from "jsonwebtoken";

const createToken = (
  payload: JwtPayload,
  secret: string,
  expiresIn: SignOptions,
) => {
  const token = jwt.sign(payload, secret, {
    expiresIn,
  } as SignOptions);
  return token;
};

const verifyToken = (token: string, secret: string) => {
  try {
    const decoded = jwt.verify(token, secret);
    return {
      success: true,
      data: decoded,
    };
  } catch (error: any) {
    console.log("Invalid token", error);
    return {
      success: false,
      error: error.message,
    }
  }
};

export const jwtUtils = {
  createToken,
  verifyToken,
};