import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config
export default defineConfig({
  root: 'frontend', // Point to the frontend directory
  plugins: [react()],
  build: {
    outDir: 'dist', // Output to a directory that Forge will use
    emptyOutDir: true,
  },
});