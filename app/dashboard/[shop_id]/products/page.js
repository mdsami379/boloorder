"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

const EMPTY_FORM = {
  product_name: "",
  price: "",
  stock: "",
  category: "",
  image_url: "",
};

export default function ShopProductsPage({ params }) {
  const shopId = params.shop_id;
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(null); // product row being edited
  const [toast, setToast] = useState("");

  async function loadProducts() {
    setLoading(true);
    const { data } = await supabase
      .from("products")
      .select("*")
      .eq("shop_id", shopId)
      .order("id", { ascending: true });
    setProducts(data || []);
    setLoading(false);
  }

  useEffect(() => {
    if (shopId) loadProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shopId]);

  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(""), 3500);
  }

  function handleChange(e) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  }

  async function handleAdd(e) {
    e.preventDefault();
    setSaving(true);
    const { error } = await supabase.from("products").insert({
      shop_id: shopId,
      product_name: form.product_name.trim(),
      price: Number(form.price) || 0,
      stock: Number(form.stock) || 0,
      category: form.category.trim() || null,
      image_url: form.image_url.trim() || null,
      is_available: true,
    });
    setSaving(false);
    if (error) {
      showToast("Could not add product.");
      return;
    }
    setForm(EMPTY_FORM);
    showToast("Product added.");
    loadProducts();
  }

  async function handleUpdate(e) {
    e.preventDefault();
    const { error } = await supabase
      .from("products")
      .update({
        product_name: editing.product_name.trim(),
        price: Number(editing.price) || 0,
        stock: Number(editing.stock) || 0,
        category: editing.category?.trim() || null,
        image_url: editing.image_url?.trim() || null,
      })
      .eq("id", editing.id)
      .eq("shop_id", shopId);
    if (error) {
      showToast("Could not update product.");
      return;
    }
    setEditing(null);
    showToast("Product updated.");
    loadProducts();
  }

  async function handleDelete(id) {
    if (!window.confirm("Delete this product? This cannot be undone.")) return;
    const { error } = await supabase
      .from("products")
      .delete()
      .eq("id", id)
      .eq("shop_id", shopId);
    if (error) {
      showToast("Could not delete product.");
      return;
    }
    showToast("Product deleted.");
    loadProducts();
  }

  async function handleToggle(p) {
    const { error } = await supabase
      .from("products")
      .update({ is_available: !p.is_available })
      .eq("id", p.id)
      .eq("shop_id", shopId);
    if (error) {
      showToast("Could not update availability.");
      return;
    }
    setProducts((list) =>
      list.map((x) => (x.id === p.id ? { ...x, is_available: !p.is_available } : x))
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">
          Products <span className="text-base font-normal text-slate-400">— پروڈکٹس</span>
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Your menu — the AI voice agent reads from this list when customers call.
        </p>
      </div>

      {/* Add product */}
      <div className="card mb-6">
        <h2 className="mb-4 text-lg font-semibold text-slate-900">Add Product</h2>
        <form onSubmit={handleAdd} className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <label className="label">Product Name</label>
            <input name="product_name" required className="input" placeholder="Zinger Burger"
              value={form.product_name} onChange={handleChange} />
          </div>
          <div>
            <label className="label">Price (Rs)</label>
            <input name="price" type="number" min="0" required className="input" placeholder="450"
              value={form.price} onChange={handleChange} />
          </div>
          <div>
            <label className="label">Stock</label>
            <input name="stock" type="number" min="0" className="input" placeholder="20"
              value={form.stock} onChange={handleChange} />
          </div>
          <div>
            <label className="label">Category</label>
            <input name="category" className="input" placeholder="Burgers"
              value={form.category} onChange={handleChange} />
          </div>
          <div className="sm:col-span-2">
            <label className="label">Image URL</label>
            <input name="image_url" className="input" placeholder="https://..."
              value={form.image_url} onChange={handleChange} />
          </div>
          <div className="sm:col-span-2 lg:col-span-3">
            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? "Adding…" : "Add Product"}
            </button>
          </div>
        </form>
      </div>

      {/* Table */}
      <div className="table-wrap">
        <table className="w-full">
          <thead>
            <tr>
              <th className="th">Product</th>
              <th className="th">Category</th>
              <th className="th">Price</th>
              <th className="th">Stock</th>
              <th className="th">Available</th>
              <th className="th">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td className="td" colSpan={6}>Loading…</td></tr>
            ) : products.length === 0 ? (
              <tr><td className="td" colSpan={6}>No products yet. Add your first item above.</td></tr>
            ) : (
              products.map((p) => (
                <tr key={p.id}>
                  <td className="td">
                    <div className="flex items-center gap-3">
                      {p.image_url && (
                        <img src={p.image_url} alt={p.product_name}
                          className="h-10 w-10 rounded-lg object-cover" />
                      )}
                      <span className="font-medium">{p.product_name}</span>
                    </div>
                  </td>
                  <td className="td">{p.category || "—"}</td>
                  <td className="td">Rs {Number(p.price || 0).toLocaleString()}</td>
                  <td className="td">{p.stock ?? 0}</td>
                  <td className="td">
                    <button
                      onClick={() => handleToggle(p)}
                      role="switch"
                      aria-checked={!!p.is_available}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
                        p.is_available ? "bg-brand-600" : "bg-slate-300"
                      }`}
                      title="When off, the AI voice agent will say this item is out of stock."
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                          p.is_available ? "translate-x-6" : "translate-x-1"
                        }`}
                      />
                    </button>
                    <p className="mt-1 max-w-[180px] text-xs text-slate-400">
                      When off, the AI voice agent will say this item is out of stock.
                    </p>
                  </td>
                  <td className="td">
                    <div className="flex gap-2">
                      <button onClick={() => setEditing({ ...p })} className="btn-secondary !px-3 !py-1.5 !text-xs">
                        Edit
                      </button>
                      <button onClick={() => handleDelete(p.id)} className="btn-danger !px-3 !py-1.5 !text-xs">
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Edit modal */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4">
          <div className="card w-full max-w-lg">
            <h2 className="mb-4 text-lg font-semibold text-slate-900">Edit Product</h2>
            <form onSubmit={handleUpdate} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="label">Product Name</label>
                <input name="product_name" required className="input"
                  value={editing.product_name || ""}
                  onChange={(e) => setEditing({ ...editing, product_name: e.target.value })} />
              </div>
              <div>
                <label className="label">Price (Rs)</label>
                <input name="price" type="number" min="0" required className="input"
                  value={editing.price ?? ""}
                  onChange={(e) => setEditing({ ...editing, price: e.target.value })} />
              </div>
              <div>
                <label className="label">Stock</label>
                <input name="stock" type="number" min="0" className="input"
                  value={editing.stock ?? ""}
                  onChange={(e) => setEditing({ ...editing, stock: e.target.value })} />
              </div>
              <div>
                <label className="label">Category</label>
                <input name="category" className="input"
                  value={editing.category || ""}
                  onChange={(e) => setEditing({ ...editing, category: e.target.value })} />
              </div>
              <div className="sm:col-span-2">
                <label className="label">Image URL</label>
                <input name="image_url" className="input"
                  value={editing.image_url || ""}
                  onChange={(e) => setEditing({ ...editing, image_url: e.target.value })} />
              </div>
              <div className="flex gap-3 sm:col-span-2">
                <button type="submit" className="btn-primary">Save Changes</button>
                <button type="button" onClick={() => setEditing(null)} className="btn-secondary">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed bottom-6 right-6 z-50 rounded-xl bg-slate-900 px-5 py-3 text-sm font-medium text-white shadow-lg">
          {toast}
        </div>
      )}
    </div>
  );
}
