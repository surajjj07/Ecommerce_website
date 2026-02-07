import Category from "../models/Category.js";

export const addCategory = async (req, res) => {
    try {
        const rawName = req.body?.name;
        const name = String(rawName || "").trim();

        if (!name) {
            return res.status(400).json({ success: false, message: "Category name is required" });
        }

        const existing = await Category.findOne({
            name: { $regex: `^${name}$`, $options: "i" }
        });

        if (existing) {
            return res.status(409).json({ success: false, message: "Category already exists" });
        }

        const category = await Category.create({ name });
        return res.status(201).json({ success: true, message: "Category added successfully", category });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

export const getAllCategories = async (_req, res) => {
    try {
        const categories = await Category.find().sort({ name: 1 });
        return res.status(200).json({ success: true, categories });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
