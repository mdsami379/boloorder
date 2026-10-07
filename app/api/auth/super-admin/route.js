import { NextResponse } from 'next/server';

const COOKIE_NAME = 'vc_admin';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

export async function POST(req) {
  const body = await req.json().catch(() => ({}));

  // Logout action: clear the admin cookie
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

  const expectedEmail = process.env.SUPER_ADMIN_EMAIL;
  const expectedPassword = process.env.SUPER_ADMIN_PASSWORD;

  if (!expectedEmail || !expectedPassword) {
    return NextResponse.json(
      { ok: false, error: 'Super admin credentials are not configured on the server.' },
      { status: 500 }
    );
  }

  if (email === expectedEmail && password === expectedPassword) {
    const res = NextResponse.json({ ok: true });
    res.cookies.set(COOKIE_NAME, '1', {
      httpOnly: true,
      path: '/',
      maxAge: COOKIE_MAX_AGE,
      sameSite: 'lax',
    });
    return res;
  }

  return NextResponse.json(
    { ok: false, error: 'Invalid email or password' },
    { status: 401 }
  );
}
