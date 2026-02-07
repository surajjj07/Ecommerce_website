import express from "express";
import {
    getSettings,
    updateSettings,
} from "../controllers/settingsController.js";
import { authenticateAdmin } from "../middlewares/adminAuth.js";

const router = express.Router();

/* Admin Settings */
router.get("/settings", authenticateAdmin, getSettings);
router.put("/settings", authenticateAdmin, updateSettings);

export default router;
