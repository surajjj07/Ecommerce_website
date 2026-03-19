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
import Orders from "./pages/Orders";
import Contact from "./pages/Contact";
import Faq from "./pages/Faq";
import Shipping from "./pages/Shipping";
import Returns from "./pages/Returns";
import Terms from "./pages/Terms";

const Home = () => (
  <div className="relative overflow-hidden">
    <div className="pointer-events-none absolute inset-x-0 top-0 h-[34rem] bg-[radial-gradient(circle_at_top,_rgba(251,191,36,0.18),_transparent_48%)]" />
    <div className="pointer-events-none absolute left-[-12rem] top-[28rem] h-[28rem] w-[28rem] rounded-full bg-cyan-400/10 blur-[150px]" />
    <div className="pointer-events-none absolute right-[-8rem] top-[62rem] h-[24rem] w-[24rem] rounded-full bg-amber-300/10 blur-[140px]" />

    <div className="relative">
      <Hero />
      <Bestselling />
      <Reviews />
    </div>
  </div>
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
          <Route path="/orders" element={<Orders />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/faqs" element={<Faq />} />
          <Route path="/shipping" element={<Shipping />} />
          <Route path="/returns" element={<Returns />} />
          <Route path="/terms" element={<Terms />} />
        </Routes>
      </main>

      <Footer />
    </div>
  );
};

export default App
