import { Link } from "react-router-dom";

const InfoPageLayout = ({ eyebrow, title, description, children }) => {
    return (
        <section className="relative overflow-hidden bg-[#f7f4ef] py-18 md:py-22">
            <div className="absolute -left-24 top-12 h-72 w-72 rounded-full bg-amber-200/50 blur-3xl" />
            <div className="absolute -right-28 bottom-10 h-80 w-80 rounded-full bg-sky-200/50 blur-3xl" />

            <div className="relative mx-auto max-w-5xl px-6">
                <div className="rounded-[2rem] bg-slate-950 px-6 py-8 text-white shadow-[0_30px_90px_-50px_rgba(15,23,42,0.9)] md:px-10 md:py-10">
                    <p className="text-xs uppercase tracking-[0.35em] text-amber-300">
                        {eyebrow}
                    </p>
                    <h1 className="mt-4 text-3xl font-black tracking-tight md:text-5xl">
                        {title}
                    </h1>
                    <p className="mt-4 max-w-3xl text-sm text-slate-300 md:text-base">
                        {description}
                    </p>
                </div>

                <div className="mt-8 rounded-[2rem] border border-white/70 bg-white/90 p-6 shadow-[0_30px_80px_-55px_rgba(15,23,42,0.65)] md:p-8">
                    {children}

                    <div className="mt-10 border-t border-slate-100 pt-6 text-sm text-slate-600">
                        Need more help? Visit{" "}
                        <Link to="/contact" className="font-semibold text-indigo-600 hover:text-indigo-700">
                            Contact Us
                        </Link>{" "}
                        or{" "}
                        <Link to="/orders" className="font-semibold text-indigo-600 hover:text-indigo-700">
                            Track Your Order
                        </Link>
                        .
                    </div>
                </div>
            </div>
        </section>
    );
};

export default InfoPageLayout;
