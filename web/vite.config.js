import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// In development, any request to /api is forwarded to the API on port 4000,
// so the web app can just call "/api/..." without worrying about addresses.
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: { '/api': 'http://localhost:4000' },
  },
});
