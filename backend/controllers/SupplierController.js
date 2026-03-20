import Supplier from "../models/Supplier.js";
import Product from "../models/Product.js";
import { fetchSupplierCatalog } from "../Services/supplierCatalogService.js";

const normalizeList = (value) => {
    if (Array.isArray(value)) {
        return [...new Set(value.map((item) => String(item || "").trim()).filter(Boolean))];
    }

    if (typeof value === "string") {
        return [
            ...new Set(
                value
                    .split(",")
                    .map((item) => item.trim())
                    .filter(Boolean)
            ),
        ];
    }

    return [];
};

const parseBoolean = (value) => value === true || value === "true";

const normalizeApiIntegration = (value = {}) => {
    if (!value || typeof value !== "object") {
        return {
            enabled: false,
            endpointUrl: "",
            catalogEndpointUrl: "",
            authType: "none",
            apiKey: "",
            customHeaderName: "x-api-key",
        };
    }

    return {
        enabled: parseBoolean(value.enabled),
        endpointUrl: String(value.endpointUrl || "").trim(),
        catalogEndpointUrl: String(value.catalogEndpointUrl || "").trim(),
        authType: ["none", "bearer", "x-api-key"].includes(value.authType)
            ? value.authType
            : "none",
        apiKey: String(value.apiKey || "").trim(),
        customHeaderName: String(value.customHeaderName || "x-api-key").trim() || "x-api-key",
    };
};

export const createSupplier = async (req, res) => {
    try {
        const {
            name,
        companyName,
        email,
        phone,
        whatsappNumber,
        website,
        address,
        pickupContactName,
        pickupPhone,
        pickupAddressLine1,
        pickupAddressLine2,
        pickupCity,
        pickupState,
        pickupPincode,
        pickupCountry,
        pickupLocationCode,
        categories,
        fulfillmentLeadTimeDays,
        shippingRegions,
        notes,
        isActive,
            apiIntegration,
        } = req.body;

        const normalizedName = String(name || "").trim();
        if (!normalizedName) {
            return res.status(400).json({ success: false, message: "Supplier name is required" });
        }

        const supplier = await Supplier.create({
            admin: req.admin._id,
            name: normalizedName,
            companyName: String(companyName || "").trim(),
            email: String(email || "").trim().toLowerCase(),
            phone: String(phone || "").trim(),
            whatsappNumber: String(whatsappNumber || "").trim(),
            website: String(website || "").trim(),
            address: String(address || "").trim(),
            pickupContactName: String(pickupContactName || name || "").trim(),
            pickupPhone: String(pickupPhone || phone || whatsappNumber || "").trim(),
            pickupAddressLine1: String(pickupAddressLine1 || address || "").trim(),
            pickupAddressLine2: String(pickupAddressLine2 || "").trim(),
            pickupCity: String(pickupCity || "").trim(),
            pickupState: String(pickupState || "").trim(),
            pickupPincode: String(pickupPincode || "").trim(),
            pickupCountry: String(pickupCountry || "India").trim(),
            pickupLocationCode: String(pickupLocationCode || "").trim(),
            categories: normalizeList(categories),
            fulfillmentLeadTimeDays: Number(fulfillmentLeadTimeDays || 0),
            shippingRegions: normalizeList(shippingRegions),
            notes: String(notes || "").trim(),
            apiIntegration: normalizeApiIntegration(apiIntegration),
            isActive: isActive === undefined ? true : parseBoolean(isActive),
        });

        return res.status(201).json({
            success: true,
            message: "Supplier created successfully",
            supplier,
        });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({
                success: false,
                message: "A supplier with this name already exists",
            });
        }

        return res.status(500).json({ success: false, message: error.message });
    }
};

