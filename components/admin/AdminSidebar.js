'use client';

import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useState } from 'react';

const LINKS = [
  { href: '/super-admin/dashboard', label: 'Dashboard', urdu: 'ڈیش بورڈ' },
  { href: '/super-admin/shops', label: 'Shops', urdu: 'دکانیں' },
  { href: '/super-admin/billing', label: 'Billing', urdu: 'بلنگ' },
  { href: '/super-admin/api-keys', label: 'API Keys', urdu: 'اے پی آئی کیز' },
];

export default function AdminSidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const [loggingOut, setLoggingOut] = useState(false);

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await fetch('/api/auth/super-admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'logout' }),
      });
    } finally {
      router.push('/super-admin');
    }
  }

  return (
    <aside className="flex w-full flex-col border-b border-slate-200 bg-white lg:h-screen lg:w-64 lg:border-b-0 lg:border-r">
      <div className="border-b border-slate-100 px-6 py-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-600 text-sm font-bold text-white">
            VB
          </div>
          <div>
            <p className="text-sm font-bold leading-tight text-slate-900">VoiceBazaar</p>
            <p className="text-xs font-medium text-slate-500">Super Admin</p>
          </div>
        </div>
      </div>

      <nav className="flex gap-1 overflow-x-auto p-4 lg:flex-col">
        {LINKS.map((link) => {
          const active = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex shrink-0 items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
                active
                  ? 'bg-brand-50 text-brand-700'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <span>{link.label}</span>
              <span className="text-xs font-normal text-slate-400">{link.urdu}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto hidden p-4 lg:block">
        <button
          onClick={handleLogout}
          disabled={loggingOut}
          className="btn-secondary w-full"
        >
          {loggingOut ? 'Signing out...' : 'Sign Out'}
        </button>
      </div>
    </aside>
  );
}
