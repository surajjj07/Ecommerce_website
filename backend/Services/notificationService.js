import { sendEmail } from "./emailService.js";

const formatMoney = (value) => `INR ${Number(value || 0).toFixed(2)}`;

const getCustomerEmail = ({ order, user }) =>
    order?.shippingDetails?.email || user?.email || "";

const getCustomerName = ({ order, user }) =>
    order?.shippingDetails?.name || user?.name || "Customer";

const sendCustomerEmail = async ({ to, subject, html, settings }) => {
    if (!settings?.orderEmailNotify || !to) return;
    await sendEmail({ to, subject, html });
};

export const notifyOrderPlaced = async ({ order, user, settings }) => {
    if (!settings || !order) return;

    const customerEmail = getCustomerEmail({ order, user });
    const customerName = getCustomerName({ order, user });

    await sendCustomerEmail({
        to: customerEmail,
        settings,
        subject: `Order Confirmed - ${order.orderId}`,
        html: `
            <div style="font-family: Arial, sans-serif; color: #0f172a; line-height: 1.6;">
                <h2 style="margin-bottom: 8px;">Order Confirmed</h2>
                <p>Hi ${customerName}, your order has been placed successfully.</p>
                <p><strong>Order ID:</strong> ${order.orderId}</p>
                <p><strong>Total:</strong> ${formatMoney(order.totalAmount)}</p>
                <p><strong>Payment:</strong> ${String(order.paymentMethod || "").toUpperCase()}</p>
                <p>We will notify you again as soon as your order is delivered.</p>
            </div>
        `,
    });
};

export const notifyOrderDelivered = async ({ order, user, settings }) => {
    if (!settings || !order) return;

    const customerEmail = getCustomerEmail({ order, user });
    const customerName = getCustomerName({ order, user });

    await sendCustomerEmail({
        to: customerEmail,
        settings,
        subject: `Order Delivered - ${order.orderId}`,
        html: `
            <div style="font-family: Arial, sans-serif; color: #0f172a; line-height: 1.6;">
                <h2 style="margin-bottom: 8px;">Order Delivered</h2>
                <p>Hi ${customerName}, your order has been delivered.</p>
                <p><strong>Order ID:</strong> ${order.orderId}</p>
                <p><strong>Total:</strong> ${formatMoney(order.totalAmount)}</p>
                <p>Thank you for shopping with us.</p>
            </div>
        `,
    });
};
