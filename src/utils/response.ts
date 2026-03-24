import { Response } from "express";

// success response
export const successResponse = (
  res: Response,
  message: string,
  data: any = null,
  status: number = 200
): void => {
  res.status(status).json({
    success: true,
    message,
    data,
  });
};

//error response
export const errorResponse = (
  res: Response,
  message: string,
  status: number = 500,
  errors: any = null
): void => {
  res.status(status).json({
    success: false,
    message,
    errors,
  });
};
