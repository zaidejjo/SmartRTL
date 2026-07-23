import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { resolve } from 'path';

export default defineConfig({
  plugins: [vue()],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        popup: resolve(__dirname, 'index.html'),
        content_script: resolve(__dirname, 'src/content/content_script.js'),
        content_style: resolve(__dirname, 'src/content/content_style.css')
      },
      output: {
        entryFileNames: (chunkInfo) => {
          if (chunkInfo.name === 'content_script') {
            return 'content_script.js';
          }
          return 'assets/[name]-[hash].js';
        },
        assetFileNames: (assetInfo) => {
          if (assetInfo.name === 'content_style.css') {
            return 'content_style.css';
          }
          return 'assets/[name]-[hash][extname]';
        }
      }
    }
  }
});
