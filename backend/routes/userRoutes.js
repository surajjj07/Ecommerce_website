import express from 'express';
import { signup, login, logout, setProfilePic, getProfile, updateProfile } from '../controllers/UserController.js';
import upload from '../config/multer.js';
import { authenticateUser } from '../middlewares/auth.js';

const router = express.Router();

router.post('/signup', signup);
router.post('/login', login);
router.post('/logout', authenticateUser, logout);
router.post('/set-profile-pic', authenticateUser, upload.single('profilePic'), setProfilePic);
router.get('/profile', authenticateUser, getProfile);
router.put('/profile', authenticateUser, updateProfile);

export default router;
