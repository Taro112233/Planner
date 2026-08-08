// tests/prisma-mock.ts
// Centralised Prisma mock using vitest-mock-extended.
//
// How it works:
//   1. vi.mock('@/lib/server/prisma') intercepts every `import { prisma }` in services.
//   2. mockDeep<PrismaClient>() returns a fully type-safe mock where every
//      Prisma method (findUnique, update, create, …) is a vi.fn().
//   3. mockReset(prismaMock) clears call history before each test.
//
// Import pattern in test files:
//   import { prismaMock } from '@/tests/prisma-mock';
//   prismaMock.user.findUnique.mockResolvedValue({ id: '1', ... });

import { vi } from 'vitest';
import { mockDeep, mockReset, type DeepMockProxy } from 'vitest-mock-extended';
import { PrismaClient } from '@prisma/client';

// The typed mock instance — use this in tests to set up return values
export const prismaMock = mockDeep<PrismaClient>() as DeepMockProxy<PrismaClient>;

// Tell Vitest to replace @/lib/server/prisma with our mock
vi.mock('@/lib/server/prisma', () => ({
  prisma: prismaMock,
}));

// Reset all mocked method call history before each test
import { beforeEach } from 'vitest';
beforeEach(() => {
  mockReset(prismaMock);
});
