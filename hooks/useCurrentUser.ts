// hooks/useCurrentUser.ts
// NextJS Starter - Current User Hook (Better Auth Version)

"use client";

import { useSession, authClient } from "@/lib/client/auth-client";
import { useCallback, useRef } from "react";

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
  // Custom server fields are not inferred by the base Better Auth client.
  const customFields = session?.user as Partial<Pick<CurrentUser,
    "firstName" | "lastName" | "phone" | "role" | "status" | "isActive"
  >> | undefined;

  // Transform session user to CurrentUser type
  const sessionUser: CurrentUser | null = session?.user
    ? {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name,
        firstName:
          customFields?.firstName ||
          session.user.name?.split(" ")[0] ||
          "",
        lastName:
          customFields?.lastName ||
          session.user.name?.split(" ").slice(1).join(" ") ||
          "",
        fullName: session.user.name,
        phone: customFields?.phone || null,
        role: customFields?.role || "USER",
        status: customFields?.status || "ACTIVE",
        isActive: customFields?.isActive ?? true,
        emailVerified: session.user.emailVerified || false,
        image: session.user.image || undefined,
        createdAt: new Date(session.user.createdAt).toISOString(),
        updatedAt: new Date(session.user.updatedAt).toISOString(),
      }
    : null;

  // Better Auth can briefly report no session data while it revalidates.
  // Serving the last known user through that window stops consumers from
  // tearing their whole tree down (and re-running every fetch) on a refresh
  // that changes nothing. Once `isPending` clears we trust the real value, so
  // a genuine logout or expiry still resolves to null.
  const lastUserRef = useRef<CurrentUser | null>(null);
  if (sessionUser) {
    lastUserRef.current = sessionUser;
  } else if (!isPending) {
    lastUserRef.current = null;
  }
  const user = sessionUser ?? (isPending ? lastUserRef.current : null);

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
