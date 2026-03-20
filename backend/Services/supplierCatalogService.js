const buildHeaders = (apiIntegration = {}) => {
    const authType = apiIntegration.authType || "none";
    const apiKey = String(apiIntegration.apiKey || "").trim();
    const headers = {
        "Content-Type": "application/json",
    };

    if (authType === "bearer" && apiKey) {
        headers.Authorization = `Bearer ${apiKey}`;
    }

    if (authType === "x-api-key" && apiKey) {
        headers[String(apiIntegration.customHeaderName || "x-api-key").trim() || "x-api-key"] = apiKey;
    }

    return headers;
};

const normalizeImageList = (value) => {
    if (Array.isArray(value)) {
        return value.map((item) => String(item || "").trim()).filter(Boolean);
    }

    const single = String(value || "").trim();
    return single ? [single] : [];
};

const normalizeSizes = (value) => {
    const allowed = new Set(["XS", "S", "M", "L", "XL", "XXL"]);
    if (!Array.isArray(value)) return [];
    return [...new Set(value.map((item) => String(item || "").trim().toUpperCase()).filter((item) => allowed.has(item)))];
};

const pickProducts = (payload) => {
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.products)) return payload.products;
    if (Array.isArray(payload?.items)) return payload.items;
    return [];
};

export const fetchSupplierCatalog = async (supplier) => {
    const apiIntegration = supplier?.apiIntegration || {};
    const catalogEndpointUrl = String(apiIntegration.catalogEndpointUrl || "").trim();

    if (!apiIntegration.enabled || !catalogEndpointUrl) {
        throw new Error(`Catalog API is not configured for ${supplier?.name || "this supplier"}`);
    }

    const response = await fetch(catalogEndpointUrl, {
        method: "GET",
        headers: buildHeaders(apiIntegration),
    });

    const rawText = await response.text();
    let body = rawText;

    try {
        body = rawText ? JSON.parse(rawText) : {};
    } catch {
        body = rawText;
    }

    if (!response.ok) {
        const message = body?.message || body?.error || `Catalog sync failed with status ${response.status}`;
        throw new Error(message);
    }

    return pickProducts(body).map((item, index) => ({
        supplierProductId: String(item.id || item.productId || item.supplierProductId || index + 1).trim(),
        name: String(item.name || item.title || "").trim(),
        sku: String(item.sku || item.code || "").trim().toUpperCase(),
        supplierSku: String(item.supplierSku || item.vendorSku || item.sku || "").trim().toUpperCase(),
        description: String(item.description || item.details || "Imported from supplier catalog").trim(),
        price: Number(item.price || item.mrp || 0),
        discountPrice: Number(item.discountPrice || item.salePrice || 0),
        category: String(item.category || item.categoryName || "Imported").trim(),
        brand: String(item.brand || "").trim(),
        stock: Number(item.stock || item.inventory || 0),
        costPrice: Number(item.costPrice || item.wholesalePrice || item.price || 0),
        supplierLeadTimeDays: Number(item.supplierLeadTimeDays || item.leadTimeDays || supplier.fulfillmentLeadTimeDays || 0),
        images: normalizeImageList(item.images || item.image || item.imageUrl),
        sizes: normalizeSizes(item.sizes),
        featured: Boolean(item.featured),
        bestseller: Boolean(item.bestseller),
    }));
};

