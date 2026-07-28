// components/ProfilePage/PersonalInfoSection.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { User, Phone, Save, X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import type { UserProfile, UpdateProfileRequest } from '@/types/profile';

interface PersonalInfoSectionProps {
  profile: UserProfile;
  onUpdate: (data: UpdateProfileRequest) => Promise<boolean>;
  isUpdating: boolean;
}

export function PersonalInfoSection({ profile, onUpdate, isUpdating }: PersonalInfoSectionProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<UpdateProfileRequest>({
    firstName: profile.firstName || '',
    lastName: profile.lastName || '',
    phone: profile.phone || '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    setFormData({
      firstName: profile.firstName || '',
      lastName: profile.lastName || '',
      phone: profile.phone || '',
    });
  }, [profile]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'กรุณากรอกชื่อ';
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = 'กรุณากรอกนามสกุล';
    }

    if (formData.phone && formData.phone.length > 20) {
      newErrors.phone = 'เบอร์โทรศัพท์ยาวเกินไป';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    const success = await onUpdate(formData);

    if (success) {
      setIsEditing(false);
      toast.success('อัปเดตข้อมูลสำเร็จ');
    }
  };

  const handleCancel = () => {
    setFormData({
      firstName: profile.firstName || '',
      lastName: profile.lastName || '',
      phone: profile.phone || '',
    });
    setErrors({});
    setIsEditing(false);
  };

  const handleInputChange = (field: keyof UpdateProfileRequest, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              ข้อมูลส่วนตัว
            </CardTitle>
            <CardDescription>
              จัดการข้อมูลส่วนตัวของคุณ
            </CardDescription>
          </div>

          {!isEditing && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditing(true)}
            >
              แก้ไข
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* First Name */}
            <div className="space-y-2">
              <Label htmlFor="firstName">ชื่อ *</Label>
              <Input
                id="firstName"
                value={formData.firstName}
                onChange={(e) => handleInputChange('firstName', e.target.value)}
                disabled={!isEditing || isUpdating}
                className={errors.firstName ? 'border-alert-error-border' : ''}
              />
              {errors.firstName && (
                <p className="text-sm text-alert-error-text">{errors.firstName}</p>
              )}
            </div>

            {/* Last Name */}
            <div className="space-y-2">
              <Label htmlFor="lastName">นามสกุล *</Label>
              <Input
                id="lastName"
                value={formData.lastName}
                onChange={(e) => handleInputChange('lastName', e.target.value)}
                disabled={!isEditing || isUpdating}
                className={errors.lastName ? 'border-alert-error-border' : ''}
              />
              {errors.lastName && (
                <p className="text-sm text-alert-error-text">{errors.lastName}</p>
              )}
            </div>
          </div>

          {/* Phone */}
          <div className="space-y-2">
            <Label htmlFor="phone">
              <Phone className="w-4 h-4 inline mr-1" />
              เบอร์โทรศัพท์
            </Label>
            <Input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => handleInputChange('phone', e.target.value)}
              disabled={!isEditing || isUpdating}
              placeholder="08x-xxx-xxxx"
              className={errors.phone ? 'border-alert-error-border' : ''}
            />
            {errors.phone && (
              <p className="text-sm text-alert-error-text">{errors.phone}</p>
            )}
          </div>

          {/* Action Buttons */}
          {isEditing && (
            <div className="flex justify-end gap-3 pt-4 border-t border-border-primary">
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                disabled={isUpdating}
              >
                <X className="w-4 h-4 mr-2" />
                ยกเลิก
              </Button>
              <Button
                type="submit"
                disabled={isUpdating}
                className="gradient-brand-semantic hover:opacity-90"
              >
                {isUpdating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    กำลังบันทึก...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    บันทึก
                  </>
                )}
              </Button>
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  );
}