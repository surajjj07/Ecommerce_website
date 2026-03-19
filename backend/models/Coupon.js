import mongoose from "mongoose";

const couponSchema = new mongoose.Schema(
    {
        admin: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Admin",
            required: true,
            index: true,
        },
        code: {
            type: String,
            required: true,
            trim: true,
            uppercase: true,
        },
        description: {
            type: String,
            trim: true,
            default: "",
        },
        type: {
            type: String,
            enum: ["percent", "flat"],
            required: true,
        },
        value: {
            type: Number,
            required: true,
            min: 0,
        },
        minOrderAmount: {
            type: Number,
            default: 0,
            min: 0,
        },
        maxDiscount: {
            type: Number,
            default: 0,
            min: 0,
        },
        usageLimit: {
            type: Number,
            default: 0,
            min: 0,
        },
        usedCount: {
            type: Number,
            default: 0,
            min: 0,
        },
        startsAt: {
            type: Date,
            default: null,
        },
        expiresAt: {
            type: Date,
            default: null,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
    },
    {
        timestamps: true,
    }
);

couponSchema.index({ admin: 1, code: 1 }, { unique: true });

const Coupon = mongoose.model("Coupon", couponSchema);

export default Coupon;
