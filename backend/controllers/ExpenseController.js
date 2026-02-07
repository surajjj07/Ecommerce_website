import Order from "../models/Order.js";
import Expense from "../models/Expense.js";

export const getAdminDashboard = async (req, res) => {
    try {
        /* ---------- Revenue ---------- */
        const revenueResult = await Order.aggregate([
            { $match: { status: { $in: ["paid", "shipped", "delivered"] } } },
            {
                $group: {
                    _id: null,
                    totalRevenue: { $sum: "$totalAmount" },
                },
            },
        ]);

        const totalRevenue = revenueResult[0]?.totalRevenue || 0;

        /* ---------- Expenses ---------- */
        const expenseResult = await Expense.aggregate([
            {
                $group: {
                    _id: null,
                    totalExpenses: { $sum: "$amount" },
                },
            },
        ]);

        const totalExpenses = expenseResult[0]?.totalExpenses || 0;

        /* ---------- Monthly Change (Simple Example) ---------- */
        const monthlyChange = "+18.2%"; // later you can calculate dynamically

        res.status(200).json({
            success: true,
            data: {
                totalRevenue,
                totalExpenses,
                monthlyChange,
            },
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Dashboard data fetch failed",
            error: error.message,
        });
    }
};