export const getSuppliers = async (req, res) => {
    try {
        const includeInactive = req.query.includeInactive === "true";
        const filter = { admin: req.admin._id };

        if (!includeInactive) {
            filter.isActive = true;
        }

        const suppliers = await Supplier.find(filter).sort({ createdAt: -1 });
        return res.json({ success: true, suppliers });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

export const updateSupplier = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = {};
        const fields = [
            "name",
            "companyName",
            "email",
            "phone",
            "whatsappNumber",
            "website",
            "address",
            "pickupContactName",
            "pickupPhone",
            "pickupAddressLine1",
            "pickupAddressLine2",
            "pickupCity",
            "pickupState",
            "pickupPincode",
            "pickupCountry",
            "pickupLocationCode",
            "notes",
        ];

        fields.forEach((field) => {
            if (field in req.body) {
                updates[field] =
                    field === "email"
                        ? String(req.body[field] || "").trim().toLowerCase()
                        : String(req.body[field] || "").trim();
            }
        });

        if ("categories" in req.body) {
            updates.categories = normalizeList(req.body.categories);
        }
        if ("shippingRegions" in req.body) {
            updates.shippingRegions = normalizeList(req.body.shippingRegions);
        }
        if ("fulfillmentLeadTimeDays" in req.body) {
            updates.fulfillmentLeadTimeDays = Number(req.body.fulfillmentLeadTimeDays || 0);
        }
        if ("isActive" in req.body) {
            updates.isActive = parseBoolean(req.body.isActive);
        }
        if ("apiIntegration" in req.body) {
            updates.apiIntegration = normalizeApiIntegration(req.body.apiIntegration);
        }

        if ("name" in updates && !updates.name) {
            return res.status(400).json({ success: false, message: "Supplier name is required" });
        }

        const supplier = await Supplier.findOneAndUpdate(
            { _id: id, admin: req.admin._id },
            updates,
            { new: true, runValidators: true }
        );

        if (!supplier) {
            return res.status(404).json({ success: false, message: "Supplier not found" });
        }

        return res.json({
            success: true,
            message: "Supplier updated successfully",
            supplier,
        });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({
                success: false,
                message: "A supplier with this name already exists",
            });
        }

        return res.status(500).json({ success: false, message: error.message });
    }
};

export const syncSupplierCatalog = async (req, res) => {
    try {
        const { id } = req.params;
        const supplier = await Supplier.findOne({ _id: id, admin: req.admin._id });

        if (!supplier) {
            return res.status(404).json({ success: false, message: "Supplier not found" });
        }

        const catalogProducts = await fetchSupplierCatalog(supplier);
        if (catalogProducts.length === 0) {
            return res.json({
                success: true,
                message: "No products returned from supplier catalog",
                summary: { created: 0, updated: 0, skipped: 0 },
            });
        }

        let created = 0;
        let updated = 0;
        let skipped = 0;

        for (const item of catalogProducts) {
            if (!item.name) {
                skipped += 1;
                continue;
            }

            const baseSku =
                item.sku ||
                item.supplierSku ||
                `${supplier.name.slice(0, 3).toUpperCase()}-${item.supplierProductId || Date.now()}`;

            let product =
                (item.supplierProductId
                    ? await Product.findOne({
                          admin: req.admin._id,
                          supplier: supplier._id,
                          supplierProductId: item.supplierProductId,
                      })
                    : null) ||
                (item.supplierSku
                    ? await Product.findOne({
                          admin: req.admin._id,
                          supplier: supplier._id,
                          supplierSku: item.supplierSku,
                      })
                    : null);

            if (!product) {
                let uniqueSku = baseSku;
                let suffix = 1;

                while (await Product.findOne({ sku: uniqueSku })) {
                    uniqueSku = `${baseSku}-${suffix}`;
                    suffix += 1;
                }

                product = new Product({
                    admin: req.admin._id,
                    sku: uniqueSku,
                });
                created += 1;
            } else {
                updated += 1;
            }

            Object.assign(product, {
                name: item.name,
                description: item.description,
                price: Math.max(item.price, 0),
                discountPrice:
                    item.discountPrice > 0 && item.discountPrice <= item.price
                        ? item.discountPrice
                        : 0,
                category: item.category || "Imported",
                brand: item.brand,
                supplier: supplier._id,
                supplierSku: item.supplierSku || product.supplierSku || baseSku,
                supplierProductId: item.supplierProductId || product.supplierProductId || "",
                costPrice: Math.max(item.costPrice, 0),
                supplierLeadTimeDays: Math.max(item.supplierLeadTimeDays, 0),
                stock: Math.max(item.stock, 0),
                images: item.images,
                sizes: item.sizes,
                featured: item.featured,
                bestseller: item.bestseller,
                source: "supplier_api",
                lastSupplierSyncAt: new Date(),
                isActive: true,
            });

            await product.save();
        }

        return res.json({
            success: true,
            message: "Supplier catalog synced successfully",
            summary: { created, updated, skipped },
        });
    } catch (error) {
        return res.status(400).json({ success: false, message: error.message });
    }
};
