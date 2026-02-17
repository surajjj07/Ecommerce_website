import crypto from "crypto";
import Razorpay from "razorpay";
import Order from "../models/Order.js";
import Product from "../models/Product.js";
import Settings from "../models/Settings.js";
import User from "../models/User.js";
import { sendSMS } from "../Services/smsService.js";

const razorpayInstance =
    process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET
        ? new Razorpay({
            key_id: process.env.RAZORPAY_KEY_ID,
            key_secret: process.env.RAZORPAY_KEY_SECRET,
        })
        : null;

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
    }
};

const validateAndBuildOrderItems = async (incomingItems) => {
    if (!incomingItems || !Array.isArray(incomingItems) || incomingItems.length === 0) {
        throw new Error("Products are required");
    }

    let totalAmount = 0;
    const orderProducts = [];

    for (const item of incomingItems) {
        const product = await Product.findById(item.product);

        if (!product || !product.isActive) {
            throw new Error(`Product ${item.product} not found or inactive`);
        }

        if (product.stock < item.quantity) {
            throw new Error(`Insufficient stock for ${product.name}`);
        }

        orderProducts.push({
            product: item.product,
            quantity: item.quantity,
            price: product.price,
        });

        totalAmount += product.price * item.quantity;
    }

    return { orderProducts, totalAmount };
};

const createOrderDocument = async ({
    userId,
    orderProducts,
    totalAmount,
    shippingAddress,
    paymentMethod = "cod",
    paymentStatus = "pending",
    paymentId = null,
    paymentGatewayOrderId = null,
    paymentSignature = null,
}) => {
    const orderId = `ORD-${Date.now()}-${Math.floor(Math.random() * 9000 + 1000)}`;

    const order = new Order({
        orderId,
        user: userId,
        items: orderProducts,
        totalAmount,
        shippingAddress,
        paymentMethod,
        paymentStatus,
        paymentId,
        paymentGatewayOrderId,
        paymentSignature,
    });

    await order.save();
    return order;
};

export const createOrder = async (req, res) => {
    try {
        const userId = req.user.id;
        const { products, items, shippingAddress, paymentMethod = "cod" } = req.body;
        const incomingItems = products ?? items;

        if (!shippingAddress?.trim()) {
            return res.status(400).json({ message: "Shipping address is required" });
        }

        const normalizedPaymentMethod = paymentMethod === "online" ? "online" : "cod";
        const { orderProducts, totalAmount } = await validateAndBuildOrderItems(incomingItems);

        const order = await createOrderDocument({
            userId,
            orderProducts,
            totalAmount,
            shippingAddress,
            paymentMethod: normalizedPaymentMethod,
            paymentStatus: normalizedPaymentMethod === "cod" ? "pending" : "paid",
        });

        sendOrderSMS({
            userId,
            message: `Order placed successfully. Total amount INR ${totalAmount}.`,
        });

        res.status(201).json({
            message: "Order created successfully",
            order,
        });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

export const createRazorpayOrder = async (req, res) => {
    try {
        if (!razorpayInstance) {
            return res.status(500).json({
                message: "Payment gateway is not configured",
            });
        }

        const { products, items, shippingAddress } = req.body;
        const incomingItems = products ?? items;

        if (!shippingAddress?.trim()) {
            return res.status(400).json({ message: "Shipping address is required" });
        }

        const { totalAmount } = await validateAndBuildOrderItems(incomingItems);
        const amountInPaise = Math.round(totalAmount * 100);

        const razorpayOrder = await razorpayInstance.orders.create({
            amount: amountInPaise,
            currency: "INR",
            receipt: `rcpt_${Date.now()}`,
        });

        res.json({
            key: process.env.RAZORPAY_KEY_ID,
            orderId: razorpayOrder.id,
            amount: razorpayOrder.amount,
            currency: razorpayOrder.currency,
        });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

export const verifyRazorpayPaymentAndCreateOrder = async (req, res) => {
    try {
        if (!razorpayInstance || !process.env.RAZORPAY_KEY_SECRET) {
            return res.status(500).json({
                message: "Payment gateway is not configured",
            });
        }

        const userId = req.user.id;
        const {
            products,
            items,
            shippingAddress,
            razorpayOrderId,
            razorpayPaymentId,
            razorpaySignature,
        } = req.body;

        if (!shippingAddress?.trim()) {
            return res.status(400).json({ message: "Shipping address is required" });
        }

        if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
            return res.status(400).json({ message: "Payment details are required" });
        }

        const incomingItems = products ?? items;
        const { orderProducts, totalAmount } = await validateAndBuildOrderItems(incomingItems);

        const generatedSignature = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
            .update(`${razorpayOrderId}|${razorpayPaymentId}`)
            .digest("hex");

        if (generatedSignature !== razorpaySignature) {
            return res.status(400).json({ message: "Payment signature verification failed" });
        }

        const order = await createOrderDocument({
            userId,
            orderProducts,
            totalAmount,
            shippingAddress,
            paymentMethod: "online",
            paymentStatus: "paid",
            paymentId: razorpayPaymentId,
            paymentGatewayOrderId: razorpayOrderId,
            paymentSignature: razorpaySignature,
        });

        sendOrderSMS({
            userId,
            message: `Payment successful. Order confirmed. Total amount INR ${totalAmount}.`,
        });

        res.status(201).json({
            message: "Payment verified and order created successfully",
            order,
        });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

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
