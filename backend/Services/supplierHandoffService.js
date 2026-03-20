import { sendWhatsApp } from "./smsService.js";

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

export const sendSupplierWhatsAppHandoff = async ({
    order,
    supplier,
    items,
    fulfillmentGroup,
}) => {
    const destination = String(
        supplier?.whatsappNumber || supplier?.phone || ""
    ).trim();

    if (!destination) {
        throw new Error(`WhatsApp number missing for ${supplier?.name || "this supplier"}`);
    }

    const customerName = order.shippingDetails?.name || order.user?.name || "Customer";
    const customerPhone = order.shippingDetails?.phone || order.user?.phone || "";
    const shippingAddress = renderAddress(order.shippingDetails, order.shippingAddress);
    const itemLines = (items || [])
        .map((item) => {
            const product = item.product || {};
            return `- ${product.name || "Product"} x${item.quantity} | SKU: ${product.supplierSku || product.sku || "-"}`;
        })
        .join("\n");

    const body = [
        `New supplier handoff`,
        `Order: ${order.orderId}`,
        `Group: ${fulfillmentGroup.groupId}`,
        `Customer: ${customerName}`,
        customerPhone ? `Phone: ${customerPhone}` : "",
        `Address: ${shippingAddress}`,
        `Items:\n${itemLines}`,
        `Please process and update shipment status from the panel.`,
    ]
        .filter(Boolean)
        .join("\n");

    await sendWhatsApp({ to: destination, body });
};

