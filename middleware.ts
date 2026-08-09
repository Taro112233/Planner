// middleware.ts
// NextJS Starter - Route Protection Middleware
//
// Edge Runtime limitation: no DB access available.
// Middleware performs a lightweight session-cookie presence check only.
// Full role-based enforcement is handled by AuthGuard.tsx (client-side, full DB check).

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// ─────────────────────────────────────────────
// Route configuration
// ─────────────────────────────────────────────

/** Routes accessible without any authentication */
const PUBLIC_ROUTES: string[] = [
  '/',
  '/login',
  '/register',
  '/terms-of-service',
  '/privacy-policy',
];

/**
 * Route prefixes that require an authenticated session.
 * Prefix matching: '/admin' covers '/admin', '/admin/users', etc.
 *
 * Add your feature routes here when you extend the template.
 * Role-based access within these routes is enforced by AuthGuard.tsx.
 */
const PROTECTED_ROUTE_PREFIXES: string[] = [
  '/dashboard',
  '/profile',
  '/admin',
  '/superadmin',
  '/board',
  // Add feature-specific routes below as your app grows:
  // '/settings',
  // '/reports',
  // '/data',
];

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

function isStaticAsset(pathname: string): boolean {
  return (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/static') ||
    pathname.startsWith('/images') ||
    pathname.startsWith('/icons') ||
    pathname.startsWith('/favicon') ||
    pathname.includes('.')
  );
}

function matchesPrefix(pathname: string, prefixes: string[]): boolean {
  return prefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(prefix + '/')
  );
}

/**
 * Read the Better Auth session cookie.
 * Handles both HTTP (dev) and HTTPS (prod) variants.
 */
function getSessionCookie(request: NextRequest) {
  return (
    request.cookies.get('better-auth.session_token') ??
    request.cookies.get('__Secure-better-auth.session_token')
  );
}

// ─────────────────────────────────────────────
// Middleware
// ─────────────────────────────────────────────

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Skip static assets and Next.js internals
  if (isStaticAsset(pathname)) {
    return NextResponse.next();
  }

  // 2. Always allow Better Auth API routes (handles auth callbacks, token refresh, etc.)
  if (pathname.startsWith('/api/auth')) {
    return NextResponse.next();
  }

  // 3. Public routes — pass through unconditionally
  if (PUBLIC_ROUTES.includes(pathname)) {
    return NextResponse.next();
  }

  // 4. Protected routes — redirect unauthenticated visitors to /login
  //    The `redirect` query param allows the login page to send users back
  //    to their original destination after a successful sign-in.
  if (matchesPrefix(pathname, PROTECTED_ROUTE_PREFIXES)) {
    const sessionCookie = getSessionCookie(request);

    if (!sessionCookie) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Cookie present → let AuthGuard perform the full role/status check
    return NextResponse.next();
  }

  // 5. All other routes (public API endpoints, etc.) — pass through
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|manifest.json|robots.txt|images|icons).*)',
  ],
};