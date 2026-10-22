import { defineConfig } from 'vite';

export default defineConfig({
  root: 'client',
  publicDir: 'public',
  build: { outDir: '../dist', emptyOutDir: true, chunkSizeWarningLimit: 2000 },
  server: {
    port: 5173,
    host: true,
    proxy: { '/ws': { target: 'ws://localhost:8080', ws: true } },
  },
});
