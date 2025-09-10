import { defineConfig } from 'vite';

// https://vitejs.dev/config
export default defineConfig({
  build: {
    // outDir is not respected by Electron Forge, so we can ignore it.
    // However, it's required by Vite.
    outDir: 'dist-electron/preload',
  },
});