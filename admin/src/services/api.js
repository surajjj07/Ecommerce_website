import axios from "axios";

// ================================
// AXIOS INSTANCE
// ================================
const API_BASE =import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export const api = axios.create({
    baseURL: API_BASE,
    withCredentials: true, // IMPORTANT for cookies
    headers: {
        "Content-Type": "application/json"
    }
});

// ================================
// RESPONSE / ERROR HANDLING
// ================================
api.interceptors.response.use(
    (response) => response.data,
    (error) => {
        const message =
            error?.response?.data?.message ||
            error.message ||
            "Something went wrong";

        return Promise.reject(new Error(message));
    }
);

// ================================
// ADMIN AUTH APIs
// ================================

// export const login = async (data) => {
//     try {
//         let response = await api.post("/admin/login", data);
//     } catch (error) {
        
//     }
// }

export const adminApi = {
    login: (data) =>
        api.post("/admin/login", data),

    signup: (data) =>
        api.post("/admin/signup", data),

    logout: () =>
        api.post("/admin/logout"),

    getProfile: () =>
        api.get("/admin/profile"),

    updateProfile: (data) =>
        api.put("/admin/profile", data),

    updateProfilePic: (formData) =>
        api.post("/admin/set-profile-pic", formData, {
            headers: {
                "Content-Type": "multipart/form-data"
            }
        }),
};

// ================================
// PRODUCT APIs
// ================================
export const productApi = {
    getAllProducts: () =>
        api.get("/products"),

    getProductById: (id) =>
        api.get(`/products/${id}`),

    createProduct: (formData) =>
        api.post("/products", formData, {
            headers: {
                "Content-Type": "multipart/form-data"
            }
        }),

    updateProduct: (id, formData) =>
        api.put(`/products/${id}`, formData, {
            headers: {
                "Content-Type": "multipart/form-data"
            }
        }),

    deleteProduct: (id) =>
        api.delete(`/products/${id}`)
};

// ================================
// ORDER APIs
// ================================
export const orderApi = {
    getAllOrders: () =>
        api.get("/orders"),

    getOrderById: (id) =>
        api.get(`/orders/${id}`),

    updateOrderStatus: (id, status) =>
        api.put(`/orders/${id}/status`, { status }),

    deleteOrder: (id) =>
        api.delete(`/orders/${id}`)
};
