import crypto from "crypto";
import Razorpay from "razorpay";
import Order from "../models/Order.js";
import Product from "../models/Product.js";
import Settings from "../models/Settings.js";
import User from "../models/User.js";
import {
    calculateCouponDiscount,
    incrementCouponUsage,
} from "../Services/couponService.js";
import {
    notifyOrderDelivered,
    notifyOrderPlaced,
} from "../Services/notificationService.js";
import {
    createShiprocketShipment,
    trackShiprocketShipment,
} from "../Services/shippingService.js";

const getRazorpayInstance = () => {
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret) return null;

    return new Razorpay({
        key_id: keyId,
        key_secret: keySecret,
    });
};

const sendDeliveredNotifications = async ({ order, settings }) => {
    try {
        if (!order) return;

        const userId = order.user?._id || order.user;
        const user = userId
            ? await User.findById(userId).select("name email")
            : null;

        await notifyOrderDelivered({ order, user, settings });
    } catch (error) {
        console.error("Delivered notification failed:", error.message);
    }
};

const validateAndBuildOrderItems = async (incomingItems) => {
    if (!incomingItems || !Array.isArray(incomingItems) || incomingItems.length === 0) {
        throw new Error("Products are required");
    }

    let totalAmount = 0;
    const orderProducts = [];
    let ownerAdminId = null;

    for (const item of incomingItems) {
        const product = await Product.findById(item.product);

        if (!product || !product.isActive) {
            throw new Error(`Product ${item.product} not found or inactive`);
        }

        if (product.stock < item.quantity) {
            throw new Error(`Insufficient stock for ${product.name}`);
        }

        if (!product.admin) {
            throw new Error(`Product ${product.name} is not mapped to a store admin`);
        }

        const currentProductAdminId = product.admin.toString();
        if (!ownerAdminId) {
            ownerAdminId = currentProductAdminId;
        } else if (ownerAdminId !== currentProductAdminId) {
            throw new Error("You can only place one store admin's products in a single order");
        }

        orderProducts.push({
            product: item.product,
            quantity: item.quantity,
            price: product.price,
        });

        totalAmount += product.price * item.quantity;
    }

    return { orderProducts, totalAmount, ownerAdminId };
};

const decrementStockForOrder = async (order) => {
    const adjustedProducts = [];

    try {
        for (const item of order.items || []) {
            const productId = item.product?._id || item.product;
            const qty = Number(item.quantity || 0);
            if (!productId || qty <= 0) continue;

            const updated = await Product.findOneAndUpdate(
                { _id: productId, stock: { $gte: qty } },
                { $inc: { stock: -qty } },
                { new: true }
            );

            if (!updated) {
                throw new Error("Insufficient stock while accepting order");
            }

            adjustedProducts.push({ productId, qty });
        }
    } catch (error) {
        if (adjustedProducts.length > 0) {
            await Promise.all(
                adjustedProducts.map(({ productId, qty }) =>
                    Product.findByIdAndUpdate(productId, { $inc: { stock: qty } })
                )
            );
        }
        throw error;
    }
};

const restoreStockForOrder = async (order) => {
    const updates = (order.items || []).map((item) => {
        const productId = item.product?._id || item.product;
        const qty = Number(item.quantity || 0);
        if (!productId || qty <= 0) return null;
        return Product.findByIdAndUpdate(productId, { $inc: { stock: qty } });
    });

    await Promise.all(updates.filter(Boolean));
};

const createOrderDocument = async ({
    userId,
    adminId,
    orderProducts,
    totalAmount,
    subtotalAmount = totalAmount,
    discountAmount = 0,
    couponCode = "",
    shippingAddress,
    shippingDetails = null,
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
        admin: adminId,
        items: orderProducts,
        totalAmount,
        subtotalAmount,
        discountAmount,
        couponCode,
        shippingAddress,
        shippingDetails,
        paymentMethod,
        paymentStatus,
        paymentId,
        paymentGatewayOrderId,
        paymentSignature,
    });

    await order.save();
    return order;
};

