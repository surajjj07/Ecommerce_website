import User from '../models/User.js';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { generateToken } from '../config/token.js';
import cloudinary from '../config/cloudinary.js';
import { sendEmail } from '../Services/emailService.js';

const buildResetOtpEmail = ({ customerName, otp }) => `
    <div style="font-family: Arial, sans-serif; color: #0f172a; line-height: 1.6;">
        <h2 style="margin-bottom: 8px;">Password Reset OTP</h2>
        <p>Hello ${customerName || "Customer"},</p>
        <p>Use the OTP below to verify your password reset request.</p>
        <div style="margin: 20px 0; padding: 14px 18px; display: inline-block; border-radius: 12px; background: #0f172a; color: #ffffff; font-size: 24px; font-weight: 700; letter-spacing: 6px;">
            ${otp}
        </div>
        <p>This OTP will expire in 10 minutes.</p>
        <p>If you did not request this, you can safely ignore this email.</p>
    </div>
`;

const createHash = (value) =>
    crypto.createHash('sha256').update(String(value)).digest('hex');

export const signup = async (req, res) => {
    try {
        const { name, email, password, phone = "" } = req.body;

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = new User({ name, email, password: hashedPassword, phone });
        await user.save();

        const token = generateToken({ id: user._id, email: user.email });

        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });

        res.status(201).json({
            message: 'User created successfully',
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                profilePic: user.profilePic,
                defaultAddress: user.defaultAddress,
            },
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        const token = generateToken({ id: user._id, email: user.email });

        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

        res.json({
            message: 'Login successful',
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                profilePic: user.profilePic,
                defaultAddress: user.defaultAddress,
            },
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const logout = (req, res) => {
    res.clearCookie('token');
    res.json({ message: 'Logout successful' });
};

export const setProfilePic = async (req, res) => {
    try {
        const userId = req.user.id; // Assuming middleware sets req.user

        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        // Upload to Cloudinary
        const result = await new Promise((resolve, reject) => {
            const stream = cloudinary.uploader.upload_stream(
                { folder: 'profile_pics' },
                (error, result) => {
                    if (error) reject(error);
                    else resolve(result);
                }
            );
            stream.end(req.file.buffer);
        });

        const user = await User.findByIdAndUpdate(userId, { profilePic: result.secure_url }, { new: true });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json({
            message: 'Profile picture updated',
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                profilePic: user.profilePic,
                defaultAddress: user.defaultAddress,
            },
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const requestPasswordResetOtp = async (req, res) => {
    try {
        const email = String(req.body?.email || '').trim().toLowerCase();
        if (!email) {
            return res.status(400).json({ success: false, message: 'Email is required' });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ success: false, message: 'Customer account not found' });
        }

        const otp = String(crypto.randomInt(100000, 999999));
        user.passwordResetOtpHash = createHash(otp);
        user.passwordResetOtpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);
        user.passwordResetTokenHash = '';
        user.passwordResetTokenExpiresAt = null;
        await user.save();

        await sendEmail({
            to: user.email,
            subject: 'Customer password reset OTP',
            html: buildResetOtpEmail({ customerName: user.name, otp }),
        });

        return res.json({
            success: true,
            message: 'OTP sent successfully to your email',
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

export const verifyPasswordResetOtp = async (req, res) => {
    try {
        const email = String(req.body?.email || '').trim().toLowerCase();
        const otp = String(req.body?.otp || '').trim();

        if (!email || !otp) {
            return res.status(400).json({ success: false, message: 'Email and OTP are required' });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ success: false, message: 'Customer account not found' });
        }

        const isExpired =
            !user.passwordResetOtpExpiresAt ||
            new Date(user.passwordResetOtpExpiresAt).getTime() < Date.now();

        if (!user.passwordResetOtpHash || isExpired) {
            return res.status(400).json({ success: false, message: 'OTP expired. Please request a new one.' });
        }

        if (createHash(otp) !== user.passwordResetOtpHash) {
            return res.status(400).json({ success: false, message: 'Invalid OTP' });
        }

        const resetToken = crypto.randomBytes(24).toString('hex');
        user.passwordResetTokenHash = createHash(resetToken);
        user.passwordResetTokenExpiresAt = new Date(Date.now() + 10 * 60 * 1000);
        await user.save();

        return res.json({
            success: true,
            message: 'OTP verified successfully',
            resetToken,
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

export const resetPasswordWithOtp = async (req, res) => {
    try {
        const email = String(req.body?.email || '').trim().toLowerCase();
        const resetToken = String(req.body?.resetToken || '').trim();
        const newPassword = String(req.body?.newPassword || '');

        if (!email || !resetToken || !newPassword) {
            return res.status(400).json({
                success: false,
                message: 'Email, reset token, and new password are required',
            });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'New password must be at least 6 characters',
            });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ success: false, message: 'Customer account not found' });
        }

        const isExpired =
            !user.passwordResetTokenExpiresAt ||
            new Date(user.passwordResetTokenExpiresAt).getTime() < Date.now();

        if (!user.passwordResetTokenHash || isExpired) {
            return res.status(400).json({
                success: false,
                message: 'Reset session expired. Please verify OTP again.',
            });
        }

        if (createHash(resetToken) !== user.passwordResetTokenHash) {
            return res.status(400).json({ success: false, message: 'Invalid reset session' });
        }

        user.password = await bcrypt.hash(newPassword, 10);
        user.passwordResetOtpHash = '';
        user.passwordResetOtpExpiresAt = null;
        user.passwordResetTokenHash = '';
        user.passwordResetTokenExpiresAt = null;
        await user.save();

        return res.json({
            success: true,
            message: 'Password reset successful. Please login with your new password.',
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

export const getProfile = async (req, res) => {
    try {
        const user = req.user;
        res.json({
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                profilePic: user.profilePic,
                defaultAddress: user.defaultAddress,
            },
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const updateProfile = async (req, res) => {
    try {
        const userId = req.user.id;
        const {
            name,
            phone,
            defaultAddress = {},
            currentPassword,
            newPassword,
        } = req.body;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        if (typeof name === "string" && name.trim()) {
            user.name = name.trim();
        }

        if (typeof phone === "string") {
            user.phone = phone.trim();
        }

        if (defaultAddress && typeof defaultAddress === "object") {
            user.defaultAddress = {
                ...user.defaultAddress?.toObject?.(),
                ...defaultAddress,
                email:
                    String(defaultAddress.email || "").trim() ||
                    user.email ||
                    user.defaultAddress?.email ||
                    "",
                phone:
                    String(defaultAddress.phone || "").trim() ||
                    user.phone ||
                    user.defaultAddress?.phone ||
                    "",
                name:
                    String(defaultAddress.name || "").trim() ||
                    user.name ||
                    user.defaultAddress?.name ||
                    "",
            };
        }

        if (newPassword || currentPassword) {
            if (!currentPassword || !newPassword) {
                return res.status(400).json({ message: "Current and new password are required" });
            }

            const isMatch = await bcrypt.compare(currentPassword, user.password);
            if (!isMatch) {
                return res.status(400).json({ message: "Current password is incorrect" });
            }

            user.password = await bcrypt.hash(newPassword, 10);
        }

        await user.save();

        res.json({
            message: "Profile updated successfully",
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                profilePic: user.profilePic,
                defaultAddress: user.defaultAddress,
            },
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
