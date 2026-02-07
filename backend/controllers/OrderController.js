import Order from "../models/Order.js";
import Product from "../models/Product.js";
import Settings from "../models/Settings.js";
import User from "../models/User.js";
import { sendSMS } from "../Services/smsService.js";

/* =====================================================
   🔔 Helper: Safe SMS Sender
===================================================== */

const sendOrderSMS = async ({ userId, message }) => {
    try {
        const settings = await Settings.getSingleton();
        if (!settings.orderSmsNotify) return;

        const user = await User.findById(userId);
        if (!user || !user.phone) return;

        await sendSMS({
            to: user.phone,
            body: message,
        });
    } catch (error) {
        console.error("SMS failed:", error.message);
        // ❗ SMS failure should NOT break order flow
    }
};

/* =====================================================
   🛒 CREATE ORDER
===================================================== */

export const createOrder = async (req, res) => {
    try {
        const userId = req.user.id;
        const { products, items, shippingAddress } = req.body;
        const incomingItems = products ?? items;

        if (!incomingItems || !Array.isArray(incomingItems) || incomingItems.length === 0) {
            return res.status(400).json({ message: "Products are required" });
        }

        let totalAmount = 0;
        const orderProducts = [];

        for (const item of incomingItems) {
            const product = await Product.findById(item.product);

            if (!product || !product.isActive) {
                return res.status(400).json({
                    message: `Product ${item.product} not found or inactive`,
                });
            }

            if (product.stock < item.quantity) {
                return res.status(400).json({
                    message: `Insufficient stock for ${product.name}`,
                });
            }

            orderProducts.push({
                product: item.product,
                quantity: item.quantity,
                price: product.price,
            });

            totalAmount += product.price * item.quantity;

            // Optional: reduce stock
            // product.stock -= item.quantity;
            // await product.save();
        }

        const orderId = `ORD-${Date.now()}-${Math.floor(Math.random() * 9000 + 1000)}`;

        const order = new Order({
            orderId,
            user: userId,
            items: orderProducts,
            totalAmount,
            shippingAddress,
        });

        await order.save();

        /* 🔔 SMS: Order Placed */
        sendOrderSMS({
            userId,
            message: `✅ Order placed successfully. Total amount ₹${totalAmount}.`,
        });

        res.status(201).json({
            message: "Order created successfully",
            order,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/* =====================================================
   👤 USER ORDERS
===================================================== */

export const getUserOrders = async (req, res) => {
    try {
        const userId = req.user.id;

        const orders = await Order.find({ user: userId })
            .populate("items.product")
            .sort({ createdAt: -1 });

        res.json({ orders });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/* =====================================================
   🛠️ ADMIN: ALL ORDERS
===================================================== */

export const getAllOrders = async (req, res) => {
    try {
        const orders = await Order.find({ status: { $ne: "delivered" } })
            .populate("user", "name email phone")
            .populate("items.product")
            .sort({ createdAt: -1 });

        res.json({ orders });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/* =====================================================
   ✅ COMPLETED ORDERS
===================================================== */

export const getCompletedOrders = async (req, res) => {
    try {
        const orders = await Order.find({ status: "delivered" })
            .populate("user", "name email phone")
            .populate("items.product")
            .sort({ createdAt: -1 });

        res.json({ orders });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/* =====================================================
   📊 COMPLETED ORDERS COUNT (LAST MONTH)
===================================================== */

export const getCompletedOrdersCountLastMonth = async (req, res) => {
    try {
        const oneMonthAgo = new Date();
        oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

        const count = await Order.countDocuments({
            status: "delivered",
            createdAt: { $gte: oneMonthAgo },
        });

        res.json({ count });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/* =====================================================
   💰 PROFIT (LAST MONTH)
===================================================== */

export const getProfitLastMonth = async (req, res) => {
    try {
        const oneMonthAgo = new Date();
        oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

        const result = await Order.aggregate([
            {
                $match: {
                    status: "delivered",
                    createdAt: { $gte: oneMonthAgo },
                },
            },
            {
                $group: {
                    _id: null,
                    totalProfit: { $sum: "$totalAmount" },
                },
            },
        ]);

        const totalProfit = result[0]?.totalProfit || 0;
        res.json({ totalProfit });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/* =====================================================
   🔄 UPDATE ORDER STATUS
===================================================== */

export const updateOrderStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const allowedStatuses = ["pending", "processing", "shipped", "delivered", "cancelled"];
        const transitions = {
            pending: ["processing", "cancelled"],
            processing: ["shipped", "cancelled"],
            shipped: ["delivered"],
            delivered: [],
            cancelled: [],
        };

        if (!allowedStatuses.includes(status)) {
            return res.status(400).json({ success: false, message: "Invalid order status" });
        }

        const order = await Order.findById(id);
        if (!order) {
            return res.status(404).json({ success: false, message: "Order not found" });
        }

        if (order.status === status) {
            return res.json({ success: true, message: "Order status unchanged", order });
        }

        const canTransition = transitions[order.status]?.includes(status);
        if (!canTransition) {
            return res.status(400).json({
                success: false,
                message: `Cannot change status from "${order.status}" to "${status}"`,
            });
        }

        order.status = status;
        await order.save();

        // SMS on outbound and completion updates.
        if (status === "shipped" || status === "delivered") {
            sendOrderSMS({
                userId: order.user,
                message: `Your order status is now "${status}". Order ID: ${order._id}`,
            });
        }

        res.json({ success: true, message: "Order status updated", order });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
