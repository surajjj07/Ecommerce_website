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
        icon: <Truck className="h-6 w-6 text-indigo-600" />,
        title: "Fast Delivery",
        desc: "Get your orders delivered within 2–3 business days.",
    },
    {
        icon: <ShieldCheck className="h-6 w-6 text-indigo-600" />,
        title: "100% Authentic Products",
        desc: "All products are verified and quality-checked.",
    },
    {
        icon: <RefreshCcw className="h-6 w-6 text-indigo-600" />,
        title: "Easy Returns",
        desc: "Hassle-free 7-day return & replacement policy.",
    },
    {
        icon: <Headphones className="h-6 w-6 text-indigo-600" />,
        title: "24/7 Customer Support",
        desc: "We’re always here to help you with your orders.",
    },
];

const getInitials = (name) =>
    name
        .split(" ")
        .map((n) => n[0])
        .join("");

const Reviews = () => {
    return (
        <section className="bg-white pb-12 md:pb-20">

            <div className="max-w-7xl mx-auto px-6">

                {/* Header */}
                <div className="text-center max-w-3xl mx-auto mb-20">
                    <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900">
                        Trusted by Thousands of Customers
                    </h2>
                    <p className="mt-4 text-gray-600">
                        We focus on quality, speed, and customer satisfaction.
                        Here’s what our customers say about us.
                    </p>

                    <div className="mt-6 flex items-center justify-center gap-2">
                        {[...Array(5)].map((_, i) => (
                            <Star
                                key={i}
                                className="h-5 w-5 fill-yellow-400 text-yellow-400"
                            />
                        ))}
                        <span className="ml-2 text-sm font-semibold text-gray-700">
                            4.9 / 5 based on 10,000+ reviews
                        </span>
                    </div>
                </div>

                {/* 🔥 Auto-Sliding Reviews Carousel */}
                {/* 🔥 Auto-Sliding Reviews Carousel */}
                <Swiper
                    modules={[Autoplay]}
                    autoplay={{
                        delay: 3500,
                        disableOnInteraction: false,
                    }}
                    loop
                    spaceBetween={30}
                    breakpoints={{
                        0: { slidesPerView: 1 },
                        768: { slidesPerView: 2 },
                        1024: { slidesPerView: 3 },
                    }}
                    className="mb-24"
                >
                    {reviews.map((review, index) => (
                        <SwiperSlide key={review.id}>
                            <div
                                className="
          relative rounded-3xl p-8 h-full
          bg-gradient-to-br from-indigo-50 via-white to-pink-50
          border border-indigo-100
        "
                            >
                                {/* Soft glow */}
                                <div className="absolute inset-0 rounded-3xl bg-indigo-200/20 blur-2xl opacity-50 -z-10" />

                                {/* Rating */}
                                <div className="flex items-center gap-1 mb-4">
                                    {[...Array(5)].map((_, i) => (
                                        <Star
                                            key={i}
                                            className={`h-4 w-4 ${i < Math.floor(review.rating)
                                                    ? "fill-yellow-400 text-yellow-400"
                                                    : "text-gray-300"
                                                }`}
                                        />
                                    ))}
                                </div>

                                {/* Comment */}
                                <p className="text-gray-800 leading-relaxed">
                                    “{review.comment}”
                                </p>

                                {/* Avatar + name */}
                                <div className="mt-6 flex items-center gap-4">
                                    <div
                                        className="
              w-12 h-12 rounded-full
              bg-gradient-to-br from-indigo-600 to-pink-500
              flex items-center justify-center
              text-white font-semibold
              shadow-lg
            "
                                    >
                                        {getInitials(review.name)}
                                    </div>

                                    <div>
                                        <p className="font-semibold text-gray-900">
                                            {review.name}
                                        </p>
                                        <p className="text-sm text-gray-500">
                                            Verified Buyer
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </SwiperSlide>
                    ))}
                </Swiper>


                {/* Quality & Social Proof */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
                    {qualities.map((item, index) => (
                        <div
                            key={index}
                            className="bg-gray-50 rounded-3xl p-8 text-center"
                        >
                            <div className="flex justify-center mb-4">
                                {item.icon}
                            </div>

                            <h3 className="font-semibold text-gray-900 mb-2">
                                {item.title}
                            </h3>

                            <p className="text-sm text-gray-600">
                                {item.desc}
                            </p>
                        </div>
                    ))}
                </div>

            </div>
        </section>
    );
};

export default Reviews;
