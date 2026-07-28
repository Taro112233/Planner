// components/ProfilePage/ProfileHeader.tsx
'use client';

import React, { useRef } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Camera, Loader2 } from 'lucide-react';
import { getRoleIcon, getRoleBadgeClasses, getRoleDisplayNameEN } from '@/lib/auth-helpers';
import type { UserProfile } from '@/types/profile';
import { cn } from '@/lib/utils';

interface ProfileHeaderProps {
  profile: UserProfile;
  onAvatarUpload: (file: File) => Promise<void>;
  isUploading: boolean;
}

export function ProfileHeader({ profile, onAvatarUpload, isUploading }: ProfileHeaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getUserInitials = () => {
    const firstName = profile.firstName || profile.name?.split(' ')[0] || '';
    const lastName = profile.lastName || profile.name?.split(' ').slice(1).join(' ') || '';
    
    if (!firstName && !lastName) return 'U';
    
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    await onAvatarUpload(file);
    
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <Card>
      <CardContent className="pt-6 pb-6">
        <div className="flex flex-col sm:flex-row items-center gap-6">
          {/* Avatar */}
          <div className="relative">
            {/* ✅ Show skeleton while uploading */}
            {isUploading ? (
              <Skeleton className="h-24 w-24 rounded-full" />
            ) : (
              <Avatar className="h-24 w-24">
                {profile.image && (
                  <AvatarImage src={profile.image} alt={profile.name} />
                )}
                <AvatarFallback className="text-2xl gradient-brand-semantic text-white">
                  {getUserInitials()}
                </AvatarFallback>
              </Avatar>
            )}
            
            {/* Upload Button */}
            <Button
              size="icon"
              variant="secondary"
              className="absolute -bottom-2 -right-2 rounded-full h-8 w-8 shadow-md"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
            >
              {isUploading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Camera className="w-4 h-4" />
              )}
            </Button>
            
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>

          {/* User Info */}
          <div className="flex-1 text-center sm:text-left">
            <h2 className="text-2xl font-bold text-content-primary">
              {profile.name || `${profile.firstName} ${profile.lastName}`}
            </h2>
            <p className="text-content-secondary mt-1">{profile.email}</p>
            
            <div className="flex items-center gap-2 mt-3 justify-center sm:justify-start">
              {/* Role Badge */}
              <span className={cn(
                "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border",
                getRoleBadgeClasses(profile.role)
              )}>
                {getRoleIcon(profile.role)} {getRoleDisplayNameEN(profile.role)}
              </span>
              
              {/* Status Badge */}
              <span className={cn(
                "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border",
                profile.isActive 
                  ? "bg-alert-success-bg text-alert-success-text border-alert-success-border" 
                  : "bg-alert-error-bg text-alert-error-text border-alert-error-border"
              )}>
                {profile.isActive ? '✓ Active' : '✗ Inactive'}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}