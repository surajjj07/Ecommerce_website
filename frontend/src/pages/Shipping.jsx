import InfoPageLayout from "../Components/InfoPageLayout";

const Shipping = () => {
    return (
        <InfoPageLayout
            eyebrow="Delivery"
            title="Shipping Information"
            description="Understand how LuxeCart handles dispatch, estimated delivery windows, and shipment tracking."
        >
            <div className="grid gap-5 md:grid-cols-3">
                <Feature title="Fast Dispatch" text="Orders are typically processed quickly once payment or order confirmation is complete." />
                <Feature title="Pan-India Delivery" text="We deliver across major Indian cities and serviceable pin codes through courier partners." />
                <Feature title="Tracking Updates" text="Shipment progress is visible from the Track Order page as soon as the courier assigns an AWB." />
            </div>

            <div className="mt-8 grid gap-6 md:grid-cols-2">
                <Section
                    title="Standard Process"
                    lines={[
                        "1. Order placed and confirmed",
                        "2. Store packs and dispatches the shipment",
                        "3. Courier partner picks up the order",
                        "4. Tracking is updated until delivery",
                    ]}
                />
                <Section
                    title="Important Notes"
                    lines={[
                        "Delivery timelines can vary during holidays, weather disruptions, or high demand periods.",
                        "Incorrect shipping details may delay dispatch or delivery.",
                        "Cash on Delivery availability depends on store settings.",
                    ]}
                />
            </div>
        </InfoPageLayout>
    );
};

const Feature = ({ title, text }) => (
    <div className="rounded-3xl border border-slate-100 bg-slate-50 p-5">
        <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
        <p className="mt-2 text-sm text-slate-600">{text}</p>
    </div>
);

const Section = ({ title, lines }) => (
    <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
        <div className="mt-3 space-y-2 text-sm text-slate-600">
            {lines.map((line) => (
                <p key={line}>{line}</p>
            ))}
        </div>
    </div>
);

export default Shipping;
