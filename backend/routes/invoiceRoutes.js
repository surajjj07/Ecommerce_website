import express from "express";
import { generateInvoicePDF } from "../controllers/InvoiceController.js";
import {authenticateUser} from '../middlewares/auth.js'
import { authenticateAdmin } from "../middlewares/adminAuth.js";

const router = express.Router();

/* User Invoice */
router.get("/invoice/:id", authenticateUser, generateInvoicePDF);

/* Admin Invoice */
router.get("/admin/invoice/:id", authenticateAdmin, generateInvoicePDF);

export default router;
