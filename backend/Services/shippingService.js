const SHIPROCKET_BASE_URL = "https://apiv2.shiprocket.in";

const shiprocketTokenCache = new Map();

const getRequiredShippingConfig = (settings) => {
    const config = settings?.shiprocket || {};
    const email = String(config.email || "").trim();
    const password = String(config.password || "").trim();
    const pickupPincode = String(config.pickupPincode || "").trim();

    if (!email || !password || !pickupPincode) {
        throw new Error(
            "Shiprocket settings missing. Please add email, password and pickup pincode in Admin Settings."
        );
    }

    return {
        email,
        password,
        pickupLocation: String(config.pickupLocation || "Primary").trim(),
        pickupPincode,
        pickupCity: String(config.pickupCity || "").trim(),
        pickupState: String(config.pickupState || "").trim(),
        pickupCountry: String(config.pickupCountry || "India").trim(),
        pickupAddress: String(config.pickupAddress || "").trim(),
        pickupPhone: String(config.pickupPhone || "").trim(),
        defaultWeight: Number(config.defaultWeight || 0.5),
        defaultLength: Number(config.defaultLength || 10),
        defaultBreadth: Number(config.defaultBreadth || 10),
        defaultHeight: Number(config.defaultHeight || 10),
    };
};

const shiprocketFetch = async ({ path, method = "GET", token = "", body }) => {
    const response = await fetch(`${SHIPROCKET_BASE_URL}${path}`, {
        method,
        headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: body ? JSON.stringify(body) : undefined,
    });

    const data = await response.json();

    if (!response.ok) {
        const message = data?.message || data?.error || "Shiprocket request failed";
        throw new Error(message);
    }

    return data;
};

const getShiprocketToken = async (config) => {
    const cacheKey = config.email.toLowerCase();
    const cached = shiprocketTokenCache.get(cacheKey);
    if (cached?.token && Date.now() < cached.expiresAt) {
        return cached.token;
    }

    const auth = await shiprocketFetch({
        path: "/v1/external/auth/login",
        method: "POST",
        body: { email: config.email, password: config.password },
    });

    const token = auth?.token;
    if (!token) {
        throw new Error("Failed to authenticate with Shiprocket");
    }

    shiprocketTokenCache.set(cacheKey, {
        token,
        expiresAt: Date.now() + 9 * 60 * 1000,
    });

    return token;
};

const normalizeOrderItems = (order) =>
    (order.items || []).map((item, index) => ({
        name: item.product?.name || `Item-${index + 1}`,
        sku: item.product?._id?.toString() || `SKU-${index + 1}`,
        units: Number(item.quantity || 1),
        selling_price: Number(item.price || 0),
        discount: 0,
        tax: 0,
    }));

const getCustomerPayload = (order) => {
    const details = order.shippingDetails || {};
    const fullName = details.name || order.user?.name || "Customer";
    const split = fullName.trim().split(/\s+/);
    const firstName = split[0] || "Customer";
    const lastName = split.slice(1).join(" ") || ".";

    const phone = String(details.phone || order.user?.phone || "").trim();
    const pincode = String(details.pincode || "").trim();
    const city = String(details.city || "").trim();
    const state = String(details.state || "").trim();
    const addressLine1 = String(details.addressLine1 || "").trim();
    const addressLine2 = String(details.addressLine2 || "").trim();
    const email = String(details.email || order.user?.email || "customer@example.com").trim();

    if (!phone || !pincode || !city || !state || !addressLine1) {
        throw new Error(
            "Shipping details incomplete. Please add phone, address line 1, city, state and pincode."
        );
    }

    return {
        firstName,
        lastName,
        phone,
        pincode,
        city,
        state,
        email,
        addressLine1,
        addressLine2,
        country: details.country || "India",
    };
};

export const createShiprocketShipment = async ({ order, settings }) => {
    const config = getRequiredShippingConfig(settings);
    const token = await getShiprocketToken(config);
    const customer = getCustomerPayload(order);

    const payload = {
        order_id: order.orderId || order._id.toString(),
        order_date: new Date(order.createdAt || Date.now()).toISOString().slice(0, 10),
        pickup_location: config.pickupLocation,
        channel_id: "",
        comment: "Created from admin panel",
        billing_customer_name: customer.firstName,
        billing_last_name: customer.lastName,
        billing_address: customer.addressLine1,
        billing_address_2: customer.addressLine2 || "",
        billing_city: customer.city,
        billing_pincode: customer.pincode,
        billing_state: customer.state,
        billing_country: customer.country,
        billing_email: customer.email,
        billing_phone: customer.phone,
        shipping_is_billing: true,
        shipping_customer_name: customer.firstName,
        shipping_last_name: customer.lastName,
        shipping_address: customer.addressLine1,
        shipping_address_2: customer.addressLine2 || "",
        shipping_city: customer.city,
        shipping_pincode: customer.pincode,
        shipping_country: customer.country,
        shipping_state: customer.state,
        shipping_email: customer.email,
        shipping_phone: customer.phone,
        order_items: normalizeOrderItems(order),
        payment_method: order.paymentMethod === "cod" ? "COD" : "Prepaid",
        sub_total: Number(order.totalAmount || 0),
        length: config.defaultLength,
        breadth: config.defaultBreadth,
        height: config.defaultHeight,
        weight: config.defaultWeight,
    };

    const data = await shiprocketFetch({
        path: "/v1/external/orders/create/adhoc",
        method: "POST",
        token,
        body: payload,
    });

    const details = data?.shipment_details || {};
    const awbCode =
        details?.awb_code || data?.awb_code || details?.awb || "";
    const courierName = details?.courier_name || data?.courier_name || "";
    const shipmentId =
        details?.shipment_id?.toString() || data?.shipment_id?.toString() || "";
    const trackingUrl =
        details?.tracking_url || (awbCode ? `https://shiprocket.co/tracking/${awbCode}` : "");

    return {
        provider: "shiprocket",
        shipmentId,
        awbCode,
        courierName,
        trackingUrl,
        status: "created",
        createdAt: new Date(),
        rawResponse: data,
    };
};

export const trackShiprocketShipment = async ({ awbCode, settings }) => {
    const awb = String(awbCode || "").trim();
    if (!awb) {
        throw new Error("AWB code is required to sync tracking");
    }

    const config = getRequiredShippingConfig(settings);
    const token = await getShiprocketToken(config);

    const data = await shiprocketFetch({
        path: `/v1/external/courier/track/awb/${encodeURIComponent(awb)}`,
        token,
    });

    const trackingData = data?.tracking_data || {};
    const tracks = trackingData?.shipment_track || [];
    const latestTrack = Array.isArray(tracks) && tracks.length > 0 ? tracks[0] : {};

    return {
        status:
            trackingData?.shipment_status_label ||
            latestTrack?.current_status ||
            latestTrack?.status ||
            "in_transit",
        trackingUrl:
            trackingData?.track_url ||
            latestTrack?.tracking_url ||
            `https://shiprocket.co/tracking/${awb}`,
        courierName:
            latestTrack?.courier_name ||
            trackingData?.courier_name ||
            "",
        rawResponse: data,
    };
};
