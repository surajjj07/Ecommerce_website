import { verifyToken } from '../config/token.js';
import Admin from '../models/Admin.js';

export const authenticateAdmin = async (req, res, next) => {
    try {
        const token = req.cookies.adminToken;
        if (!token) {
            return res.status(401).json({ message: 'Access denied. No admin token provided.' });
        }

        const decoded = verifyToken(token);
        const admin = await Admin.findById(decoded.id);
        if (!admin) {
            return res.status(401).json({ message: 'Invalid token. Admin not found.' });
        }

        req.admin = admin;
        next();
    } catch (error) {
        res.status(401).json({ message: 'Invalid admin token.' });
    }
};