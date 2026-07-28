// components/providers/AuthProvider.tsx
"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { authClient, useSession } from "@/lib/auth-client";

// ✅ Define Better Auth User interface
interface BetterAuthUser {
  id: string;
  email: string;
  name: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  role?: 'USER' | 'ADMIN' | 'SUPERADMIN';
  status?: string;
  isActive?: boolean;
  image?: string;
  emailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Types
export interface AuthUser {
  id: string;
  email: string;
  name: string;
  firstName?: string;
  lastName?: string;
  phone?: string; // ✅ Changed from string | null to string | undefined
  role: "USER" | "ADMIN" | "SUPERADMIN";
  status: string;
  isActive: boolean;
  image?: string;
  emailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  signIn: {
    email: (data: {
      email: string;
      password: string;
      rememberMe?: boolean;
    }) => Promise<void>;
    google: () => Promise<void>;
  };
  signUp: (data: {
    email: string;
    password: string;
    name: string;
    firstName: string;
    lastName: string;
    phone?: string;
  }) => Promise<void>;
  signOut: () => Promise<void>;
  refetch: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { data: session, isPending, refetch } = useSession();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isPending) {
      setIsLoading(false);
    }
  }, [isPending]);

  // Transform session user to our AuthUser type
  const user: AuthUser | null = session?.user
    ? (() => {
        // ✅ Type user properly
        const betterAuthUser = session.user as BetterAuthUser;
        
        return {
          id: betterAuthUser.id,
          email: betterAuthUser.email,
          name: betterAuthUser.name,
          firstName: betterAuthUser.firstName || betterAuthUser.name?.split(" ")[0] || "",
          lastName: betterAuthUser.lastName || betterAuthUser.name?.split(" ").slice(1).join(" ") || "",
          phone: betterAuthUser.phone || undefined, // ✅ Changed from null to undefined
          role: (betterAuthUser.role || "USER") as "USER" | "ADMIN",
          status: betterAuthUser.status || "ACTIVE",
          isActive: betterAuthUser.isActive ?? true,
          image: betterAuthUser.image || undefined,
          emailVerified: betterAuthUser.emailVerified || false,
          createdAt: new Date(betterAuthUser.createdAt),
          updatedAt: new Date(betterAuthUser.updatedAt),
        };
      })()
    : null;

  const handleSignInEmail = async (data: {
    email: string;
    password: string;
    rememberMe?: boolean;
  }) => {
    const result = await authClient.signIn.email({
      email: data.email,
      password: data.password,
      rememberMe: data.rememberMe ?? true,
    });

    if (result.error) {
      throw new Error(result.error.message || "เข้าสู่ระบบไม่สำเร็จ");
    }
  };

  const handleSignInGoogle = async () => {
    const result = await authClient.signIn.social({
      provider: "google",
      callbackURL: "/dashboard",
    });

    if (result.error) {
      throw new Error(result.error.message || "เข้าสู่ระบบด้วย Google ไม่สำเร็จ");
    }
  };

  const handleSignUp = async (data: {
    email: string;
    password: string;
    name: string;
    firstName: string;
    lastName: string;
    phone?: string;
  }) => {
    // ✅ Type the sign up data with proper Better Auth structure
    const signUpData = {
      email: data.email,
      password: data.password,
      name: data.name,
      // Additional fields will be handled by Better Auth
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone || "",
      role: "USER",
      status: "ACTIVE",
      isActive: true,
    };

    const result = await authClient.signUp.email(signUpData);

    if (result.error) {
      throw new Error(result.error.message || "สร้างบัญชีไม่สำเร็จ");
    }
  };

  const handleSignOut = async () => {
    await authClient.signOut();
    window.location.href = "/login";
  };

  const handleRefetch = async () => {
    await refetch();
  };

  const value: AuthContextType = {
    user,
    loading: isLoading,
    isAuthenticated: !!user,
    isAdmin: user?.role === "ADMIN",
    signIn: {
      email: handleSignInEmail,
      google: handleSignInGoogle,
    },
    signUp: handleSignUp,
    signOut: handleSignOut,
    refetch: handleRefetch,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

// Export for backward compatibility
export { useAuth as useCurrentUser };