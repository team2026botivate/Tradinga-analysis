import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

import { loadEnv } from 'vite';
import { URL } from 'node:url';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  // Use VITE_GAS_URL to derive the base path for the Apps Script exec endpoint
  const envGasUrl = env.VITE_GAS_URL || 'https://script.google.com/macros/s/AKfycbytdWuWsGhWhEoRaiuOodqnMCyUC_jG-tYRzLVDe6NaokpwMC0JQDGigq9UIzxzH3PV/exec';

  // Derive the path portion (e.g., /macros/s/DEPLOYMENT_ID/exec)
  let basePath = '/macros/s/AKfycbytdWuWsGhWhEoRaiuOodqnMCyUC_jG-tYRzLVDe6NaokpwMC0JQDGigq9UIzxzH3PV/exec';
  try {
    const u = new URL(envGasUrl);
    basePath = u.pathname || basePath;
  } catch {
    // If VITE_GAS_URL is not a full URL (e.g., left empty or set to proxy path),
    // keep the default basePath. Optionally, allow specifying the path directly.
    if (envGasUrl.startsWith('/macros/')) basePath = envGasUrl;
  }

  return {
    plugins: [react()],
    server: {
      port: 5173,        // Preferred port
      strictPort: false, // Auto-picks a free port if busy
      proxy: {
        '/gs': {
          target: 'https://script.google.com',
          changeOrigin: true,
          secure: true,
          rewrite: (path) => {
            const query = path.includes('?') ? path.split('?')[1] : '';
            return query ? `${basePath}?${query}` : basePath;
          },
        },
        '/gas': {
          target: 'https://script.google.com',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/gas/, '')
        }
      },
    },
  };
});
