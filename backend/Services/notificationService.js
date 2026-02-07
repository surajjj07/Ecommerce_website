import Settings from "../models/Settings.js";
import { sendEmail } from "./emailService.js";
import { sendSMS } from "./smsService.js";

export const notifyOrderPlaced = async ({ order, user }) => {
    const settings = await Settings.getSingleton();

    /* ---------- EMAIL ---------- */
    if (settings.orderEmailNotify && user.email) {
        await sendEmail({
            to: user.email,
            subject: `Order Confirmed - ${order.orderId}`,
            html: `
        <h3>Thank you for your order!</h3>
        <p><b>Order ID:</b> ${order.orderId}</p>
        <p><b>Total:</b> ₹${order.totalAmount}</p>
        <p>We will notify you once it is shipped.</p>
      `,
        });
    }

    /* ---------- SMS ---------- */
    if (settings.orderSmsNotify && user.phone) {
        await sendSMS({
            to: user.phone,
            body: `Order ${order.orderId} confirmed. Total ₹${order.totalAmount}.`,
        });
    }
};
