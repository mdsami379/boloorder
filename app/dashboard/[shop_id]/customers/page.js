"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

const LANG_LABELS = {
  ur: "Urdu",
  en: "English",
  punjabi: "Punjabi",
  saraiki: "Saraiki",
};

const LANG_BADGE = {
  ur: "bg-emerald-100 text-emerald-700",
  en: "bg-blue-100 text-blue-700",
  punjabi: "bg-amber-100 text-amber-700",
  saraiki: "bg-purple-100 text-purple-700",
};

function formatDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleString("en-PK", { hour12: true });
}

export default function ShopCustomersPage({ params }) {
  const shopId = params.shop_id;
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      const { data } = await supabase
        .from("customers")
        .select("id, phone_number, customer_name, address, preferred_language, created_at")
        .eq("shop_id", shopId)
        .order("created_at", { ascending: false });
      if (!active) return;

      const enriched = await Promise.all(
        (data || []).map(async (c) => {
          const { data: orders } = await supabase
            .from("orders")
            .select("id, created_at")
            .eq("shop_id", shopId)
            .eq("customer_phone", c.phone_number)
            .order("created_at", { ascending: false });
          const list = orders || [];
          return {
            ...c,
            total_orders: list.length,
            last_order: list[0]?.created_at || null,
          };
        })
      );
      setCustomers(enriched);
      setLoading(false);
    }
    if (shopId) load();
    return () => {
      active = false;
    };
  }, [shopId]);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">
          Customers <span className="text-base font-normal text-slate-400">— کسٹمرز</span>
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Everyone who called your virtual number, with their saved details.
        </p>
      </div>

      <div className="table-wrap">
        <table className="w-full">
          <thead>
            <tr>
              <th className="th">Phone</th>
              <th className="th">Name</th>
              <th className="th">Address</th>
              <th className="th">Language</th>
              <th className="th">Total Orders</th>
              <th className="th">Last Order</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td className="td" colSpan={6}>Loading…</td></tr>
            ) : customers.length === 0 ? (
              <tr><td className="td" colSpan={6}>No customers yet.</td></tr>
            ) : (
              customers.map((c) => (
                <tr key={c.id}>
                  <td className="td font-medium">{c.phone_number}</td>
                  <td className="td">{c.customer_name || "—"}</td>
                  <td className="td">{c.address || "—"}</td>
                  <td className="td">
                    {c.preferred_language ? (
                      <span className={`badge ${LANG_BADGE[c.preferred_language] || "bg-slate-100 text-slate-600"}`}>
                        {LANG_LABELS[c.preferred_language] || c.preferred_language}
                      </span>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="td">
                    <span className="badge bg-slate-100 text-slate-700">{c.total_orders}</span>
                  </td>
                  <td className="td">{formatDate(c.last_order)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
