// types/profile.ts
export interface UserProfile {
  id: string;
  email: string;
  name: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  image: string | null;
  role: 'USER' | 'ADMIN' | 'SUPERADMIN';
  status: string;
  isActive: boolean;
  emailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface UpdateProfileRequest {
  firstName: string;
  lastName: string;
  phone?: string;
}

export interface UpdateProfileResponse {
  success: boolean;
  data?: UserProfile;
  error?: string;
}