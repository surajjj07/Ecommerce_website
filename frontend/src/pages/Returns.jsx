import InfoPageLayout from "../Components/InfoPageLayout";

const Returns = () => {
    return (
        <InfoPageLayout
            eyebrow="Policy"
            title="Returns & Refunds"
            description="Review the return eligibility rules, refund process, and customer responsibilities before requesting a return."
        >
            <div className="grid gap-6 md:grid-cols-2">
                <PolicyCard
                    title="Return Eligibility"
                    items={[
                        "Item should be unused and in original packaging.",
                        "Return request should be raised within the applicable return window.",
                        "Products marked as final sale or hygiene-sensitive may not be returnable.",
                    ]}
                />
                <PolicyCard
                    title="Refund Process"
                    items={[
                        "Once the returned item is received and inspected, the refund is processed.",
                        "Refund timing depends on your payment method and banking partner.",
                        "Any approved refund is shared back to the original payment source where applicable.",
                    ]}
                />
            </div>

            <div className="mt-8 rounded-3xl border border-slate-100 bg-slate-50 p-5">
                <h2 className="text-lg font-semibold text-slate-900">Need help with a return?</h2>
                <p className="mt-2 text-sm text-slate-600">
                    Keep your order ID ready and contact support with product photos if the item arrived damaged,
                    incorrect, or incomplete.
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
