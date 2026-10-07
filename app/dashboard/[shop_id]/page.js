"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

const STATUS_BADGE = {
  pending: "bg-amber-100 text-amber-700",
  confirmed: "bg-blue-100 text-blue-700",
  delivered: "bg-emerald-100 text-emerald-700",
  cancelled: "bg-red-100 text-red-600",
};

function formatItems(items) {
  if (!items) return "—";
  const arr = Array.isArray(items) ? items : [];
  return arr
    .map((i) => `${i.qty || i.quantity || 1}x ${i.name || i.product_name || "Item"}`)
    .join(", ");
}

export default function ShopDashboardPage({ params }) {
  const shopId = params.shop_id;
  const router = useRouter();
  const [stats, setStats] = useState({ todayOrders: 0, pending: 0, sales: 0, customers: 0 });
  const [recent, setRecent] = useState([]);
  const [lowStock, setLowStock] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      const today = new Date().toISOString().split("T")[0];

      const [{ data: orders }, { data: products }, { count: customerCount }] = await Promise.all([
        supabase.from("orders").select("*").eq("shop_id", shopId).order("created_at", { ascending: false }),
        supabase.from("products").select("id, product_name, stock, price").eq("shop_id", shopId),
        supabase.from("customers").select("id", { count: "exact", head: true }).eq("shop_id", shopId),
      ]);

      if (!active) return;
      const all = orders || [];
      const todayOrders = all.filter((o) => (o.created_at || "").startsWith(today));
      setStats({
        todayOrders: todayOrders.length,
        pending: all.filter((o) => o.status === "pending").length,
        sales: all.reduce((s, o) => s + (Number(o.total_amount) || 0), 0),
        customers: customerCount || 0,
      });
      setRecent(all.slice(0, 5));
      setLowStock((products || []).filter((p) => (p.stock ?? 0) < 5));
      setLoading(false);
    }
    if (shopId) load();
    return () => {
      active = false;
    };
  }, [shopId]);

  const cards = [
    { label: "Today's Orders", urdu: "آج کے آرڈرز", value: stats.todayOrders },
    { label: "Pending Orders", urdu: "زیر التوا آرڈرز", value: stats.pending },
    { label: "Total Sales", urdu: "کل فروخت", value: `Rs ${stats.sales.toLocaleString()}` },
    { label: "Total Customers", urdu: "کل کسٹمرز", value: stats.customers },
  ];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">
          Dashboard <span className="text-base font-normal text-slate-400">— ڈیش بورڈ</span>
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          A quick view of your shop's activity today.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} className="card">
            <p className="text-sm font-medium text-slate-500">
              {c.label} <span className="text-xs text-slate-400">· {c.urdu}</span>
            </p>
            <p className="mt-2 text-3xl font-bold text-slate-900">
              {loading ? "…" : c.value}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">
              Recent Orders <span className="text-sm font-normal text-slate-400">— حالیہ آرڈرز</span>
            </h2>
            <button
              onClick={() => router.push(`/dashboard/${shopId}/orders`)}
              className="text-sm font-semibold text-brand-600 hover:text-brand-700"
            >
              View all
            </button>
          </div>
          <div className="table-wrap">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="th">Order</th>
                  <th className="th">Items</th>
                  <th className="th">Total</th>
                  <th className="th">Status</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td className="td" colSpan={4}>Loading…</td></tr>
                ) : recent.length === 0 ? (
                  <tr><td className="td" colSpan={4}>No orders yet.</td></tr>
                ) : (
                  recent.map((o) => (
                    <tr key={o.id}>
                      <td className="td font-semibold">#{o.id}</td>
                      <td className="td">{formatItems(o.items)}</td>
                      <td className="td">Rs {Number(o.total_amount || 0).toLocaleString()}</td>
                      <td className="td">
                        <span className={`badge ${STATUS_BADGE[o.status] || "bg-slate-100 text-slate-600"}`}>
                          {o.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">
              Low Stock <span className="text-sm font-normal text-slate-400">— کم اسٹاک</span>
            </h2>
            <button
              onClick={() => router.push(`/dashboard/${shopId}/products`)}
              className="text-sm font-semibold text-brand-600 hover:text-brand-700"
            >
              Manage menu
            </button>
          </div>
          <div className="table-wrap">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="th">Product</th>
                  <th className="th">Stock</th>
                  <th className="th">Price</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td className="td" colSpan={3}>Loading…</td></tr>
                ) : lowStock.length === 0 ? (
                  <tr><td className="td" colSpan={3}>All stocked up.</td></tr>
                ) : (
                  lowStock.map((p) => (
                    <tr key={p.id}>
                      <td className="td font-medium">{p.product_name}</td>
                      <td className="td">
                        <span className="badge bg-red-100 text-red-600">{p.stock ?? 0} left</span>
                      </td>
                      <td className="td">Rs {Number(p.price || 0).toLocaleString()}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
