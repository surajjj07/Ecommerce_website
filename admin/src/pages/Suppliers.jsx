import { useEffect, useMemo, useState } from "react";
import { Building2, Globe, Mail, MapPin, Phone, Truck } from "lucide-react";
import { api } from "../services/api";
import { useToast } from "../context/ToastContext";

const initialForm = {
  name: "",
  companyName: "",
  email: "",
  phone: "",
  whatsappNumber: "",
  website: "",
  address: "",
  categories: "",
  shippingRegions: "",
  fulfillmentLeadTimeDays: "",
  notes: "",
  apiEnabled: false,
  apiEndpointUrl: "",
  apiCatalogEndpointUrl: "",
  apiAuthType: "none",
  apiKey: "",
  apiHeaderName: "x-api-key",
};

export default function Suppliers() {
  const { showToast } = useToast();
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [syncingSupplierId, setSyncingSupplierId] = useState("");
  const [form, setForm] = useState(initialForm);

  const fetchSuppliers = async () => {
    try {
      setLoading(true);
      const res = await api.get("/admin/suppliers?includeInactive=true");
      setSuppliers(res?.suppliers || []);
    } catch (err) {
      showToast(err.message || "Failed to load suppliers", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      setSaving(true);
      const payload = {
        ...form,
        apiIntegration: {
          enabled: form.apiEnabled,
          endpointUrl: form.apiEndpointUrl,
          catalogEndpointUrl: form.apiCatalogEndpointUrl,
          authType: form.apiAuthType,
          apiKey: form.apiKey,
          customHeaderName: form.apiHeaderName,
        },
      };

      const res = await api.post("/admin/suppliers", payload);
      if (!res?.success || !res?.supplier) {
        throw new Error(res?.message || "Failed to save supplier");
      }

      setSuppliers((prev) => [res.supplier, ...prev]);
      setForm(initialForm);
      showToast("Supplier added successfully", "success");
    } catch (err) {
      showToast(err.message || "Failed to save supplier", "error");
    } finally {
      setSaving(false);
    }
  };

  const toggleSupplier = async (supplier) => {
    try {
      const res = await api.put(`/admin/suppliers/${supplier._id}`, {
        isActive: !supplier.isActive,
      });

      if (!res?.success || !res?.supplier) {
        throw new Error(res?.message || "Failed to update supplier");
      }

      setSuppliers((prev) =>
        prev.map((item) => (item._id === supplier._id ? res.supplier : item))
      );
      showToast(
        res.supplier.isActive ? "Supplier activated" : "Supplier archived",
        "success"
      );
    } catch (err) {
      showToast(err.message || "Failed to update supplier", "error");
    }
  };

  const syncCatalog = async (supplierId) => {
    try {
      setSyncingSupplierId(supplierId);
      const res = await api.post(`/admin/suppliers/${supplierId}/catalog-sync`);
      if (!res?.success) {
        throw new Error(res?.message || "Catalog sync failed");
      }

      const summary = res.summary || {};
      showToast(
        `Catalog synced: ${summary.created || 0} created, ${summary.updated || 0} updated, ${summary.skipped || 0} skipped`,
        "success"
      );
    } catch (err) {
      showToast(err.message || "Catalog sync failed", "error");
    } finally {
      setSyncingSupplierId("");
    }
  };

  const activeSupplierCount = useMemo(
    () => suppliers.filter((supplier) => supplier.isActive).length,
    [suppliers]
  );

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-3xl border bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-6 py-8 text-white shadow-sm">
        <div className="pointer-events-none absolute -left-10 -top-16 h-48 w-48 rounded-full bg-cyan-500/30 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 right-0 h-56 w-56 rounded-full bg-emerald-500/30 blur-3xl" />

        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.3em] text-cyan-200/80">
              Dropshipping Network
            </p>
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              Supplier Management
            </h1>
            <p className="max-w-2xl text-sm text-slate-200/80 sm:text-base">
              Keep vendor contacts, lead times, shipping coverage, and sourcing
              notes in one place for faster fulfillment.
            </p>
          </div>

          <div className="rounded-2xl bg-white/10 px-5 py-4 text-center shadow-inner">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-200/70">
              Active Suppliers
            </p>
            <p className="mt-2 text-3xl font-semibold">{activeSupplierCount}</p>
            <p className="mt-2 text-xs text-cyan-100/80">
              {suppliers.length} total in your sourcing list
            </p>
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_1.4fr]">
        <form
          onSubmit={handleSubmit}
          className="rounded-3xl border bg-white p-6 shadow-sm"
        >
          <div className="flex items-start gap-3">
            <div className="rounded-2xl bg-slate-900 p-2 text-white">
              <Building2 size={18} />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                Add Supplier
              </h2>
              <p className="text-sm text-slate-500">
                Create a supplier profile for catalog mapping and order follow-up.
              </p>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field label="Supplier Name" name="name" value={form.name} onChange={handleChange} required />
            <Field label="Company Name" name="companyName" value={form.companyName} onChange={handleChange} />
            <Field label="Email" name="email" type="email" value={form.email} onChange={handleChange} />
            <Field label="Phone" name="phone" value={form.phone} onChange={handleChange} />
            <Field label="WhatsApp Number" name="whatsappNumber" value={form.whatsappNumber} onChange={handleChange} />
            <Field label="Website" name="website" value={form.website} onChange={handleChange} />
            <Field
              label="Lead Time (days)"
              name="fulfillmentLeadTimeDays"
              type="number"
              value={form.fulfillmentLeadTimeDays}
              onChange={handleChange}
            />
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4">
            <Field
              label="Categories"
              name="categories"
              value={form.categories}
              onChange={handleChange}
              placeholder="Fashion, Home Decor, Electronics"
            />
            <Field
              label="Shipping Regions"
              name="shippingRegions"
              value={form.shippingRegions}
              onChange={handleChange}
              placeholder="India, UAE, Europe"
            />
            <Textarea
              label="Address"
              name="address"
              value={form.address}
              onChange={handleChange}
              rows={3}
            />
            <Textarea
              label="Notes"
              name="notes"
              value={form.notes}
              onChange={handleChange}
              rows={4}
              placeholder="MOQ, return terms, packaging notes, preferred contact window..."
            />
          </div>

          <div className="mt-6 rounded-3xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">
                  Supplier API Integration
                </h3>
                <p className="text-xs text-slate-500">
                  Automated supplier fulfillment will call this API endpoint.
                </p>
              </div>
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  name="apiEnabled"
                  checked={form.apiEnabled}
                  onChange={handleChange}
                />
                Enable API
              </label>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
              <Field
                label="Endpoint URL"
                name="apiEndpointUrl"
                value={form.apiEndpointUrl}
                onChange={handleChange}
                placeholder="https://supplier.example.com/api/orders"
              />
              <Field
                label="Catalog Endpoint URL"
                name="apiCatalogEndpointUrl"
                value={form.apiCatalogEndpointUrl}
                onChange={handleChange}
                placeholder="https://supplier.example.com/api/products"
              />
              <label className="block">
                <span className="mb-1 block text-sm font-medium text-slate-700">
                  Auth Type
                </span>
                <select
                  name="apiAuthType"
                  value={form.apiAuthType}
                  onChange={handleChange}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-[0_8px_20px_-12px_rgba(15,23,42,0.35)] outline-none transition focus:border-slate-900 focus:ring-4 focus:ring-slate-200/60"
                >
                  <option value="none">No Auth</option>
                  <option value="bearer">Bearer Token</option>
                  <option value="x-api-key">API Key Header</option>
                </select>
              </label>
              <Field
                label="API Key / Token"
                name="apiKey"
                value={form.apiKey}
                onChange={handleChange}
              />
              <Field
                label="Header Name"
                name="apiHeaderName"
                value={form.apiHeaderName}
                onChange={handleChange}
                placeholder="x-api-key"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="mt-6 w-full rounded-2xl bg-slate-900 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60"
          >
            {saving ? "Saving..." : "Save Supplier"}
          </button>
        </form>

        <section className="rounded-3xl border bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                Supplier Directory
              </h2>
              <p className="text-sm text-slate-500">
                Vendors available for sourcing and dropship dispatch.
              </p>
            </div>
            <button
              type="button"
              onClick={fetchSuppliers}
              className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-300"
            >
              Refresh
            </button>
          </div>

          <div className="mt-6 space-y-4">
            {loading ? (
              <p className="text-sm text-slate-500">Loading suppliers...</p>
            ) : suppliers.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-sm text-slate-500">
                No suppliers added yet. Create your first supplier to start linking
                products for dropshipping.
              </div>
            ) : (
              suppliers.map((supplier) => (
                <article
                  key={supplier._id}
                  className="rounded-3xl border border-slate-200 bg-slate-50/70 p-5"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="space-y-3">
                      <div className="flex flex-wrap items-center gap-3">
                        <h3 className="text-lg font-semibold text-slate-900">
                          {supplier.name}
                        </h3>
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${
                            supplier.isActive
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-slate-200 text-slate-600"
                          }`}
                        >
                          {supplier.isActive ? "Active" : "Archived"}
                        </span>
                      </div>
                      <div className="grid gap-2 text-sm text-slate-600 sm:grid-cols-2">
                        <Info icon={<Building2 size={15} />} text={supplier.companyName || "Independent supplier"} />
                        <Info icon={<Mail size={15} />} text={supplier.email || "No email added"} />
                        <Info icon={<Phone size={15} />} text={supplier.phone || "No phone added"} />
                        <Info icon={<Phone size={15} />} text={supplier.whatsappNumber ? `WhatsApp: ${supplier.whatsappNumber}` : "No WhatsApp added"} />
                        <Info icon={<Globe size={15} />} text={supplier.website || "No website added"} />
                        <Info
                          icon={<Truck size={15} />}
                          text={`Lead time: ${supplier.fulfillmentLeadTimeDays || 0} day(s)`}
                        />
                        <Info
                          icon={<MapPin size={15} />}
                          text={
                            supplier.shippingRegions?.length
                              ? supplier.shippingRegions.join(", ")
                              : "No shipping regions added"
                          }
                        />
                      </div>
                      {supplier.apiIntegration?.enabled ? (
                        <p className="text-xs uppercase tracking-[0.18em] text-sky-600">
                          API automation enabled
                        </p>
                      ) : null}
                      {supplier.categories?.length ? (
                        <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                          Categories: {supplier.categories.join(", ")}
                        </p>
                      ) : null}
                      {supplier.notes ? (
                        <p className="rounded-2xl bg-white px-4 py-3 text-sm text-slate-600">
                          {supplier.notes}
                        </p>
                      ) : null}
                    </div>

                    <button
                      type="button"
                      onClick={() => toggleSupplier(supplier)}
                      className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400"
                    >
                      {supplier.isActive ? "Archive" : "Activate"}
                    </button>
                    <button
                      type="button"
                      onClick={() => syncCatalog(supplier._id)}
                      disabled={syncingSupplierId === supplier._id}
                      className="rounded-full border border-sky-300 px-4 py-2 text-sm font-semibold text-sky-700 transition hover:border-sky-400 disabled:opacity-60"
                    >
                      {syncingSupplierId === supplier._id ? "Syncing..." : "Sync Catalog"}
                    </button>
                  </div>
                </article>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

function Field({ label, ...props }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-slate-700">{label}</span>
      <input
        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-[0_8px_20px_-12px_rgba(15,23,42,0.35)] outline-none transition focus:border-slate-900 focus:ring-4 focus:ring-slate-200/60"
        {...props}
      />
    </label>
  );
}

function Textarea({ label, ...props }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-slate-700">{label}</span>
      <textarea
        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-[0_8px_20px_-12px_rgba(15,23,42,0.35)] outline-none transition focus:border-slate-900 focus:ring-4 focus:ring-slate-200/60"
        {...props}
      />
    </label>
  );
}

function Info({ icon, text }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-slate-400">{icon}</span>
      <span>{text}</span>
    </div>
  );
}
