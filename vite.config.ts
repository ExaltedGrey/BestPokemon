import { defineConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';
import path from 'node:path';

export default defineConfig(() => {
  const isSingle = process.env.SINGLE_FILE === '1';
  return {
    base: './',
    resolve: {
      alias: {
        '@engine': path.resolve(__dirname, 'src/engine'),
        '@data': path.resolve(__dirname, 'src/data'),
      },
    },
    plugins: isSingle ? [viteSingleFile()] : [],
    build: {
      target: 'es2022',
      assetsInlineLimit: isSingle ? 100_000_000 : 4096,
    },
  };
});
