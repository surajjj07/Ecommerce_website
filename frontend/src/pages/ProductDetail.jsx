import { useParams } from "react-router-dom";
import { Star, ShoppingCart } from "lucide-react";
import { useState, useEffect } from "react";
import { useCart } from "../Context/CartContext";
import { api } from "../services/api";

const ProductDetail = () => {
    const { id } = useParams();
    const { addToCart } = useCart();

    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedImage, setSelectedImage] = useState(0);

    useEffect(() => {
        const fetchProduct = async () => {
            try {
                const result = await api.getProductById(id);

                if (result?.product) {
                    setProduct({
                        id: result.product._id,
                        name: result.product.name,
                        price: `₹${result.product.price}`,
                        rating: 4.5,
                        stock:
                            result.product.stock === 0
                                ? "outOfStock"
                                : result.product.stock < 5
                                    ? "limited"
                                    : "inStock",
                        description: result.product.description,
                        images:
                            result.product.images?.length > 0
                                ? result.product.images
                                : ["https://via.placeholder.com/500"],
                    });
                }
            } catch (error) {
                console.error("Failed to fetch product:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchProduct();
    }, [id]);

    if (loading) {
        return <div className="py-32 text-center">Loading product...</div>;
    }

    if (!product) {
        return <div className="py-32 text-center">Product not found</div>;
    }

    const handleAddToCart = () => {
        addToCart({
            id: product.id,
            name: product.name,
            price: product.price,
            image: product.images[0],
        });
    };

    return (
        <section className="bg-white py-20">
            <div className="max-w-7xl mx-auto px-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-16">

                    {/* IMAGE GALLERY */}
                    <div>
                        <div className="bg-gray-50 rounded-3xl overflow-hidden mb-6">
                            <img
                                src={product.images[selectedImage]}
                                alt={product.name}
                                className="w-full h-[420px] object-cover"
                            />
                        </div>

                        <div className="flex gap-4">
                            {product.images.map((img, index) => (
                                <img
                                    key={index}
                                    src={img}
                                    alt="thumbnail"
                                    onClick={() => setSelectedImage(index)}
                                    className={`w-20 h-20 object-cover rounded-xl cursor-pointer border ${selectedImage === index
                                            ? "border-indigo-600"
                                            : "border-gray-200"
                                        }`}
                                />
                            ))}
                        </div>
                    </div>

                    {/* PRODUCT INFO */}
                    <div>
                        <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900">
                            {product.name}
                        </h1>

                        {/* Rating */}
                        <div className="flex items-center gap-1 mt-4">
                            {[...Array(5)].map((_, i) => (
                                <Star
                                    key={i}
                                    className={`h-5 w-5 ${i < Math.floor(product.rating)
                                            ? "fill-yellow-400 text-yellow-400"
                                            : "text-gray-300"
                                        }`}
                                />
                            ))}
                            <span className="ml-2 text-sm text-gray-600">
                                {product.rating} rating
                            </span>
                        </div>

                        {/* Price */}
                        <p className="mt-6 text-2xl font-bold text-indigo-600">
                            {product.price}
                        </p>

                        {/* Stock */}
                        <p
                            className={`mt-2 text-sm font-semibold ${product.stock === "outOfStock"
                                    ? "text-red-600"
                                    : product.stock === "limited"
                                        ? "text-yellow-600"
                                        : "text-green-600"
                                }`}
                        >
                            {product.stock === "limited"
                                ? "Limited Stock Available"
                                : product.stock === "outOfStock"
                                    ? "Out of Stock"
                                    : "In Stock"}
                        </p>

                        {/* Description */}
                        <p className="mt-6 text-gray-700 leading-relaxed">
                            {product.description}
                        </p>

                        {/* Add to Cart */}
                        <button
                            disabled={product.stock === "outOfStock"}
                            onClick={handleAddToCart}
                            className={`mt-10 px-8 py-3 rounded-full text-sm font-semibold flex items-center gap-2 ${product.stock === "outOfStock"
                                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                                    : "bg-indigo-600 text-white hover:bg-indigo-700"
                                }`}
                        >
                            <ShoppingCart className="h-5 w-5" />
                            Add to Cart
                        </button>
                    </div>

                </div>
            </div>
        </section>
    );
};

export default ProductDetail;
