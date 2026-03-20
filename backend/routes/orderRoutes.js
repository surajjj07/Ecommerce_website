import express from 'express';
import {
    createShipmentForOrder,
    createOrder,
    createRazorpayOrder,
    createShipmentForFulfillmentGroup,
    createSupplierShipmentForGroup,
    getAllOrders,
    getCompletedOrders,
    getCompletedOrdersCountLastMonth,
    getProfitLastMonth,
    getUserOrders,
    startSupplierFulfillmentForGroup,
    startSupplierFulfillment,
    syncShipmentForFulfillmentGroup,
    syncOrderShipmentTracking,
    updateOrderStatus,
    updateSupplierFulfillmentGroupStatus,
    updateSupplierFulfillmentStatus,
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
router.post("/:id/fulfillment-groups/:groupId/admin-shipping/create", authenticateAdmin, createShipmentForFulfillmentGroup);
router.post("/:id/fulfillment-groups/:groupId/supplier-shipping/create", authenticateAdmin, createSupplierShipmentForGroup);
router.post("/:id/fulfillment-groups/:groupId/admin-shipping/sync", authenticateAdmin, syncShipmentForFulfillmentGroup);
router.post("/:id/supplier-fulfillment/start", authenticateAdmin, startSupplierFulfillment);
router.post("/:id/supplier-fulfillment/status", authenticateAdmin, updateSupplierFulfillmentStatus);
router.post("/:id/fulfillment-groups/:groupId/supplier/start", authenticateAdmin, startSupplierFulfillmentForGroup);
router.post("/:id/fulfillment-groups/:groupId/supplier/status", authenticateAdmin, updateSupplierFulfillmentGroupStatus);

export default router;
