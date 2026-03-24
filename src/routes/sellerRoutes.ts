
import { Router } from "express";
import { sellerLogin } from "../controllers/sellerController";
import { authenticate, authorizeRole } from "../middlewares/authMiddleware";

const router = Router();


router.post("/login", sellerLogin);

export default router;
