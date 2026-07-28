// app/api/profile/route.ts
// Profile Controller — Layer 1 (HTTP only)
//
// Responsibilities: auth check, Zod validation, call service, map errors → HTTP.
// 🚫 No prisma.* calls. 🚫 No business logic.

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import {
  apiSuccess,
  apiUnauthorized,
  apiBadRequest,
  apiNotFound,
  apiZodError,
  apiInternalError,
} from '@/lib/api-response';
import {
  getProfileById,
  updateProfile,
} from '@/services/profile.service';

// ─────────────────────────────────────────────
// Validation schema
// ─────────────────────────────────────────────

const UpdateProfileSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(100),
  lastName:  z.string().min(1, 'Last name is required').max(100),
  phone:     z.string().max(20).optional(),
});

// ─────────────────────────────────────────────
// GET /api/profile
// ─────────────────────────────────────────────

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) return apiUnauthorized();

    const profile = await getProfileById(session.user.id);
    return apiSuccess(profile);
  } catch (error) {
    if (error instanceof Error && error.message === 'User not found') {
      return apiNotFound('User not found');
    }
    console.error('[GET /api/profile]', error);
    return apiInternalError();
  }
}

// ─────────────────────────────────────────────
// PATCH /api/profile
// ─────────────────────────────────────────────

export async function PATCH(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) return apiUnauthorized();

    const body = await request.json().catch(() => null);
    if (!body) return apiBadRequest('Request body is required');

    const parsed = UpdateProfileSchema.safeParse(body);
    if (!parsed.success) return apiZodError(parsed.error);

    const updated = await updateProfile(session.user.id, parsed.data);
    return apiSuccess(updated, 'Profile updated successfully');
  } catch (error) {
    if (error instanceof Error && error.message === 'User not found') {
      return apiNotFound('User not found');
    }
    console.error('[PATCH /api/profile]', error);
    return apiInternalError();
  }
}
