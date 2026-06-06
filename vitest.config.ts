import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: false,
    setupFiles: ['./frontend/test-setup.ts'],
    include: ['frontend/**/*.test.{ts,tsx}'],
    css: false,
    coverage: {
      provider: 'v8',
      include: ['frontend/**/*.{ts,tsx}'],
      exclude: ['frontend/**/*.test.{ts,tsx}', 'frontend/test-setup.ts', 'frontend/types/**']
    }
  }
})
