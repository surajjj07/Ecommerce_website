// import { useEffect, useMemo, useState } from "react";
// import { Star, ShoppingCart } from "lucide-react";
// import { useCart } from "../Context/CartContext";
// import { useNavigate } from "react-router-dom";
// import { api } from "../services/api";

// const formatPrice = (value) => `INR ${Number(value || 0).toLocaleString("en-IN")}`;

// const mapProduct = (product) => ({
//     id: product._id,
//     name: product.name,
//     price: formatPrice(product.price),
//     rating: 4.6,
//     stock: product.stock > 0 ? "inStock" : "outOfStock",
//     image: product.images?.[0] || "https://via.placeholder.com/300",
//     bestseller: Boolean(product.bestseller),
// });

// const SkeletonCard = () => (
//     <div className="animate-pulse">
//         <div className="h-72 rounded-3xl bg-slate-200" />
//         <div className="mt-5 space-y-3">
//             <div className="h-4 w-3/4 rounded bg-slate-200" />
//             <div className="h-4 w-1/2 rounded bg-slate-200" />
//             <div className="h-4 w-1/3 rounded bg-slate-200" />
//         </div>
//     </div>
// );

// const Bestselling = () => {
//     const { addToCart } = useCart();
//     const navigate = useNavigate();

//     const [products, setProducts] = useState([]);
//     const [loading, setLoading] = useState(true);

//     useEffect(() => {
//         const fetchProducts = async () => {
//             try {
//                 const result = await api.getAllProducts();
//                 const mapped = (result?.products || []).map(mapProduct);
//                 setProducts(mapped);
//             } catch (error) {
//                 console.error("Failed to fetch bestselling products:", error);
//             } finally {
//                 setLoading(false);
//             }
//         };

//         fetchProducts();
//     }, []);

//     const showcasedProducts = useMemo(() => {
//         if (!products.length) {
//             return [];
//         }

//         const best = products.filter((product) => product.bestseller);
//         if (best.length >= 4) {
//             return best.slice(0, 4);
//         }

//         return [...best, ...products.filter((product) => !product.bestseller)].slice(0, 4);
//     }, [products]);

//     return (
//         <section id="bestselling" className="bg-white pb-12 md:pb-20">
//             <div className="mx-auto max-w-7xl px-6">
//                 <div className="mb-14">
//                     <h2 className="text-3xl font-extrabold text-slate-900 md:text-4xl">
//                         Bestselling Products
//                     </h2>
//                     <p className="mt-3 text-slate-600">
//                         Real-time picks from our most loved catalog.
//                     </p>
//                 </div>

//                 <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">
//                     {loading
//                         ? [...Array(4)].map((_, i) => <SkeletonCard key={i} />)
//                         : showcasedProducts.map((product) => (
//                             <div
//                                 key={product.id}
//                                 className="group cursor-pointer"
//                                 onClick={() => navigate(`/product/${product.id}`)}
//                             >
//                                 <div className="relative overflow-hidden rounded-3xl bg-slate-50">
//                                     <img
//                                         src={product.image}
//                                         alt={product.name}
//                                         className={`h-72 w-full object-cover transition-transform duration-500 ${
//                                             product.stock === "outOfStock"
//                                                 ? "opacity-60 grayscale"
//                                                 : "group-hover:scale-105"
//                                         }`}
//                                     />

//                                     {product.stock === "outOfStock" && (
//                                         <span className="absolute left-4 top-4 rounded-full bg-red-600 px-3 py-1 text-xs font-semibold text-white">
//                                             Out of Stock
//                                         </span>
//                                     )}

//                                     <button
//                                         disabled={product.stock === "outOfStock"}
//                                         onClick={(event) => {
//                                             event.stopPropagation();
//                                             addToCart(product);
//                                         }}
//                                         className={`absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full px-5 py-2 text-sm font-semibold transition-all duration-300 ${
//                                             product.stock === "outOfStock"
//                                                 ? "cursor-not-allowed bg-slate-300 text-slate-500"
//                                                 : "bg-slate-900 text-white opacity-0 group-hover:opacity-100 hover:bg-slate-800"
//                                         }`}
//                                     >
//                                         <span className="flex items-center gap-2">
//                                             <ShoppingCart className="h-4 w-4" />
//                                             Add to Cart
//                                         </span>
//                                     </button>
//                                 </div>

//                                 <div className="mt-5 space-y-2">
//                                     <h3 className="text-lg font-semibold text-slate-900">{product.name}</h3>

//                                     <div className="flex items-center gap-1">
//                                         {[...Array(5)].map((_, i) => (
//                                             <Star
//                                                 key={i}
//                                                 className={`h-4 w-4 ${
//                                                     i < Math.floor(product.rating)
//                                                         ? "fill-amber-400 text-amber-400"
//                                                         : "text-slate-300"
//                                                 }`}
//                                             />
//                                         ))}
//                                         <span className="ml-2 text-sm text-slate-500">
//                                             {product.rating}
//                                         </span>
//                                     </div>

//                                     <p className="font-bold text-slate-900">{product.price}</p>
//                                 </div>
//                             </div>
//                         ))}
//                 </div>
//             </div>
//         </section>
//     );
// };

