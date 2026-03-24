// ============================================
//   Admin Routes
//   Base path: /api/admin
// ============================================

import { Router } from "express";
import {
  adminLogin,
  createAdmin,
  createSeller,
  listSellers,
} from "../controllers/adminController";
import { authenticate, authorizeRole } from "../middlewares/authMiddleware";

const router = Router();



router.post("/register", createAdmin);

router.post("/login", adminLogin);
 
router.post("/sellers",authenticate,authorizeRole("admin"),createSeller);

router.get("/sellers",authenticate,authorizeRole("admin"),listSellers);

export default router;
