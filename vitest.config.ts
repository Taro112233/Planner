// vitest.config.ts
// Vitest configuration for unit testing the service layer.
// Tests run in Node environment (no browser/DOM needed for services).
// Prisma is mocked via vitest-mock-extended — no real DB connections.

import { defineConfig } from 'vitest/config';
import path from 'path';

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
      '@': path.resolve(__dirname, '.'),
    },
  },
});
