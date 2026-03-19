import PDFDocument from "pdfkit";
import Order from "../models/Order.js";
import Settings from "../models/Settings.js";

const formatMoney = (value) => `INR ${Number(value || 0).toFixed(2)}`;

const formatDate = (value) =>
    new Date(value).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });

const normalizeText = (value) => String(value || "").trim().toLowerCase();

const drawLabelValue = (doc, label, value, x, y, width) => {
    doc
        .font("Helvetica-Bold")
        .fontSize(9)
        .fillColor("#64748B")
        .text(label.toUpperCase(), x, y, { width });
    doc
        .font("Helvetica")
        .fontSize(11)
        .fillColor("#0F172A")
        .text(value || "-", x, y + 14, { width });
};

const drawTableRow = (doc, y, columns, options = {}) => {
    const {
        background = null,
        textColor = "#0F172A",
        bold = false,
        borderColor = "#E2E8F0",
        rowHeight = 24,
    } = options;

    if (background) {
        doc
            .save()
            .rect(40, y - 6, 515, rowHeight)
            .fill(background)
            .restore();
    }

    doc
        .moveTo(40, y + rowHeight - 6)
        .lineTo(555, y + rowHeight - 6)
        .strokeColor(borderColor)
        .stroke();

    doc.font(bold ? "Helvetica-Bold" : "Helvetica").fontSize(10).fillColor(textColor);
    columns.forEach(({ text, x, width, align = "left" }) => {
        doc.text(text, x, y, { width, align });
    });
};

const buildInvoiceBreakdown = ({ order, settings }) => {
    const taxRate = Number(settings?.defaultTaxRate ?? 18);
    const storeState =
        settings?.storeState || settings?.shiprocket?.pickupState || "";
    const customerState = order.shippingDetails?.state || "";
    const isIntraState =
        normalizeText(storeState) &&
        normalizeText(customerState) &&
        normalizeText(storeState) === normalizeText(customerState);

    const items = (order.items || []).map((item) => {
        const baseItem = item.toObject ? item.toObject() : item;
        const grossAmount = Number(item.price || 0) * Number(item.quantity || 0);
        const taxableAmount =
            taxRate > 0 ? (grossAmount * 100) / (100 + taxRate) : grossAmount;
        const taxAmount = grossAmount - taxableAmount;
        const halfTax = taxAmount / 2;

        return {
            ...baseItem,
            grossAmount,
            taxableAmount,
            taxAmount,
            cgstAmount: isIntraState ? halfTax : 0,
            sgstAmount: isIntraState ? halfTax : 0,
            igstAmount: isIntraState ? 0 : taxAmount,
        };
    });

    const subtotal = items.reduce((sum, item) => sum + item.taxableAmount, 0);
    const totalTax = items.reduce((sum, item) => sum + item.taxAmount, 0);
    const cgst = items.reduce((sum, item) => sum + item.cgstAmount, 0);
    const sgst = items.reduce((sum, item) => sum + item.sgstAmount, 0);
    const igst = items.reduce((sum, item) => sum + item.igstAmount, 0);

    return {
        taxRate,
        isIntraState,
        items,
        subtotal,
        totalTax,
        cgst,
        sgst,
        igst,
        grandTotal: Number(order.totalAmount || 0),
    };
};

