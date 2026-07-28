// components/ProfilePage/index.tsx
'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { ProfileHeader } from './ProfileHeader';
import { PersonalInfoSection } from './PersonalInfoSection';
import { AccountSection } from './AccountSection';
import { ProfileSkeleton } from './ProfileSkeleton';
import { useProfile } from '@/hooks/useProfile';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

export function ProfilePage() {
  const { profile, loading, error, updateProfile, uploadAvatar, isUpdating } = useProfile();

  const handleAvatarUpload = async (file: File) => {
    const success = await uploadAvatar(file);
    
    if (success) {
      toast.success('อัปเดตรูปโปรไฟล์สำเร็จ');
    } else {
      toast.error('อัปโหลดรูปภาพไม่สำเร็จ');
    }
  };

  // ✅ Show skeleton while loading
  if (loading) {
    return <ProfileSkeleton />;
  }

  if (error || !profile) {
    return (
      <div className="relative min-h-screen">
        <div className="fixed inset-0 bg-linear-to-br from-brand-primary/10 via-brand-secondary/10 to-brand-tertiary/10 pointer-events-none dark:hidden" />
        
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {error || 'ไม่สามารถโหลดข้อมูลโปรไฟล์ได้'}
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="relative min-h-screen"
    >
      <div className="fixed inset-0 bg-linear-to-br from-brand-primary/10 via-brand-secondary/10 to-brand-tertiary/10 pointer-events-none dark:hidden" />
      
      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="mb-6"
        >
          <h1 className="text-2xl font-bold text-content-primary mb-2">
            ตั้งค่าโปรไฟล์
          </h1>
          <p className="text-content-secondary">
            จัดการข้อมูลส่วนตัวและการตั้งค่าบัญชีของคุณ
          </p>
        </motion.div>

        <div className="space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
          >
            <ProfileHeader
              profile={profile}
              onAvatarUpload={handleAvatarUpload}
              isUploading={isUpdating}
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
          >
            <PersonalInfoSection
              profile={profile}
              onUpdate={updateProfile}
              isUpdating={isUpdating}
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.4 }}
          >
            <AccountSection profile={profile} />
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}