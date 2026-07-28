// components/AuthGuard.tsx
"use client";

import { usePathname, useRouter } from "next/navigation";
import { useCurrentUser, type CurrentUser } from "@/hooks/useCurrentUser";
import { useEffect } from "react";

// ─────────────────────────────────────────────
// Route configuration
// ─────────────────────────────────────────────

const PUBLIC_ROUTES = [
  "/",
  "/login",
  "/register",
  "/terms-of-service",
  "/privacy-policy",
];

/**
 * Role-based route rules.
 * - Uses prefix matching: '/admin' matches '/admin', '/admin/users', etc.
 * - When multiple rules match, the longest (most specific) prefix wins.
 * - Routes not matching any rule are accessible by any logged-in user.
 */
interface RouteRoleRule {
  prefix: string;
  check: (user: CurrentUser) => boolean;
  redirectTo?: string; // default: '/dashboard'
}

const ROLE_RULES: RouteRoleRule[] = [
  // ── SUPERADMIN only ──
  {
    prefix: "/superadmin",
    check: (user) => user.role === "SUPERADMIN",
  },

  // ── ADMIN + SUPERADMIN ──
  {
    prefix: "/admin",
    check: (user) => user.role === "ADMIN" || user.role === "SUPERADMIN",
  },
];

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

/**
 * Find the most specific (longest prefix) matching rule for a given pathname.
 * Returns null if no rule matches → any logged-in user can access.
 */
function findMatchingRule(pathname: string): RouteRoleRule | null {
  let bestMatch: RouteRoleRule | null = null;

  for (const rule of ROLE_RULES) {
    const isMatch =
      pathname === rule.prefix || pathname.startsWith(rule.prefix + "/");

    if (isMatch) {
      if (!bestMatch || rule.prefix.length > bestMatch.prefix.length) {
        bestMatch = rule;
      }
    }
  }

  return bestMatch;
}

// ─────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading } = useCurrentUser();

  useEffect(() => {
    if (loading) return;

    const isPublicRoute = PUBLIC_ROUTES.includes(pathname);

    // 1. Redirect to login if not authenticated and trying to access protected route
    if (!user && !isPublicRoute) {
      router.push("/login");
      return;
    }

    // 2. Check role-based rules (only for logged-in users on non-public routes)
    if (user && !isPublicRoute) {
      const rule = findMatchingRule(pathname);

      if (rule && !rule.check(user)) {
        console.warn(
          `Access denied: User ${user.id} (${user.role}) attempted to access ${pathname}`
        );
        router.push(rule.redirectTo || "/dashboard");
        return;
      }
    }
  }, [user, loading, pathname, router]);

  return <>{children}</>;
}