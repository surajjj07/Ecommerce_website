import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "./index.css";
import { CartProvider } from "./Context/CartContext";
import { AuthProvider } from "./Context/AuthContext"
import { ToastProvider } from "./Context/ToastContext";
import { CategoryProvider } from "./Context/CategoryContext";
ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ToastProvider>
      <AuthProvider>
        <CategoryProvider>
          <CartProvider>
            <BrowserRouter>
              <App />
            </BrowserRouter>
          </CartProvider>
        </CategoryProvider>
      </AuthProvider>
    </ToastProvider>
  </React.StrictMode>
);
