// Supabase clients.
// `supabase`      -> anon (publishable) client for client components.
// `supabaseAdmin` -> service-role client, SERVER ONLY. Never import in 'use client' code.
import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  console.warn('Supabase URL / anon key missing - check .env.local');
}

// Public anon client (safe for client components).
export const supabase = createClient(url, anonKey);

// Service-role client for API routes / server components only.
export const supabaseAdmin = createClient(
  url,
  process.env.SUPABASE_SERVICE_ROLE_KEY || anonKey,
  { auth: { persistSession: false, autoRefreshToken: false } }
);
