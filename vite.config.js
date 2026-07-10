import { defineConfig } from 'vite';

export default defineConfig({
  base: './', // Allow deployment to subdirectories like github.io/repo/
  server: {
    port: 3000,
    open: true
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets'
  }
});
