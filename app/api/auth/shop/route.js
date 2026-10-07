import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseClient';

const COOKIE_NAME = 'vc_shop';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

export async function POST(req) {
  const body = await req.json().catch(() => ({}));

  // Logout action: clear the shop cookie
  if (body.action === 'logout') {
    const res = NextResponse.json({ ok: true });
    res.cookies.set(COOKIE_NAME, '', {
      httpOnly: true,
      path: '/',
      maxAge: 0,
    });
    return res;
  }

  const { email, password } = body || {};

  if (!email || !password) {
    return NextResponse.json(
      { ok: false, error: 'Email and password are required' },
      { status: 400 }
    );
  }

  const { data: shop, error } = await supabaseAdmin
    .from('shops')
    .select('id, owner_email, owner_password, is_active, shop_name')
    .eq('owner_email', email)
    .maybeSingle();

  if (error || !shop || shop.owner_password !== password) {
    return NextResponse.json(
      { ok: false, error: 'Invalid email or password' },
      { status: 401 }
    );
  }

  if (!shop.is_active) {
    return NextResponse.json(
      { ok: false, error: 'This shop is currently disabled. Please contact the platform administrator.' },
      { status: 403 }
    );
  }

  const res = NextResponse.json({ ok: true, shop_id: shop.id });
  res.cookies.set(COOKIE_NAME, JSON.stringify({ shop_id: shop.id }), {
    httpOnly: true,
    path: '/',
    maxAge: COOKIE_MAX_AGE,
    sameSite: 'lax',
  });
  return res;
}
