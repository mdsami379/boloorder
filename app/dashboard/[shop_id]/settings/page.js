"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

const LANGUAGES = [
  { value: "ur", label: "Urdu — اردو" },
  { value: "en", label: "English — انگریزی" },
  { value: "punjabi", label: "Punjabi — پنجابی" },
  { value: "saraiki", label: "Saraiki — سرائیکی" },
];

export default function ShopSettingsPage({ params }) {
  const shopId = params.shop_id;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState("");
  const [form, setForm] = useState({
    shop_name: "",
    default_language: "ur",
    open_time: "",
    close_time: "",
    whatsapp_enabled: true,
    owner_whatsapp: "",
    virtual_number: "",
  });

  useEffect(() => {
    let active = true;
    async function load() {
      const { data } = await supabase
        .from("shops")
        .select("shop_name, default_language, open_time, close_time, whatsapp_enabled, owner_whatsapp, virtual_number")
        .eq("id", shopId)
        .single();
      if (!active) return;
      if (data) {
        setForm({
          shop_name: data.shop_name || "",
          default_language: data.default_language || "ur",
          open_time: data.open_time || "",
          close_time: data.close_time || "",
          whatsapp_enabled: data.whatsapp_enabled ?? true,
          owner_whatsapp: data.owner_whatsapp || "",
          virtual_number: data.virtual_number || "",
        });
      }
      setLoading(false);
    }
    if (shopId) load();
    return () => {
      active = false;
    };
  }, [shopId]);

  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(""), 3500);
  }

  function handleChange(e) {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({ ...f, [name]: type === "checkbox" ? checked : value }));
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    const { error } = await supabase
      .from("shops")
      .update({
        shop_name: form.shop_name.trim(),
        default_language: form.default_language,
        open_time: form.open_time || null,
        close_time: form.close_time || null,
        whatsapp_enabled: form.whatsapp_enabled,
        owner_whatsapp: form.owner_whatsapp.trim() || null,
      })
      .eq("id", shopId);
    setSaving(false);
    if (error) {
      showToast("Could not save settings.");
      return;
    }
    showToast("Settings saved.");
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">
          Settings <span className="text-base font-normal text-slate-400">— سیٹنگز</span>
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Shop details, AI voice language, and WhatsApp alerts.
        </p>
      </div>

      {loading ? (
        <div className="card">Loading…</div>
      ) : (
        <form onSubmit={handleSave} className="card max-w-2xl space-y-5">
          <div>
            <label className="label" htmlFor="virtual_number">Virtual Number</label>
            <input
              id="virtual_number"
              className="input bg-slate-50 text-slate-500"
              value={form.virtual_number}
              readOnly
              disabled
            />
            <p className="mt-1 text-xs text-slate-400">
              Your AI phone line — assigned by the platform. Contact support to change it.
            </p>
          </div>

          <div>
            <label className="label" htmlFor="shop_name">Shop Name</label>
            <input
              id="shop_name"
              name="shop_name"
              required
              className="input"
              value={form.shop_name}
              onChange={handleChange}
            />
          </div>

          <div>
            <label className="label" htmlFor="default_language">Bot Language — AI کی زبان</label>
            <select
              id="default_language"
              name="default_language"
              className="input"
              value={form.default_language}
              onChange={handleChange}
            >
              {LANGUAGES.map((l) => (
                <option key={l.value} value={l.value}>
                  {l.label}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-slate-400">
              The AI voice agent answers customers in this language.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="open_time">Open Time</label>
              <input
                id="open_time"
                name="open_time"
                type="time"
                className="input"
                value={form.open_time}
                onChange={handleChange}
              />
            </div>
            <div>
              <label className="label" htmlFor="close_time">Close Time</label>
              <input
                id="close_time"
                name="close_time"
                type="time"
                className="input"
                value={form.close_time}
                onChange={handleChange}
              />
            </div>
          </div>

          <div>
            <label className="label" htmlFor="owner_whatsapp">Owner WhatsApp Number</label>
            <input
              id="owner_whatsapp"
              name="owner_whatsapp"
              className="input"
              placeholder="0301XXXXXXX"
              value={form.owner_whatsapp}
              onChange={handleChange}
            />
            <p className="mt-1 text-xs text-slate-400">
              New-order alerts are sent here when WhatsApp alerts are on.
            </p>
          </div>

          <div className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-slate-800">WhatsApp Alerts</p>
              <p className="text-xs text-slate-500">
                Send order confirmations to you and your customers.
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={form.whatsapp_enabled}
              onClick={() => setForm((f) => ({ ...f, whatsapp_enabled: !f.whatsapp_enabled }))}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
                form.whatsapp_enabled ? "bg-brand-600" : "bg-slate-300"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                  form.whatsapp_enabled ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>

          <button type="submit" disabled={saving} className="btn-primary">
            {saving ? "Saving…" : "Save Settings"}
          </button>
        </form>
      )}

      {toast && (
        <div className="fixed bottom-6 right-6 z-50 rounded-xl bg-slate-900 px-5 py-3 text-sm font-medium text-white shadow-lg">
          {toast}
        </div>
      )}
    </div>
  );
}
