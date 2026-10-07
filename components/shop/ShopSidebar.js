"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

const NAV_ITEMS = [
  { label: "Dashboard", urdu: "ڈیش بورڈ", href: (id) => `/dashboard/${id}` },
  { label: "Orders", urdu: "آرڈرز", href: (id) => `/dashboard/${id}/orders` },
  { label: "Products", urdu: "پروڈکٹس", href: (id) => `/dashboard/${id}/products` },
  { label: "Customers", urdu: "کسٹمرز", href: (id) => `/dashboard/${id}/customers` },
  { label: "Settings", urdu: "سیٹنگز", href: (id) => `/dashboard/${id}/settings` },
];

export default function ShopSidebar({ shopId }) {
  const pathname = usePathname();
  const router = useRouter();
  const [shop, setShop] = useState(null);

  useEffect(() => {
    let active = true;
    async function loadShop() {
      const { data } = await supabase
        .from("shops")
        .select("shop_name, virtual_number, whatsapp_enabled")
        .eq("id", shopId)
        .single();
      if (active) setShop(data || null);
    }
    if (shopId) loadShop();
    return () => {
      active = false;
    };
  }, [shopId]);

  function handleLogout() {
    document.cookie = "vc_shop=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    router.push("/dashboard/login");
  }

  function isActive(href) {
    return href === `/dashboard/${shopId}` ? pathname === href : pathname.startsWith(href);
  }

  return (
    <aside className="fixed inset-y-0 left-0 z-30 flex w-64 flex-col bg-white shadow-card">
      <div className="border-b border-slate-100 px-5 py-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-600 text-lg font-bold text-white">
            {shop?.shop_name ? shop.shop_name.charAt(0).toUpperCase() : "V"}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-slate-900">
              {shop?.shop_name || "Loading..."}
            </p>
            <p className="text-xs text-slate-500">
              {shop?.virtual_number || ""}
            </p>
          </div>
        </div>
        {shop && (
          <div className="mt-3 flex items-center gap-2 text-xs">
            <span
              className={`badge ${
                shop.whatsapp_enabled
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-slate-100 text-slate-500"
              }`}
            >
              WhatsApp {shop.whatsapp_enabled ? "On" : "Off"}
            </span>
          </div>
        )}
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {NAV_ITEMS.map((item) => {
          const href = item.href(shopId);
          const active = isActive(href);
          return (
            <button
              key={item.label}
              onClick={() => router.push(href)}
              className={`flex w-full items-center justify-between rounded-xl px-4 py-2.5 text-sm font-medium transition ${
                active
                  ? "bg-brand-50 text-brand-700"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <span>{item.label}</span>
              <span className="text-xs text-slate-400">{item.urdu}</span>
            </button>
          );
        })}
      </nav>

      <div className="border-t border-slate-100 p-4">
        <button onClick={handleLogout} className="btn-secondary w-full">
          Log Out
        </button>
      </div>
    </aside>
  );
}
