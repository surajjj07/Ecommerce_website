import { useState, useEffect } from "react";
import { Star, ShoppingCart } from "lucide-react";
import { useCart } from "../Context/CartContext";
import { useNavigate } from "react-router-dom";
import { api } from "../services/api";

const categories = ["All", "Electronics", "Fashion", "Shoes", "Accessories"];

const Shop = () => {
    const [activeCategory, setActiveCategory] = useState("All");
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);

    const { addToCart } = useCart();
    const navigate = useNavigate();

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const result = await api.getAllProducts();
                if (result?.products) {
                    setProducts(
                        result.products.map((product) => ({
                            id: product._id,
                            name: product.name,
                            price: `₹${product.price}`,
                            rating: 4.5,
                            stock: product.stock > 0 ? "inStock" : "outOfStock",
                            category: product.category,
                            image:
                                product.images?.[0] ||
                                "https://via.placeholder.com/300",
                        }))
                    );
                }
            } catch (err) {
                console.error("Failed to fetch products:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchProducts();
    }, []);

    const filteredProducts =
        activeCategory === "All"
            ? products
            : products.filter((p) => p.category === activeCategory);

    return (
        <section className="bg-white py-20">
            <div className="max-w-7xl mx-auto px-6">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-extrabold text-gray-900">
                        Shop Products
                    </h1>
                    <p className="mt-2 text-gray-600">
                        Browse products by category
                    </p>
                </div>

                {/* Categories */}
                <div className="flex flex-wrap gap-3 mb-10">
                    {categories.map((cat) => (
                        <button
                            key={cat}
                            onClick={() => setActiveCategory(cat)}
                            className={`px-5 py-2 rounded-full text-sm font-semibold transition ${activeCategory === cat
                                    ? "bg-indigo-600 text-white"
                                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                                }`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>

                {/* Products */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                    {loading ? (
                        <div className="col-span-full text-center py-12 text-gray-600">
                            Loading products...
                        </div>
                    ) : filteredProducts.length === 0 ? (
                        <div className="col-span-full text-center py-12 text-gray-600">
                            No products found.
                        </div>
                    ) : (
                        filteredProducts.map((product) => (
                            <div
                                key={product.id}
                                className="group cursor-pointer"
                                onClick={() => navigate(`/product/${product.id}`)}
                            >
                                {/* Image */}
                                <div className="relative bg-gray-50 rounded-2xl overflow-hidden">
                                    <img
                                        src={product.image}
                                        alt={product.name}
                                        className={`w-full h-40 object-cover transition ${product.stock === "outOfStock"
                                                ? "grayscale opacity-60"
                                                : "group-hover:scale-105"
                                            }`}
                                    />

                                    {/* Add to cart */}
                                    <button
                                        disabled={product.stock === "outOfStock"}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            addToCart(product);
                                        }}
                                        className={`absolute bottom-2 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1 transition-all ${product.stock === "outOfStock"
                                                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                                                : "bg-indigo-600 text-white opacity-0 group-hover:opacity-100 hover:bg-indigo-700"
                                            }`}
                                    >
                                        <ShoppingCart className="h-3.5 w-3.5" />
                                        Add
                                    </button>
                                </div>

                                {/* Info */}
                                <div className="mt-3 space-y-1">
                                    <h3 className="text-sm font-semibold text-gray-900 truncate">
                                        {product.name}
                                    </h3>

                                    <div className="flex items-center gap-0.5">
                                        {[...Array(5)].map((_, i) => (
                                            <Star
                                                key={i}
                                                className={`h-3.5 w-3.5 ${i < Math.floor(product.rating)
                                                        ? "fill-yellow-400 text-yellow-400"
                                                        : "text-gray-300"
                                                    }`}
                                            />
                                        ))}
                                        <span className="ml-1 text-xs text-gray-500">
                                            {product.rating}
                                        </span>
                                    </div>

                                    <p className="text-sm font-bold text-indigo-600">
                                        {product.price}
                                    </p>
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
