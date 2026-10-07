'use client';

import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import AdminSidebar from '@/components/admin/AdminSidebar';

export default function SuperAdminBillingPage() {
  const [payments, setPayments] = useState([]);
  const [shopNames, setShopNames] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updating, setUpdating] = useState(null);

  async function load() {
    setLoading(true);
    setError('');
    try {
      const [paymentsRes, shopsRes] = await Promise.all([
        supabase.from('payments').select('*').order('created_at', { ascending: false }),
        supabase.from('shops').select('id, shop_name'),
      ]);
      if (paymentsRes.error) throw paymentsRes.error;
      if (shopsRes.error) throw shopsRes.error;

      setPayments(paymentsRes.data || []);
      const names = {};
      for (const s of shopsRes.data || []) names[s.id] = s.shop_name;
      setShopNames(names);
    } catch (e) {
      setError(e.message || 'Failed to load billing data.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function markPaid(payment) {
    setUpdating(payment.id);
    setError('');
    const { error: err } = await supabase
      .from('payments')
      .update({ status: 'paid' })
      .eq('id', payment.id);
    if (err) {
      setError(err.message);
    } else {
      setPayments((prev) =>
        prev.map((p) => (p.id === payment.id ? { ...p, status: 'paid' } : p))
      );
    }
    setUpdating(null);
  }

  const summary = useMemo(() => {
    const byShop = {};
    for (const p of payments) {
      const sid = p.shop_id;
      if (!byShop[sid]) byShop[sid] = { paid: 0, pending: 0, count: 0 };
      byShop[sid].count += 1;
      if (p.status === 'paid') byShop[sid].paid += Number(p.amount) || 0;
      else byShop[sid].pending += Number(p.amount) || 0;
    }
    return Object.entries(byShop).map(([shop_id, totals]) => ({
      shop_id,
      shop_name: shopNames[shop_id] || shop_id,
      ...totals,
    }));
  }, [payments, shopNames]);

  return (
    <div className="min-h-screen bg-slate-50 lg:flex">
      <AdminSidebar />

      <main className="flex-1 p-4 sm:p-6 lg:p-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900">Revenue & Billing</h1>
          <p className="mt-1 text-sm text-slate-500">ادائیگیوں اور واجبات کی تفصیل</p>
        </div>

        {error && (
          <div className="mb-6 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {error}
          </div>
        )}

        <h2 className="mb-3 text-base font-bold text-slate-900">Per-Shop Summary · خلاصہ</h2>
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {loading ? (
            <div className="card text-sm text-slate-500">Loading summary...</div>
          ) : summary.length === 0 ? (
            <div className="card text-sm text-slate-500">No payment records yet.</div>
          ) : (
            summary.map((s) => (
              <div key={s.shop_id} className="card">
                <p className="font-bold text-slate-900">{s.shop_name}</p>
                <p className="text-xs text-slate-400">{s.count} payment record{s.count === 1 ? '' : 's'}</p>
                <div className="mt-3 flex items-center justify-between text-sm">
                  <span className="text-slate-500">Paid</span>
                  <span className="font-bold text-emerald-600">Rs {s.paid.toLocaleString()}</span>
                </div>
                <div className="mt-1 flex items-center justify-between text-sm">
                  <span className="text-slate-500">Pending</span>
                  <span className="font-bold text-amber-600">Rs {s.pending.toLocaleString()}</span>
                </div>
              </div>
            ))
          )}
        </div>

        <h2 className="mb-3 text-base font-bold text-slate-900">Payment Records</h2>
        <div className="table-wrap">
          <table className="w-full">
            <thead>
              <tr>
                <th className="th">Shop</th>
                <th className="th">Month</th>
                <th className="th">Amount</th>
                <th className="th">Status</th>
                <th className="th text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td className="td" colSpan={5}>Loading payments...</td></tr>
              ) : payments.length === 0 ? (
                <tr><td className="td" colSpan={5}>No payment records yet.</td></tr>
              ) : (
                payments.map((p) => (
                  <tr key={p.id}>
                    <td className="td font-semibold text-slate-900">
                      {shopNames[p.shop_id] || p.shop_id}
                    </td>
                    <td className="td">{p.month}</td>
                    <td className="td">Rs {Number(p.amount || 0).toLocaleString()}</td>
                    <td className="td">
                      <span className={`badge ${p.status === 'paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                        {p.status === 'paid' ? 'Paid' : 'Pending'}
                      </span>
                    </td>
                    <td className="td">
                      <div className="flex justify-end">
                        {p.status !== 'paid' ? (
                          <button
                            onClick={() => markPaid(p)}
                            disabled={updating === p.id}
                            className="btn-primary !px-3 !py-1.5 !text-xs"
                          >
                            {updating === p.id ? 'Saving...' : 'Mark Paid'}
                          </button>
                        ) : (
                          <span className="text-xs text-slate-400">Done</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
