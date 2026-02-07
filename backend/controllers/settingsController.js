import Settings from "../models/Settings.js";

/* ================= GET SETTINGS ================= */

export const getSettings = async (req, res) => {
    try {
        const settings = await Settings.getSingleton();

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
        const settings = await Settings.getSingleton();

        Object.assign(settings, req.body);
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
