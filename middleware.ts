/**
 * Next.js Middleware
 *
 * V1 LOCAL MODE: Pass-through — no auth checks required.
 * V2 HOSTED MODE: When hosted persistence is explicitly enabled, refreshes auth
 * sessions and redirects unauthenticated users on protected routes.
 */

import { NextResponse, type NextRequest } from 'next/server';

function isLocalMode(): boolean {
  const hostedFlag = process.env.USE_HOSTED_PERSISTENCE;
  return hostedFlag !== 'true' && hostedFlag !== '1';
}

export async function middleware(request: NextRequest) {
  // V1 local mode: no auth enforcement
  if (isLocalMode()) {
    return NextResponse.next();
  }

  // V2 hosted mode: Supabase session refresh + route protection
  const { createServerClient } = await import('@supabase/ssr');

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  // Allow public routes
  const PUBLIC_PATTERNS = ['/auth', '/_next', '/favicon.ico', '/api/auth'];
  if (PUBLIC_PATTERNS.some(p => pathname.startsWith(p))) {
    return supabaseResponse;
  }

  // Redirect protected routes to sign-in when unauthenticated
  const PROTECTED_PATTERNS = ['/sessions', '/items', '/api/sessions', '/api/items', '/api/intake'];
  if (PROTECTED_PATTERNS.some(p => pathname.startsWith(p)) && !user) {
    const url = request.nextUrl.clone();
    url.pathname = '/auth/sign-in';
    url.searchParams.set('redirect', pathname);
    return NextResponse.redirect(url);
  }

  if (pathname === '/' && !user) {
    const url = request.nextUrl.clone();
    url.pathname = '/auth/sign-in';
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
