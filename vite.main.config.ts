import { defineConfig } from 'vite';
import { builtinModules } from 'node:module';
import path from 'node:path';

export default defineConfig({
  build: {
    outDir: 'dist-electron',
    sourcemap: true,
    target: 'node18',
    lib: {
      entry: {
        main: path.resolve(__dirname, 'src/main/main.ts'),
        preload: path.resolve(__dirname, 'src/main/preload.ts'),
      },
      formats: ['cjs'],
      fileName: (_, entryName) => `${entryName}.js`,
    },
    rollupOptions: {
      external: ['electron', ...builtinModules, ...builtinModules.map((item) => `node:${item}`)],
    },
    emptyOutDir: true,
  },
});
