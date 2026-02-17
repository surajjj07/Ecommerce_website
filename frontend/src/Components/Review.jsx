import { Star, Truck, ShieldCheck, Headphones, RefreshCcw } from "lucide-react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay } from "swiper/modules";

import "swiper/css";

const reviews = [
    {
        id: 1,
        name: "Aman Verma",
        rating: 5,
        comment:
            "Amazing quality products and super fast delivery. Packaging was premium and customer support was very helpful.",
    },
    {
        id: 2,
        name: "Riya Sharma",
        rating: 4.5,
        comment:
            "Loved the experience. The product quality exceeded my expectations. Will definitely order again.",
    },
    {
        id: 3,
        name: "Karan Patel",
        rating: 5,
        comment:
            "Smooth checkout, quick delivery, and genuine products. This feels like a premium brand.",
    },
    {
        id: 4,
        name: "Neha Singh",
        rating: 4.8,
        comment:
            "Very smooth shopping experience. Delivery was faster than expected and quality is top-notch.",
    },
];

const qualities = [
    {
        icon: <Truck className="h-6 w-6 text-amber-300" />,
        title: "Fast Delivery",
        desc: "Get your orders delivered within 2-3 business days.",
    },
    {
        icon: <ShieldCheck className="h-6 w-6 text-amber-300" />,
        title: "100% Authentic Products",
        desc: "All products are verified and quality-checked.",
    },
    {
        icon: <RefreshCcw className="h-6 w-6 text-amber-300" />,
        title: "Easy Returns",
        desc: "Hassle-free 7-day return and replacement policy.",
    },
    {
        icon: <Headphones className="h-6 w-6 text-amber-300" />,
        title: "24/7 Customer Support",
        desc: "We're always here to help you with your orders.",
    },
];

const getInitials = (name) =>
    name
        .split(" ")
        .map((n) => n[0])
        .join("");

const Reviews = () => {
    return (
        <section className="relative overflow-hidden bg-transparent py-16 md:py-24">
            <div className="pointer-events-none absolute -bottom-24 left-10 h-80 w-80 rounded-full bg-cyan-500/10 blur-[120px]" />
            <div className="pointer-events-none absolute -top-24 right-10 h-80 w-80 rounded-full bg-amber-500/15 blur-[120px]" />

            <div className="relative mx-auto max-w-7xl px-6">
                <div className="mx-auto mb-16 max-w-3xl text-center">
                    <h2 className="text-3xl font-extrabold text-white md:text-4xl">
                        Trusted by Thousands of Customers
                    </h2>
                    <p className="mt-4 text-slate-300">
                        We focus on quality, speed, and customer satisfaction.
                        Here's what our customers say about us.
                    </p>

                    <div className="mt-6 flex items-center justify-center gap-2">
                        {[...Array(5)].map((_, i) => (
                            <Star
                                key={i}
                                className="h-5 w-5 fill-amber-400 text-amber-400"
                            />
                        ))}
                        <span className="ml-2 text-sm font-semibold text-slate-200">
                            4.9 / 5 based on 10,000+ reviews
                        </span>
                    </div>
                </div>

                <Swiper
                    modules={[Autoplay]}
                    autoplay={{
                        delay: 3500,
                        disableOnInteraction: false,
                    }}
                    loop
                    spaceBetween={24}
                    breakpoints={{
                        0: { slidesPerView: 1 },
                        768: { slidesPerView: 2 },
                        1024: { slidesPerView: 3 },
                    }}
                    className="mb-16"
                >
                    {reviews.map((review) => (
                        <SwiperSlide key={review.id}>
                            <div className="h-full rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-xl transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_30px_80px_-20px_rgba(0,0,0,0.8)]">
                                <div className="mb-4 flex items-center gap-1">
                                    {[...Array(5)].map((_, i) => (
                                        <Star
                                            key={i}
                                            className={`h-4 w-4 ${
                                                i < Math.floor(review.rating)
                                                    ? "fill-amber-400 text-amber-400"
                                                    : "text-slate-500"
                                            }`}
                                        />
                                    ))}
                                </div>

                                <p className="leading-relaxed text-slate-200">
                                    "{review.comment}"
                                </p>

                                <div className="mt-6 flex items-center gap-4">
                                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-r from-amber-400 to-yellow-500 font-semibold text-black">
                                        {getInitials(review.name)}
                                    </div>

                                    <div>
                                        <p className="font-semibold text-white">
                                            {review.name}
                                        </p>
                                        <p className="text-sm text-slate-400">
                                            Verified Buyer
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </SwiperSlide>
                    ))}
                </Swiper>

                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                    {qualities.map((item, index) => (
                        <div
                            key={index}
                            className="rounded-3xl border border-white/10 bg-white/5 p-8 text-center backdrop-blur"
                        >
                            <div className="mb-4 flex justify-center">{item.icon}</div>

                            <h3 className="mb-2 font-semibold text-white">{item.title}</h3>

                            <p className="text-sm text-slate-300">{item.desc}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default Reviews;
