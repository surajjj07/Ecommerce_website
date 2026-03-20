import express from "express";
import env from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import { DbConnect } from "./config/Db.js";
import { assertProductionEnv, getEnvReadinessReport } from "./config/env.js";
import { initializeStoreIsolation } from "./Services/storeIsolationBootstrap.js";
import userRoutes from "./routes/userRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import categoryRoutes from "./routes/categoryRoutes.js";
import invoiceRoutes from "./routes/invoiceRoutes.js";
import settingsRoutes from "./routes/settingsRoutes.js";
import couponRoutes from "./routes/couponRoutes.js";
import supplierRoutes from "./routes/supplierRoutes.js";

env.config();

const envReport = getEnvReadinessReport();
if (process.env.NODE_ENV === "production") {
    assertProductionEnv();
} else if (!envReport.ok) {
    const warnings = [
        envReport.placeholderValues.length
            ? `placeholder values: ${envReport.placeholderValues.join(", ")}`
            : "",
        envReport.malformedSecrets.length
            ? `malformed secrets: ${envReport.malformedSecrets.join(", ")}`
            : "",
    ].filter(Boolean);

    if (warnings.length > 0) {
        console.warn(`Env warning: ${warnings.join(" | ")}`);
    }
}

const app = express();
const port = process.env.PORT || 5000;
const isProduction = process.env.NODE_ENV === "production";
const allowedOrigins = (process.env.CORS_ORIGINS || "http://localhost:5173,http://localhost:5174")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: isProduction ? 300 : 1000,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        message: "Too many requests, please try again later.",
    },
});

app.use(
    helmet({
        crossOriginResourcePolicy: false,
    })
);
app.use(
    cors({
        origin: allowedOrigins,
        credentials: true,
    })
);
app.use(morgan(isProduction ? "combined" : "dev"));
app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());
app.use("/api", apiLimiter);

app.get("/", (req, res) => {
    res.send("This is live server");
});

app.use("/api/users", userRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/products", productRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api", invoiceRoutes);
app.use("/api/admin", settingsRoutes);
app.use("/api/admin", couponRoutes);
app.use("/api/admin/suppliers", supplierRoutes);

app.listen(port, async () => {
    console.log("Server is live");
    await DbConnect();
    await initializeStoreIsolation();
});
