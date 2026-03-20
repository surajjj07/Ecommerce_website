const formatMoney = (value) => `INR ${Number(value || 0).toFixed(2)}`;

const renderAddress = (details = {}, fallback = "") =>
  [
    details.addressLine1,
    details.addressLine2,
    details.city,
    details.state,
    details.pincode,
    details.country,
  ]
    .filter(Boolean)
    .join(", ") || fallback;

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

export const sendSupplierFulfillmentRequest = async ({
  order,
  settings,
  supplier,
  items,
  fulfillmentGroup,
}) => {
  const apiIntegration = supplier?.apiIntegration || {};
  const endpointUrl = String(apiIntegration.endpointUrl || "").trim();

  if (!apiIntegration.enabled || !endpointUrl) {
    throw new Error(`API integration is not configured for ${supplier?.name || "this supplier"}`);
  }

  const payload = {
    orderId: order.orderId,
    fulfillmentGroupId: fulfillmentGroup.groupId,
    store: {
      name: settings?.storeName || "Your store",
      email: settings?.storeEmail || "",
      phone: settings?.phone || "",
    },
    customer: {
      name: order.shippingDetails?.name || order.user?.name || "Customer",
      phone: order.shippingDetails?.phone || order.user?.phone || "",
      email: order.shippingDetails?.email || order.user?.email || "",
      address: renderAddress(order.shippingDetails, order.shippingAddress),
    },
    pricing: {
      totalAmount: Number(order.totalAmount || 0),
    },
    items: (items || []).map((item) => ({
      productId: item.product?._id?.toString() || item.product?.toString?.() || "",
      name: item.product?.name || "Product",
      sku: item.product?.sku || "",
      supplierSku: item.product?.supplierSku || item.product?.sku || "",
      quantity: Number(item.quantity || 0),
      costPrice: Number(item.product?.costPrice || 0),
      sellingPrice: Number(item.price || 0),
    })),
  };

  const response = await fetch(endpointUrl, {
    method: "POST",
    headers: buildHeaders(apiIntegration),
    body: JSON.stringify(payload),
  });

  const rawText = await response.text();
  let responseBody = rawText;

  try {
    responseBody = rawText ? JSON.parse(rawText) : {};
  } catch {
    responseBody = rawText;
  }

  if (!response.ok) {
    const message =
      responseBody?.message ||
      responseBody?.error ||
      `Supplier API request failed with status ${response.status}`;
    throw new Error(message);
  }

  return {
    endpointUrl,
    responseBody,
    summary: `${supplier?.name || "Supplier"} API accepted ${items?.length || 0} item(s)`,
    valuePreview: items
      ?.map((item) => `${item.product?.name || "Product"} x${item.quantity} (${formatMoney(item.product?.costPrice || 0)})`)
      .join(", ") || "",
  };
};
