import PDFDocument from "pdfkit";
import Order from "../models/Order.js";

export const generateInvoicePDF = async (req, res) => {
    try {
        const { id } = req.params;

        const order = await Order.findById(id)
            .populate("user", "name email")
            .populate("items.product", "name");

        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }

        // 🔒 Optional security check (user can only access own invoice)
        if (req.user && order.user._id.toString() !== req.user.id) {
            return res.status(403).json({ message: "Unauthorized access" });
        }

        const doc = new PDFDocument({ margin: 40 });

        res.setHeader("Content-Type", "application/pdf");
        res.setHeader(
            "Content-Disposition",
            `inline; filename=invoice-${order.orderId}.pdf`
        );

        doc.pipe(res);

        /* ---------- HEADER ---------- */
        doc
            .fontSize(22)
            .text("INVOICE", { align: "center" })
            .moveDown();

        doc
            .fontSize(12)
            .text(`Order ID: ${order.orderId}`)
            .text(`Date: ${order.createdAt.toDateString()}`)
            .moveDown();

        /* ---------- CUSTOMER ---------- */
        doc
            .fontSize(14)
            .text("Billed To:", { underline: true })
            .fontSize(12)
            .text(order.user.name)
            .text(order.user.email)
            .text(order.shippingAddress)
            .moveDown();

        /* ---------- TABLE HEADER ---------- */
        const tableTop = doc.y;
        doc.fontSize(12);

        doc.text("Product", 50, tableTop);
        doc.text("Qty", 280, tableTop);
        doc.text("Price", 330, tableTop);
        doc.text("Total", 420, tableTop);

        doc.moveDown(0.5);

        /* ---------- TABLE ROWS ---------- */
        let position = tableTop + 20;

        order.items.forEach((item) => {
            doc.text(item.product.name, 50, position);
            doc.text(item.quantity.toString(), 280, position);
            doc.text(`₹${item.price}`, 330, position);
            doc.text(`₹${item.price * item.quantity}`, 420, position);
            position += 20;
        });

        doc.moveDown(2);

        /* ---------- TOTAL ---------- */
        doc
            .fontSize(14)
            .text(`Grand Total: ₹${order.totalAmount}`, {
                align: "right",
            })
            .moveDown();

        /* ---------- FOOTER ---------- */
        doc
            .fontSize(10)
            .text("Thank you for your purchase!", { align: "center" })
            .text("This is a system generated invoice.", { align: "center" });

        doc.end();
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
