// API service for backend communication
const API_BASE = 'http://localhost:5000/api';

export const api = {
    // Products
    getAllProducts: () => fetch(`${API_BASE}/products/all`).then(res => res.json()),
    getProductById: (id) => fetch(`${API_BASE}/products/${id}`).then(res => res.json()),
    getProductsByCategory: (category) => fetch(`${API_BASE}/products/category/${category}`).then(res => res.json()),
    searchProducts: (query) => fetch(`${API_BASE}/products/search?q=${query}`).then(res => res.json()),

    // Orders
    createOrder: (orderData) => fetch(`${API_BASE}/orders/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(orderData)
    }).then(res => res.json()),

    getUserOrders: () => fetch(`${API_BASE}/orders/my-orders`, {
        credentials: 'include'
    }).then(res => res.json())
};