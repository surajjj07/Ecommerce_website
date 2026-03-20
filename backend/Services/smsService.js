import twilio from "twilio";

const client = twilio(
    process.env.TWILIO_SID,
    process.env.TWILIO_AUTH_TOKEN
);

export const sendSMS = async ({ to, body }) => {
    await client.messages.create({
        from: process.env.TWILIO_PHONE,
        to,
        body,
    });
};

export const sendWhatsApp = async ({ to, body }) => {
    const from = String(process.env.TWILIO_WHATSAPP_FROM || "").trim();
    const destination = String(to || "").trim();

    if (!from) {
        throw new Error("TWILIO_WHATSAPP_FROM is not configured");
    }

    if (!destination) {
        throw new Error("WhatsApp destination number is required");
    }

    const normalize = (value) =>
        value.startsWith("whatsapp:") ? value : `whatsapp:${value}`;

    await client.messages.create({
        from: normalize(from),
        to: normalize(destination),
        body,
    });
};
