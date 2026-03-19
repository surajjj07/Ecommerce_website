import { Mail, MapPin, Phone } from "lucide-react";
import InfoPageLayout from "../Components/InfoPageLayout";

const Contact = () => {
    return (
        <InfoPageLayout
            eyebrow="Support"
            title="Contact Us"
            description="Reach our support team for order help, product questions, delivery updates, or business inquiries."
        >
            <div className="grid gap-5 md:grid-cols-3">
                <ContactCard
                    icon={<Mail className="h-5 w-5" />}
                    title="Email Support"
                    value="support@luxecart.com"
                    detail="Average response time: within 24 hours"
                />
                <ContactCard
                    icon={<Phone className="h-5 w-5" />}
                    title="Call Us"
                    value="+91 98765 43210"
                    detail="Monday to Saturday, 9:00 AM to 7:00 PM"
                />
                <ContactCard
                    icon={<MapPin className="h-5 w-5" />}
                    title="Office"
                    value="LuxeCart India"
                    detail="Mumbai, Maharashtra, India"
                />
            </div>

            <div className="mt-8 grid gap-6 md:grid-cols-2">
                <InfoBlock
                    title="Order Support"
                    items={[
                        "Share your order ID for faster help.",
                        "We can assist with delivery, returns, refunds, and invoice requests.",
                        "For urgent shipping updates, use the Track Order page first.",
                    ]}
                />
                <InfoBlock
                    title="Business Queries"
                    items={[
                        "Vendor and partnership queries can be sent to support@luxecart.com.",
                        "Please include your brand details, website, and product category.",
                        "Our team reviews partnership requests on business days.",
                    ]}
                />
            </div>
        </InfoPageLayout>
    );
};

const ContactCard = ({ icon, title, value, detail }) => (
    <div className="rounded-3xl border border-slate-100 bg-slate-50 p-5">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-900 text-white">
            {icon}
        </div>
        <h2 className="mt-4 text-lg font-semibold text-slate-900">{title}</h2>
        <p className="mt-1 font-medium text-slate-800">{value}</p>
        <p className="mt-2 text-sm text-slate-500">{detail}</p>
    </div>
);

const InfoBlock = ({ title, items }) => (
    <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
        <div className="mt-3 space-y-2 text-sm text-slate-600">
            {items.map((item) => (
                <p key={item}>{item}</p>
            ))}
        </div>
    </div>
);

export default Contact;
