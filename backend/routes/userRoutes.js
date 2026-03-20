import express from 'express';
import {
    signup,
    login,
    logout,
    setProfilePic,
    getProfile,
    updateProfile,
    requestPasswordResetOtp,
    verifyPasswordResetOtp,
    resetPasswordWithOtp
} from '../controllers/UserController.js';
import upload from '../config/multer.js';
import { authenticateUser } from '../middlewares/auth.js';

const router = express.Router();

router.post('/signup', signup);
router.post('/login', login);
router.post('/forgot-password/request-otp', requestPasswordResetOtp);
router.post('/forgot-password/verify-otp', verifyPasswordResetOtp);
router.post('/forgot-password/reset', resetPasswordWithOtp);
router.post('/logout', authenticateUser, logout);
router.post('/set-profile-pic', authenticateUser, upload.single('profilePic'), setProfilePic);
router.get('/profile', authenticateUser, getProfile);
router.put('/profile', authenticateUser, updateProfile);

export default router;