export const generateInvoicePDF = async (req, res) => {
    try {
        const { id } = req.params;

        const order = await Order.findById(id)
            .populate("user", "name email")
            .populate("items.product", "name sku");

        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }

        const settings = order.admin
            ? await Settings.getForAdmin(order.admin)
            : await Settings.findOne().sort({ createdAt: 1 });

        if (req.user && order.user._id.toString() !== req.user.id) {
            return res.status(403).json({ message: "Unauthorized access" });
        }

        const breakdown = buildInvoiceBreakdown({ order, settings });
        const invoiceNumber = `${settings?.invoicePrefix || "INV"}-${order.orderId}`;
        const sellerAddress = [
            settings?.storeAddress,
            settings?.storeCity,
            settings?.storeState,
            settings?.storePincode,
            settings?.storeCountry,
        ]
            .filter(Boolean)
            .join(", ");
        const customerAddress =
            [
                order.shippingDetails?.addressLine1,
                order.shippingDetails?.addressLine2,
                order.shippingDetails?.city,
                order.shippingDetails?.state,
                order.shippingDetails?.pincode,
                order.shippingDetails?.country,
            ]
                .filter(Boolean)
                .join(", ") || order.shippingAddress;

        const doc = new PDFDocument({ margin: 40, size: "A4" });

        res.setHeader("Content-Type", "application/pdf");
        res.setHeader(
            "Content-Disposition",
            `inline; filename=${invoiceNumber.toLowerCase()}.pdf`
        );

        doc.pipe(res);

        doc.rect(40, 36, 515, 88).fill("#0F172A");
        doc
            .fillColor("#FFFFFF")
            .font("Helvetica-Bold")
            .fontSize(24)
            .text("TAX INVOICE", 55, 56);
        doc
            .font("Helvetica")
            .fontSize(10)
            .fillColor("#CBD5E1")
            .text("Professional GST-compliant order summary", 55, 88);

        doc
            .font("Helvetica-Bold")
            .fontSize(20)
            .fillColor("#FFFFFF")
            .text(settings?.storeName || "Store", 330, 56, { align: "right", width: 200 });
        doc
            .font("Helvetica")
            .fontSize(10)
            .fillColor("#E2E8F0")
            .text(settings?.storeEmail || "-", 330, 84, { align: "right", width: 200 })
            .text(settings?.phone || "-", 330, 98, { align: "right", width: 200 });

        let y = 145;
        drawLabelValue(doc, "Invoice No", invoiceNumber, 40, y, 160);
        drawLabelValue(doc, "Invoice Date", formatDate(order.createdAt), 215, y, 110);
        drawLabelValue(doc, "Order ID", order.orderId, 340, y, 110);
        drawLabelValue(doc, "Payment", `${order.paymentMethod.toUpperCase()} / ${order.paymentStatus.toUpperCase()}`, 455, y, 100);

        y += 58;
        doc
            .roundedRect(40, y, 245, 110, 12)
            .fill("#F8FAFC");
        doc
            .roundedRect(310, y, 245, 110, 12)
            .fill("#F8FAFC");

        doc
            .font("Helvetica-Bold")
            .fontSize(11)
            .fillColor("#0F172A")
            .text("Seller Details", 55, y + 16);
        doc
            .font("Helvetica")
            .fontSize(10)
            .fillColor("#334155")
            .text(settings?.storeName || "Store", 55, y + 36)
            .text(sellerAddress || "Store address not configured", 55, y + 52, { width: 210 })
            .text(`GSTIN: ${settings?.gstNumber || "Not configured"}`, 55, y + 82)
            .text(`Contact: ${settings?.phone || "-"}`, 55, y + 96);

        doc
            .font("Helvetica-Bold")
            .fontSize(11)
            .fillColor("#0F172A")
            .text("Bill / Ship To", 325, y + 16);
        doc
            .font("Helvetica")
            .fontSize(10)
            .fillColor("#334155")
            .text(order.user?.name || order.shippingDetails?.name || "Customer", 325, y + 36)
            .text(customerAddress || "Shipping address unavailable", 325, y + 52, { width: 210 })
            .text(`Email: ${order.user?.email || order.shippingDetails?.email || "-"}`, 325, y + 82)
            .text(`Phone: ${order.shippingDetails?.phone || "-"}`, 325, y + 96);

        y += 138;

        drawTableRow(
            doc,
            y,
            [
                { text: "Item", x: 48, width: 140 },
                { text: "SKU", x: 190, width: 70 },
                { text: "Qty", x: 264, width: 34, align: "right" },
                { text: "Taxable", x: 305, width: 72, align: "right" },
                { text: breakdown.isIntraState ? "CGST" : "IGST", x: 385, width: 55, align: "right" },
                { text: breakdown.isIntraState ? "SGST" : "Rate", x: 445, width: 45, align: "right" },
                { text: "Total", x: 495, width: 52, align: "right" },
            ],
            { background: "#E2E8F0", bold: true, rowHeight: 28 }
        );

        y += 32;

        breakdown.items.forEach((item) => {
            const primaryTax = breakdown.isIntraState ? item.cgstAmount : item.igstAmount;
            const secondaryTax = breakdown.isIntraState ? item.sgstAmount : breakdown.taxRate;

            drawTableRow(doc, y, [
                { text: item.product?.name || "Product", x: 48, width: 140 },
                { text: item.product?.sku || "-", x: 190, width: 70 },
                { text: String(item.quantity || 0), x: 264, width: 34, align: "right" },
                { text: formatMoney(item.taxableAmount), x: 305, width: 72, align: "right" },
                { text: formatMoney(primaryTax), x: 385, width: 55, align: "right" },
                {
                    text: breakdown.isIntraState
                        ? formatMoney(item.sgstAmount)
                        : `${breakdown.taxRate.toFixed(2)}%`,
                    x: 445,
                    width: 45,
                    align: "right",
                },
                { text: formatMoney(item.grossAmount), x: 495, width: 52, align: "right" },
            ]);
            y += 24;
        });

        y += 18;

        const summaryX = 340;
        const summaryWidth = 215;
        doc.roundedRect(summaryX, y, summaryWidth, 118, 14).fill("#F8FAFC");

        drawLabelValue(doc, "Taxable Amount", formatMoney(breakdown.subtotal), summaryX + 16, y + 16, 183);
        if (breakdown.isIntraState) {
            drawLabelValue(
                doc,
                `CGST (${(breakdown.taxRate / 2).toFixed(2)}%)`,
                formatMoney(breakdown.cgst),
                summaryX + 16,
                y + 48,
                183
            );
            drawLabelValue(
                doc,
                `SGST (${(breakdown.taxRate / 2).toFixed(2)}%)`,
                formatMoney(breakdown.sgst),
                summaryX + 16,
                y + 80,
                183
            );
        } else {
            drawLabelValue(
                doc,
                `IGST (${breakdown.taxRate.toFixed(2)}%)`,
                formatMoney(breakdown.igst),
                summaryX + 16,
                y + 48,
                183
            );
            drawLabelValue(doc, "Total Tax", formatMoney(breakdown.totalTax), summaryX + 16, y + 80, 183);
        }

        y += 136;

        doc
            .font("Helvetica-Bold")
            .fontSize(14)
            .fillColor("#0F172A")
            .text(`Grand Total: ${formatMoney(breakdown.grandTotal)}`, 340, y, {
                width: 215,
                align: "right",
            });

        y += 34;
        doc
            .moveTo(40, y)
            .lineTo(555, y)
            .strokeColor("#CBD5E1")
            .stroke();

        y += 16;
        doc
            .font("Helvetica")
            .fontSize(9)
            .fillColor("#475569")
            .text(
                `Tax treatment: ${
                    breakdown.isIntraState
                        ? "Intra-state supply, GST split into CGST and SGST."
                        : "Inter-state supply, GST charged as IGST."
                }`,
                40,
                y,
                { width: 515 }
            )
            .moveDown(0.5)
            .text("This is a system generated invoice and does not require a physical signature.", {
                width: 515,
            })
            .moveDown(0.5)
            .text("Thank you for your business.", { width: 515, align: "center" });

        doc.end();
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
