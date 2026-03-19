import Coupon from "../models/Coupon.js";

export const normalizeCouponCode = (couponCode) =>
    String(couponCode || "").trim().toUpperCase();

export const sanitizeCouponForClient = (coupon) => {
    if (!coupon) return null;

    return {
        _id: coupon._id,
        code: coupon.code,
        description: coupon.description,
        type: coupon.type,
        value: coupon.value,
        minOrderAmount: coupon.minOrderAmount,
        maxDiscount: coupon.maxDiscount,
        usageLimit: coupon.usageLimit,
        usedCount: coupon.usedCount,
        startsAt: coupon.startsAt,
        expiresAt: coupon.expiresAt,
        isActive: coupon.isActive,
        createdAt: coupon.createdAt,
        updatedAt: coupon.updatedAt,
    };
};

const getCouponIneligibilityReason = ({ coupon, subtotalAmount, now }) => {
    if (!coupon) return "Invalid coupon code";
    if (!coupon.isActive) return "This coupon is currently inactive";
    if (coupon.startsAt && coupon.startsAt > now) return "This coupon is not active yet";
    if (coupon.expiresAt && coupon.expiresAt < now) return "This coupon has expired";
    if (subtotalAmount < Number(coupon.minOrderAmount || 0)) {
        return `Minimum order amount is INR ${Number(coupon.minOrderAmount || 0).toLocaleString("en-IN")}`;
    }
    if (coupon.usageLimit > 0 && coupon.usedCount >= coupon.usageLimit) {
        return "This coupon has reached its usage limit";
    }
    return "";
};

export const calculateCouponDiscount = async ({ adminId, subtotalAmount, couponCode }) => {
    const normalizedCode = normalizeCouponCode(couponCode);
    if (!normalizedCode) {
        return {
            couponCode: "",
            discountAmount: 0,
            appliedCoupon: null,
            reason: "",
        };
    }

    const coupon = await Coupon.findOne({
        admin: adminId,
        code: normalizedCode,
    });

    const now = new Date();
    const reason = getCouponIneligibilityReason({ coupon, subtotalAmount, now });

    if (reason) {
        return {
            couponCode: "",
            discountAmount: 0,
            appliedCoupon: null,
            reason,
        };
    }

    let discountAmount = 0;
    if (coupon.type === "percent") {
        discountAmount = Math.round((subtotalAmount * coupon.value) / 100);
        if (coupon.maxDiscount > 0) {
            discountAmount = Math.min(discountAmount, coupon.maxDiscount);
        }
    } else {
        discountAmount = Math.min(coupon.value, subtotalAmount);
    }

    return {
        couponCode: coupon.code,
        discountAmount,
        appliedCoupon: sanitizeCouponForClient(coupon),
        reason: "",
    };
};

export const incrementCouponUsage = async (couponId) => {
    if (!couponId) return;
    await Coupon.findByIdAndUpdate(couponId, { $inc: { usedCount: 1 } });
};
