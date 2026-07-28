// app/register/page.tsx
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
import { TermsCheckbox } from "@/components/TermsCheckbox";
import {
  Loader2,
  Stethoscope,
  Eye,
  EyeOff,
  AlertTriangle,
  UserPlus,
  Mail,
  Phone,
} from "lucide-react";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";

interface BetterAuthSignUpData {
  email: string;
  password: string;
  name: string;
  firstName: string;
  lastName: string;
  phone: string;
  role: string;
  status: string;
  isActive: boolean;
}

interface RegisterFormData {
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  phone: string;
}

interface FormErrors {
  terms?: string;
  [key: string]: string | undefined;
}

export default function RegisterPage() {
  const [formData, setFormData] = useState<RegisterFormData>({
    email: "",
    password: "",
    confirmPassword: "",
    firstName: "",
    lastName: "",
    phone: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});

  const router = useRouter();

  const validateForm = (): boolean => {
    if (!formData.email?.trim()) {
      setError("กรุณากรอกอีเมล");
      return false;
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(formData.email)) {
      setError("รูปแบบอีเมลไม่ถูกต้อง");
      return false;
    }

    if (!formData.password || formData.password.length < 8) {
      setError("รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร");
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("รหัสผ่านไม่ตรงกัน");
      return false;
    }

    if (!formData.firstName?.trim() || !formData.lastName?.trim()) {
      setError("กรุณากรอกชื่อ-นามสกุล");
      return false;
    }

    if (!acceptedTerms) {
      setErrors({ terms: "กรุณายอมรับข้อกำหนดและเงื่อนไขการใช้บริการ" });
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const signUpData: BetterAuthSignUpData = {
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        name: `${formData.firstName.trim()} ${formData.lastName.trim()}`,
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        phone: formData.phone.trim() || "",
        role: "USER",
        status: "ACTIVE",
        isActive: true,
      };

      const result = await authClient.signUp.email(signUpData);

      if (result.error) {
        throw new Error(result.error.message || "สร้างบัญชีไม่สำเร็จ");
      }

      toast.success("สร้างบัญชีสำเร็จ!", {
        description: "ยินดีต้อนรับเข้าสู่ NextJS Starter",
      });

      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "สร้างบัญชีไม่สำเร็จ";
      setError(errorMsg);
      toast.error("สร้างบัญชีไม่สำเร็จ", {
        description: errorMsg,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (error) setError("");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-primary p-4">
      {/* Background Gradient */}
      <div className="fixed inset-0 bg-linear-to-br from-brand-primary/10 via-brand-secondary/10 to-brand-tertiary/10 pointer-events-none dark:hidden" />
      
      <div className="relative w-full max-w-lg">
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

        {/* Register Form */}
        <Card className="shadow-xl border-border-primary bg-card/80 backdrop-blur-sm">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-xl text-center text-content-primary">
              สร้างบัญชี
            </CardTitle>
            <CardDescription className="text-center text-content-secondary">
              สร้างบัญชีเพื่อเริ่มใช้งาน Sandbox
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-content-primary">
                  <Mail className="w-4 h-4 inline mr-1" />
                  อีเมล *
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="your@email.com"
                  disabled={isLoading}
                  className="h-11 bg-input border-border-primary text-content-primary"
                  autoComplete="email"
                  required
                />
              </div>

              {/* Name */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName" className="text-content-primary">
                    ชื่อ *
                  </Label>
                  <Input
                    id="firstName"
                    name="firstName"
                    type="text"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    placeholder="ชื่อ"
                    disabled={isLoading}
                    className="h-11 bg-input border-border-primary text-content-primary"
                    autoComplete="given-name"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName" className="text-content-primary">
                    นามสกุล *
                  </Label>
                  <Input
                    id="lastName"
                    name="lastName"
                    type="text"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    placeholder="นามสกุล"
                    disabled={isLoading}
                    className="h-11 bg-input border-border-primary text-content-primary"
                    autoComplete="family-name"
                    required
                  />
                </div>
              </div>

              {/* Phone */}
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-content-primary">
                  <Phone className="w-4 h-4 inline mr-1" />
                  เบอร์โทรศัพท์ (ไม่บังคับ)
                </Label>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="08x-xxx-xxxx"
                  disabled={isLoading}
                  className="h-11 bg-input border-border-primary text-content-primary"
                  autoComplete="tel"
                />
              </div>

              {/* Password */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-content-primary">
                  รหัสผ่าน *
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder="รหัสผ่าน (อย่างน้อย 8 ตัวอักษร)"
                    disabled={isLoading}
                    className="h-11 pr-10 bg-input border-border-primary text-content-primary"
                    autoComplete="new-password"
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-11 w-10 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isLoading}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4 text-content-secondary" />
                    ) : (
                      <Eye className="w-4 h-4 text-content-secondary" />
                    )}
                  </Button>
                </div>
              </div>

              {/* Confirm Password */}
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-content-primary">
                  ยืนยันรหัสผ่าน *
                </Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    placeholder="ยืนยันรหัสผ่าน"
                    disabled={isLoading}
                    className="h-11 pr-10 bg-input border-border-primary text-content-primary"
                    autoComplete="new-password"
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-11 w-10 hover:bg-transparent"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    disabled={isLoading}
                  >
                    {showConfirmPassword ? (
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

              {/* Terms Checkbox */}
              <TermsCheckbox
                checked={acceptedTerms}
                onCheckedChange={(checked) => {
                  setAcceptedTerms(checked);
                  if (checked && errors.terms) {
                    setErrors({ ...errors, terms: undefined });
                  }
                }}
                error={errors.terms}
              />

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full h-11 text-base gradient-brand-semantic hover:opacity-90"
                disabled={isLoading || !acceptedTerms}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    กำลังสร้างบัญชี...
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4 mr-2" />
                    สร้างบัญชี
                  </>
                )}
              </Button>
            </form>

            {/* Login link */}
            <div className="text-center">
              <p className="text-sm text-content-secondary">
                มีบัญชีอยู่แล้ว?{" "}
                <Link
                  href="/login"
                  className="text-interactive-primary hover:opacity-80 font-medium"
                >
                  เข้าสู่ระบบ
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