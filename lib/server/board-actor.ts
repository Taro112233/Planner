// lib/server/board-actor.ts
// Controller-layer helper shared by the planner API routes. Resolves which
// organization the request acts in (services/organization.service.ts) and
// shapes the ActorInput snapshot that services/board.service.ts writes into
// TaskActivity rows. Does not touch Prisma directly — pure orchestration.

import { cookies } from 'next/headers';
import { resolveActiveOrganization } from '@/services/organization.service';
import type { ActorInput } from '@/services/board.service';

/**
 * Which workspace the user last switched to. Server-readable only: it decides
 * what data a request may touch, so it must not be settable from client JS.
 */
export const ACTIVE_ORG_COOKIE = 'planner-active-org';

interface SessionUser {
  id: string;
  name: string;
  image?: string | null;
}

export interface BoardActorContext {
  organizationId: string;
  actor: ActorInput;
}

export async function resolveBoardActor(user: SessionUser): Promise<BoardActorContext> {
  const cookieStore = await cookies();
  const requestedOrganizationId = cookieStore.get(ACTIVE_ORG_COOKIE)?.value ?? null;

  // A cookie naming a workspace the user no longer belongs to falls back to
  // their default rather than failing the request.
  const context = await resolveActiveOrganization(
    user.id,
    user.name || user.id,
    requestedOrganizationId
  );
  const snapshotName = `${context.firstName} ${context.lastName}`.trim() || user.name;

  return {
    organizationId: context.organizationId,
    actor: {
      organizationUserId: context.organizationUserId,
      userId: user.id,
      name: snapshotName,
      avatarUrl: user.image ?? null,
      role: context.role,
    },
  };
}
