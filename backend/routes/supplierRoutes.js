import express from "express";
import {
    createSupplier,
    getSuppliers,
    syncSupplierCatalog,
    updateSupplier,
} from "../controllers/SupplierController.js";
import { authenticateAdmin } from "../middlewares/adminAuth.js";

const router = express.Router();

router.use(authenticateAdmin);
router.get("/", getSuppliers);
router.post("/", createSupplier);
router.put("/:id", updateSupplier);
router.post("/:id/catalog-sync", syncSupplierCatalog);

export default router;
