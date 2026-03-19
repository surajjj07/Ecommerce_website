import express from "express";
import env from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import { DbConnect } from "./config/Db.js";
import { initializeStoreIsolation } from "./Services/storeIsolationBootstrap.js";
import userRoutes from "./routes/userRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import categoryRoutes from "./routes/categoryRoutes.js";
import invoiceRoutes from "./routes/invoiceRoutes.js";
import settingsRoutes from "./routes/settingsRoutes.js";
import couponRoutes from "./routes/couponRoutes.js";

env.config();

const app = express();
const port = process.env.PORT || 5000;

app.use(
    cors({
        origin: ["http://localhost:5173", "http://localhost:5174"],
        credentials: true,
    })
);
app.use(express.json());
app.use(cookieParser());

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

app.listen(port, async () => {
    console.log("Server is live");
    await DbConnect();
    await initializeStoreIsolation();
});
