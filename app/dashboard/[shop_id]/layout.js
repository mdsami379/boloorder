"use client";

import ShopSidebar from "@/components/shop/ShopSidebar";

export default function ShopDashboardLayout({ children, params }) {
  const shopId = params.shop_id;
  return (
    <div className="min-h-screen bg-slate-50">
      <ShopSidebar shopId={shopId} />
      <main className="pl-64">
        <div className="mx-auto max-w-6xl px-6 py-8">{children}</div>
      </main>
    </div>
  );
}
