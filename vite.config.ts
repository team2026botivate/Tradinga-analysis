import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,        // Preferred port
    strictPort: false, // Auto-picks a free port if busy
  },
});
