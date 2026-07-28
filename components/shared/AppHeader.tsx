// components/shared/AppHeader.tsx
"use client";

import React from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import {
  Stethoscope,
  Plus,
  LogOut,
  User,
  Shield,
  ChevronDown,
  Send,
  Crown,
} from "lucide-react";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { CompactThemeSelector } from "@/components/theme/CompactThemeSelector";
import { hasAdminAccess, isSuperAdmin } from "@/lib/auth-helpers";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "Home" },
  { href: "/dashboard", label: "Dashboard", authRequired: true },
];

export function AppHeader() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout } = useCurrentUser();

  if (
    pathname === "/login" ||
    pathname === "/register" ||
    pathname === "/not-found"
  ) {
    return null;
  }

  const getUserInitials = () => {
    if (!user) return "U";
    return `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase();
  };

  const handleLogout = async () => {
    await logout();
  };

  const isActivePath = (path: string) => {
    if (path === "/") return pathname === "/";
    return pathname.startsWith(path);
  };

  return (
    <header className="bg-card border-b border-border sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo with Mobile Menu */}
          <div className="md:hidden">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 hover:opacity-80 transition-opacity cursor-pointer">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg gradient-brand-semantic">
                    <Stethoscope className="w-6 h-6 text-white" />
                  </div>
                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                <DropdownMenuLabel>Navigation</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {navItems.map((item) => {
                  if (item.authRequired && !user) return null;

                  return (
                    <DropdownMenuItem key={item.href} asChild>
                      <Link
                        href={item.href}
                        className={cn(
                          "cursor-pointer",
                          isActivePath(item.href) && "bg-accent"
                        )}
                      >
                        {item.label}
                      </Link>
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Logo (768px - 1024px) */}
          <Link
            href="/"
            className="hidden md:flex xl:hidden items-center gap-3 hover:opacity-80 transition-opacity"
          >
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg gradient-brand-semantic">
              <Stethoscope className="w-6 h-6 text-white" />
            </div>
          </Link>

          {/* Logo with Platform Name (1024px+) */}
          <Link
            href="/"
            className="hidden xl:flex items-center gap-3 hover:opacity-80 transition-opacity"
          >
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg gradient-brand-semantic">
              <Stethoscope className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">
                NextJS Starter
              </h1>
              <p className="text-xs text-muted-foreground">
                template for nextjs apps
              </p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-10 flex-1 justify-center">
            {navItems.map((item) => {
              if (item.authRequired && !user) return null;

              const isActive = isActivePath(item.href);

              return (
                <Link key={item.href} href={item.href}>
                  <Button
                    variant={isActive ? "secondary" : "ghost"}
                    size="sm"
                    className={cn("px-4", isActive && "bg-accent")}
                  >
                    {item.label}
                  </Button>
                </Link>
              );
            })}
          </nav>

          {/* Right Side Actions */}
          <div className="flex items-center gap-3">
            {/* Theme Selector */}
            <CompactThemeSelector />

            {user && (
              <>
                {/* New Request Button */}
                <Link href="/requests/new">
                  <Button className="hidden lg:flex items-center gap-2 gradient-brand-semantic hover:opacity-90">
                    <Send className="w-4 h-4" />
                    ส่งคำขอใหม่
                  </Button>
                  <Button
                    size="icon"
                    className="lg:hidden gradient-brand-semantic hover:opacity-90"
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </Link>

                {/* User Menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      className="flex items-center gap-2 pl-2 pr-3 cursor-pointer"
                    >
                      <Avatar className="h-8 w-8">
                        {user.image && (
                          <AvatarImage
                            src={user.image}
                            alt={
                              user.fullName ||
                              `${user.firstName} ${user.lastName}`
                            }
                          />
                        )}
                        <AvatarFallback className="gradient-brand-semantic text-white text-sm">
                          {getUserInitials()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="hidden 2xl:flex flex-col items-start">
                        <span className="text-sm font-medium text-foreground">
                          {user.fullName}
                        </span>
                        <div className="flex items-center gap-1">
                          {hasAdminAccess(user.role) && (
                            <Badge
                              variant="outline"
                              className={cn(
                                "text-xs px-1.5 py-0",
                                isSuperAdmin(user.role)
                                  ? "border-purple-300 dark:border-purple-700 text-purple-700 dark:text-purple-300"
                                  : "border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300"
                              )}
                            >
                              {isSuperAdmin(user.role) ? (
                                <>
                                  <Crown className="w-3 h-3 mr-1" />
                                  Super Admin
                                </>
                              ) : (
                                <>
                                  <Shield className="w-3 h-3 mr-1" />
                                  Admin
                                </>
                              )}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>
                      <div className="flex flex-col">
                        <span className="font-medium">{user.fullName}</span>
                        <span className="text-xs text-muted-foreground font-normal">
                          {user.email}
                        </span>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />

                    {hasAdminAccess(user.role) && (
                      <DropdownMenuItem onClick={() => router.push("/admin")}>
                        <Shield className="w-4 h-4 mr-2" />
                        Admin Panel
                      </DropdownMenuItem>
                    )}

                    <DropdownMenuItem onClick={() => router.push("/profile")}>
                      <User className="w-4 h-4 mr-2" />
                      ตั้งค่าโปรไฟล์
                    </DropdownMenuItem>

                    <DropdownMenuSeparator />

                    <DropdownMenuItem
                      onClick={handleLogout}
                      className="text-red-600 dark:text-red-400 focus:text-red-600 dark:focus:text-red-400 focus:bg-red-50 dark:focus:bg-red-950/20"
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      ออกจากระบบ
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            )}

            {!user && (
              <Link href="/login">
                <Button>เข้าสู่ระบบ</Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}