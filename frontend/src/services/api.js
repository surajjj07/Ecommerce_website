const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

const request = async (path, options = {}) => {
    const response = await fetch(`${API_BASE}${path}`, options);
    const data = await response.json();

    if (!response.ok) {
        const message = data?.message || data?.error || "API request failed";
        throw new Error(message);
    }

    return data;
};

export const api = {
    getAllProducts: () => request("/products/all"),
    getProductById: (id) => request(`/products/${id}`),
    getProductsByCategory: (category) =>
        request(`/products/category/${encodeURIComponent(category)}`),
    searchProducts: (query) =>
        request(`/products/search?q=${encodeURIComponent(query)}`),

    createOrder: (orderData) =>
        request("/orders/create", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify(orderData),
        }),
    createPaymentOrder: (orderData) =>
        request("/orders/payment/create-order", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify(orderData),
        }),
    verifyPaymentAndCreateOrder: (paymentData) =>
        request("/orders/payment/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify(paymentData),
        }),

    getUserOrders: () =>
        request("/orders/my-orders", {
            credentials: "include",
        }),
};
