import express from 'express';
import { createOrder, getUserOrders, getAllOrders, updateOrderStatus, getCompletedOrders, getCompletedOrdersCountLastMonth, getProfitLastMonth } from '../controllers/OrderController.js';
import { authenticateUser } from '../middlewares/auth.js';
import { authenticateAdmin } from '../middlewares/adminAuth.js';

const router = express.Router();

router.post('/create', authenticateUser, createOrder);
router.get('/my-orders', authenticateUser, getUserOrders);
router.get('/all', authenticateAdmin, getAllOrders);
router.get('/completed', authenticateAdmin, getCompletedOrders);
router.get('/completed/count-last-month', authenticateAdmin, getCompletedOrdersCountLastMonth);
router.get('/profit-last-month', authenticateAdmin, getProfitLastMonth);
router.put('/:id/status', authenticateAdmin, updateOrderStatus);

export default router;