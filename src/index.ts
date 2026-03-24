import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

import { testConnection } from "./config/db";
import adminRoutes from "./routes/adminRoutes";
import sellerRoutes from "./routes/sellerRoutes";
import productRoutes from "./routes/productRoutes";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());

app.use(express.json());

app.use(express.urlencoded({ extended: true }));
app.use("/uploads",express.static(path.join(__dirname, "../uploads")));


app.use("/api/admin", adminRoutes);

app.use("/api/seller", sellerRoutes);

app.use("/api/product", productRoutes);

app.get("/", (_req: Request, res: Response) => {
  res.json({
    success: true,
    message: "Home page ..."
  });
});


app.use((_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: "Route not found.",
  });
});


app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error("Unhandled error:", err);

  if (err.code === "LIMIT_FILE_SIZE") {
    res.status(400).json({
      success: false,
      message: "File too large. Maximum allowed size is 5MB.",
    });
    return;
  }

  if (err.message && err.message.includes("Only image files")) {
    res.status(400).json({
      success: false,
      message: err.message,
    });
    return;
  }

  res.status(500).json({
    success: false,
    message: "Something went wrong. Please try again.",
    error: process.env.NODE_ENV === "development" ? err.message : undefined,
  });
});

const startServer = async () => {
  await testConnection();
  
  app.listen(PORT, () => {
    console.log(`\nServer running...`);
  });
};

startServer();