const normalizeShippingInput = ({ shippingAddress, user }) => {
    if (typeof shippingAddress === "string") {
        const textAddress = shippingAddress.trim();
        if (!textAddress) {
            throw new Error("Shipping address is required");
        }

        return {
            shippingAddress: textAddress,
            shippingDetails: {
                name: user?.name || "",
                phone: "",
                addressLine1: textAddress,
                addressLine2: "",
                city: "",
                state: "",
                pincode: "",
                country: "India",
                email: user?.email || "",
            },
        };
    }

    if (shippingAddress && typeof shippingAddress === "object") {
        const details = {
            name: String(shippingAddress.name || user?.name || "").trim(),
            phone: String(shippingAddress.phone || "").trim(),
            addressLine1: String(shippingAddress.addressLine1 || "").trim(),
            addressLine2: String(shippingAddress.addressLine2 || "").trim(),
            city: String(shippingAddress.city || "").trim(),
            state: String(shippingAddress.state || "").trim(),
            pincode: String(shippingAddress.pincode || "").trim(),
            country: String(shippingAddress.country || "India").trim(),
            email: String(shippingAddress.email || user?.email || "").trim(),
        };

        if (!details.addressLine1 || !details.city || !details.state || !details.pincode) {
            throw new Error("Shipping address fields are incomplete");
        }

        const shippingAddressText = [
            details.addressLine1,
            details.addressLine2,
            details.city,
            details.state,
            details.pincode,
            details.country,
        ]
            .filter(Boolean)
            .join(", ");

        return { shippingAddress: shippingAddressText, shippingDetails: details };
    }

    throw new Error("Shipping address is required");
};

