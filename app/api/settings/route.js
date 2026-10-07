import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseClient';

function isSuperAdmin(req) {
  return req.cookies.get('vc_admin')?.value === '1';
}

// GET /api/settings -> { key: value } for all rows (super-admin only)
export async function GET(req) {
  if (!isSuperAdmin(req)) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  const { data, error } = await supabaseAdmin.from('settings').select('key, value');
  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  const map = {};
  for (const row of data || []) map[row.key] = row.value;
  return NextResponse.json(map);
}

// POST /api/settings { key, value } -> upsert one setting (super-admin only)
export async function POST(req) {
  if (!isSuperAdmin(req)) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const { key, value } = body || {};

  if (!key || typeof value === 'undefined') {
    return NextResponse.json(
      { ok: false, error: 'Both "key" and "value" are required' },
      { status: 400 }
    );
  }

  const { error } = await supabaseAdmin
    .from('settings')
    .upsert({ key, value: String(value) }, { onConflict: 'key' });

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
