import { Router } from "express";
import { login, refreshToken, logout } from "../controllers/authController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = Router();

router.post("/login", login);
router.post("/refresh", refreshToken);
router.post("/logout", protect, logout);

export default router;