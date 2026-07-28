// app/login/page.tsx
"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import {
  Loader2,
  Eye,
  EyeOff,
  AlertTriangle,
  Stethoscope,
  LogIn,
} from "lucide-react";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";

// Google Icon Component
function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

interface LoginFormData {
  email: string;
  password: string;
}

export default function LoginPage() {
  const [formData, setFormData] = useState<LoginFormData>({
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [error, setError] = useState("");

  const router = useRouter();

  const validateForm = (): boolean => {
    if (!formData.email?.trim()) {
      setError("กรุณากรอกอีเมล");
      return false;
    }

    if (!formData.password?.trim()) {
      setError("กรุณากรอกรหัสผ่าน");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    setError("");

    try {
      const result = await authClient.signIn.email({
        email: formData.email.trim(),
        password: formData.password,
        rememberMe: true,
      });

      if (result.error) {
        throw new Error(result.error.message || "เข้าสู่ระบบไม่สำเร็จ");
      }

      toast.success("เข้าสู่ระบบสำเร็จ!", {
        description: "ยินดีต้อนรับเข้าสู่ NextJS Starter",
      });

      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "เข้าสู่ระบบไม่สำเร็จ";
      setError(errorMsg);
      toast.error("เข้าสู่ระบบไม่สำเร็จ", {
        description: errorMsg,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    setError("");

    try {
      await authClient.signIn.social({
        provider: "google",
        callbackURL: "/dashboard",
      });
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "เข้าสู่ระบบด้วย Google ไม่สำเร็จ";
      setError(errorMsg);
      toast.error("เข้าสู่ระบบไม่สำเร็จ", {
        description: errorMsg,
      });
      setIsGoogleLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (error) setError("");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-primary p-4">
      {/* Background Gradient */}
      <div className="fixed inset-0 bg-linear-to-br from-brand-primary/10 via-brand-secondary/10 to-brand-tertiary/10 pointer-events-none dark:hidden" />
      
      <div className="relative w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <Link
            href="/"
            className="inline-flex items-center gap-3 mb-4 group hover:opacity-80 transition-opacity cursor-pointer"
          >
            <div className="w-12 h-12 gradient-brand-semantic rounded-xl flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
              <Stethoscope className="w-7 h-7 text-white" />
            </div>
            <div className="text-left">
              <h1 className="text-2xl font-bold text-content-primary">
                NextJS Starter
              </h1>
              <p className="text-sm text-content-secondary">
                template for nextjs apps
              </p>
            </div>
          </Link>
        </div>

        {/* Login Form */}
        <Card className="shadow-xl border-border-primary bg-card/80 backdrop-blur-sm">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-xl text-center text-content-primary">
              เข้าสู่ระบบ
            </CardTitle>
            <CardDescription className="text-center text-content-secondary">
              เลือกวิธีเข้าสู่ระบบที่ต้องการ
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Google Sign In Button */}
            <Button
              type="button"
              variant="outline"
              className="w-full h-11"
              onClick={handleGoogleSignIn}
              disabled={isLoading || isGoogleLoading}
            >
              {isGoogleLoading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <GoogleIcon className="w-5 h-5 mr-2" />
              )}
              เข้าสู่ระบบด้วย Google
            </Button>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <Separator className="w-full" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-content-secondary">
                  หรือใช้อีเมล
                </span>
              </div>
            </div>

            {/* Email/Password Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-content-primary">
                  อีเมล
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="your@email.com"
                  disabled={isLoading || isGoogleLoading}
                  className="h-11 bg-input border-border-primary text-content-primary"
                  autoComplete="email"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-content-primary">
                  รหัสผ่าน
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder="กรอกรหัสผ่าน"
                    disabled={isLoading || isGoogleLoading}
                    className="h-11 pr-10 bg-input border-border-primary text-content-primary"
                    autoComplete="current-password"
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-11 w-10 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isLoading || isGoogleLoading}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4 text-content-secondary" />
                    ) : (
                      <Eye className="w-4 h-4 text-content-secondary" />
                    )}
                  </Button>
                </div>
              </div>

              {error && (
                <Alert variant="destructive" className="bg-alert-error-bg border-alert-error-border">
                  <AlertTriangle className="h-4 w-4 text-alert-error-icon" />
                  <AlertDescription className="text-alert-error-text">
                    {error}
                  </AlertDescription>
                </Alert>
              )}

              <Button
                type="submit"
                className="w-full h-11 text-base gradient-brand-semantic hover:opacity-90"
                disabled={isLoading || isGoogleLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    กำลังเข้าสู่ระบบ...
                  </>
                ) : (
                  <>
                    <LogIn className="w-4 h-4 mr-2" />
                    เข้าสู่ระบบ
                  </>
                )}
              </Button>
            </form>

            <div className="text-center">
              <p className="text-sm text-content-secondary">
                ยังไม่มีบัญชี?{" "}
                <Link
                  href="/register"
                  className="text-interactive-primary hover:opacity-80 font-medium"
                >
                  สร้างบัญชี
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-content-secondary">
          <p>NextJS Starter - template for nextjs apps</p>
          <p>© 2025 - Educational & Experimental Use Only</p>
        </div>
      </div>
    </div>
  );
}