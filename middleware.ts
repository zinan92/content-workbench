/**
 * Next.js Middleware for Auth Protection
 * 
 * This middleware:
 * - Refreshes auth sessions on every request
 * - Redirects unauthenticated users to sign-in for protected routes
 * - Allows public access to auth pages and static assets
 */

import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

/**
 * Routes that require authentication
 * All routes matching these patterns will redirect to sign-in if not authenticated
 */
const PROTECTED_ROUTE_PATTERNS = [
  '/sessions',
  '/items',
  '/api/sessions',
  '/api/items',
  '/api/intake',
];

/**
 * Public routes that should always be accessible
 */
const PUBLIC_ROUTE_PATTERNS = [
  '/auth',
  '/_next',
  '/favicon.ico',
  '/api/auth',
];

/**
 * Check if a path matches any of the given patterns
 */
function matchesPattern(path: string, patterns: string[]): boolean {
  return patterns.some(pattern => path.startsWith(pattern));
}

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

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
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // IMPORTANT: Avoid writing any logic between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  // Allow public routes
  if (matchesPattern(pathname, PUBLIC_ROUTE_PATTERNS)) {
    return supabaseResponse;
  }

  // Redirect to sign-in if accessing protected routes without auth
  if (matchesPattern(pathname, PROTECTED_ROUTE_PATTERNS) && !user) {
    const url = request.nextUrl.clone();
    url.pathname = '/auth/sign-in';
    url.searchParams.set('redirect', pathname);
    return NextResponse.redirect(url);
  }

  // Redirect root to sign-in if not authenticated
  if (pathname === '/' && !user) {
    const url = request.nextUrl.clone();
    url.pathname = '/auth/sign-in';
    return NextResponse.redirect(url);
  }

  // IMPORTANT: You *must* return the supabaseResponse object as it is. If you're
  // creating a new response object with NextResponse.next() make sure to:
  // 1. Pass the request in it, like so:
  //    const myNewResponse = NextResponse.next({ request })
  // 2. Copy over the cookies, like so:
  //    myNewResponse.cookies.setAll(supabaseResponse.cookies.getAll())
  // 3. Change the myNewResponse object to fit your needs, but avoid changing
  //    the cookies!
  // 4. Finally:
  //    return myNewResponse
  // If this is not done, you may be causing the browser and server to go out
  // of sync and terminate the user's session prematurely!

  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
