const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";
const API_ORIGIN = API_BASE.replace(/\/api\/?$/, "");
export const PRODUCT_PLACEHOLDER = "https://via.placeholder.com/600x600?text=No+Image";

const normalizeImageValue = (value) => {
    if (!value) return "";
    if (typeof value === "string") return value.trim();
    if (typeof value === "object") {
        return (
            value.secure_url ||
            value.url ||
            value.path ||
            value.src ||
            ""
        );
    }
    return "";
};

export const resolveImageUrl = (value, fallback = PRODUCT_PLACEHOLDER) => {
    const raw = normalizeImageValue(value);
    if (!raw) return fallback;
    if (raw === "[object Object]" || raw.toLowerCase() === "undefined" || raw.toLowerCase() === "null") {
        return fallback;
    }

    if (/^https?:\/\//i.test(raw) || raw.startsWith("data:")) {
        return raw;
    }

    if (raw.startsWith("//")) {
        return `https:${raw}`;
    }

    const normalizedPath = raw.startsWith("/") ? raw : `/${raw}`;
    return `${API_ORIGIN}${normalizedPath}`;
};
