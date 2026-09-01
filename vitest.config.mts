// vitest.config.mts
// Vitest configuration for unit testing the service layer.
// Tests run in Node environment (no browser/DOM needed for services).
// Prisma is mocked via vitest-mock-extended — no real DB connections.
//
// NOTE: the `.mts` extension is load-bearing. package.json has no
// `"type": "module"`, so a `vitest.config.ts` gets loaded as CommonJS, which
// makes Vite `require()` vitest's CJS entry — and that entry `require()`s
// std-env v4, an ESM-only package. On Node < 20.19 `require(esm)` throws
// ERR_REQUIRE_ESM and Vitest can't start at all. `.mts` forces the ESM loader
// and the whole chain resolves. Don't rename it back to `.ts`.

import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  test: {
    // Node environment — services have no browser dependencies
    environment: 'node',

    // Global test APIs (describe, it, expect, vi) available without importing
    globals: true,

    // Run setup file before every test suite
    setupFiles: ['./tests/setup.ts'],

    // Test file patterns
    include: [
      'services/**/*.test.ts',
      '__tests__/**/*.test.ts',
    ],

    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'json-summary'],
      // Only measure coverage on service files
      include: ['services/**/*.ts'],
      exclude: ['services/**/*.test.ts', 'services/**/*.d.ts'],
      thresholds: {
        lines:     80,
        functions: 80,
        branches:  70,
        statements: 80,
      },
    },
  },

  resolve: {
    alias: {
      // Mirror the @/* path alias from tsconfig.json
      '@': fileURLToPath(new URL('.', import.meta.url)),
    },
  },
});
