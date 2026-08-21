import { defineConfig } from 'vite';

export default defineConfig({
  base: './', // Relative base path guarantees zero 404 asset path issues on GitHub Pages
  build: {
    outDir: 'dist',
    assetsDir: 'assets'
  }
});
