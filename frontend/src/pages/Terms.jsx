import InfoPageLayout from "../Components/InfoPageLayout";

const Terms = () => {
    return (
        <InfoPageLayout
            eyebrow="Legal"
            title="Terms and Conditions"
            description="These terms describe the general rules for browsing, ordering, and using services on LuxeCart."
        >
            <div className="space-y-5">
                <LegalBlock
                    title="Orders"
                    text="All orders are subject to product availability, pricing validation, serviceability, and store approval. The store may cancel or refuse an order if stock, payment, or shipping issues arise."
                />
                <LegalBlock
                    title="Pricing and Payments"
                    text="Displayed prices, taxes, and payment options may vary by store settings and availability. Customers should review the final amount carefully before placing an order."
                />
                <LegalBlock
                    title="Shipping and Returns"
                    text="Dispatch timelines, courier movement, delivery estimates, and return eligibility depend on product type, order status, and operational constraints."
                />
                <LegalBlock
                    title="Support"
                    text="For any dispute, assistance request, or order clarification, please contact support with the relevant order details for faster resolution."
                />
            </div>
        </InfoPageLayout>
    );
};

const LegalBlock = ({ title, text }) => (
    <div className="rounded-3xl border border-slate-100 bg-slate-50 p-5">
        <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">{text}</p>
    </div>
);

export default Terms;
