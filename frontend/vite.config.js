// frontend/vite.config.js

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // This is the crucial part for Docker hot-reloading
    watch: {
      usePolling: true, // Enable polling to detect file changes in Docker
    },
    host: true, // This makes the Vite dev server accessible from your host machine's browser
    port: 5173, // Ensure this matches the container's internal port (as mapped in docker-compose.yml)
  },
});