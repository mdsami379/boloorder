"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

const TABS = ["all", "pending", "confirmed", "delivered", "cancelled"];

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

function formatDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleString("en-PK", { hour12: true });
}

export default function ShopOrdersPage({ params }) {
  const shopId = params.shop_id;
  const [orders, setOrders] = useState([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(null);
  const [toast, setToast] = useState("");

  async function loadOrders() {
    setLoading(true);
    const res = await fetch(`/api/orders?shop_id=${encodeURIComponent(shopId)}`);
    const data = await res.json().catch(() => ({}));
    setOrders(data.orders || []);
    setLoading(false);
  }

  useEffect(() => {
    if (shopId) loadOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shopId]);

  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(""), 4000);
  }

  async function handleConfirm(orderId) {
    setConfirming(orderId);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "confirm", order_id: orderId, shop_id: shopId }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.ok) {
        showToast("Order confirmed, receipt printing, WhatsApp sent.");
        await loadOrders();
      } else {
        showToast(data.error || "Could not confirm the order.");
      }
    } catch (err) {
      showToast("Could not reach the server.");
    } finally {
      setConfirming(null);
    }
  }

  const visible = filter === "all" ? orders : orders.filter((o) => o.status === filter);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">
          Orders <span className="text-base font-normal text-slate-400">— آرڈرز</span>
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Orders from your virtual phone line and WhatsApp.
        </p>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setFilter(t)}
            className={`rounded-full px-4 py-1.5 text-sm font-semibold capitalize transition ${
              filter === t
                ? "bg-brand-600 text-white"
                : "bg-white text-slate-600 shadow-sm hover:bg-slate-100"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="table-wrap">
        <table className="w-full">
          <thead>
            <tr>
              <th className="th">Order ID</th>
              <th className="th">Customer Phone</th>
              <th className="th">Items</th>
              <th className="th">Total</th>
              <th className="th">Status</th>
              <th className="th">Date</th>
              <th className="th">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td className="td" colSpan={7}>Loading…</td></tr>
            ) : visible.length === 0 ? (
              <tr><td className="td" colSpan={7}>No orders in this view.</td></tr>
            ) : (
              visible.map((o) => (
                <tr key={o.id}>
                  <td className="td font-semibold">#{o.id}</td>
                  <td className="td">{o.customer_phone || "—"}</td>
                  <td className="td">{formatItems(o.items)}</td>
                  <td className="td font-medium">Rs {Number(o.total_amount || 0).toLocaleString()}</td>
                  <td className="td">
                    <span className={`badge ${STATUS_BADGE[o.status] || "bg-slate-100 text-slate-600"}`}>
                      {o.status}
                    </span>
                  </td>
                  <td className="td">{formatDate(o.created_at)}</td>
                  <td className="td">
                    {o.status === "pending" && (
                      <button
                        onClick={() => handleConfirm(o.id)}
                        disabled={confirming === o.id}
                        className="btn-primary !px-3 !py-1.5 !text-xs"
                      >
                        {confirming === o.id ? "Confirming…" : "Confirm & Print Receipt"}
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {toast && (
        <div className="fixed bottom-6 right-6 z-50 rounded-xl bg-slate-900 px-5 py-3 text-sm font-medium text-white shadow-lg">
          {toast}
        </div>
      )}
    </div>
  );
}
