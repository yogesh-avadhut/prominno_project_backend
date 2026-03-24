import { Router } from "express";
import {
  addProduct,
  listProducts,
  deleteProduct,
  viewProductPDF,
} from "../controllers/productController";
import { authenticate, authorizeRole } from "../middlewares/authMiddleware";
import { uploadBrandImages } from "../middlewares/uploadMiddleware";

const router = Router();

router.post("/products",authenticate,authorizeRole("seller"),uploadBrandImages,addProduct);

router.get("/products",authenticate,authorizeRole("seller"),listProducts);

router.get("/products/:id/pdf",authenticate,authorizeRole("seller"),viewProductPDF);

router.delete("/products/:id",authenticate,authorizeRole("seller"),deleteProduct);

export default router;
