import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import * as adminRepository from "../repositories/adminRepository";
import { generateToken } from "../utils/jwt";
import { successResponse, errorResponse } from "../utils/response";



export const createAdmin = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password || !role) {
      errorResponse(res, "Name, email, password, and role are required.", 400);
      return;
    }

    const existingAdmin = await adminRepository.findAdminByEmail(email);
    if (existingAdmin) {
      errorResponse(res, "Admin with this email already exists.", 409);
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newAdmin = await adminRepository.createAdmin({
      name,
      email,
      password: hashedPassword,
      role,
    });

    successResponse(res, "Admin created successfully.", {
      admin: {
        id: newAdmin.id,
        name: newAdmin.name,
        email: newAdmin.email,
        role: newAdmin.role,
      },
    });
  } catch (error) {
    console.error("Create admin error:", error);
    errorResponse(res, "Internal server error during admin creation.", 500);
  }
};


export const adminLogin = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      errorResponse(res, "Email and password are required.", 400);
      return;
    }

    const admin = await adminRepository.findAdminByEmail(email);

    if (!admin) {
      errorResponse(res, "Invalid credentials. Admin not found.", 401);
      return;
    }

    const isPasswordValid = await bcrypt.compare(password, admin.password);

    if (!isPasswordValid) {
      errorResponse(res, "Invalid credentials. Wrong password.", 401);
      return;
    }

    const token = generateToken({
      id: admin.id,
      email: admin.email,
      role: admin.role,
    });

    successResponse(res, "Admin login successful.", {
      token,
      admin: {
        id: admin.id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
      },
    });
  } catch (error) {
    console.error("Admin login error:", error);
    errorResponse(res, "Internal server error during login.", 500);
  }
};

export const createSeller = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, mobile, country, state, skills, password } = req.body;

    if (!name || !email || !mobile || !country || !state || !skills || !password) {
      errorResponse(res, "All fields are required: name, email, mobile, country, state, skills, password.", 400);
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      errorResponse(res, "Please provide a valid email address.", 400);
      return;
    }

    const mobileRegex = /^[0-9]{10,15}$/;
    if (!mobileRegex.test(mobile)) {
      errorResponse(res, "Mobile number must be 10-15 digits.", 400);
      return;
    }

    let skillsArray: string[];
    if (Array.isArray(skills)) {
      skillsArray = skills;
    } else if (typeof skills === "string") {
      try {
        skillsArray = JSON.parse(skills);
      } catch {
        skillsArray = skills.split(",").map((s: string) => s.trim());
      }
    } else {
      errorResponse(res, "Skills must be an array or comma-separated string.", 400);
      return;
    }

    if (skillsArray.length === 0) {
      errorResponse(res, "At least one skill is required.", 400);
      return;
    }

    if (password.length < 6) {
      errorResponse(res, "Password must be at least 6 characters.", 400);
      return;
    }

    const existingSeller = await adminRepository.findSellerByEmail(email);
    if (existingSeller) {
      errorResponse(res, "A seller with this email already exists.", 409);
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const sellerId = await adminRepository.createSeller({
      name,
      email,
      mobile,
      country,
      state,
      skills: skillsArray,
      password: hashedPassword,
    });

    successResponse(
      res,
      "Seller created successfully.",
      { seller_id: sellerId, name, email, mobile, country, state, skills: skillsArray },
      201
    );
  } catch (error) {
    console.error("Create seller error:", error);
    errorResponse(res, "Internal server error while creating seller.", 500);
  }
};

export const listSellers = async (req: Request, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    if (page < 1 || limit < 1) {
      errorResponse(res, "Page and limit must be positive numbers.", 400);
      return;
    }

    if (limit > 100) {
      errorResponse(res, "Limit cannot exceed 100 per page.", 400);
      return;
    }

    const { sellers, total } = await adminRepository.getAllSellers(page, limit);

    const totalPages = Math.ceil(total / limit);

    successResponse(res, "Sellers fetched successfully.", {
      sellers,
      pagination: {
        currentPage: page,
        totalPages,
        totalRecords: total,
        limit,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    });
  } catch (error) {
    console.error("List sellers error:", error);
    errorResponse(res, "Internal server error while fetching sellers.", 500);
  }
};