export const createOrder = async (req, res) => {
    try {
        const userId = req.user.id;
        const {
            products,
            items,
            shippingAddress,
            paymentMethod = "cod",
            couponCode = "",
        } = req.body;
        const incomingItems = products ?? items;
        const user = await User.findById(userId).select("name email phone");
        const normalizedShipping = normalizeShippingInput({
            shippingAddress,
            user,
        });

        const normalizedPaymentMethod = paymentMethod === "online" ? "online" : "cod";
        const { orderProducts, totalAmount, ownerAdminId } =
            await validateAndBuildOrderItems(incomingItems);
        const { discountAmount, couponCode: appliedCouponCode, appliedCoupon, reason } =
            await calculateCouponDiscount({
                adminId: ownerAdminId,
                subtotalAmount: totalAmount,
                couponCode,
            });
        if (couponCode && !appliedCouponCode) {
            return res.status(400).json({ message: reason || "Invalid coupon code" });
        }
        const settings = await Settings.getForAdmin(ownerAdminId);

        if (normalizedPaymentMethod === "cod" && settings.codEnabled === false) {
            return res.status(400).json({ message: "Cash on Delivery is currently disabled for this store" });
        }
        if (normalizedPaymentMethod === "online" && settings.onlinePaymentEnabled === false) {
            return res.status(400).json({ message: "Online payment is currently disabled for this store" });
        }

        const order = await createOrderDocument({
            userId,
            adminId: ownerAdminId,
            orderProducts,
            totalAmount: Math.max(totalAmount - discountAmount, 0),
            subtotalAmount: totalAmount,
            discountAmount,
            couponCode: appliedCouponCode,
            shippingAddress: normalizedShipping.shippingAddress,
            shippingDetails: normalizedShipping.shippingDetails,
            paymentMethod: normalizedPaymentMethod,
            paymentStatus: normalizedPaymentMethod === "cod" ? "pending" : "paid",
        });
        if (appliedCoupon?._id) {
            await incrementCouponUsage(appliedCoupon._id);
        }

        if (user) {
            notifyOrderPlaced({ order, user, settings }).catch((error) => {
                console.error("Order notification failed:", error.message);
            });
        }

        res.status(201).json({
            message: "Order created successfully",
            order,
            pricing: {
                subtotalAmount: totalAmount,
                discountAmount,
                totalAmount: order.totalAmount,
                coupon: appliedCoupon,
            },
        });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

export const createRazorpayOrder = async (req, res) => {
    try {
        const razorpayInstance = getRazorpayInstance();
        if (!razorpayInstance) {
            return res.status(500).json({
                message: "Payment gateway is not configured",
            });
        }

        const { products, items, shippingAddress, couponCode = "" } = req.body;
        const incomingItems = products ?? items;

        normalizeShippingInput({ shippingAddress, user: null });

        const { totalAmount, ownerAdminId } = await validateAndBuildOrderItems(incomingItems);
        const { discountAmount, couponCode: appliedCouponCode, appliedCoupon, reason } =
            await calculateCouponDiscount({
                adminId: ownerAdminId,
                subtotalAmount: totalAmount,
                couponCode,
            });
        if (couponCode && !appliedCouponCode) {
            return res.status(400).json({ message: reason || "Invalid coupon code" });
        }
        const settings = await Settings.getForAdmin(ownerAdminId);

        if (settings.onlinePaymentEnabled === false) {
            return res.status(400).json({ message: "Online payment is currently disabled for this store" });
        }
        const finalAmount = Math.max(totalAmount - discountAmount, 0);
        const amountInPaise = Math.round(finalAmount * 100);

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
            pricing: {
                subtotalAmount: totalAmount,
                discountAmount,
                totalAmount: finalAmount,
                coupon: appliedCouponCode ? appliedCoupon : null,
            },
        });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

export const verifyRazorpayPaymentAndCreateOrder = async (req, res) => {
    try {
        const razorpayInstance = getRazorpayInstance();
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
            couponCode = "",
            razorpayOrderId,
            razorpayPaymentId,
            razorpaySignature,
        } = req.body;

        const user = await User.findById(userId).select("name email phone");
        const normalizedShipping = normalizeShippingInput({
            shippingAddress,
            user,
        });
        if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
            return res.status(400).json({ message: "Payment details are required" });
        }

        const incomingItems = products ?? items;
        const { orderProducts, totalAmount, ownerAdminId } =
            await validateAndBuildOrderItems(incomingItems);
        const { discountAmount, couponCode: appliedCouponCode, appliedCoupon, reason } =
            await calculateCouponDiscount({
                adminId: ownerAdminId,
                subtotalAmount: totalAmount,
                couponCode,
            });
        if (couponCode && !appliedCouponCode) {
            return res.status(400).json({ message: reason || "Invalid coupon code" });
        }
        const settings = await Settings.getForAdmin(ownerAdminId);

        if (settings.onlinePaymentEnabled === false) {
            return res.status(400).json({ message: "Online payment is currently disabled for this store" });
        }

        const generatedSignature = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
            .update(`${razorpayOrderId}|${razorpayPaymentId}`)
            .digest("hex");

        if (generatedSignature !== razorpaySignature) {
            return res.status(400).json({ message: "Payment signature verification failed" });
        }

        const order = await createOrderDocument({
            userId,
            adminId: ownerAdminId,
            orderProducts,
            totalAmount: Math.max(totalAmount - discountAmount, 0),
            subtotalAmount: totalAmount,
            discountAmount,
            couponCode: appliedCouponCode,
            shippingAddress: normalizedShipping.shippingAddress,
            shippingDetails: normalizedShipping.shippingDetails,
            paymentMethod: "online",
            paymentStatus: "paid",
            paymentId: razorpayPaymentId,
            paymentGatewayOrderId: razorpayOrderId,
            paymentSignature: razorpaySignature,
        });
        if (appliedCoupon?._id) {
            await incrementCouponUsage(appliedCoupon._id);
        }

        if (user) {
            notifyOrderPlaced({ order, user, settings }).catch((error) => {
                console.error("Order notification failed:", error.message);
            });
        }

        res.status(201).json({
            message: "Payment verified and order created successfully",
            order,
            pricing: {
                subtotalAmount: totalAmount,
                discountAmount,
                totalAmount: order.totalAmount,
                coupon: appliedCoupon,
            },
        });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

export const validateCoupon = async (req, res) => {
    try {
        const { products, items, couponCode = "" } = req.body;
        const incomingItems = products ?? items;
        const { totalAmount, ownerAdminId } = await validateAndBuildOrderItems(incomingItems);
        const { discountAmount, couponCode: appliedCouponCode, appliedCoupon, reason } =
            await calculateCouponDiscount({
                adminId: ownerAdminId,
                subtotalAmount: totalAmount,
                couponCode,
            });

        if (couponCode && !appliedCouponCode) {
            return res.status(400).json({
                success: false,
                message: reason || "Invalid coupon code",
            });
        }

        return res.json({
            success: true,
            message: appliedCouponCode
                ? `${appliedCoupon.code} applied successfully`
                : "No coupon applied",
            pricing: {
                subtotalAmount: totalAmount,
                discountAmount,
                totalAmount: Math.max(totalAmount - discountAmount, 0),
                coupon: appliedCoupon,
            },
        });
    } catch (error) {
        return res.status(400).json({
            success: false,
            message: error.message,
        });
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
        const orders = await Order.find({
            admin: req.admin._id,
            status: { $ne: "delivered" },
        })
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
        const orders = await Order.find({ admin: req.admin._id, status: "delivered" })
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
            admin: req.admin._id,
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
                    admin: req.admin._id,
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
        const settings = await Settings.getForAdmin(req.admin._id);

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

        const order = await Order.findOne({ _id: id, admin: req.admin._id });
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

        const previousStatus = order.status;

        if (previousStatus === "pending" && status === "processing" && !order.stockDeducted) {
            await decrementStockForOrder(order);
            order.stockDeducted = true;
        }

        if (status === "cancelled" && order.stockDeducted) {
            await restoreStockForOrder(order);
            order.stockDeducted = false;
        }

        order.status = status;
        await order.save();

        if (status === "delivered") {
            sendDeliveredNotifications({ order, settings });
        }

        res.json({ success: true, message: "Order status updated", order });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const createShipmentForOrder = async (req, res) => {
    try {
        const { id } = req.params;
        const settings = await Settings.getForAdmin(req.admin._id);
        const order = await Order.findOne({ _id: id, admin: req.admin._id })
            .populate("items.product")
            .populate("user", "name email phone");

        if (!order) {
            return res.status(404).json({ success: false, message: "Order not found" });
        }

        if (order.status === "cancelled" || order.status === "delivered") {
            return res.status(400).json({
                success: false,
                message: `Cannot create shipment for "${order.status}" order`,
            });
        }

        if (order.shipment?.awbCode) {
            return res.status(400).json({
                success: false,
                message: "Shipment already created for this order",
            });
        }

        const shipment = await createShiprocketShipment({ order, settings });
        order.shipment = shipment;

        if (order.status === "pending" || order.status === "processing") {
            order.status = "shipped";
        }

        await order.save();

        res.json({
            success: true,
            message: "Shipment created successfully",
            order,
        });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

export const syncOrderShipmentTracking = async (req, res) => {
    try {
        const { id } = req.params;
        const settings = await Settings.getForAdmin(req.admin._id);
        const order = await Order.findOne({ _id: id, admin: req.admin._id });

        if (!order) {
            return res.status(404).json({ success: false, message: "Order not found" });
        }

        if (!order.shipment?.awbCode) {
            return res.status(400).json({
                success: false,
                message: "Shipment AWB not found for this order",
            });
        }

        const tracking = await trackShiprocketShipment({
            awbCode: order.shipment.awbCode,
            settings,
        });

        order.shipment = {
            ...order.shipment,
            courierName: tracking.courierName || order.shipment.courierName,
            trackingUrl: tracking.trackingUrl || order.shipment.trackingUrl,
            status: tracking.status || order.shipment.status,
            rawResponse: tracking.rawResponse,
        };

        const previousStatus = order.status;
        const normalizedTrackingStatus = String(tracking.status || "").toLowerCase();
        if (normalizedTrackingStatus.includes("deliver")) {
            order.status = "delivered";
        } else if (
            (normalizedTrackingStatus.includes("ship") ||
                normalizedTrackingStatus.includes("transit")) &&
            (order.status === "pending" || order.status === "processing")
        ) {
            order.status = "shipped";
        }

        await order.save();

        if (previousStatus !== "delivered" && order.status === "delivered") {
            sendDeliveredNotifications({ order, settings });
        }

        res.json({
            success: true,
            message: "Tracking synced successfully",
            order,
        });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};
