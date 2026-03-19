import Settings from "../models/Settings.js";

const ALLOWED_ROOT_FIELDS = new Set([
    "storeName",
    "storeEmail",
    "phone",
    "storeAddress",
    "storeCity",
    "storeState",
    "storePincode",
    "storeCountry",
    "gstNumber",
    "invoicePrefix",
    "defaultTaxRate",
    "codEnabled",
    "onlinePaymentEnabled",
    "orderEmailNotify",
]);

const ALLOWED_SHIPROCKET_FIELDS = new Set([
    "email",
    "password",
    "pickupLocation",
    "pickupPincode",
    "pickupCity",
    "pickupState",
    "pickupCountry",
    "pickupAddress",
    "pickupPhone",
    "defaultWeight",
    "defaultLength",
    "defaultBreadth",
    "defaultHeight",
]);

const buildSafeSettingsUpdate = (payload = {}) => {
    const next = {};

    for (const [key, value] of Object.entries(payload)) {
        if (ALLOWED_ROOT_FIELDS.has(key)) {
            next[key] = value;
        }
    }

    if (payload.shiprocket && typeof payload.shiprocket === "object") {
        next.shiprocket = {};
        for (const [key, value] of Object.entries(payload.shiprocket)) {
            if (ALLOWED_SHIPROCKET_FIELDS.has(key)) {
                next.shiprocket[key] = value;
            }
        }
    }

    return next;
};

/* ================= GET SETTINGS ================= */

export const getSettings = async (req, res) => {
    try {
        const settings = await Settings.getForAdmin(req.admin._id);

        res.status(200).json({
            success: true,
            settings,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to load settings",
        });
    }
};

/* ================= UPDATE SETTINGS ================= */

export const updateSettings = async (req, res) => {
    try {
        const settings = await Settings.getForAdmin(req.admin._id);
        const safePayload = buildSafeSettingsUpdate(req.body);

        Object.assign(settings, safePayload);
        await settings.save();

        res.status(200).json({
            success: true,
            message: "Settings updated successfully",
            settings,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to update settings",
        });
    }
};
