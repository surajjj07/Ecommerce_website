import crypto from "crypto";
import Razorpay from "razorpay";
import Order from "../models/Order.js";
import Product from "../models/Product.js";
import Settings from "../models/Settings.js";
import User from "../models/User.js";
import {
    calculateCouponDiscount,
    releaseCouponUsage,
    reserveCouponUsage,
} from "../Services/couponService.js";
import {
    notifyOrderDelivered,
    notifyOrderPlaced,
} from "../Services/notificationService.js";
import {
    createShiprocketShipment,
    trackShiprocketShipment,
} from "../Services/shippingService.js";
import { sendSupplierFulfillmentRequest } from "../Services/supplierFulfillmentService.js";
import { sendSupplierWhatsAppHandoff } from "../Services/supplierHandoffService.js";
import { getEffectiveProductPrice } from "../utils/pricing.js";

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
    const fulfillmentGroupMap = new Map();

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

        const effectivePrice = getEffectiveProductPrice(product);

        orderProducts.push({
            product: item.product,
            quantity: item.quantity,
            price: effectivePrice,
        });

        const supplierId = product.supplier ? product.supplier.toString() : "";
        const groupKey = supplierId ? `supplier:${supplierId}` : "admin";
        if (!fulfillmentGroupMap.has(groupKey)) {
            fulfillmentGroupMap.set(groupKey, {
                groupId: supplierId ? `supplier-${supplierId}` : "admin-main",
                channel: supplierId ? "supplier" : "admin",
                supplier: product.supplier || null,
                productIds: [],
                mode: "none",
                status: "not_started",
                note: "",
            });
        }

        const group = fulfillmentGroupMap.get(groupKey);
        if (!group.productIds.some((id) => id.toString() === product._id.toString())) {
            group.productIds.push(product._id);
        }

        totalAmount += effectivePrice * item.quantity;
    }

    return {
        orderProducts,
        totalAmount,
        ownerAdminId,
        fulfillmentGroups: [...fulfillmentGroupMap.values()],
    };
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

const getSupplierRef = (item) => item?.product?.supplier || item?.supplier || null;

const orderSupportsSupplierFulfillment = (order) => {
    const items = order?.items || [];
    if (items.length === 0) return false;

    return items.every((item) => Boolean(getSupplierRef(item)?._id || getSupplierRef(item)));
};

const getOrderFulfillmentChannel = (order) =>
    orderSupportsSupplierFulfillment(order) ? "supplier" : "admin";

const getFulfillmentChannelForProductIds = async (productIds = []) => {
    const products = await Product.find({ _id: { $in: productIds } }).select("supplier");
    return getOrderFulfillmentChannel({ items: products });
};

const getOrderItemsForGroup = (order, group) =>
    (order.items || []).filter((item) =>
        (group.productIds || []).some(
            (productId) =>
                productId.toString() === (item.product?._id || item.product)?.toString()
        )
    );

const findFulfillmentGroup = (order, groupId) =>
    (order.fulfillmentGroups || []).find((group) => group.groupId === groupId);

const buildSupplierPickupOverride = (supplier) => {
    if (!supplier) return null;

    const pickup = {
        pickupLocation:
            String(supplier.pickupLocationCode || "").trim() ||
            `SUP-${(supplier._id || "").toString().slice(-6) || "pickup"}`,
        pickupPincode: String(supplier.pickupPincode || "").trim(),
        pickupCity: String(supplier.pickupCity || "").trim(),
        pickupState: String(supplier.pickupState || "").trim(),
        pickupCountry: String(supplier.pickupCountry || "India").trim(),
        pickupAddress: String(supplier.pickupAddressLine1 || supplier.address || "").trim(),
        pickupAddressLine2: String(supplier.pickupAddressLine2 || "").trim(),
        pickupPhone: String(
            supplier.pickupPhone || supplier.phone || supplier.whatsappNumber || ""
        ).trim(),
        pickupContactName: String(
            supplier.pickupContactName || supplier.name || supplier.companyName || "Supplier"
        ).trim(),
        pickupEmail: String(supplier.email || "").trim(),
    };

    const missing = [];
    if (!pickup.pickupAddress) missing.push("address");
    if (!pickup.pickupCity) missing.push("city");
    if (!pickup.pickupState) missing.push("state");
    if (!pickup.pickupPincode) missing.push("pincode");
    if (!pickup.pickupPhone) missing.push("phone");

    if (missing.length > 0) {
        throw new Error(
            `Supplier pickup details are incomplete (${missing.join(
                ", "
            )}). Please update supplier pickup address in supplier profile.`
        );
    }

    return pickup;
};

