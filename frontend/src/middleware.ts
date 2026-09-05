import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * IMPORTANT: This middleware reads the token from a cookie named `ke_token`.
 * The authStore.setAuth() method writes this cookie when logging in.
 * localStorage is not accessible in middleware (it runs on the Edge runtime).
 */
export function middleware(request: NextRequest) {
  const token     = request.cookies.get('ke_token')?.value;
  const pathname  = request.nextUrl.pathname;

  // ── Protected customer routes ────────────────────────────────────────────
  const customerProtected = ['/checkout', '/orders', '/profile'];
  if (customerProtected.some((p) => pathname.startsWith(p))) {
    if (!token) {
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      url.searchParams.set('redirect', pathname);
      return NextResponse.redirect(url);
    }
  }

  // ── Admin routes ─────────────────────────────────────────────────────────
  if (pathname.startsWith('/admin')) {
    if (!token) {
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      url.searchParams.set('redirect', pathname);
      return NextResponse.redirect(url);
    }
    // Note: role check is done client-side in admin layout
    // (middleware cannot decode JWT without secret on edge runtime without a library)
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/checkout/:path*',
    '/orders/:path*',
    '/profile/:path*',
    '/admin/:path*',
  ],
};
