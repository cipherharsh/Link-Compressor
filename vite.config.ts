import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// The production site is served from https://<user>.github.io/Link-Compressor/,
// so the build needs that base path for assets to resolve. Dev stays at the root.
export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/Link-Compressor/' : '/',
  plugins: [react()],
  resolve: {
    alias: { '@': path.resolve(import.meta.dirname, './src') },
  },
  build: {
    rollupOptions: {
      input: { main: path.resolve(import.meta.dirname, 'index.html') },
    },
  },
  server: { port: 3000 },
  // @ts-expect-error - vitest config in vite config
  test: {
    include: ['tests/**/*.test.ts'],
  },
}));
