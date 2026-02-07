import { useEffect, useMemo, useState } from "react";
import {
  Upload,
  X,
  Tag,
  Package,
  Sparkles,
  BadgePercent,
  Boxes,
} from "lucide-react";
import { api } from "../services/api";

const AVAILABLE_SIZES = ["XS", "S", "M", "L", "XL", "XXL"];

export default function AddProduct() {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [categoryInput, setCategoryInput] = useState("");
  const [addingCategory, setAddingCategory] = useState(false);

  const [form, setForm] = useState({
    name: "",
    sku: "",
    category: "",
    description: "",
    price: "",
    discountPrice: "",
    stock: "",
    sizes: [],
    featured: false,
    bestseller: false,
  });

  /* ---------- handlers ---------- */
  const fetchCategories = async () => {
    try {
      const res = await api.get("/categories/all");
      setCategories(res?.categories || []);
    } catch (err) {
      alert(err.message || "Failed to load categories");
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const toggleSize = (size) => {
    setForm((prev) => ({
      ...prev,
      sizes: prev.sizes.includes(size)
        ? prev.sizes.filter((s) => s !== size)
        : [...prev.sizes, size],
    }));
  };

  const handleImages = (e) => {
    setImages((prev) => [...prev, ...Array.from(e.target.files)]);
  };

  const removeImage = (index) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!form.category) {
        throw new Error("Please select a category");
      }

      const formData = new FormData();

      Object.entries(form).forEach(([key, value]) => {
        if (Array.isArray(value)) {
          value.forEach((v) => formData.append(key, v));
        } else {
          formData.append(key, value);
        }
      });

      images.forEach((file) => {
        formData.append("images", file);
      });

      const res = await api.post("/products/add", formData);

      if (!res?.success) {
        throw new Error(res?.message || "Product creation failed");
      }

      alert("✅ Product added successfully");

      // reset form
      setForm({
        name: "",
        sku: "",
        category: "",
        description: "",
        price: "",
        discountPrice: "",
        stock: "",
        sizes: [],
        featured: false,
        bestseller: false,
      });
      setImages([]);
    } catch (err) {
      alert(err.message || "Product creation failed");
    } finally {
      setLoading(false);
    }
  };

  const handleAddCategory = async () => {
    const name = categoryInput.trim();
    if (!name) {
      alert("Please enter a category name");
      return;
    }

    try {
      setAddingCategory(true);
      const res = await api.post("/categories/add", { name });

      if (!res?.success || !res?.category) {
        throw new Error(res?.message || "Failed to add category");
      }

      const nextCategories = [...categories, res.category].sort((a, b) =>
        a.name.localeCompare(b.name)
      );
      setCategories(nextCategories);
      setForm((prev) => ({ ...prev, category: res.category.name }));
      setCategoryInput("");
    } catch (err) {
      alert(err.message || "Failed to add category");
    } finally {
      setAddingCategory(false);
    }
  };

  const pricingPreview = useMemo(() => {
    const price = Number(form.price || 0);
    const discount = Number(form.discountPrice || 0);
    const displayDiscount = discount > 0 && discount < price;
    const effective = displayDiscount ? discount : price;
    const percentOff =
      displayDiscount && price > 0
        ? Math.round(((price - discount) / price) * 100)
        : 0;

    return {
      effective,
      displayDiscount,
      percentOff,
    };
  }, [form.price, form.discountPrice]);

  /* ---------- UI ---------- */

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6">
      <section className="relative overflow-hidden rounded-3xl border bg-gradient-to-br from-amber-50 via-white to-sky-50 px-6 py-8 shadow-sm">
        <div className="pointer-events-none absolute -left-12 -top-12 h-40 w-40 rounded-full bg-amber-200/50 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 right-0 h-56 w-56 rounded-full bg-sky-200/50 blur-3xl" />

        <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/70 px-4 py-1 text-xs uppercase tracking-[0.2em] text-amber-700">
              <Sparkles size={14} />
              New Inventory Drop
            </div>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
              Add Product
            </h1>
            <p className="max-w-xl text-sm text-slate-600 sm:text-base">
              Launch a polished product page with pricing, sizes, and visuals in
              one clean flow.
            </p>
          </div>

          <div className="rounded-2xl border bg-white/70 px-5 py-4 shadow-sm">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
              Price Preview
            </p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">
              ₹{pricingPreview.effective.toLocaleString("en-IN")}
            </p>
            {pricingPreview.displayDiscount ? (
              <div className="mt-2 inline-flex items-center gap-2 rounded-full bg-amber-100 px-3 py-1 text-xs text-amber-700">
                <BadgePercent size={14} />
                {pricingPreview.percentOff}% off
              </div>
            ) : (
              <div className="mt-2 inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600">
                <Tag size={14} />
                No discount applied
              </div>
            )}
          </div>
        </div>
      </section>

      <form
        onSubmit={handleSubmit}
        className="grid grid-cols-1 gap-6 lg:grid-cols-3"
      >
        {/* Left */}
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-3xl border bg-white p-6 shadow-sm">
            <SectionHeader
              icon={<Package size={18} />}
              title="Product details"
              subtitle="Give the essentials that appear on the product card."
            />
            <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
              <Input
                label="Product Name"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Studio cotton shirt"
              />
              <Input
                label="SKU"
                name="sku"
                value={form.sku}
                onChange={handleChange}
                placeholder="STU-CL-092"
              />
            </div>

            <div className="mt-4 space-y-3">
              <label className="block">
                <span className="label">Category</span>
                <select
                  name="category"
                  value={form.category}
                  onChange={handleChange}
                  className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-[0_8px_20px_-12px_rgba(15,23,42,0.35)] outline-none transition focus:border-slate-900 focus:ring-4 focus:ring-slate-200/60"
                >
                  <option value="">Select category</option>
                  {categories.map((cat) => (
                    <option key={cat._id} value={cat.name}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </label>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={categoryInput}
                  onChange={(e) => setCategoryInput(e.target.value)}
                  placeholder="Add new category"
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-[0_8px_20px_-12px_rgba(15,23,42,0.35)] outline-none transition focus:border-slate-900 focus:ring-4 focus:ring-slate-200/60"
                />
                <button
                  type="button"
                  disabled={addingCategory}
                  onClick={handleAddCategory}
                  className="rounded-2xl border border-slate-900 px-4 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-900 hover:text-white disabled:opacity-60"
                >
                  {addingCategory ? "Adding..." : "Add"}
                </button>
              </div>
            </div>

            <div className="mt-4">
              <Textarea
                label="Description"
                name="description"
                value={form.description}
                onChange={handleChange}
                placeholder="Describe material, fit, and standout features."
              />
            </div>
          </div>

          <div className="rounded-3xl border bg-white p-6 shadow-sm">
            <SectionHeader
              icon={<BadgePercent size={18} />}
              title="Pricing & stock"
              subtitle="Set the base price, optional discount, and availability."
            />

            <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
              <Input
                label="Price (₹)"
                name="price"
                type="number"
                value={form.price}
                onChange={handleChange}
              />
              <Input
                label="Discount Price (₹)"
                name="discountPrice"
                type="number"
                value={form.discountPrice}
                onChange={handleChange}
              />
              <Input
                label="Stock"
                name="stock"
                type="number"
                value={form.stock}
                onChange={handleChange}
              />
            </div>

            <div className="mt-6">
              <label className="label mb-2 block">Available Sizes</label>
              <div className="flex flex-wrap gap-3">
                {AVAILABLE_SIZES.map((size) => (
                  <button
                    key={size}
                    type="button"
                    onClick={() => toggleSize(size)}
                    className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                      form.sizes.includes(size)
                        ? "border-slate-900 bg-slate-900 text-white"
                        : "bg-white text-slate-700 hover:border-slate-400"
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-6">
              <Checkbox
                label="Featured"
                name="featured"
                checked={form.featured}
                onChange={handleChange}
              />
              <Checkbox
                label="Bestseller"
                name="bestseller"
                checked={form.bestseller}
                onChange={handleChange}
              />
            </div>
          </div>
        </div>

        {/* Right */}
        <div className="space-y-6">
          <div className="rounded-3xl border bg-white p-6 shadow-sm">
            <SectionHeader
              icon={<Upload size={18} />}
              title="Product images"
              subtitle="Add crisp visuals to make the product stand out."
            />

            <div className="mt-5 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/60 p-6 text-center">
              <Upload className="mx-auto text-slate-400" />
              <p className="mt-2 text-sm text-slate-500">
                Drag and drop or upload multiple images.
              </p>

              <input
                id="images"
                type="file"
                multiple
                accept="image/*"
                onChange={handleImages}
                className="hidden"
              />
              <label
                htmlFor="images"
                className="mt-3 inline-flex cursor-pointer items-center justify-center rounded-full border border-slate-900 px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-slate-900 hover:text-white"
              >
                Browse files
              </label>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-3">
              {images.map((file, index) => (
                <div key={index} className="group relative">
                  <img
                    src={URL.createObjectURL(file)}
                    alt="preview"
                    className="h-24 w-full rounded-xl border object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute right-1 top-1 hidden rounded-full bg-black/70 p-1 text-white group-hover:block"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border bg-white p-6 shadow-sm">
            <SectionHeader
              icon={<Boxes size={18} />}
              title="Publishing"
              subtitle="Review and send the product live."
            />
            <div className="mt-5 space-y-3">
              <div className="rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                Tip: Add at least 3 images and one size for better conversion.
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-2xl bg-slate-900 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60"
              >
                {loading ? "Saving..." : "Publish Product"}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}

/* ---------- UI helpers ---------- */

function SectionHeader({ icon, title, subtitle }) {
  return (
    <div className="flex items-start gap-3">
      <div className="rounded-2xl bg-slate-900 p-2 text-white">{icon}</div>
      <div>
        <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
        <p className="text-sm text-slate-500">{subtitle}</p>
      </div>
    </div>
  );
}

function Input({ label, ...props }) {
  return (
    <label className="block">
      <span className="label">{label}</span>
      <input
        type="text"
        className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-[0_8px_20px_-12px_rgba(15,23,42,0.35)] outline-none transition focus:border-slate-900 focus:ring-4 focus:ring-slate-200/60"
        {...props}
      />
    </label>
  );
}

function Textarea({ label, ...props }) {
  return (
    <label className="block">
      <span className="label">{label}</span>
      <textarea
        className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-[0_8px_20px_-12px_rgba(15,23,42,0.35)] outline-none transition focus:border-slate-900 focus:ring-4 focus:ring-slate-200/60"
        rows={4}
        {...props}
      />
    </label>
  );
}

function Checkbox({ label, ...props }) {
  return (
    <label className="flex items-center gap-2">
      <input type="checkbox" className="accent-slate-900" {...props} />
      <span className="text-sm text-slate-700">{label}</span>
    </label>
  );
}
