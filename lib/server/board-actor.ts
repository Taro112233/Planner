// lib/server/board-actor.ts
// Controller-layer helper shared by app/api/board/** routes.
// Resolves the session user's default organization (services/organization.service.ts)
// and shapes the ActorInput snapshot that services/board.service.ts writes into
// TaskActivity rows. Does not touch Prisma directly — pure orchestration + mapping.

import { getOrCreateDefaultOrganization } from '@/services/organization.service';
import type { ActorInput } from '@/services/board.service';

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
  const context = await getOrCreateDefaultOrganization(user.id, user.name || user.id);
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
