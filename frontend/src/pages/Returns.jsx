import InfoPageLayout from "../Components/InfoPageLayout";

const Returns = () => {
    return (
        <InfoPageLayout
            eyebrow="Policy"
            title="Returns & Refunds"
            description="Easy, transparent, and fast. We stand behind every product and make returns simple if something isn’t right."
        >
            <div className="grid gap-6 md:grid-cols-2">
                <PolicyCard
                    title="Our Promise"
                    items={[
                        "7-day hassle-free returns on eligible items from the day of delivery.",
                        "Free pickup from your address in most serviceable pincodes.",
                        "Quick refunds to your original payment method after quality check.",
                    ]}
                />
                <PolicyCard
                    title="What’s Eligible"
                    items={[
                        "Unused, unwashed items with tags, invoice, and original packaging.",
                        "Damaged/incorrect items qualify for replacement or full refund.",
                        "Electronics, intimate wear, and marked “Final Sale” are not returnable unless damaged on arrival.",
                    ]}
                />
            </div>

            <div className="mt-6 grid gap-6 md:grid-cols-2">
                <PolicyCard
                    title="How to Start a Return"
                    items={[
                        "Go to My Orders → select the item → tap “Request Return”.",
                        "Upload clear photos if the item is damaged/incorrect.",
                        "Choose pickup slot; keep the package ready with all accessories.",
                    ]}
                />
                <PolicyCard
                    title="Refund Timelines"
                    items={[
                        "Prepaid orders: 24–72 hours after item clears QC.",
                        "COD orders: refund to bank/UPI within 2–4 business days after QC.",
                        "Replacements dispatch as soon as pickup is marked in transit (stock permitting).",
                    ]}
                />
            </div>

            <div className="mt-8 rounded-3xl border border-amber-100 bg-amber-50 px-5 py-6 shadow-sm">
                <h2 className="text-lg font-semibold text-amber-900">Quick Rules</h2>
                <ul className="mt-3 space-y-2 text-sm text-amber-900/80">
                    <li>Seal the product securely; include freebies/accessories to avoid partial refunds.</li>
                    <li>Pickup attempts: 2 tries before a request auto-closes (you can re-open within the window).</li>
                    <li>Price tags tampered, heavy wear, or missing packaging may lead to rejection.</li>
                </ul>
            </div>

            <div className="mt-6 rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
                <h2 className="text-lg font-semibold text-slate-900">Need help right now?</h2>
                <p className="mt-2 text-sm text-slate-600">
                    Chat with support or email us with your order ID and photos. We typically respond within a few hours.
                </p>
            </div>
        </InfoPageLayout>
    );
};

const PolicyCard = ({ title, items }) => (
    <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
        <div className="mt-3 space-y-2 text-sm text-slate-600">
            {items.map((item) => (
                <p key={item}>{item}</p>
            ))}
        </div>
    </div>
);

export default Returns;
