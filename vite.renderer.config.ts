import { defineConfig } from 'vite';
import path from 'node:path';

export default defineConfig({
  root: __dirname,
  base: './',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: true,
    rollupOptions: {
      input: path.resolve(__dirname, 'index.html'),
      output: {
        entryFileNames: 'main.js',
        assetFileNames: '[name][extname]',
      },
    },
  },
  server: {
    port: 5173,
    strictPort: true,
  },
});
