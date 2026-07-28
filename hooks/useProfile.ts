// hooks/useProfile.ts
import { useState, useEffect, useCallback } from 'react';
import type { UserProfile, UpdateProfileRequest } from '@/types/profile';

interface UseProfileReturn {
  profile: UserProfile | null;
  loading: boolean;
  error: string | null;
  updateProfile: (data: UpdateProfileRequest) => Promise<boolean>;
  uploadAvatar: (file: File) => Promise<boolean>;
  refetch: () => Promise<void>;
  isUpdating: boolean;
}

export function useProfile(): UseProfileReturn {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/profile', {
        credentials: 'include',
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('กรุณาเข้าสู่ระบบ');
        }
        throw new Error('ไม่สามารถโหลดข้อมูลได้');
      }

      const data = await response.json();

      if (data.success) {
        setProfile(data.data);
      } else {
        throw new Error(data.error || 'Failed to load profile');
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'เกิดข้อผิดพลาด';
      setError(errorMsg);
      console.error('Fetch profile error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const updateProfile = async (data: UpdateProfileRequest): Promise<boolean> => {
    try {
      setIsUpdating(true);
      setError(null);

      const response = await fetch('/api/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'อัปเดตข้อมูลไม่สำเร็จ');
      }

      if (result.success) {
        setProfile(result.data);
        return true;
      } else {
        throw new Error(result.error || 'Failed to update profile');
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'เกิดข้อผิดพลาด';
      setError(errorMsg);
      console.error('Update profile error:', err);
      return false;
    } finally {
      setIsUpdating(false);
    }
  };

  const uploadAvatar = async (file: File): Promise<boolean> => {
    try {
      setIsUpdating(true);
      setError(null);

      const formData = new FormData();
      formData.append('avatar', file);

      const response = await fetch('/api/profile/avatar', {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'อัปโหลดรูปภาพไม่สำเร็จ');
      }

      if (result.success) {
        setProfile(result.data);
        return true;
      } else {
        throw new Error(result.error || 'Failed to upload avatar');
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'เกิดข้อผิดพลาด';
      setError(errorMsg);
      console.error('Upload avatar error:', err);
      return false;
    } finally {
      setIsUpdating(false);
    }
  };

  return {
    profile,
    loading,
    error,
    updateProfile,
    uploadAvatar,
    refetch: fetchProfile,
    isUpdating,
  };
}