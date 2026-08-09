// app/api/profile/avatar/route.ts
// Avatar Upload Controller — Layer 1 (HTTP only)
//
// Responsibilities: auth, file validation, upload to storage, call service.
// 🚫 No prisma.* calls. 🚫 No business logic beyond file-type guard.

import { NextRequest } from 'next/server';
import { auth } from '@/lib/server/auth';
import { validateFile } from '@/lib/server/file-validation';
import {
  apiSuccess,
  apiUnauthorized,
  apiBadRequest,
  apiNotFound,
  apiInternalError,
} from '@/lib/server/api-response';
import { updateAvatar } from '@/services/profile.service';

// ─────────────────────────────────────────────
// POST /api/profile/avatar
// ─────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) return apiUnauthorized();

    // Parse multipart form data
    let formData: FormData;
    try {
      formData = await request.formData();
    } catch {
      return apiBadRequest('Invalid form data');
    }

    const file = formData.get('avatar') as File | null;
    if (!file) return apiBadRequest('No file provided');

    // Generic file validation (size, extension)
    const validation = validateFile(file);
    if (!validation.isValid) return apiBadRequest(validation.error ?? 'Invalid file');

    // Avatar must be an image
    if (!file.type.startsWith('image/')) {
      return apiBadRequest('Only image files are accepted');
    }

    // Upload to Vercel Blob
    const { put } = await import('@vercel/blob');
    const ext = file.type.split('/')[1];
    const blobPath = `avatars/${session.user.id}/${Date.now()}-avatar.${ext}`;

    const blob = await put(blobPath, file, {
      access: 'public',
      addRandomSuffix: false,
    });

    // Persist the URL via service layer
    const updated = await updateAvatar(session.user.id, blob.url);
    return apiSuccess(updated, 'Avatar updated successfully');
  } catch (error) {
    if (error instanceof Error && error.message === 'User not found') {
      return apiNotFound('User not found');
    }
    console.error('[POST /api/profile/avatar]', error);
    return apiInternalError();
  }
}
