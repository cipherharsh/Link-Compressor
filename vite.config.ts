import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

/**
 * Link previews (Open Graph / Twitter cards) need absolute URLs, which differ per
 * deployment. SITE_URL wins (the GitHub Pages workflow sets it); on Vercel the
 * production host comes from VERCEL_PROJECT_PRODUCTION_URL. Locally it's empty,
 * so the tags fall back to root-relative paths.
 */
function siteMeta(): Plugin {
  const vercelHost = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  const siteUrl = (process.env.SITE_URL || (vercelHost ? `https://${vercelHost}` : '')).replace(/\/+$/, '');
  return {
    name: 'linkzip-site-meta',
    transformIndexHtml: (html) => html.split('__SITE_URL__').join(siteUrl),
  };
}

// Asset base path. Hosts that serve from the domain root (Vercel, Netlify, a
// custom domain, local dev) use '/'. GitHub Pages project sites live under
// /<repo>/, so the Pages workflow sets BASE_PATH=/Link-Compressor/.
export default defineConfig(() => ({
  base: process.env.BASE_PATH || '/',
  plugins: [react(), siteMeta()],
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
