import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    outDir: '../public',
    emptyOutDir: false,
  },
  server: {
    port: 5173,
    proxy: {
      '/ws/analyze': {
        target: 'ws://localhost:3000',
        ws: true,
      },
      '/socket': {
        target: 'ws://localhost:3000',
        ws: true,
      },
    },
  },
});
