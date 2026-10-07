'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import AdminSidebar from '@/components/admin/AdminSidebar';

function startOfTodayISO() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

export default function SuperAdminDashboardPage() {
  const [stats, setStats] = useState({
    shops: 0,
    ordersToday: 0,
    revenue: 0,
    aiCalls: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError('');
      try {
        const [shopsRes, ordersTodayRes, revenueRes, allOrdersRes] = await Promise.all([
          supabase.from('shops').select('id', { count: 'exact', head: true }),
          supabase
            .from('orders')
            .select('id', { count: 'exact', head: true })
            .gte('created_at', startOfTodayISO()),
          supabase.from('orders').select('total_amount'),
          supabase.from('orders').select('id', { count: 'exact', head: true }),
        ]);

        if (shopsRes.error) throw shopsRes.error;
        if (ordersTodayRes.error) throw ordersTodayRes.error;
        if (revenueRes.error) throw revenueRes.error;
        if (allOrdersRes.error) throw allOrdersRes.error;

        const revenue = (revenueRes.data || []).reduce(
          (sum, o) => sum + (Number(o.total_amount) || 0),
          0
        );

        setStats({
          shops: shopsRes.count || 0,
          ordersToday: ordersTodayRes.count || 0,
          revenue,
          aiCalls: allOrdersRes.count || 0,
        });
      } catch (e) {
        setError(e.message || 'Failed to load dashboard stats.');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const cards = [
    { label: 'Total Shops', urdu: 'کل دکانیں', value: stats.shops, format: (v) => v },
    { label: 'Total Orders Today', urdu: 'آج کے آرڈر', value: stats.ordersToday, format: (v) => v },
    { label: 'Total Revenue', urdu: 'کل آمدنی', value: stats.revenue, format: (v) => `Rs ${v.toLocaleString()}` },
    { label: 'Total AI Calls', urdu: 'اے آئی کالز', value: stats.aiCalls, format: (v) => v, hint: 'Orders handled by AI agents' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 lg:flex">
      <AdminSidebar />

      <main className="flex-1 p-4 sm:p-6 lg:p-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900">Platform Overview</h1>
          <p className="mt-1 text-sm text-slate-500">پورے پلیٹ فارم کی ایک نظر میں صورتحال</p>
        </div>

        {error && (
          <div className="mb-6 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {cards.map((card) => (
            <div key={card.label} className="card">
              <p className="text-sm font-semibold text-slate-500">
                {card.label} <span className="font-normal text-slate-400">· {card.urdu}</span>
              </p>
              <p className="mt-2 text-3xl font-bold text-slate-900">
                {loading ? '...' : card.format(card.value)}
              </p>
              {card.hint && (
                <p className="mt-1 text-xs text-slate-400">{card.hint}</p>
              )}
            </div>
          ))}
        </div>

        <div className="card mt-6">
          <h2 className="text-base font-bold text-slate-900">Quick Links</h2>
          <p className="mt-1 text-sm text-slate-500">جلدی رسائی</p>
          <div className="mt-4 flex flex-wrap gap-3">
            <a href="/super-admin/shops" className="btn-secondary">Manage Shops</a>
            <a href="/super-admin/billing" className="btn-secondary">View Billing</a>
            <a href="/super-admin/api-keys" className="btn-secondary">Configure API Keys</a>
          </div>
        </div>
      </main>
    </div>
  );
}
