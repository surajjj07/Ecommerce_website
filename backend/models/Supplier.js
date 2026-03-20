import mongoose from "mongoose";

const supplierSchema = new mongoose.Schema(
    {
        admin: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Admin",
            required: true,
            index: true,
        },
        name: {
            type: String,
            required: true,
            trim: true,
        },
        companyName: {
            type: String,
            trim: true,
            default: "",
        },
        email: {
            type: String,
            trim: true,
            lowercase: true,
            default: "",
        },
        phone: {
            type: String,
            trim: true,
            default: "",
        },
        whatsappNumber: {
            type: String,
            trim: true,
            default: "",
        },
        website: {
            type: String,
            trim: true,
            default: "",
        },
        address: {
            type: String,
            trim: true,
            default: "",
        },
        pickupContactName: {
            type: String,
            trim: true,
            default: "",
        },
        pickupPhone: {
            type: String,
            trim: true,
            default: "",
        },
        pickupAddressLine1: {
            type: String,
            trim: true,
            default: "",
        },
        pickupAddressLine2: {
            type: String,
            trim: true,
            default: "",
        },
        pickupCity: {
            type: String,
            trim: true,
            default: "",
        },
        pickupState: {
            type: String,
            trim: true,
            default: "",
        },
        pickupPincode: {
            type: String,
            trim: true,
            default: "",
        },
        pickupCountry: {
            type: String,
            trim: true,
            default: "India",
        },
        pickupLocationCode: {
            type: String,
            trim: true,
            default: "",
        },
        categories: {
            type: [String],
            default: [],
        },
        fulfillmentLeadTimeDays: {
            type: Number,
            min: 0,
            default: 0,
        },
        shippingRegions: {
            type: [String],
            default: [],
        },
        notes: {
            type: String,
            trim: true,
            default: "",
        },
        apiIntegration: {
            enabled: {
                type: Boolean,
                default: false,
            },
            endpointUrl: {
                type: String,
                trim: true,
                default: "",
            },
            catalogEndpointUrl: {
                type: String,
                trim: true,
                default: "",
            },
            authType: {
                type: String,
                enum: ["none", "bearer", "x-api-key"],
                default: "none",
            },
            apiKey: {
                type: String,
                trim: true,
                default: "",
            },
            customHeaderName: {
                type: String,
                trim: true,
                default: "x-api-key",
            },
        },
        isActive: {
            type: Boolean,
            default: true,
            index: true,
        },
    },
    {
        timestamps: true,
    }
);

supplierSchema.index({ admin: 1, name: 1 }, { unique: true });

const Supplier = mongoose.model("Supplier", supplierSchema);

export default Supplier;
