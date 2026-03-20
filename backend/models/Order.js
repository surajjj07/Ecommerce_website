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

const fulfillmentGroupSchema = new mongoose.Schema(
    {
        groupId: {
            type: String,
            required: true,
        },
        channel: {
            type: String,
            enum: ["admin", "supplier"],
            required: true,
        },
        supplier: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Supplier",
            default: null,
        },
        productIds: {
            type: [mongoose.Schema.Types.ObjectId],
            default: [],
        },
        mode: {
            type: String,
            enum: ["none", "manual", "automated", "whatsapp"],
            default: "none",
        },
        status: {
            type: String,
            enum: ["not_started", "requested", "shipped", "delivered"],
            default: "not_started",
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
        requestedAt: {
            type: Date,
            default: null,
        },
        notifiedAt: {
            type: Date,
            default: null,
        },
        whatsappSentAt: {
            type: Date,
            default: null,
        },
        shippedAt: {
            type: Date,
            default: null,
        },
        deliveredAt: {
            type: Date,
            default: null,
        },
        trackingNumber: {
            type: String,
            default: "",
        },
        trackingUrl: {
            type: String,
            default: "",
        },
        note: {
            type: String,
            default: "",
        },
        apiResponse: {
            type: mongoose.Schema.Types.Mixed,
            default: null,
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
        supplierFulfillment: {
            channel: {
                type: String,
                enum: ["admin", "supplier"],
                default: "admin",
            },
            mode: {
                type: String,
                enum: ["none", "manual", "automated", "whatsapp"],
                default: "none",
            },
            status: {
                type: String,
                enum: ["not_started", "requested", "shipped", "delivered"],
                default: "not_started",
            },
            requestedAt: {
                type: Date,
                default: null,
            },
            notifiedAt: {
                type: Date,
                default: null,
            },
            whatsappSentAt: {
                type: Date,
                default: null,
            },
            deliveredAt: {
                type: Date,
                default: null,
            },
            note: {
                type: String,
                default: "",
            },
        },
        fulfillmentGroups: {
            type: [fulfillmentGroupSchema],
            default: [],
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
