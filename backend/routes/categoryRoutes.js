import express from "express";
import { addCategory, getAllCategories } from "../controllers/CategoryController.js";
import { authenticateAdmin } from "../middlewares/adminAuth.js";

const router = express.Router();

router.get("/all", getAllCategories);
router.post("/add", authenticateAdmin, addCategory);

export default router;
