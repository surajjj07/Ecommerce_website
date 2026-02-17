import { Routes, Route } from "react-router-dom";
import Navbar from "./Components/Navbar";
import Hero from "./Components/Hero";
import Bestselling from "./Components/Bestselling";
import Reviews from "./Components/Review";
import Footer from "./Components/Footer";
import Shop from "./pages/Shop";
import ProductDetail from "./pages/ProductDetail";
import Cart from "./pages/Cart";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Profile from "./pages/Profile";

const Home = () => (
  <>
    <Hero />
    <Bestselling />
    <Reviews />
  </>
);

const App = () => {
  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-[#070B1A] via-[#0B1226] to-[#0F1A2E]">
      <Navbar />

      {/* Main content grows to fill space */}
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/shop" element={<Shop />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/product/:id" element={<ProductDetail />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup/>}/>
          <Route path="/profile" element={<Profile/>}/>
        </Routes>
      </main>

      <Footer />
    </div>
  );
};

export default App
