// hooks/useAdminUsers.ts
import { useState, useEffect, useCallback } from 'react';
import type { UserRole } from '@prisma/client';

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  image: string | null;
  role: UserRole;
  status: string;
  isActive: boolean;
  emailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastLogin: Date | null;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface FetchParams {
  page?: number;
  limit?: number;
  search?: string;
  role?: UserRole | '';
}

interface UseAdminUsersReturn {
  users: AdminUser[];
  pagination: Pagination | null;
  loading: boolean;
  error: string | null;
  fetchParams: FetchParams;
  setFetchParams: (params: Partial<FetchParams>) => void;
  refetch: () => Promise<void>;
  updateUserRole: (userId: string, newRole: UserRole) => Promise<boolean>;
  isUpdating: boolean;
}

export function useAdminUsers(): UseAdminUsersReturn {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [fetchParams, _setFetchParams] = useState<FetchParams>({
    page: 1,
    limit: 20,
    search: '',
    role: '',
  });

  const setFetchParams = useCallback((params: Partial<FetchParams>) => {
    _setFetchParams((prev) => ({
      ...prev,
      ...params,
      // Reset to page 1 when filter/search changes
      page: params.page ?? (params.search !== undefined || params.role !== undefined ? 1 : prev.page),
    }));
  }, []);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (fetchParams.page) params.set('page', fetchParams.page.toString());
      if (fetchParams.limit) params.set('limit', fetchParams.limit.toString());
      if (fetchParams.search) params.set('search', fetchParams.search);
      if (fetchParams.role) params.set('role', fetchParams.role);

      const response = await fetch(`/api/admin/users?${params.toString()}`, {
        credentials: 'include',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to fetch users');
      }

      const data = await response.json();

      if (data.success) {
        setUsers(data.data.items);
        setPagination(data.data.pagination);
      } else {
        throw new Error(data.error || 'Failed to fetch users');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาด');
    } finally {
      setLoading(false);
    }
  }, [fetchParams]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const updateUserRole = async (userId: string, newRole: UserRole): Promise<boolean> => {
    try {
      setIsUpdating(true);

      const response = await fetch(`/api/admin/users/${userId}/role`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ role: newRole }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update role');
      }

      if (data.success) {
        // Optimistic update in local state
        setUsers((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
        );
        return true;
      }

      throw new Error(data.error || 'Failed to update role');
    } catch (err) {
      throw err; // re-throw so caller can show toast
    } finally {
      setIsUpdating(false);
    }
  };

  return {
    users,
    pagination,
    loading,
    error,
    fetchParams,
    setFetchParams,
    refetch: fetchUsers,
    updateUserRole,
    isUpdating,
  };
}