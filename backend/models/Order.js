import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema(
    {
        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Product",
            required: true,
        },
        quantity: {
            type: Number,
            required: true,
            min: 1,
        },
        price: {
            type: Number,
            required: true,
            min: 0,
        },
    },
    { _id: false }
);

const orderSchema = new mongoose.Schema(
    {
        orderId: {
            type: String,
            required: true,
            unique: true,
            index: true,
        },

        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        admin: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Admin",
            required: true,
            index: true,
        },

        items: {
            type: [orderItemSchema],
            required: true,
        },

        totalAmount: {
            type: Number,
            required: true,
            min: 0,
        },
        subtotalAmount: {
            type: Number,
            default: 0,
            min: 0,
        },
        discountAmount: {
            type: Number,
            default: 0,
            min: 0,
        },
        couponCode: {
            type: String,
            trim: true,
            uppercase: true,
            default: "",
        },

        status: {
            type: String,
            enum: ["pending", "processing", "shipped", "delivered", "cancelled"],
            default: "pending",
            index: true,
        },

        paymentMethod: {
            type: String,
            enum: ["online", "cod"],
            default: "online",
        },

        paymentStatus: {
            type: String,
            enum: ["pending", "paid", "failed"],
            default: "pending",
            index: true,
        },
        paymentId: {
            type: String,
            default: null,
        },
        paymentGatewayOrderId: {
            type: String,
            default: null,
            index: true,
        },
        paymentSignature: {
            type: String,
            default: null,
        },

        shippingAddress: {
            type: String,
            required: true,
        },
        shippingDetails: {
            name: { type: String, default: "" },
            phone: { type: String, default: "" },
            addressLine1: { type: String, default: "" },
            addressLine2: { type: String, default: "" },
            city: { type: String, default: "" },
            state: { type: String, default: "" },
            pincode: { type: String, default: "" },
            country: { type: String, default: "India" },
            email: { type: String, default: "" },
        },
        shipment: {
            provider: { type: String, default: "" },
            shipmentId: { type: String, default: "" },
            awbCode: { type: String, default: "" },
            courierName: { type: String, default: "" },
            trackingUrl: { type: String, default: "" },
            status: { type: String, default: "not_created" },
            createdAt: { type: Date, default: null },
            rawResponse: { type: mongoose.Schema.Types.Mixed, default: null },
        },
        stockDeducted: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true,
    }
);

/* ---------- Indexes ---------- */
orderSchema.index({ createdAt: -1 });

const Order = mongoose.model("Order", orderSchema);
export default Order;
