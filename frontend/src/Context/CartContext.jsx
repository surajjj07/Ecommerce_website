import { useContext, useReducer } from "react";
import CartContext from "./CerateCartContext.js";
import { useToast } from "./ToastContext";


const cartReducer = (state, action) => {
    switch (action.type) {
        case "ADD_TO_CART": {
            const existing = state.find(
                (item) => item.id === action.payload.id
            );

            if (existing) {
                return state.map((item) =>
                    item.id === action.payload.id
                        ? { ...item, qty: item.qty + 1 }
                        : item
                );
            }

            return [...state, { ...action.payload, qty: 1 }];
        }
            
        case "DECREASE_QTY": {
            return state
                .map(item =>
                    item.id === action.payload
                        ? { ...item, qty: item.qty - 1 }
                        : item
                )
                .filter(item => item.qty > 0);
        }
          

        case "REMOVE_FROM_CART":
            return state.filter((item) => item.id !== action.payload);

        case "CLEAR_CART":
            return [];

        default:
            return state;
    }
};

export const CartProvider = ({ children }) => {
    const [cart, dispatch] = useReducer(cartReducer, []);
    const { showToast } = useToast();

    const addToCart = (product) => {
        dispatch({ type: "ADD_TO_CART", payload: product });
        showToast(`${product?.name || "Product"} added to cart`, "success");
    };

    const removeFromCart = (id) => {
        dispatch({ type: "REMOVE_FROM_CART", payload: id });
        showToast("Item removed from cart", "info");
    };

    const increaseQty = (id) => {
        dispatch({ type: "ADD_TO_CART", payload: { id } });
    };

    const decreaseQty = (id) => {
        dispatch({ type: "DECREASE_QTY", payload: id });
    };

    const clearCart = () => {
        dispatch({ type: "CLEAR_CART" });
        showToast("Cart cleared", "info");
    };
      

    return (
        <CartContext.Provider
            value={{ cart, addToCart, removeFromCart, increaseQty, decreaseQty, clearCart }}
        >
      
            {children}
        </CartContext.Provider>
    );
};

export const useCart = () => useContext(CartContext);
