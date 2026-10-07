'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import AdminSidebar from '@/components/admin/AdminSidebar';

const LANGUAGE_OPTIONS = [
  { value: 'ur', label: 'Urdu (اردو)' },
  { value: 'en', label: 'English' },
  { value: 'punjabi', label: 'Punjabi (پنجابی)' },
  { value: 'saraiki', label: 'Saraiki (سرائیکی)' },
];

const EMPTY_FORM = {
  shop_name: '',
  virtual_number: '',
  owner_whatsapp: '',
  owner_email: '',
  owner_password: '',
  default_language: 'ur',
  monthly_plan: 0,
};

export default function SuperAdminShopsPage() {
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState(EMPTY_FORM);
  const [showForm, setShowForm] = useState(false);

  // Edit modal state
  const [editing, setEditing] = useState(null); // shop object or null
  const [editForm, setEditForm] = useState(EMPTY_FORM);

  async function loadShops() {
    setLoading(true);
    setError('');
    const { data, error: err } = await supabase
      .from('shops')
      .select('*')
      .order('created_at', { ascending: false });
    if (err) {
      setError(err.message);
    } else {
      setShops(data || []);
    }
    setLoading(false);
  }

  useEffect(() => {
    loadShops();
  }, []);

  function updateForm(setter) {
    return (e) => {
      const { name, value } = e.target;
      setter((prev) => ({ ...prev, [name]: value }));
    };
  }

  async function handleAdd(e) {
    e.preventDefault();
    setSaving(true);
    setError('');

    const payload = {
      id: `shop_${Date.now()}`,
      shop_name: form.shop_name.trim(),
      virtual_number: form.virtual_number.trim(),
      owner_whatsapp: form.owner_whatsapp.trim(),
      owner_email: form.owner_email.trim(),
      owner_password: form.owner_password,
      default_language: form.default_language,
      monthly_plan: Number(form.monthly_plan) || 0,
      is_active: true,
    };

    const { error: err } = await supabase.from('shops').insert(payload);
    if (err) {
      setError(err.message);
    } else {
      setForm(EMPTY_FORM);
      setShowForm(false);
      await loadShops();
    }
    setSaving(false);
  }

  function openEdit(shop) {
    setEditing(shop);
    setEditForm({
      shop_name: shop.shop_name || '',
      virtual_number: shop.virtual_number || '',
      owner_whatsapp: shop.owner_whatsapp || '',
      owner_email: shop.owner_email || '',
      owner_password: shop.owner_password || '',
      default_language: shop.default_language || 'ur',
      monthly_plan: shop.monthly_plan || 0,
    });
  }

  async function handleUpdate(e) {
    e.preventDefault();
    if (!editing) return;
    setSaving(true);
    setError('');

    const { error: err } = await supabase
      .from('shops')
      .update({
        shop_name: editForm.shop_name.trim(),
        virtual_number: editForm.virtual_number.trim(),
        owner_whatsapp: editForm.owner_whatsapp.trim(),
        owner_email: editForm.owner_email.trim(),
        owner_password: editForm.owner_password,
        default_language: editForm.default_language,
        monthly_plan: Number(editForm.monthly_plan) || 0,
      })
      .eq('id', editing.id);

    if (err) {
      setError(err.message);
    } else {
      setEditing(null);
      await loadShops();
    }
    setSaving(false);
  }

  async function toggleActive(shop) {
    setError('');
    const { error: err } = await supabase
      .from('shops')
      .update({ is_active: !shop.is_active })
      .eq('id', shop.id);
    if (err) {
      setError(err.message);
    } else {
      setShops((prev) =>
        prev.map((s) => (s.id === shop.id ? { ...s, is_active: !s.is_active } : s))
      );
    }
  }

  async function handleDelete(shop) {
    if (!window.confirm(`Delete "${shop.shop_name}" permanently? This cannot be undone.`)) return;
    setError('');
    const { error: err } = await supabase.from('shops').delete().eq('id', shop.id);
    if (err) {
      setError(err.message);
    } else {
      setShops((prev) => prev.filter((s) => s.id !== shop.id));
    }
  }

  function formFields(values, onChange, showPassword = true) {
    return (
      <>
        <div>
          <label className="label">Shop Name · دکان کا نام</label>
          <input name="shop_name" className="input" value={values.shop_name} onChange={onChange} required placeholder="Burger House" />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="label">Virtual Number · ورچوئل نمبر</label>
            <input name="virtual_number" className="input" value={values.virtual_number} onChange={onChange} required placeholder="0301-2345678" />
          </div>
          <div>
            <label className="label">Owner WhatsApp</label>
            <input name="owner_whatsapp" className="input" value={values.owner_whatsapp} onChange={onChange} required placeholder="0301-2345678" />
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="label">Owner Email</label>
            <input name="owner_email" type="email" className="input" value={values.owner_email} onChange={onChange} required placeholder="owner@shop.com" />
          </div>
          {showPassword && (
            <div>
              <label className="label">Owner Password · پاس ورڈ</label>
              <input name="owner_password" type="password" className="input" value={values.owner_password} onChange={onChange} required placeholder="Shop login password" />
            </div>
          )}
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="label">Default Language · زبان</label>
            <select name="default_language" className="input" value={values.default_language} onChange={onChange}>
              {LANGUAGE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Monthly Plan (Rs) · ماہانہ فیس</label>
            <input name="monthly_plan" type="number" min="0" className="input" value={values.monthly_plan} onChange={onChange} placeholder="5000" />
          </div>
        </div>
      </>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 lg:flex">
      <AdminSidebar />

      <main className="flex-1 p-4 sm:p-6 lg:p-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Shops Management</h1>
            <p className="mt-1 text-sm text-slate-500">تمام دکانوں کا انتظام</p>
          </div>
          <button className="btn-primary" onClick={() => setShowForm((v) => !v)}>
            {showForm ? 'Close Form' : 'Add New Shop'}
          </button>
        </div>

        {error && (
          <div className="mb-6 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {error}
          </div>
        )}

        {showForm && (
          <form onSubmit={handleAdd} className="card mb-6 space-y-4">
            <h2 className="text-base font-bold text-slate-900">Add New Shop · نئی دکان شامل کریں</h2>
            {formFields(form, updateForm(setForm))}
            <div>
              <button type="submit" className="btn-primary" disabled={saving}>
                {saving ? 'Saving...' : 'Save Shop'}
              </button>
            </div>
          </form>
        )}

        <div className="table-wrap">
          <table className="w-full">
            <thead>
              <tr>
                <th className="th">Shop</th>
                <th className="th">Virtual Number</th>
                <th className="th">Plan (Rs)</th>
                <th className="th">Status</th>
                <th className="th text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td className="td" colSpan={5}>Loading shops...</td></tr>
              ) : shops.length === 0 ? (
                <tr><td className="td" colSpan={5}>No shops yet. Add your first shop above.</td></tr>
              ) : (
                shops.map((shop) => (
                  <tr key={shop.id}>
                    <td className="td">
                      <div className="font-semibold text-slate-900">{shop.shop_name}</div>
                      <div className="text-xs text-slate-400">{shop.id}</div>
                    </td>
                    <td className="td">{shop.virtual_number}</td>
                    <td className="td">Rs {Number(shop.monthly_plan || 0).toLocaleString()}</td>
                    <td className="td">
                      <span className={`badge ${shop.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                        {shop.is_active ? 'Active' : 'Disabled'}
                      </span>
                    </td>
                    <td className="td">
                      <div className="flex justify-end gap-2">
                        <a href={`/dashboard/${shop.id}`} className="btn-secondary !px-3 !py-1.5 !text-xs">
                          View Dashboard
                        </a>
                        <button onClick={() => openEdit(shop)} className="btn-secondary !px-3 !py-1.5 !text-xs">
                          Edit
                        </button>
                        <button onClick={() => toggleActive(shop)} className="btn-secondary !px-3 !py-1.5 !text-xs">
                          {shop.is_active ? 'Disable' : 'Enable'}
                        </button>
                        <button onClick={() => handleDelete(shop)} className="btn-danger !px-3 !py-1.5 !text-xs">
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
      </main>

      {/* Edit modal */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">Edit Shop · ترمیم</h2>
              <button onClick={() => setEditing(null)} className="btn-secondary !px-3 !py-1.5 !text-xs">
                Close
              </button>
            </div>
            <form onSubmit={handleUpdate} className="space-y-4">
              {formFields(editForm, updateForm(setEditForm))}
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setEditing(null)} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={saving}>
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
