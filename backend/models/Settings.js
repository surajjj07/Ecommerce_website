import mongoose from "mongoose";

const settingsSchema = new mongoose.Schema(
    {
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
    },
    {
        timestamps: true,
    }
);

/* 
  IMPORTANT:
  Only ONE settings document should exist.
*/
settingsSchema.statics.getSingleton = async function () {
    const settings = await this.findOne();
    if (settings) return settings;
    return this.create({});
};

const Settings = mongoose.model("Settings", settingsSchema);
export default Settings;
