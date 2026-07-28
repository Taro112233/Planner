// tests/setup.ts
// Global test setup — runs before every test file.
// Clears all mocks between tests to prevent state bleed.

import { vi, beforeEach, afterEach } from 'vitest';

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  vi.restoreAllMocks();
});
