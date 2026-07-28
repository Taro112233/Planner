// components/ProfilePage/AccountSection.tsx
'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Mail, Shield, Calendar, CheckCircle2, XCircle } from 'lucide-react';
import { format } from 'date-fns';
import { th } from 'date-fns/locale';
import type { UserProfile } from '@/types/profile';

interface AccountSectionProps {
  profile: UserProfile;
}

export function AccountSection({ profile }: AccountSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="w-5 h-5" />
          ข้อมูลบัญชี
        </CardTitle>
        <CardDescription>
          ข้อมูลบัญชีและสถานะ (อ่านอย่างเดียว)
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Email */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 min-w-0">
            <Mail className="w-5 h-5 text-content-secondary shrink-0 mt-0.5" />
            <div className="min-w-0">
              <p className="text-sm font-medium text-content-secondary">อีเมล</p>
              <p className="text-base text-content-primary break-all">{profile.email}</p>
            </div>
          </div>
          
          {profile.emailVerified ? (
            <Badge variant="outline" className="bg-alert-success-bg text-alert-success-text border-alert-success-border shrink-0">
              <CheckCircle2 className="w-3 h-3 mr-1" />
              ยืนยันแล้ว
            </Badge>
          ) : (
            <Badge variant="outline" className="bg-alert-warning-bg text-alert-warning-text border-alert-warning-border shrink-0">
              <XCircle className="w-3 h-3 mr-1" />
              ยังไม่ยืนยัน
            </Badge>
          )}
        </div>

        {/* Role */}
        <div className="flex items-center gap-3">
          <Shield className="w-5 h-5 text-content-secondary" />
          <div>
            <p className="text-sm font-medium text-content-secondary">สิทธิ์การใช้งาน</p>
            <p className="text-base text-content-primary">
              {profile.role === 'ADMIN' ? '👑 ผู้ดูแลระบบ (Admin)' : '👤 ผู้ใช้งาน (User)'}
            </p>
          </div>
        </div>

        {/* Status */}
        <div className="flex items-center gap-3">
          <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
            profile.isActive ? 'bg-alert-success-bg' : 'bg-alert-error-bg'
          }`}>
            {profile.isActive ? (
              <CheckCircle2 className="w-3 h-3 text-alert-success-icon" />
            ) : (
              <XCircle className="w-3 h-3 text-alert-error-icon" />
            )}
          </div>
          <div>
            <p className="text-sm font-medium text-content-secondary">สถานะบัญชี</p>
            <p className="text-base text-content-primary">
              {profile.isActive ? 'ใช้งานปกติ' : 'ระงับการใช้งาน'}
            </p>
          </div>
        </div>

        {/* Created At */}
        <div className="flex items-center gap-3">
          <Calendar className="w-5 h-5 text-content-secondary" />
          <div>
            <p className="text-sm font-medium text-content-secondary">สร้างบัญชีเมื่อ</p>
            <p className="text-base text-content-primary">
              {format(new Date(profile.createdAt), 'dd MMMM yyyy, HH:mm', { locale: th })}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}