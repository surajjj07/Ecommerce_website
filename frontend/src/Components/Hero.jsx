import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay } from "swiper/modules";
import { ArrowRight, BadgeCheck, ShieldCheck, Truck } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Hero1 from '../assets/Hero1.jpeg'
import Hero2 from '../assets/Hero2.jpeg'
import Hero3 from '../assets/Hero3.jpeg'
import Hero4 from '../assets/Hero4.jpeg'
import Hero5 from '../assets/Hero5.jpeg'
import Hero6 from '../assets/Hero6.jpeg'

import "swiper/css";
import "./hero-swiper.css";

const images = [
    Hero1,Hero2,Hero3,Hero4,Hero5,Hero6
];

const Hero = () => {
    const navigate = useNavigate();

    return (
        <section className="relative overflow-hidden bg-transparent text-white">
            <div className="pointer-events-none absolute -left-20 top-0 h-72 w-72 rounded-full bg-amber-400/20 blur-3xl" />
            <div className="pointer-events-none absolute -right-10 bottom-0 h-96 w-96 rounded-full bg-cyan-500/20 blur-3xl" />

            <div className="relative mx-auto grid max-w-7xl grid-cols-1 gap-10 px-6 pb-16 pt-16 md:grid-cols-2 md:items-center md:gap-14 md:py-24">
                <div>
                    <span className="inline-flex items-center rounded-full border border-amber-300/40 bg-amber-300/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-amber-200">
                        Spring Drop 2026
                    </span>

                    <h1 className="mt-5 text-4xl font-black leading-tight md:text-6xl">
                        Premium essentials,
                        <br />
                        <span className="text-amber-400">built for everyday luxury.</span>
                    </h1>

                    <p className="mt-5 max-w-xl text-base text-slate-300 md:text-lg">
                        Discover curated products with verified quality, fast delivery,
                        and a checkout flow you can trust.
                    </p>

                    <div className="mt-9 flex flex-wrap items-center gap-4">
                        <button
                            onClick={() => navigate("/shop")}
                            className="inline-flex items-center gap-2 rounded-full bg-amber-400 px-7 py-3 text-sm font-bold text-slate-950 transition hover:bg-amber-300"
                        >
                            Shop Collection
                            <ArrowRight className="h-4 w-4" />
                        </button>

                        <button
                            onClick={() => navigate("/shop?category=Electronics")}
                            className="rounded-full border border-slate-500 px-7 py-3 text-sm font-semibold text-slate-100 transition hover:border-amber-300 hover:text-amber-200"
                        >
                            Explore Categories
                        </button>
                    </div>

                    <div className="mt-10 grid grid-cols-1 gap-3 text-sm text-slate-300 sm:grid-cols-3">
                        <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 backdrop-blur">
                            <BadgeCheck className="h-4 w-4 text-amber-300" />
                            Handpicked Quality
                        </div>
                        <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 backdrop-blur">
                            <Truck className="h-4 w-4 text-amber-300" />
                            Fast Dispatch
                        </div>
                        <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 backdrop-blur">
                            <ShieldCheck className="h-4 w-4 text-amber-300" />
                            Secure Payments
                        </div>
                    </div>
                </div>

                <div className="relative flex h-[440px] items-center justify-center md:h-[520px]">
                    <div className="absolute inset-0 rounded-[2.5rem] border border-white/10 bg-gradient-to-br from-slate-900/70 via-slate-950/40 to-slate-900/80 backdrop-blur" />
                    <Swiper
                        modules={[Autoplay]}
                        slidesPerView={3}
                        centeredSlides
                        loop
                        spaceBetween={-50}
                        autoplay={{
                            delay: 3200,
                            disableOnInteraction: false,
                        }}
                        className="premium-hero-swiper relative w-full max-w-xl"
                    >
                        {images.map((img, index) => (
                            <SwiperSlide key={index} className="flex justify-center">
                                <img
                                    src={`${img}?auto=format&fit=crop&w=600&q=80`}
                                    alt="premium-product"
                                    className="product-img h-56 w-56 rounded-full border-4 border-white/30 object-cover"
                                />
                            </SwiperSlide>
                        ))}
                    </Swiper>
                </div>
            </div>
        </section>
    );
};

export default Hero;
