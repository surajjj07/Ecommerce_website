import Admin from "../models/Admin.js";
import Product from "../models/Product.js";
import Settings from "../models/Settings.js";
import Order from "../models/Order.js";

const ensureSettingsForAllAdmins = async () => {
    const admins = await Admin.find({}, "_id");
    if (admins.length === 0) return;

    await Promise.all(
        admins.map((admin) =>
            Settings.getForAdmin(admin._id).catch((error) => {
                console.error(`Failed to init settings for admin ${admin._id}:`, error.message);
            })
        )
    );
};

const backfillProductAdmin = async () => {
    const unassignedProductsCount = await Product.countDocuments({
        $or: [{ admin: { $exists: false } }, { admin: null }],
    });

    if (!unassignedProductsCount) return;

    const fallbackAdmin = await Admin.findOne({}, "_id").sort({ createdAt: 1 });
    if (!fallbackAdmin) return;

    await Product.updateMany(
        { $or: [{ admin: { $exists: false } }, { admin: null }] },
        { $set: { admin: fallbackAdmin._id } }
    );
};

const backfillOrderAdminFromProducts = async () => {
    const orders = await Order.find({
        $or: [{ admin: { $exists: false } }, { admin: null }],
    })
        .populate("items.product", "admin")
        .limit(500);

    for (const order of orders) {
        const adminCandidates = (order.items || [])
            .map((item) => item?.product?.admin?.toString())
            .filter(Boolean);

        const uniqueAdmins = [...new Set(adminCandidates)];
        if (uniqueAdmins.length !== 1) continue;

        order.admin = uniqueAdmins[0];
        await order.save();
    }
};

export const initializeStoreIsolation = async () => {
    try {
        await ensureSettingsForAllAdmins();
        await backfillProductAdmin();
        await backfillOrderAdminFromProducts();
    } catch (error) {
        console.error("Store isolation bootstrap failed:", error.message);
    }
};