const recomputeOrderStatusFromGroups = (order) => {
    const groups = order.fulfillmentGroups || [];
    if (groups.length === 0) {
        return order.status;
    }

    if (groups.every((group) => group.status === "delivered")) {
        return "delivered";
    }

    if (groups.some((group) => group.status === "shipped" || group.status === "delivered")) {
        return "shipped";
    }

    if (groups.some((group) => group.status === "requested")) {
        return "processing";
    }

    return "pending";
};

const ensureStockDeducted = async (order) => {
    if (!order.stockDeducted) {
        await decrementStockForOrder(order);
        order.stockDeducted = true;
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
    fulfillmentGroups = [],
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
        fulfillmentGroups,
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
        if (normalizedPaymentMethod !== "cod") {
            return res.status(400).json({
                message:
                    "Online orders must be completed through the payment gateway verification flow",
            });
        }
        const { orderProducts, totalAmount, ownerAdminId, fulfillmentGroups } =
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

        let finalDiscountAmount = discountAmount;
        let finalCouponCode = appliedCouponCode;
        let finalAppliedCoupon = appliedCoupon;
        let reservedCouponId = null;

        if (appliedCouponCode) {
            const reservedCoupon = await reserveCouponUsage({
                adminId: ownerAdminId,
                subtotalAmount: totalAmount,
                couponCode: appliedCouponCode,
            });

            if (!reservedCoupon.couponCode) {
                return res.status(409).json({
                    message: reservedCoupon.reason || "Coupon is no longer available",
                });
            }

            reservedCouponId = reservedCoupon.appliedCoupon?._id || null;
            finalDiscountAmount = reservedCoupon.discountAmount;
            finalCouponCode = reservedCoupon.couponCode;
            finalAppliedCoupon = reservedCoupon.appliedCoupon;
        }

        let order;
        try {
            order = await createOrderDocument({
                userId,
                adminId: ownerAdminId,
                orderProducts,
                totalAmount: Math.max(totalAmount - finalDiscountAmount, 0),
                subtotalAmount: totalAmount,
                discountAmount: finalDiscountAmount,
                couponCode: finalCouponCode,
                shippingAddress: normalizedShipping.shippingAddress,
                shippingDetails: normalizedShipping.shippingDetails,
                paymentMethod: normalizedPaymentMethod,
                paymentStatus: normalizedPaymentMethod === "cod" ? "pending" : "paid",
                fulfillmentGroups,
            });
            order.supplierFulfillment.channel = await getFulfillmentChannelForProductIds(
                orderProducts.map((item) => item.product)
            );
            await order.save();
        } catch (error) {
            if (reservedCouponId) {
                await releaseCouponUsage(reservedCouponId);
            }
            throw error;
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
                discountAmount: finalDiscountAmount,
                totalAmount: order.totalAmount,
                coupon: finalAppliedCoupon,
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
        const { orderProducts, totalAmount, ownerAdminId, fulfillmentGroups } =
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

        let finalDiscountAmount = discountAmount;
        let finalCouponCode = appliedCouponCode;
        let finalAppliedCoupon = appliedCoupon;
        let reservedCouponId = null;

        if (appliedCouponCode) {
            const reservedCoupon = await reserveCouponUsage({
                adminId: ownerAdminId,
                subtotalAmount: totalAmount,
                couponCode: appliedCouponCode,
            });

            if (!reservedCoupon.couponCode) {
                return res.status(409).json({
                    message: reservedCoupon.reason || "Coupon is no longer available",
                });
            }

            reservedCouponId = reservedCoupon.appliedCoupon?._id || null;
            finalDiscountAmount = reservedCoupon.discountAmount;
            finalCouponCode = reservedCoupon.couponCode;
            finalAppliedCoupon = reservedCoupon.appliedCoupon;
        }

        let order;
        try {
            order = await createOrderDocument({
                userId,
                adminId: ownerAdminId,
                orderProducts,
                totalAmount: Math.max(totalAmount - finalDiscountAmount, 0),
                subtotalAmount: totalAmount,
                discountAmount: finalDiscountAmount,
                couponCode: finalCouponCode,
                shippingAddress: normalizedShipping.shippingAddress,
                shippingDetails: normalizedShipping.shippingDetails,
                paymentMethod: "online",
                paymentStatus: "paid",
                paymentId: razorpayPaymentId,
                paymentGatewayOrderId: razorpayOrderId,
                paymentSignature: razorpaySignature,
                fulfillmentGroups,
            });
            order.supplierFulfillment.channel = await getFulfillmentChannelForProductIds(
                orderProducts.map((item) => item.product)
            );
            await order.save();
        } catch (error) {
            if (reservedCouponId) {
                await releaseCouponUsage(reservedCouponId);
            }
            throw error;
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
                discountAmount: finalDiscountAmount,
                totalAmount: order.totalAmount,
                coupon: finalAppliedCoupon,
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
            .populate({
                path: "items.product",
                populate: {
                    path: "supplier",
                    select: "name companyName email phone whatsappNumber website fulfillmentLeadTimeDays",
                },
            })
            .populate("fulfillmentGroups.supplier", "name companyName email phone website fulfillmentLeadTimeDays")
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
            .populate({
                path: "items.product",
                populate: {
                    path: "supplier",
                    select: "name companyName email phone whatsappNumber website fulfillmentLeadTimeDays",
                },
            })
            .populate("fulfillmentGroups.supplier", "name companyName email phone website fulfillmentLeadTimeDays")
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
            .populate({
                path: "items.product",
                populate: {
                    path: "supplier",
                    select: "name companyName email phone whatsappNumber website fulfillmentLeadTimeDays",
                },
            })
            .populate("fulfillmentGroups.supplier", "name companyName email phone website fulfillmentLeadTimeDays")
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

        const fulfillmentChannel = await getFulfillmentChannelForProductIds(
            (order.items || []).map((item) => item.product?._id || item.product)
        );
        if (fulfillmentChannel === "supplier" && ["shipped", "delivered"].includes(status)) {
            return res.status(400).json({
                success: false,
                message: "Use supplier fulfillment actions for shipped or delivered updates on supplier orders",
            });
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
            .populate({
                path: "items.product",
                populate: {
                    path: "supplier",
                    select: "name companyName email phone whatsappNumber website fulfillmentLeadTimeDays",
                },
            })
            .populate("user", "name email phone");

        if (!order) {
            return res.status(404).json({ success: false, message: "Order not found" });
        }

        if (orderSupportsSupplierFulfillment(order)) {
            return res.status(400).json({
                success: false,
                message: "This order is supplier-fulfilled. Use manual or automated supplier fulfillment instead.",
            });
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

        let deductedStockForShipment = false;

        try {
            if (!order.stockDeducted) {
                await ensureStockDeducted(order);
                deductedStockForShipment = true;
            }

            const shipment = await createShiprocketShipment({ order, settings });
            order.shipment = shipment;

            if (order.status === "pending" || order.status === "processing") {
                order.status = "shipped";
            }

            await order.save();
        } catch (error) {
            if (deductedStockForShipment) {
                await restoreStockForOrder(order);
                order.stockDeducted = false;
            }
            throw error;
        }

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

        if (order.supplierFulfillment?.channel === "supplier") {
            return res.status(400).json({
                success: false,
                message: "This order is supplier-fulfilled. Update supplier fulfillment status instead.",
            });
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
        let deductedStockFromTracking = false;
        if (normalizedTrackingStatus.includes("deliver")) {
            if (!order.stockDeducted) {
                await decrementStockForOrder(order);
                order.stockDeducted = true;
                deductedStockFromTracking = true;
            }
            order.status = "delivered";
        } else if (
            (normalizedTrackingStatus.includes("ship") ||
                normalizedTrackingStatus.includes("transit")) &&
            (order.status === "pending" || order.status === "processing")
        ) {
            if (!order.stockDeducted) {
                await decrementStockForOrder(order);
                order.stockDeducted = true;
                deductedStockFromTracking = true;
            }
            order.status = "shipped";
        }

        try {
            await order.save();
        } catch (error) {
            if (deductedStockFromTracking) {
                await restoreStockForOrder(order);
                order.stockDeducted = false;
            }
            throw error;
        }

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

const getSupplierFulfillmentOrder = async ({ id, adminId }) =>
    Order.findOne({ _id: id, admin: adminId })
        .populate({
            path: "items.product",
            populate: {
                path: "supplier",
                select: "name companyName email phone whatsappNumber website fulfillmentLeadTimeDays apiIntegration pickupContactName pickupPhone pickupAddressLine1 pickupAddressLine2 pickupCity pickupState pickupPincode pickupCountry pickupLocationCode address",
            },
        })
        .populate("fulfillmentGroups.supplier", "name companyName email phone whatsappNumber website fulfillmentLeadTimeDays pickupContactName pickupPhone pickupAddressLine1 pickupAddressLine2 pickupCity pickupState pickupPincode pickupCountry pickupLocationCode address")
        .populate("user", "name email phone");

export const createShipmentForFulfillmentGroup = async (req, res) => {
    try {
        const { id, groupId } = req.params;
        const settings = await Settings.getForAdmin(req.admin._id);
        const order = await getSupplierFulfillmentOrder({ id, adminId: req.admin._id });

        if (!order) {
            return res.status(404).json({ success: false, message: "Order not found" });
        }

        const group = findFulfillmentGroup(order, groupId);
        if (!group || group.channel !== "admin") {
            return res.status(404).json({ success: false, message: "Admin fulfillment group not found" });
        }

        if (group.shipment?.awbCode) {
            return res.status(400).json({ success: false, message: "Shipment already created for this group" });
        }

        await ensureStockDeducted(order);

        const items = getOrderItemsForGroup(order, group);
        const amount = items.reduce((sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 0), 0);
        const shipment = await createShiprocketShipment({
            order,
            settings,
            itemsOverride: items,
            externalOrderId: `${order.orderId}-${group.groupId}`,
            amountOverride: amount,
        });

        group.shipment = shipment;
        group.status = "shipped";
        group.shippedAt = new Date();
        order.status = recomputeOrderStatusFromGroups(order);
        await order.save();

        return res.json({ success: true, message: "Admin shipment created", order });
    } catch (error) {
        return res.status(400).json({ success: false, message: error.message });
    }
};

export const createSupplierShipmentForGroup = async (req, res) => {
    try {
        const { id, groupId } = req.params;
        const settings = await Settings.getForAdmin(req.admin._id);
        const order = await getSupplierFulfillmentOrder({ id, adminId: req.admin._id });

        if (!order) {
            return res.status(404).json({ success: false, message: "Order not found" });
        }

        const group = findFulfillmentGroup(order, groupId);
        if (!group || group.channel !== "supplier") {
            return res
                .status(404)
                .json({ success: false, message: "Supplier fulfillment group not found" });
        }

        if (order.status === "cancelled" || order.status === "delivered") {
            return res.status(400).json({
                success: false,
                message: `Cannot create shipment for "${order.status}" order`,
            });
        }

        if (group.shipment?.awbCode) {
            return res.status(400).json({
                success: false,
                message: "Shipment already created for this supplier group",
            });
        }

        await ensureStockDeducted(order);

        const items = getOrderItemsForGroup(order, group);
        const supplier = items[0]?.product?.supplier;
        if (!supplier) {
            return res.status(400).json({
                success: false,
                message: "Supplier details missing for this group",
            });
        }

        const pickupOverride = buildSupplierPickupOverride(supplier);
        const amount = items.reduce(
            (sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 0),
            0
        );

        const shipment = await createShiprocketShipment({
            order,
            settings,
            itemsOverride: items,
            externalOrderId: `${order.orderId}-${group.groupId}`,
            amountOverride: amount,
            pickupOverride,
        });

        group.shipment = shipment;
        group.status = "shipped";
        group.shippedAt = new Date();
        order.status = recomputeOrderStatusFromGroups(order);
        order.supplierFulfillment = {
            channel: "supplier",
            mode: order.supplierFulfillment?.mode || "automated",
            status: "shipped",
            requestedAt: order.supplierFulfillment?.requestedAt || new Date(),
            notifiedAt: order.supplierFulfillment?.notifiedAt || new Date(),
            whatsappSentAt: order.supplierFulfillment?.whatsappSentAt || null,
            deliveredAt: order.supplierFulfillment?.deliveredAt || null,
            note: order.supplierFulfillment?.note || group.note || "",
        };

        await order.save();

        return res.json({
            success: true,
            message: "Supplier shipment created via Shiprocket",
            order,
        });
    } catch (error) {
        return res.status(400).json({ success: false, message: error.message });
    }
};

export const syncShipmentForFulfillmentGroup = async (req, res) => {
    try {
        const { id, groupId } = req.params;
        const settings = await Settings.getForAdmin(req.admin._id);
        const order = await Order.findOne({ _id: id, admin: req.admin._id });

        if (!order) {
            return res.status(404).json({ success: false, message: "Order not found" });
        }

        const group = findFulfillmentGroup(order, groupId);
        if (!group || group.channel !== "admin") {
            return res.status(404).json({ success: false, message: "Admin fulfillment group not found" });
        }

        if (!group.shipment?.awbCode) {
            return res.status(400).json({ success: false, message: "Shipment not created for this group" });
        }

        const tracking = await trackShiprocketShipment({
            awbCode: group.shipment.awbCode,
            settings,
        });

        group.shipment = {
            ...group.shipment,
            courierName: tracking.courierName || group.shipment.courierName,
            trackingUrl: tracking.trackingUrl || group.shipment.trackingUrl,
            status: tracking.status || group.shipment.status,
            rawResponse: tracking.rawResponse,
        };

        const normalizedTrackingStatus = String(tracking.status || "").toLowerCase();
        if (normalizedTrackingStatus.includes("deliver")) {
            group.status = "delivered";
            group.deliveredAt = new Date();
        } else if (normalizedTrackingStatus.includes("ship") || normalizedTrackingStatus.includes("transit")) {
            group.status = "shipped";
            group.shippedAt = group.shippedAt || new Date();
        }

        const previousStatus = order.status;
        order.status = recomputeOrderStatusFromGroups(order);
        await order.save();

        if (previousStatus !== "delivered" && order.status === "delivered") {
            await sendDeliveredNotifications({ order, settings });
        }

        return res.json({ success: true, message: "Admin shipment synced", order });
    } catch (error) {
        return res.status(400).json({ success: false, message: error.message });
    }
};

export const startSupplierFulfillmentForGroup = async (req, res) => {
    try {
        const { id, groupId } = req.params;
        const incomingMode = String(req.body?.mode || "").trim().toLowerCase();
        const mode =
            incomingMode === "automated"
                ? "automated"
                : incomingMode === "whatsapp"
                ? "whatsapp"
                : "manual";
        const note = String(req.body?.note || "").trim();
        const settings = await Settings.getForAdmin(req.admin._id);
        const order = await getSupplierFulfillmentOrder({ id, adminId: req.admin._id });

        if (!order) {
            return res.status(404).json({ success: false, message: "Order not found" });
        }

        const group = findFulfillmentGroup(order, groupId);
        if (!group || group.channel !== "supplier") {
            return res.status(404).json({ success: false, message: "Supplier fulfillment group not found" });
        }

        await ensureStockDeducted(order);

        const items = getOrderItemsForGroup(order, group);
        const supplier = items[0]?.product?.supplier;
        if (!supplier) {
            return res.status(400).json({ success: false, message: "Supplier details missing for this group" });
        }

        let apiResponse = group.apiResponse || null;
        if (mode === "automated") {
            const result = await sendSupplierFulfillmentRequest({
                order,
                settings,
                supplier,
                items,
                fulfillmentGroup: group,
            });
            apiResponse = result.responseBody;
        }
        if (mode === "whatsapp") {
            await sendSupplierWhatsAppHandoff({
                order,
                supplier,
                items,
                fulfillmentGroup: group,
            });
        }

        group.mode = mode;
        group.status = "requested";
        group.requestedAt = new Date();
        group.notifiedAt =
            mode === "automated" || mode === "whatsapp"
                ? new Date()
                : group.notifiedAt || null;
        group.whatsappSentAt = mode === "whatsapp" ? new Date() : group.whatsappSentAt || null;
        group.note = note;
        group.apiResponse = apiResponse;
        order.status = recomputeOrderStatusFromGroups(order);
        await order.save();

        return res.json({
            success: true,
            message:
                mode === "automated"
                    ? "Supplier API triggered successfully"
                    : mode === "whatsapp"
                    ? "Supplier WhatsApp handoff sent successfully"
                    : "Manual supplier handoff saved",
            order,
        });
    } catch (error) {
        return res.status(400).json({ success: false, message: error.message });
    }
};

export const updateSupplierFulfillmentGroupStatus = async (req, res) => {
    try {
        const { id, groupId } = req.params;
        const nextStatus = String(req.body?.status || "").trim().toLowerCase();
        const note = String(req.body?.note || "").trim();
        const trackingNumber = String(req.body?.trackingNumber || "").trim();
        const trackingUrl = String(req.body?.trackingUrl || "").trim();
        const settings = await Settings.getForAdmin(req.admin._id);
        const order = await getSupplierFulfillmentOrder({ id, adminId: req.admin._id });

        if (!order) {
            return res.status(404).json({ success: false, message: "Order not found" });
        }

        const group = findFulfillmentGroup(order, groupId);
        if (!group || group.channel !== "supplier") {
            return res.status(404).json({ success: false, message: "Supplier fulfillment group not found" });
        }

        if (!["shipped", "delivered"].includes(nextStatus)) {
            return res.status(400).json({ success: false, message: "Status must be shipped or delivered" });
        }

        group.status = nextStatus;
        group.note = note || group.note || "";
        group.trackingNumber = trackingNumber || group.trackingNumber || "";
        group.trackingUrl = trackingUrl || group.trackingUrl || "";
        if (nextStatus === "shipped") {
            group.shippedAt = new Date();
        }
        if (nextStatus === "delivered") {
            group.deliveredAt = new Date();
        }

        const previousStatus = order.status;
        order.status = recomputeOrderStatusFromGroups(order);
        await order.save();

        if (previousStatus !== "delivered" && order.status === "delivered") {
            await sendDeliveredNotifications({ order, settings });
        }

        return res.json({ success: true, message: `Supplier group marked ${nextStatus}`, order });
    } catch (error) {
        return res.status(400).json({ success: false, message: error.message });
    }
};

export const startSupplierFulfillment = async (req, res) => {
    try {
        const { id } = req.params;
        const incomingMode = String(req.body?.mode || "").trim().toLowerCase();
        const mode =
            incomingMode === "automated"
                ? "automated"
                : incomingMode === "whatsapp"
                ? "whatsapp"
                : "manual";
        const note = String(req.body?.note || "").trim();
        const settings = await Settings.getForAdmin(req.admin._id);
        const order = await getSupplierFulfillmentOrder({ id, adminId: req.admin._id });

        if (!order) {
            return res.status(404).json({ success: false, message: "Order not found" });
        }

        if (!orderSupportsSupplierFulfillment(order)) {
            return res.status(400).json({
                success: false,
                message: "This order contains admin-fulfilled items, so admin shipping should be used.",
            });
        }

        if (order.status === "cancelled" || order.status === "delivered") {
            return res.status(400).json({
                success: false,
                message: `Cannot start supplier fulfillment for "${order.status}" order`,
            });
        }

        await ensureStockDeducted(order);

        const group = (order.fulfillmentGroups || []).find((entry) => entry.channel === "supplier");
        const items = group ? getOrderItemsForGroup(order, group) : [];
        const supplier = items[0]?.product?.supplier;

        if (!group || !supplier) {
            return res.status(400).json({
                success: false,
                message: "Supplier fulfillment group not found for this order",
            });
        }

        if (mode === "automated") {
            const result = await sendSupplierFulfillmentRequest({
                order,
                settings,
                supplier,
                items,
                fulfillmentGroup: group,
            });
            group.apiResponse = result.responseBody;
        }

        if (mode === "whatsapp") {
            await sendSupplierWhatsAppHandoff({
                order,
                supplier,
                items,
                fulfillmentGroup: group,
            });
        }

        order.supplierFulfillment = {
            channel: "supplier",
            mode,
            status: "requested",
            requestedAt: new Date(),
            notifiedAt:
                mode === "automated" || mode === "whatsapp"
                    ? new Date()
                    : order.supplierFulfillment?.notifiedAt || null,
            whatsappSentAt:
                mode === "whatsapp"
                    ? new Date()
                    : order.supplierFulfillment?.whatsappSentAt || null,
            deliveredAt: null,
            note,
        };

        group.mode = mode;
        group.status = "requested";
        group.requestedAt = new Date();
        group.notifiedAt =
            mode === "automated" || mode === "whatsapp" ? new Date() : group.notifiedAt || null;
        group.whatsappSentAt = mode === "whatsapp" ? new Date() : group.whatsappSentAt || null;
        group.note = note;

        if (order.status === "pending") {
            order.status = "processing";
        }

        await order.save();

        return res.json({
            success: true,
            message:
                mode === "automated"
                    ? "Supplier API triggered successfully"
                    : mode === "whatsapp"
                    ? "Supplier WhatsApp handoff sent successfully"
                    : "Supplier fulfillment marked as manual",
            order,
        });
    } catch (error) {
        return res.status(400).json({ success: false, message: error.message });
    }
};

export const updateSupplierFulfillmentStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const nextStatus = String(req.body?.status || "").trim().toLowerCase();
        const note = String(req.body?.note || "").trim();
        const settings = await Settings.getForAdmin(req.admin._id);
        const order = await getSupplierFulfillmentOrder({ id, adminId: req.admin._id });

        if (!order) {
            return res.status(404).json({ success: false, message: "Order not found" });
        }

        if (!orderSupportsSupplierFulfillment(order)) {
            return res.status(400).json({
                success: false,
                message: "This order is not configured for supplier fulfillment",
            });
        }

        if (order.supplierFulfillment?.status === "not_started") {
            return res.status(400).json({
                success: false,
                message: "Start supplier fulfillment first",
            });
        }

        if (!["shipped", "delivered"].includes(nextStatus)) {
            return res.status(400).json({
                success: false,
                message: "Supplier fulfillment status must be shipped or delivered",
            });
        }

        await ensureStockDeducted(order);

        order.supplierFulfillment.status = nextStatus;
        order.supplierFulfillment.note = note || order.supplierFulfillment.note || "";

        if (nextStatus === "shipped") {
            order.status = "shipped";
        }

        if (nextStatus === "delivered") {
            order.status = "delivered";
            order.supplierFulfillment.deliveredAt = new Date();
            await sendDeliveredNotifications({ order, settings });
        }

        await order.save();

        return res.json({
            success: true,
            message: `Supplier fulfillment marked as ${nextStatus}`,
            order,
        });
    } catch (error) {
        return res.status(400).json({ success: false, message: error.message });
    }
};
