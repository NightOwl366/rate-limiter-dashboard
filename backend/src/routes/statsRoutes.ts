import { Router } from "express";
import { protect } from "../middleware/authMiddleware.js";
import { getOverview, getRequestTimeline } from "../controllers/statsController.js";
import { checkRedisHealth } from "../config/redis.js";

const router = Router();

router.get("/health", checkRedisHealth);
router.get("/overview", protect, getOverview);
router.get("/requests",protect,getRequestTimeline);

export default router;