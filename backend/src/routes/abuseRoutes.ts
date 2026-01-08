import { Router } from "express";
import {
    getTopIPs,
    blockIPAddress,
    unblockIPAddress,
    removeIPStats,
} from "../controllers/abuseController.js";
import { protect, restrictTo } from "../middleware/authMiddleware.js";
import { AdminRole } from "../models/Admin.js";

const router = Router();

router.use(protect);

router.get("/top-ips", restrictTo(AdminRole.ADMIN, AdminRole.VIEWER), getTopIPs);
router.post("/block-ip", restrictTo(AdminRole.ADMIN), blockIPAddress);
router.post("/unblock-ip", restrictTo(AdminRole.ADMIN), unblockIPAddress);
router.delete("/ip-stats/:ip", restrictTo(AdminRole.ADMIN), removeIPStats);

export default router;