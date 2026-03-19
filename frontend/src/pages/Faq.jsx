import InfoPageLayout from "../Components/InfoPageLayout";

const faqs = [
    {
        question: "How can I track my order?",
        answer:
            "Open the Track Order page from the footer or profile area to view order status, shipment details, and delivery updates.",
    },
    {
        question: "How long does shipping take?",
        answer:
            "Most orders are dispatched quickly and delivery timelines depend on your city and courier route. You can find details on the Shipping page.",
    },
    {
        question: "Can I return a delivered item?",
        answer:
            "Yes, eligible items can be returned within the policy window if they are unused and in original condition.",
    },
    {
        question: "Will I receive an invoice?",
        answer:
            "Yes, invoices are available for orders and can be accessed through the order management flow when provided by the store.",
    },
    {
        question: "How do I contact support?",
        answer:
            "You can use the Contact Us page for email, phone, and office details.",
    },
];

const Faq = () => {
    return (
        <InfoPageLayout
            eyebrow="Help Center"
            title="Frequently Asked Questions"
            description="Quick answers to the most common questions about orders, delivery, returns, and support."
        >
            <div className="space-y-4">
                {faqs.map((faq) => (
                    <div key={faq.question} className="rounded-3xl border border-slate-100 bg-slate-50 p-5">
                        <h2 className="text-lg font-semibold text-slate-900">{faq.question}</h2>
                        <p className="mt-2 text-sm leading-6 text-slate-600">{faq.answer}</p>
                    </div>
                ))}
            </div>
        </InfoPageLayout>
    );
};

export default Faq;
