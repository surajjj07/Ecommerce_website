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

const buildDiscountAmount = ({ coupon, subtotalAmount }) => {
    if (!coupon) return 0;

    if (coupon.type === "percent") {
        const percentageDiscount = Math.round((subtotalAmount * coupon.value) / 100);
        return coupon.maxDiscount > 0
            ? Math.min(percentageDiscount, coupon.maxDiscount)
            : percentageDiscount;
    }

    return Math.min(coupon.value, subtotalAmount);
};

const buildEligibleCouponQuery = ({ adminId, normalizedCode, subtotalAmount, now }) => ({
    admin: adminId,
    code: normalizedCode,
    isActive: true,
    minOrderAmount: { $lte: subtotalAmount },
    $and: [
        {
            $or: [
                { startsAt: null },
                { startsAt: { $exists: false } },
                { startsAt: { $lte: now } },
            ],
        },
        {
            $or: [
                { expiresAt: null },
                { expiresAt: { $exists: false } },
                { expiresAt: { $gte: now } },
            ],
        },
        {
            $or: [
                { usageLimit: 0 },
                { $expr: { $lt: ["$usedCount", "$usageLimit"] } },
            ],
        },
    ],
});

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

    const discountAmount = buildDiscountAmount({ coupon, subtotalAmount });

    return {
        couponCode: coupon.code,
        discountAmount,
        appliedCoupon: sanitizeCouponForClient(coupon),
        reason: "",
    };
};

export const reserveCouponUsage = async ({ adminId, subtotalAmount, couponCode }) => {
    const normalizedCode = normalizeCouponCode(couponCode);
    if (!normalizedCode) {
        return {
            couponCode: "",
            discountAmount: 0,
            appliedCoupon: null,
            reason: "",
        };
    }

    const now = new Date();
    const coupon = await Coupon.findOneAndUpdate(
        buildEligibleCouponQuery({
            adminId,
            normalizedCode,
            subtotalAmount,
            now,
        }),
        { $inc: { usedCount: 1 } },
        { new: true }
    );

    if (!coupon) {
        return {
            couponCode: "",
            discountAmount: 0,
            appliedCoupon: null,
            reason: "This coupon is no longer available. Please try again.",
        };
    }

    return {
        couponCode: coupon.code,
        discountAmount: buildDiscountAmount({ coupon, subtotalAmount }),
        appliedCoupon: sanitizeCouponForClient(coupon),
        reason: "",
    };
};

export const releaseCouponUsage = async (couponId) => {
    if (!couponId) return;
    await Coupon.findByIdAndUpdate(couponId, { $inc: { usedCount: -1 } });
};
