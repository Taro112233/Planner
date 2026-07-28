// hooks/useCurrentUser.ts
// NextJS Starter - Current User Hook (Better Auth Version)

"use client";

import { useSession, authClient } from "@/lib/auth-client";
import { useCallback } from "react";

export interface CurrentUser {
  id: string;
  email: string;
  name: string;
  firstName: string;
  lastName: string;
  fullName: string;
  phone: string | null;
  role: "USER" | "ADMIN" | "SUPERADMIN";
  status: string;
  isActive: boolean;
  emailVerified: boolean;
  image?: string;
  createdAt: string;
  updatedAt: string;
}

interface UseCurrentUserReturn {
  user: CurrentUser | null;
  loading: boolean;
  error: string | null;
  isAdmin: boolean;
  isAuthenticated: boolean;
  refetch: () => Promise<void>;
  logout: () => Promise<void>;
}

export function useCurrentUser(): UseCurrentUserReturn {
  const { data: session, isPending, error, refetch } = useSession();

  // Transform session user to CurrentUser type
  const user: CurrentUser | null = session?.user
    ? {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name,
        firstName:
          (session.user as any).firstName ||
          session.user.name?.split(" ")[0] ||
          "",
        lastName:
          (session.user as any).lastName ||
          session.user.name?.split(" ").slice(1).join(" ") ||
          "",
        fullName: session.user.name,
        phone: (session.user as any).phone || null,
        role: ((session.user as any).role as "USER" | "ADMIN" | "SUPERADMIN") || "USER",
        status: (session.user as any).status || "ACTIVE",
        isActive: (session.user as any).isActive ?? true,
        emailVerified: session.user.emailVerified || false,
        image: session.user.image || undefined,
        createdAt: new Date(session.user.createdAt).toISOString(),
        updatedAt: new Date(session.user.updatedAt).toISOString(),
      }
    : null;

  const logout = useCallback(async () => {
    try {
      await authClient.signOut();
      window.location.href = "/login";
    } catch (err) {
      console.error("Logout error:", err);
      window.location.href = "/login";
    }
  }, []);

  const handleRefetch = useCallback(async () => {
    await refetch();
  }, [refetch]);

  return {
    user,
    loading: isPending,
    error: error?.message || null,
    isAdmin: user?.role === "ADMIN",
    isAuthenticated: !!user,
    refetch: handleRefetch,
    logout,
  };
}