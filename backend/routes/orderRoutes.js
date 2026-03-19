import express from 'express';
import {
    createShipmentForOrder,
    createOrder,
    createRazorpayOrder,
    getAllOrders,
    getCompletedOrders,
    getCompletedOrdersCountLastMonth,
    getProfitLastMonth,
    getUserOrders,
    syncOrderShipmentTracking,
    updateOrderStatus,
    validateCoupon,
    verifyRazorpayPaymentAndCreateOrder,
} from "../controllers/OrderController.js";
import { authenticateUser } from '../middlewares/auth.js';
import { authenticateAdmin } from '../middlewares/adminAuth.js';

const router = express.Router();

router.post('/create', authenticateUser, createOrder);
router.post('/coupon/validate', validateCoupon);
router.post("/payment/create-order", authenticateUser, createRazorpayOrder);
router.post("/payment/verify", authenticateUser, verifyRazorpayPaymentAndCreateOrder);
router.get('/my-orders', authenticateUser, getUserOrders);
router.get('/all', authenticateAdmin, getAllOrders);
router.get('/completed', authenticateAdmin, getCompletedOrders);
router.get('/completed/count-last-month', authenticateAdmin, getCompletedOrdersCountLastMonth);
router.get('/profit-last-month', authenticateAdmin, getProfitLastMonth);
router.put('/:id/status', authenticateAdmin, updateOrderStatus);
router.post("/:id/shipping/create", authenticateAdmin, createShipmentForOrder);
router.post("/:id/shipping/sync", authenticateAdmin, syncOrderShipmentTracking);

export default router;
