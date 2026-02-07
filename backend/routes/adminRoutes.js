import express from 'express';
import { signup, login, logout, setProfilePic, getProfile, updateProfile } from '../controllers/AdminController.js';
import upload from '../config/multer.js';
import { authenticateAdmin } from '../middlewares/adminAuth.js';
import { getAdminDashboard } from '../controllers/ExpenseController.js';

const router = express.Router();

router.post('/signup', signup);
router.post('/login', login);
router.post('/logout', authenticateAdmin, logout);
router.post('/set-profile-pic', authenticateAdmin, upload.single('profilePic'), setProfilePic);
router.get('/profile', authenticateAdmin, getProfile);
router.put('/profile', authenticateAdmin, updateProfile);
router.get('/dashboard',authenticateAdmin,getAdminDashboard)

export default router;
