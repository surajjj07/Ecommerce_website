import { useEffect, useMemo, useState } from "react";
import { Star, ShoppingCart } from "lucide-react";
import { useCart } from "../Context/CartContext";
import { useNavigate, useSearchParams } from "react-router-dom";
import { api } from "../services/api";
import { PRODUCT_PLACEHOLDER, resolveImageUrl } from "../utils/image";

const categories = [
    "All",
    "Electronics",
    "Fashion",
    "Home & Kitchen",
    "Beauty & Health",
    "Sports & Fitness",
];

const formatPrice = (value) => `INR ${Number(value || 0).toLocaleString("en-IN")}`;

const mapProduct = (product) => ({
    id: product._id,
    name: product.name,
    price: formatPrice(product.price),
    rating: 4.5,
    stock: product.stock > 0 ? "inStock" : "outOfStock",
    category: product.category,
    image: resolveImageUrl(product.images?.[0]),
});

const Shop = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const { addToCart } = useCart();
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();

    const searchQuery = searchParams.get("search")?.trim() || "";
    const activeCategory = searchParams.get("category") || "All";

    useEffect(() => {
        const fetchProducts = async () => {
            setLoading(true);
            setError("");

            try {
                let result;

                if (searchQuery) {
                    result = await api.searchProducts(
                        searchQuery,
                        activeCategory !== "All" ? activeCategory : ""
                    );
                } else if (activeCategory !== "All") {
                    result = await api.getProductsByCategory(activeCategory);
                } else {
                    result = await api.getAllProducts();
                }

                setProducts((result?.products || []).map(mapProduct));
            } catch (err) {
                console.error("Failed to fetch products:", err);
                setProducts([]);
                setError(err.message || "Failed to load products.");
            } finally {
                setLoading(false);
            }
        };

        fetchProducts();
    }, [activeCategory, searchQuery]);

    const filteredProducts = useMemo(() => products, [products]);

    const handleCategoryClick = (category) => {
        const nextParams = new URLSearchParams(searchParams);

        if (category === "All") {
            nextParams.delete("category");
        } else {
            nextParams.set("category", category);
        }

        setSearchParams(nextParams);
    };

    return (
        <section className="bg-white py-20">
            <div className="mx-auto max-w-7xl px-6">
                <div className="mb-8">
                    <h1 className="text-3xl font-extrabold text-slate-900">Shop Products</h1>
                    <p className="mt-2 text-slate-600">
                        {searchQuery
                            ? `Showing results for "${searchQuery}"`
                            : activeCategory !== "All"
                              ? `Category: ${activeCategory}`
                              : "Browse products by category"}
                    </p>
                </div>

                <div className="mb-10 flex flex-wrap gap-3">
                    {categories.map((cat) => (
                        <button
                            key={cat}
                            onClick={() => handleCategoryClick(cat)}
                            className={`rounded-full px-5 py-2 text-sm font-semibold transition ${
                                activeCategory === cat && !searchQuery
                                    ? "bg-slate-900 text-white"
                                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                            }`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>

                <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                    {loading ? (
                        <div className="col-span-full py-12 text-center text-slate-600">
                            Loading products...
                        </div>
                    ) : error ? (
                        <div className="col-span-full py-12 text-center text-red-600">{error}</div>
                    ) : filteredProducts.length === 0 ? (
                        <div className="col-span-full py-12 text-center text-slate-600">
                            No products found.
                        </div>
                    ) : (
                        filteredProducts.map((product) => (
                            <div
                                key={product.id}
                                className="group cursor-pointer"
                                onClick={() => navigate(`/product/${product.id}`)}
                            >
                                <div className="relative overflow-hidden rounded-2xl bg-slate-50">
                                    <img
                                        src={product.image}
                                        alt={product.name}
                                        onError={(e) => {
                                            e.currentTarget.onerror = null;
                                            e.currentTarget.src = PRODUCT_PLACEHOLDER;
                                        }}
                                        className={`h-40 w-full object-cover transition ${
                                            product.stock === "outOfStock"
                                                ? "opacity-60 grayscale"
                                                : "group-hover:scale-105"
                                        }`}
                                    />

                                    <button
                                        disabled={product.stock === "outOfStock"}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            addToCart(product);
                                        }}
                                        className={`absolute bottom-2 left-1/2 -translate-x-1/2 rounded-full px-3 py-1.5 text-xs font-semibold transition-all ${
                                            product.stock === "outOfStock"
                                                ? "cursor-not-allowed bg-slate-300 text-slate-500"
                                                : "bg-slate-900 text-white opacity-0 group-hover:opacity-100 hover:bg-slate-800"
                                        }`}
                                    >
                                        <span className="flex items-center gap-1">
                                            <ShoppingCart className="h-3.5 w-3.5" />
                                            Add
                                        </span>
                                    </button>
                                </div>

                                <div className="mt-3 space-y-1">
                                    <h3 className="truncate text-sm font-semibold text-slate-900">
                                        {product.name}
                                    </h3>

                                    <div className="flex items-center gap-0.5">
                                        {[...Array(5)].map((_, i) => (
                                            <Star
                                                key={i}
                                                className={`h-3.5 w-3.5 ${
                                                    i < Math.floor(product.rating)
                                                        ? "fill-amber-400 text-amber-400"
                                                        : "text-slate-300"
                                                }`}
                                            />
                                        ))}
                                        <span className="ml-1 text-xs text-slate-500">
                                            {product.rating}
                                        </span>
                                    </div>

                                    <p className="text-sm font-bold text-slate-900">{product.price}</p>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </section>
    );
};

export default Shop;
