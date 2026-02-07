import express from 'express';
import { addProduct, getAllProducts, getProductsByCategory, getProductById, searchProducts } from '../controllers/ProductController.js';
import upload from '../config/multer.js';
import { authenticateAdmin } from '../middlewares/adminAuth.js';

const router = express.Router();

router.post('/add', authenticateAdmin, upload.array('images', 5), addProduct);
router.get('/all', getAllProducts);
router.get('/category/:category', getProductsByCategory);
router.get('/search', searchProducts);
router.get('/:id', getProductById);

export default router;