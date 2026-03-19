import express from "express";
import {
    createCoupon,
    deleteCoupon,
    getCoupons,
    updateCoupon,
} from "../controllers/CouponController.js";
import { authenticateAdmin } from "../middlewares/adminAuth.js";

const router = express.Router();

router.get("/coupons", authenticateAdmin, getCoupons);
router.post("/coupons", authenticateAdmin, createCoupon);
router.put("/coupons/:id", authenticateAdmin, updateCoupon);
router.delete("/coupons/:id", authenticateAdmin, deleteCoupon);

export default router;
