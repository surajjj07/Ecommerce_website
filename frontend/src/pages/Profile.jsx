import { User, ShoppingBag, LogOut, Camera } from "lucide-react";
import { useAuth } from "../Context/AuthContext";
import { useNavigate } from "react-router-dom";
import { useRef, useState, useEffect } from "react";
import { api } from "../services/api";

const Profile = () => {
    const { user, logout, setProfilePic } = useAuth();
    const navigate = useNavigate();
    const fileInputRef = useRef(null);
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchOrders = async () => {
            try {
                const result = await api.getUserOrders();
                if (result.orders) {
                    setOrders(result.orders);
                }
            } catch (error) {
                console.error("Failed to fetch orders:", error);
            } finally {
                setLoading(false);
            }
        };

        if (user) {
            fetchOrders();
        }
    }, [user]);

    if (!user) {
        navigate("/login");
        return null;
    }

    const handleAvatarChange = () => {
        fileInputRef.current.click();
    };

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (file) {
            await setProfilePic(file);
        }
    };

    return (
        <section className="bg-white min-h-screen pt-16 pb-12 md:pt-24 md:pb-20">
            <div className="max-w-4xl mx-auto px-6">

                {/* Header */}
                <div className="flex flex-col sm:flex-row items-center gap-8 mb-12">
                    <div className="relative">
                        <img
                            src={user.profilePic || "https://via.placeholder.com/150"}
                            alt={user.name}
                            className="w-28 h-28 rounded-full object-cover border"
                        />

                        <button
                            onClick={handleAvatarChange}
                            className="
                absolute bottom-1 right-1
                bg-indigo-600 text-white
                p-2 rounded-full
                hover:bg-indigo-700
                shadow
              "
                        >
                            <Camera className="h-4 w-4" />
                        </button>
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            accept="image/*"
                            className="hidden"
                        />
                    </div>

                    <div className="text-center sm:text-left">
                        <h1 className="text-2xl font-extrabold text-gray-900">
                            {user.name}
                        </h1>
                        <p className="text-gray-600 mt-1">{user.email}</p>
                    </div>
                </div>

                {/* Account Actions */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">

                    {/* Orders */}
                    <button
                        onClick={() => navigate("/orders")}
                        className="
              flex items-center gap-4
              p-6 rounded-2xl
              bg-gray-50 hover:bg-indigo-50
              border transition
            "
                    >
                        <ShoppingBag className="h-6 w-6 text-indigo-600" />
                        <div className="text-left">
                            <p className="font-semibold text-gray-900">
                                Track Orders
                            </p>
                            <p className="text-sm text-gray-600">
                                View your order history & status
                            </p>
                        </div>
                    </button>

                    {/* Edit Profile */}
                    <button
                        onClick={() => navigate("/profile/edit")}
                        className="
              flex items-center gap-4
              p-6 rounded-2xl
              bg-gray-50 hover:bg-indigo-50
              border transition
            "
                    >
                        <User className="h-6 w-6 text-indigo-600" />
                        <div className="text-left">
                            <p className="font-semibold text-gray-900">
                                Edit Profile
                            </p>
                            <p className="text-sm text-gray-600">
                                Update personal information
                            </p>
                        </div>
                    </button>

                </div>

                {/* Order History */}
                <div className="mt-12">
                    <h2 className="text-xl font-bold text-gray-900 mb-6">Order History</h2>
                    {loading ? (
                        <p>Loading orders...</p>
                    ) : orders.length === 0 ? (
                        <p className="text-gray-600">No orders found.</p>
                    ) : (
                        <div className="space-y-4">
                            {orders.map((order) => (
                                <div key={order._id} className="bg-gray-50 rounded-2xl p-6">
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <p className="font-semibold text-gray-900">
                                                Order #{order._id.slice(-8)}
                                            </p>
                                            <p className="text-sm text-gray-600">
                                                {new Date(order.createdAt).toLocaleDateString()}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-semibold text-gray-900">
                                                ₹{order.totalAmount.toLocaleString()}
                                            </p>
                                            <p className={`text-sm ${
                                                order.status === 'delivered' ? 'text-green-600' :
                                                order.status === 'pending' ? 'text-yellow-600' :
                                                'text-blue-600'
                                            }`}>
                                                {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        {(order.items || []).map((item, index) => (
                                            <div key={index} className="flex justify-between text-sm">
                                                <span>{item.product?.name || 'Product'} x{item.quantity}</span>
                                                <span>₹{(item.price * item.quantity).toLocaleString()}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Logout */}
                <div className="mt-12">
                    <button
                        onClick={logout}
                        className="
              w-full sm:w-auto
              px-6 py-3
              rounded-full
              border border-red-500
              text-red-600 font-semibold
              hover:bg-red-50
              transition
            "
                    >
                        <LogOut className="inline h-4 w-4 mr-2" />
                        Logout
                    </button>
                </div>

            </div>
        </section>
    );
};

export default Profile;
