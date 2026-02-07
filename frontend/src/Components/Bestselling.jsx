import { useEffect, useState } from "react";
import { Star, ShoppingCart } from "lucide-react";
import { useCart } from "../Context/CartContext";



/* Mock API data */
const productData = [
    {
        id: 1,
        name: "Wireless Headphones",
        price: "₹2,999",
        rating: 4.5,
        stock: "inStock", // inStock | limited | outOfStock
        image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e",
    },
    {
        id: 2,
        name: "Smart Watch",
        price: "₹4,499",
        rating: 4.7,
        stock: "limited",
        image: "https://images.unsplash.com/photo-1516574187841-cb9cc2ca948b",
    },
    {
        id: 3,
        name: "Running Shoes",
        price: "₹3,299",
        rating: 4.6,
        stock: "outOfStock",
        image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff",
    },
    {
        id: 4,
        name: "Minimal Backpack",
        price: "₹1,999",
        rating: 4.4,
        stock: "inStock",
        image: "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f",
    },
];

const SkeletonCard = () => (
    <div className="animate-pulse">
        <div className="h-72 rounded-3xl bg-gray-200" />
        <div className="mt-5 space-y-3">
            <div className="h-4 bg-gray-200 rounded w-3/4" />
            <div className="h-4 bg-gray-200 rounded w-1/2" />
            <div className="h-4 bg-gray-200 rounded w-1/3" />
        </div>
    </div>
);

const Bestselling = () => {
    const { addToCart } = useCart();

    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);

    /* Simulate API delay */
    useEffect(() => {
        const timer = setTimeout(() => {
            setProducts(productData);
            setLoading(false);
        }, 1500);

        return () => clearTimeout(timer);
    }, []);

    return (
        <section className="bg-white pb-12 md:pb-20">
            <div className="max-w-7xl mx-auto px-6">

                {/* Header */}
                <div className="mb-14">
                    <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900">
                        Bestselling Products
                    </h2>
                    <p className="mt-3 text-gray-600">
                        Most loved products by our customers
                    </p>
                </div>

                {/* Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">

                    {loading
                        ? [...Array(4)].map((_, i) => <SkeletonCard key={i} />)
                        : products.map((product) => (
                            <div key={product.id} className="group">

                                {/* Image */}
                                <div className="relative rounded-3xl bg-gray-50 overflow-hidden">

                                    <img
                                        src={product.image}
                                        alt={product.name}
                                        className={`w-full h-72 object-cover transition-transform duration-500
                        ${product.stock === "outOfStock"
                                                ? "grayscale opacity-60"
                                                : "group-hover:scale-105"
                                            }
                      `}
                                    />

                                    {/* Stock badge */}
                                    {product.stock !== "inStock" && (
                                        <span
                                            className={`absolute top-4 left-4 px-3 py-1 rounded-full text-xs font-semibold
                          ${product.stock === "limited"
                                                    ? "bg-yellow-500 text-white"
                                                    : "bg-red-600 text-white"
                                                }
                        `}
                                        >
                                            {product.stock === "limited"
                                                ? "Limited Stock"
                                                : "Out of Stock"}
                                        </span>
                                    )}

                                    {/* Add to cart */}
                                    <button
                                        disabled={product.stock === "outOfStock"}
                                        onClick={() => addToCart(product)}
                                        className={`
    absolute bottom-4 left-1/2 -translate-x-1/2
    px-5 py-2 rounded-full text-sm font-semibold
    flex items-center gap-2 transition-all duration-300
    ${product.stock === "outOfStock"
                                                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                                                : "bg-indigo-600 text-white opacity-0 group-hover:opacity-100 hover:bg-indigo-700"
                                            }
  `}
                                    >
                                        Add to Cart
                                    </button>

                                </div>

                                {/* Info */}
                                <div className="mt-5 space-y-2">
                                    <h3 className="text-lg font-semibold text-gray-900">
                                        {product.name}
                                    </h3>

                                    {/* Rating */}
                                    <div className="flex items-center gap-1">
                                        {[...Array(5)].map((_, i) => (
                                            <Star
                                                key={i}
                                                className={`h-4 w-4 ${i < Math.floor(product.rating)
                                                    ? "fill-yellow-400 text-yellow-400"
                                                    : "text-gray-300"
                                                    }`}
                                            />
                                        ))}
                                        <span className="ml-2 text-sm text-gray-500">
                                            {product.rating}
                                        </span>
                                    </div>

                                    {/* Price */}
                                    <p className="text-indigo-600 font-bold">
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
