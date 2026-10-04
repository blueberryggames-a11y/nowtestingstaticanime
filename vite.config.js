import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Set BASE_PATH env var to "/<repo-name>/" when deploying to a project page.
// For user/org pages, leave it as "/".
const base = process.env.BASE_PATH || '/nowtestingstaticanime/';

export default defineConfig({
  plugins: [react()],
  base,
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
});
