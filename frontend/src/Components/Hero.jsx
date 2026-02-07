import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay } from "swiper/modules";
import { useNavigate } from "react-router-dom";

import "swiper/css";
import "./hero-swiper.css";

const images = [
    "https://images.unsplash.com/photo-1523275335684-37898b6baf30",
    "https://images.unsplash.com/photo-1542291026-7eec264c27ff",
    "https://images.unsplash.com/photo-1585386959984-a41552231693",
    "https://images.unsplash.com/photo-1618354691373-d851c5c3a990",
    "https://images.unsplash.com/photo-1600185365483-26d7a4cc7519",
];

const Hero = () => {
    const navigate = useNavigate();

    return (
        <section className="relative overflow-hidden bg-gradient-to-b from-gray-50 to-white">

            {/* Background accents (same as before) */}
            <div className="absolute -top-24 -right-24 w-96 h-96 bg-indigo-300/40 rounded-full blur-3xl" />
            <div className="absolute top-40 -left-24 w-96 h-96 bg-pink-300/30 rounded-full blur-3xl" />

            <div className="relative max-w-7xl mx-auto px-6 pt-16 pb-12 md:pt-24 md:pb-20">

                <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">

                    {/* ✅ LEFT CONTENT — UNCHANGED */}
                    <div>
                        <span className="inline-block mb-4 px-4 py-1 rounded-full bg-indigo-100 text-indigo-600 text-sm font-semibold">
                            New Collection 2026
                        </span>

                        <h1 className="text-4xl md:text-6xl font-extrabold leading-tight text-gray-900">
                            Elevate Your <br />
                            <span className="text-indigo-600">Everyday Shopping</span>
                        </h1>

                        <p className="mt-6 text-lg text-gray-600 max-w-xl">
                            Discover premium products curated for quality, style, and value.
                            Experience fast delivery and secure checkout.
                        </p>

                        <div className="mt-10 flex items-center gap-5">
                            <button
                                onClick={() => navigate("/shop")}
                                className="px-8 py-3 rounded-full bg-indigo-600 text-white font-semibold text-sm hover:bg-indigo-700 transition"
                            >
                                Shop Now
                            </button>


                            <button className="px-8 py-3 rounded-full border border-gray-300 text-gray-800 font-semibold text-sm hover:bg-gray-100 transition">
                                Explore Categories
                            </button>
                        </div>

                        <div className="mt-12 flex gap-10 text-sm text-gray-500">
                            <div>
                                <span className="block text-lg font-bold text-gray-900">10k+</span>
                                Happy Customers
                            </div>
                            <div>
                                <span className="block text-lg font-bold text-gray-900">500+</span>
                                Premium Products
                            </div>
                            <div>
                                <span className="block text-lg font-bold text-gray-900">4.9★</span>
                                Average Rating
                            </div>
                        </div>
                    </div>

                    {/* ✅ RIGHT — PREMIUM 3-SLIDE HERO CAROUSEL */}
                    <div className="relative h-[520px] flex items-center justify-center">
                        <Swiper
                            modules={[Autoplay]}
                            slidesPerView={3}
                            centeredSlides
                            loop
                            spaceBetween={-60}
                            autoplay={{
                                delay: 3500,
                                disableOnInteraction: false,
                            }}
                            className="premium-hero-swiper w-full max-w-xl"
                        >
                            {images.map((img, index) => (
                                <SwiperSlide key={index} className="flex justify-center">
                                    <img
                                        src={img}
                                        alt="product"
                                        className="product-img w-56 h-56 rounded-full object-cover"
                                    />
                                </SwiperSlide>
                            ))}
                        </Swiper>
                    </div>

                </div>
            </div>
        </section>
    );
};

export default Hero;
