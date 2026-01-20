import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['**/*.test.ts'],
    exclude: ['**/node_modules/**', '**/dist/**', '**/lib/**'],
    coverage: {
      reporter: ['json', 'html'],
    },
    testTimeout: 30000,
  },
});
