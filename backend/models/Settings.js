import mongoose from "mongoose";

const settingsSchema = new mongoose.Schema(
    {
        admin: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Admin",
            required: true,
            unique: true,
            index: true,
        },
        storeName: {
            type: String,
            trim: true,
            default: "",
        },

        storeEmail: {
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
        storeAddress: {
            type: String,
            trim: true,
            default: "",
        },
        storeCity: {
            type: String,
            trim: true,
            default: "",
        },
        storeState: {
            type: String,
            trim: true,
            default: "",
        },
        storePincode: {
            type: String,
            trim: true,
            default: "",
        },
        storeCountry: {
            type: String,
            trim: true,
            default: "India",
        },
        gstNumber: {
            type: String,
            trim: true,
            uppercase: true,
            default: "",
        },
        invoicePrefix: {
            type: String,
            trim: true,
            uppercase: true,
            default: "INV",
        },
        defaultTaxRate: {
            type: Number,
            min: 0,
            max: 100,
            default: 18,
        },

        codEnabled: {
            type: Boolean,
            default: true,
        },

        onlinePaymentEnabled: {
            type: Boolean,
            default: true,
        },

        orderEmailNotify: {
            type: Boolean,
            default: true,
        },

        orderSmsNotify: {
            type: Boolean,
            default: false,
        },
        shiprocket: {
            email: {
                type: String,
                trim: true,
                lowercase: true,
                default: "",
            },
            password: {
                type: String,
                trim: true,
                default: "",
            },
            pickupLocation: {
                type: String,
                trim: true,
                default: "Primary",
            },
            pickupPincode: {
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
            pickupCountry: {
                type: String,
                trim: true,
                default: "India",
            },
            pickupAddress: {
                type: String,
                trim: true,
                default: "",
            },
            pickupPhone: {
                type: String,
                trim: true,
                default: "",
            },
            defaultWeight: {
                type: Number,
                default: 0.5,
                min: 0,
            },
            defaultLength: {
                type: Number,
                default: 10,
                min: 0,
            },
            defaultBreadth: {
                type: Number,
                default: 10,
                min: 0,
            },
            defaultHeight: {
                type: Number,
                default: 10,
                min: 0,
            },
        },
    },
    {
        timestamps: true,
    }
);

settingsSchema.statics.getSingleton = async function () {
    const settings = await this.findOne();
    if (settings) return settings;
    throw new Error("Settings not initialized");
};

settingsSchema.statics.getForAdmin = async function (adminId) {
    if (!adminId) {
        throw new Error("Admin id is required for settings");
    }

    const settings = await this.findOne({ admin: adminId });
    if (settings) return settings;

    return this.create({ admin: adminId });
};

const Settings = mongoose.model("Settings", settingsSchema);
export default Settings;
