import { defineConfig } from 'vitest/config';

export default defineConfig({
  server: {
    open: '/main.html'
  },
  build: {
    rollupOptions: {
      input: 'main.html'
    }
  },
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['tests/**/*.test.ts']
  }
});
