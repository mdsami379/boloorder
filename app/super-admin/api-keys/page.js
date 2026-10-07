'use client';

import { useEffect, useState } from 'react';
import AdminSidebar from '@/components/admin/AdminSidebar';

const KEYS = [
  { key: 'TWILIO_ACCOUNT_SID', label: 'Twilio Account SID', hint: 'Phone numbers via Twilio' },
  { key: 'TWILIO_AUTH_TOKEN', label: 'Twilio Auth Token', hint: 'Twilio account secret' },
  { key: 'VAPI_API_KEY', label: 'Vapi API Key', hint: 'Voice AI agents' },
  { key: 'WHATSAPP_CLOUD_API_TOKEN', label: 'WhatsApp Cloud API Token', hint: 'Meta WhatsApp messages' },
  { key: 'PRINTNODE_API_KEY', label: 'PrintNode API Key', hint: 'Thermal receipt printing' },
];

export default function SuperAdminApiKeysPage() {
  const [values, setValues] = useState({});
  const [saved, setSaved] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const res = await fetch('/api/settings');
        if (!res.ok) throw new Error('Could not load saved keys.');
        const data = await res.json();
        const savedFlags = {};
        for (const k of KEYS) {
          if (data[k.key]) savedFlags[k.key] = true;
        }
        setSaved(savedFlags);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  function setValue(key, value) {
    setValues((prev) => ({ ...prev, [key]: value }));
    setSuccess('');
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const toSave = KEYS.filter((k) => (values[k.key] || '').trim() !== '');
      if (toSave.length === 0) {
        setError('Enter at least one key to save.');
        setSaving(false);
        return;
      }

      for (const k of toSave) {
        const res = await fetch('/api/settings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ key: k.key, value: values[k.key].trim() }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || `Failed to save ${k.label}.`);
        }
        setSaved((prev) => ({ ...prev, [k.key]: true }));
      }

      setValues({});
      setSuccess('API keys saved successfully.');
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 lg:flex">
      <AdminSidebar />

      <main className="flex-1 p-4 sm:p-6 lg:p-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900">API Keys</h1>
          <p className="mt-1 text-sm text-slate-500">
            Integration credentials · انضمام کے لیے خفیہ کیز (stored securely on the server)
          </p>
        </div>

        {error && (
          <div className="mb-6 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-6 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
            {success}
          </div>
        )}

        <form onSubmit={handleSave} className="card max-w-3xl space-y-5">
          {loading ? (
            <p className="text-sm text-slate-500">Loading...</p>
          ) : (
            KEYS.map((k) => (
              <div key={k.key}>
                <div className="mb-1.5 flex items-center justify-between">
                  <label className="label !mb-0" htmlFor={k.key}>{k.label}</label>
                  {saved[k.key] && (
                    <span className="badge bg-emerald-100 text-emerald-700">
                      Saved · محفوظ
                    </span>
                  )}
                </div>
                <input
                  id={k.key}
                  type="password"
                  className="input"
                  value={values[k.key] || ''}
                  onChange={(e) => setValue(k.key, e.target.value)}
                  placeholder={saved[k.key] ? '•••••••• (already saved — enter a new value to replace)' : `Enter ${k.label}`}
                  autoComplete="off"
                />
                <p className="mt-1 text-xs text-slate-400">{k.hint}</p>
              </div>
            ))
          )}

          <div>
            <button type="submit" className="btn-primary" disabled={saving || loading}>
              {saving ? 'Saving...' : 'Save Keys'}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
