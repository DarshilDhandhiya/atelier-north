import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

const api = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env?.VITE_DEV_API ?? 'http://localhost:5000';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: { '/api': api, '/uploads': api, '/sitemap.xml': api, '/robots.txt': api },
  },
  build: {
    sourcemap: false,
  },
  test: { environment: 'jsdom', globals: true, setupFiles: ['./src/test/setup.ts'], css: false },
});
