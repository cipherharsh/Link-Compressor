import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': path.resolve(import.meta.dirname, './src') },
  },
  assetsInclude: ['**/*.glsl'],
  build: {
    rollupOptions: {
      input: { main: path.resolve(import.meta.dirname, 'index.html') },
    },
  },
  server: { port: 3000 },
  // @ts-expect-error - vitest config in vite config
  test: {
    include: ['tests/**/*.test.ts']
  }
});
