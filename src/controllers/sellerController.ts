import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import * as sellerRepository from "../repositories/sellerRepository";
import { generateToken } from "../utils/jwt";
import { successResponse, errorResponse } from "../utils/response";


export const sellerLogin = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      errorResponse(res, "Email and password are required.", 400);
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      errorResponse(res, "Please provide a valid email address.", 400);
      return;
    }

    const seller = await sellerRepository.findSellerByEmail(email);

    if (!seller) {
      errorResponse(res, "Invalid credentials. Seller not found.", 401);
      return;
    }

    const isPasswordValid = await bcrypt.compare(password, seller.password);

    if (!isPasswordValid) {
      errorResponse(res, "Invalid credentials. Wrong password.", 401);
      return;
    }

    const token = generateToken({
      id: seller.id,
      email: seller.email,
      role: seller.role,
    });

    const skills =
      typeof seller.skills === "string"
        ? JSON.parse(seller.skills)
        : seller.skills;

    successResponse(res, "Seller login successful.", {
      token,
      seller: {
        id: seller.id,
        name: seller.name,
        email: seller.email,
        mobile: seller.mobile,
        country: seller.country,
        state: seller.state,
        skills,
        role: seller.role,
      },
    });
  } catch (error) {
    console.error("Seller login error:", error);
    errorResponse(res, "Internal server error during seller login.", 500);
  }
};
