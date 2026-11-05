import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// Asset base path. Hosts that serve from the domain root (Vercel, Netlify, a
// custom domain, local dev) use '/'. GitHub Pages project sites live under
// /<repo>/, so the Pages workflow sets BASE_PATH=/Link-Compressor/.
export default defineConfig(() => ({
  base: process.env.BASE_PATH || '/',
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