// export default Bestselling;


import { useEffect, useMemo, useState } from "react";
import { Star, ShoppingCart } from "lucide-react";
import { useCart } from "../Context/CartContext";
import { useNavigate } from "react-router-dom";
import { api } from "../services/api";
import { PRODUCT_PLACEHOLDER, resolveImageUrl } from "../utils/image";

const formatPrice = (value) => `INR ${Number(value || 0).toLocaleString("en-IN")}`;

const mapProduct = (product) => ({
    id: product._id,
    name: product.name,
    price: formatPrice(product.price),
    rating: 4.6,
    stock: product.stock > 0 ? "inStock" : "outOfStock",
    image: resolveImageUrl(product.images?.[0]),
    bestseller: Boolean(product.bestseller),
});

const SkeletonCard = () => (
    <div className="animate-pulse rounded-3xl border border-white/10 bg-white/5 p-4 backdrop-blur">
        <div className="h-72 rounded-2xl bg-slate-700/50" />
        <div className="mt-5 space-y-3">
            <div className="h-4 w-3/4 rounded bg-slate-700/50" />
            <div className="h-4 w-1/2 rounded bg-slate-700/50" />
            <div className="h-4 w-1/3 rounded bg-slate-700/50" />
        </div>
    </div>
);

const Bestselling = () => {
    const { addToCart } = useCart();
    const navigate = useNavigate();

    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const result = await api.getAllProducts();
                const mapped = (result?.products || []).map(mapProduct);
                setProducts(mapped);
            } catch (error) {
                console.error("Failed to fetch bestselling products:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchProducts();
    }, []);

    const showcasedProducts = useMemo(() => {
        if (!products.length) return [];
        const best = products.filter((product) => product.bestseller);
        if (best.length >= 4) return best.slice(0, 4);
        return [...best, ...products.filter((product) => !product.bestseller)].slice(0, 4);
    }, [products]);

    return (
        <section
            id="bestselling"
            className="relative overflow-hidden bg-transparent py-16 md:py-24"
        >
            {/* Glow */}
            <div className="pointer-events-none absolute -top-32 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-amber-500/20 blur-[120px]" />

            <div className="relative mx-auto max-w-7xl px-6">
                <div className="mb-14">
                    <h2 className="text-3xl font-extrabold tracking-tight text-white md:text-4xl">
                        Bestselling Products
                    </h2>
                    <p className="mt-3 max-w-xl text-slate-300">
                        Curated premium picks from our most loved collection.
                    </p>
                </div>

                <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">
                    {loading
                        ? [...Array(4)].map((_, i) => <SkeletonCard key={i} />)
                        : showcasedProducts.map((product) => (
                            <div
                                key={product.id}
                                onClick={() => navigate(`/product/${product.id}`)}
                                className="group cursor-pointer rounded-3xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_30px_80px_-20px_rgba(0,0,0,0.8)]"
                            >
                                <div className="relative overflow-hidden rounded-2xl">
                                    <img
                                        src={product.image}
                                        alt={product.name}
                                        onError={(e) => {
                                            e.currentTarget.onerror = null;
                                            e.currentTarget.src = PRODUCT_PLACEHOLDER;
                                        }}
                                        className={`h-72 w-full object-cover transition-all duration-700 ${product.stock === "outOfStock"
                                                ? "opacity-50 grayscale"
                                                : "group-hover:scale-110"
                                            }`}
                                    />

                                    {product.stock === "outOfStock" && (
                                        <span className="absolute left-4 top-4 rounded-full bg-red-600/90 px-3 py-1 text-xs font-semibold text-white">
                                            Out of Stock
                                        </span>
                                    )}

                                    <button
                                        disabled={product.stock === "outOfStock"}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            addToCart(product);
                                        }}
                                        className={`absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full px-5 py-2 text-sm font-semibold transition-all duration-300 ${product.stock === "outOfStock"
                                                ? "cursor-not-allowed bg-slate-500/40 text-slate-300"
                                                : "bg-gradient-to-r from-amber-400 to-yellow-500 text-black opacity-0 group-hover:opacity-100 hover:scale-105"
                                            }`}
                                    >
                                        <span className="flex items-center gap-2">
                                            <ShoppingCart className="h-4 w-4" />
                                            Add to Cart
                                        </span>
                                    </button>
                                </div>

                                <div className="mt-5 space-y-2">
                                    <h3 className="text-lg font-semibold text-white">
                                        {product.name}
                                    </h3>

                                    <div className="flex items-center gap-1">
                                        {[...Array(5)].map((_, i) => (
                                            <Star
                                                key={i}
                                                className={`h-4 w-4 ${i < Math.floor(product.rating)
                                                        ? "fill-amber-400 text-amber-400"
                                                        : "text-slate-500"
                                                    }`}
                                            />
                                        ))}
                                        <span className="ml-2 text-sm text-slate-400">
                                            {product.rating}
                                        </span>
                                    </div>

                                    <p className="text-lg font-bold text-amber-400">
                                        {product.price}
                                    </p>
                                </div>
                            </div>
                        ))}
                </div>
            </div>
        </section>
    );
};

export default Bestselling;
