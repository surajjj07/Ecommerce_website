import Coupon from "../models/Coupon.js";
import {
    normalizeCouponCode,
    sanitizeCouponForClient,
} from "../Services/couponService.js";

const parseDateValue = (value) => {
    if (!value) return null;
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
        throw new Error("Invalid date provided");
    }
    return parsed;
};

const buildCouponPayload = (payload) => {
    const code = normalizeCouponCode(payload.code);
    if (!code) {
        throw new Error("Coupon code is required");
    }

    const type = payload.type === "flat" ? "flat" : "percent";
    const value = Number(payload.value);
    const minOrderAmount = Number(payload.minOrderAmount || 0);
    const maxDiscount = Number(payload.maxDiscount || 0);
    const usageLimit = Number(payload.usageLimit || 0);

    if (!Number.isFinite(value) || value <= 0) {
        throw new Error("Coupon value must be greater than 0");
    }
    if (type === "percent" && value > 100) {
        throw new Error("Percentage coupon cannot be more than 100");
    }
    if (minOrderAmount < 0 || maxDiscount < 0 || usageLimit < 0) {
        throw new Error("Coupon amounts cannot be negative");
    }

    const startsAt = parseDateValue(payload.startsAt);
    const expiresAt = parseDateValue(payload.expiresAt);
    if (startsAt && expiresAt && startsAt > expiresAt) {
        throw new Error("Expiry date must be after start date");
    }

    return {
        code,
        description: String(payload.description || "").trim(),
        type,
        value,
        minOrderAmount,
        maxDiscount: type === "percent" ? maxDiscount : 0,
        usageLimit,
        startsAt,
        expiresAt,
        isActive: payload.isActive !== false,
    };
};

export const getCoupons = async (req, res) => {
    try {
        const coupons = await Coupon.find({ admin: req.admin._id }).sort({ createdAt: -1 });
        return res.json({
            success: true,
            coupons: coupons.map(sanitizeCouponForClient),
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

export const createCoupon = async (req, res) => {
    try {
        const coupon = await Coupon.create({
            admin: req.admin._id,
            ...buildCouponPayload(req.body),
        });

        return res.status(201).json({
            success: true,
            message: "Coupon created successfully",
            coupon: sanitizeCouponForClient(coupon),
        });
    } catch (error) {
        const isDup = error?.code === 11000;
        return res.status(isDup ? 400 : 500).json({
            success: false,
            message: isDup ? "Coupon code already exists" : error.message,
        });
    }
};

export const updateCoupon = async (req, res) => {
    try {
        const coupon = await Coupon.findOne({ _id: req.params.id, admin: req.admin._id });
        if (!coupon) {
            return res.status(404).json({ success: false, message: "Coupon not found" });
        }

        Object.assign(coupon, buildCouponPayload(req.body));
        await coupon.save();

        return res.json({
            success: true,
            message: "Coupon updated successfully",
            coupon: sanitizeCouponForClient(coupon),
        });
    } catch (error) {
        const isDup = error?.code === 11000;
        return res.status(isDup ? 400 : 500).json({
            success: false,
            message: isDup ? "Coupon code already exists" : error.message,
        });
    }
};

export const deleteCoupon = async (req, res) => {
    try {
        const coupon = await Coupon.findOneAndDelete({ _id: req.params.id, admin: req.admin._id });
        if (!coupon) {
            return res.status(404).json({ success: false, message: "Coupon not found" });
        }

        return res.json({
            success: true,
            message: "Coupon deleted successfully",
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};
