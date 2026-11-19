import { defineConfig } from 'vitest/config';
export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    globalSetup: ['tests/globalSetup.ts'],
    hookTimeout: 120000,
    testTimeout: 30000,
    fileParallelism: false,
  },
});
