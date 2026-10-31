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
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/three')) {
            return 'vendor-three';
          }
          if (id.includes('node_modules/lucide-react')) {
            return 'vendor-icons';
          }
        }
      }
    },
    chunkSizeWarningLimit: 600
  },
  server: { port: 3000 },
  // @ts-expect-error - vitest config in vite config
  test: {
    include: ['tests/**/*.test.ts']
  }
});
