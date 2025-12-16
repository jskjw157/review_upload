import { defineConfig } from 'vite';
import { builtinModules } from 'node:module';
import path from 'node:path';

export default defineConfig({
  build: {
    outDir: 'dist-electron',
    sourcemap: true,
    target: 'node18',
    lib: {
      entry: path.resolve(__dirname, 'src/main/main.ts'),
      formats: ['cjs'],
      fileName: () => 'main.js',
    },
    rollupOptions: {
      external: ['electron', ...builtinModules, ...builtinModules.map((item) => `node:${item}`)],
    },
    emptyOutDir: true,
  },
});
