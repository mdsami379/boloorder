import { NextResponse } from 'next/server';

export function middleware(req) {
  const { pathname } = req.nextUrl;

  // --- Super Admin area ---
  // /super-admin is the public login page; everything under /super-admin/* needs vc_admin
  if (pathname.startsWith('/super-admin/')) {
    const adminCookie = req.cookies.get('vc_admin')?.value;
    if (adminCookie !== '1') {
      return NextResponse.redirect(new URL('/super-admin', req.url));
    }
  }

  // --- Shop Admin area ---
  // /dashboard/login is the public login page; everything else under /dashboard/ needs vc_shop
  if (pathname.startsWith('/dashboard/') && pathname !== '/dashboard/login') {
    const shopCookie = req.cookies.get('vc_shop')?.value;
    if (!shopCookie) {
      return NextResponse.redirect(new URL('/dashboard/login', req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/super-admin/:path*', '/dashboard/:path*'],
};
