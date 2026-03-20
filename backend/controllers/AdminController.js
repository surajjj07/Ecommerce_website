import Admin from '../models/Admin.js';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { generateToken } from '../config/token.js';
import cloudinary from '../config/cloudinary.js';
import { sendEmail } from '../Services/emailService.js';

const buildResetOtpEmail = ({ adminName, otp }) => `
    <div style="font-family: Arial, sans-serif; color: #0f172a; line-height: 1.6;">
        <h2 style="margin-bottom: 8px;">Admin Password Reset</h2>
        <p>Hello ${adminName || "Admin"},</p>
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
        const { name, email, password } = req.body;

        const existingAdmin = await Admin.findOne({ email });
        if (existingAdmin) {
            return res.status(400).json({ message: 'Admin already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const admin = new Admin({ name, email, password: hashedPassword });
        await admin.save();

        const token = generateToken({ id: admin._id, email: admin.email });

        res.cookie('adminToken', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });

        res.status(201).json({ message: 'Admin created successfully', admin: { id: admin._id, name: admin.name, email: admin.email } });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        const admin = await Admin.findOne({ email });
        if (!admin) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        const isMatch = await bcrypt.compare(password, admin.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        const token = generateToken({ id: admin._id, email: admin.email });

        res.cookie('adminToken', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

        res.json({ message: 'Login successful', admin: { id: admin._id, name: admin.name, email: admin.email, profilePic: admin.profilePic } });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const logout = (req, res) => {
    res.clearCookie('adminToken');
    res.json({ message: 'Admin logout successful' });
};

export const setProfilePic = async (req, res) => {
    try {
        const adminId = req.admin.id; // Assuming middleware sets req.admin

        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        // Upload to Cloudinary
        const result = await new Promise((resolve, reject) => {
            const stream = cloudinary.uploader.upload_stream(
                { folder: 'admin_profile_pics' },
                (error, result) => {
                    if (error) reject(error);
                    else resolve(result);
                }
            );
            stream.end(req.file.buffer);
        });

        const admin = await Admin.findByIdAndUpdate(adminId, { profilePic: result.secure_url }, { new: true });
        if (!admin) {
            return res.status(404).json({ message: 'Admin not found' });
        }

        res.json({ message: 'Profile picture updated', admin: { id: admin._id, name: admin.name, email: admin.email, profilePic: admin.profilePic } });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getProfile = async (req, res) => {
    try {
        const admin = req.admin;
        res.json({ admin: { id: admin._id, name: admin.name, email: admin.email, profilePic: admin.profilePic, permissions: admin.permissions } });
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

        const admin = await Admin.findOne({ email });
        if (!admin) {
            return res.status(404).json({ success: false, message: 'Admin account not found' });
        }

        const otp = String(crypto.randomInt(100000, 999999));
        admin.passwordResetOtpHash = createHash(otp);
        admin.passwordResetOtpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);
        admin.passwordResetTokenHash = '';
        admin.passwordResetTokenExpiresAt = null;
        await admin.save();

        await sendEmail({
            to: admin.email,
            subject: 'Admin password reset OTP',
            html: buildResetOtpEmail({ adminName: admin.name, otp }),
        });

        return res.json({
            success: true,
            message: 'OTP sent successfully to your admin email',
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

        const admin = await Admin.findOne({ email });
        if (!admin) {
            return res.status(404).json({ success: false, message: 'Admin account not found' });
        }

        const isExpired =
            !admin.passwordResetOtpExpiresAt ||
            new Date(admin.passwordResetOtpExpiresAt).getTime() < Date.now();

        if (!admin.passwordResetOtpHash || isExpired) {
            return res.status(400).json({ success: false, message: 'OTP expired. Please request a new one.' });
        }

        if (createHash(otp) !== admin.passwordResetOtpHash) {
            return res.status(400).json({ success: false, message: 'Invalid OTP' });
        }

        const resetToken = crypto.randomBytes(24).toString('hex');
        admin.passwordResetTokenHash = createHash(resetToken);
        admin.passwordResetTokenExpiresAt = new Date(Date.now() + 10 * 60 * 1000);
        await admin.save();

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

        const admin = await Admin.findOne({ email });
        if (!admin) {
            return res.status(404).json({ success: false, message: 'Admin account not found' });
        }

        const isExpired =
            !admin.passwordResetTokenExpiresAt ||
            new Date(admin.passwordResetTokenExpiresAt).getTime() < Date.now();

        if (!admin.passwordResetTokenHash || isExpired) {
            return res.status(400).json({
                success: false,
                message: 'Reset session expired. Please verify OTP again.',
            });
        }

        if (createHash(resetToken) !== admin.passwordResetTokenHash) {
            return res.status(400).json({ success: false, message: 'Invalid reset session' });
        }

        admin.password = await bcrypt.hash(newPassword, 10);
        admin.passwordResetOtpHash = '';
        admin.passwordResetOtpExpiresAt = null;
        admin.passwordResetTokenHash = '';
        admin.passwordResetTokenExpiresAt = null;
        await admin.save();

        return res.json({
            success: true,
            message: 'Password reset successful. Please login with your new password.',
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

export const updateProfile = async (req, res) => {
    try {
        const adminId = req.admin._id;
        const { name, email, currentPassword, newPassword } = req.body;

        const admin = await Admin.findById(adminId);
        if (!admin) {
            return res.status(404).json({ success: false, message: 'Admin not found' });
        }

        if (name !== undefined) {
            const nextName = String(name).trim();
            if (!nextName) {
                return res.status(400).json({ success: false, message: 'Name cannot be empty' });
            }
            admin.name = nextName;
        }

        if (email !== undefined) {
            const nextEmail = String(email).trim().toLowerCase();
            if (!nextEmail) {
                return res.status(400).json({ success: false, message: 'Email cannot be empty' });
            }

            if (nextEmail !== admin.email) {
                const exists = await Admin.findOne({ email: nextEmail, _id: { $ne: adminId } });
                if (exists) {
                    return res.status(409).json({ success: false, message: 'Email already in use' });
                }
                admin.email = nextEmail;
            }
        }

        if (newPassword) {
            if (!currentPassword) {
                return res.status(400).json({ success: false, message: 'Current password is required' });
            }

            const isMatch = await bcrypt.compare(currentPassword, admin.password);
            if (!isMatch) {
                return res.status(400).json({ success: false, message: 'Current password is incorrect' });
            }

            if (String(newPassword).length < 6) {
                return res.status(400).json({ success: false, message: 'New password must be at least 6 characters' });
            }

            admin.password = await bcrypt.hash(newPassword, 10);
        }

        await admin.save();

        return res.json({
            success: true,
            message: 'Profile updated successfully',
            admin: {
                id: admin._id,
                name: admin.name,
                email: admin.email,
                profilePic: admin.profilePic,
                permissions: admin.permissions
            }
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
