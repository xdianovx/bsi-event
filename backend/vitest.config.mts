import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    include: ['tests/int/**/*.int.spec.ts'],
    // Payload/Postgres пушит схему на первый getPayload() в каждом файле — на пустой БД
    // параллельные файлы гонятся за CREATE TYPE одновременно. Файлы строго последовательно.
    fileParallelism: false,
  },
})
