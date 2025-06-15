import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // Optional: If you need to proxy API requests during development
  server: {
    proxy: {
      '/api': { // Adjust this path if your API calls don't start with /api
        target: 'http://localhost:8000', // Your FastAPI backend URL
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''), // Remove /api prefix if backend doesn't expect it
      },
      // If your backend is at http://localhost:8000 and your frontend calls directly to '/auth', '/ingest', etc.
      // then you might just need a simple proxy for all non-static requests:
      // '/': {
      //   target: 'http://localhost:8000',
      //   changeOrigin: true,
      //   bypass: (req, res, options) => {
      //     if (req.headers.accept && req.headers.accept.includes('text/html')) {
      //       return '/index.html'; // Serve index.html for browser navigation
      //     }
      //   },
      // },
    },
  },
});
