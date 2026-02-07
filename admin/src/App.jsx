import { Routes, Route, Navigate } from "react-router-dom";
import { useContext } from "react";

import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import AddProduct from "./pages/Addproduct";
import Order from "./pages/Order";
import Setting from "./pages/Setting";
import Profile from "./pages/Profile";
import AdminLogin from "./pages/AdminLogin";
import AdminSignup from "./pages/AdminSignup";

import AuthContext from "./context/CreateAuthContext";

function ProtectedRoute({ children }) {
  const auth = useContext(AuthContext);

  if (!auth) {
    throw new Error("AuthContext is undefined. Check AuthProvider wrapping.");
  }

  const { admin, loading } = auth;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading...
      </div>
    );
  }

  return admin ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<AdminLogin />} />
      <Route path="/signup" element={<AdminSignup />} />

      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="add-product" element={<AddProduct />} />
        <Route path="orders" element={<Order />} />
        <Route path="settings" element={<Setting />} />
        <Route path="profile" element={<Profile />} />
      </Route>
    </Routes>
  );
}
