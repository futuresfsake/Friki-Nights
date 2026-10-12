import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    // Maps, constants and night state live in ../shared so the server can use them in M3.
    fs: { allow: ['..'] },
  },
});
