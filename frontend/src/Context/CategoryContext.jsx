import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { api } from "../services/api";

const fallbackCategories = [
    "Electronics",
    "Fashion",
    "Home & Kitchen",
    "Beauty & Health",
    "Sports & Fitness",
];

const CategoryContext = createContext(null);

export const CategoryProvider = ({ children }) => {
    const [categories, setCategories] = useState(fallbackCategories);

    useEffect(() => {
        const loadCategories = async () => {
            try {
                const result = await api.getAllCategories();
                const nextCategories = (result?.categories || [])
                    .map((category) => category?.name)
                    .filter(Boolean);

                if (nextCategories.length > 0) {
                    setCategories(nextCategories);
                }
            } catch {
                setCategories(fallbackCategories);
            }
        };

        loadCategories();
    }, []);

    const value = useMemo(
        () => ({
            categories,
        }),
        [categories]
    );

    return <CategoryContext.Provider value={value}>{children}</CategoryContext.Provider>;
};

export const useCategories = () => {
    const context = useContext(CategoryContext);
    if (!context) {
        throw new Error("useCategories must be used inside CategoryProvider");
    }
    return context;
};
