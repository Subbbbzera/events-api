import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    fileParallelism: false,
    testTimeout: 15000,
    hookTimeout: 15000,
    env: {
      NODE_ENV: 'test',
      PORT: '3001',
      DB_HOST: process.env.DB_HOST ?? 'localhost',
      DB_PORT: process.env.DB_PORT ?? '5433',
      DB_USER: process.env.DB_USER ?? 'postgres',
      DB_PASSWORD: process.env.DB_PASSWORD ?? 'postgres_dev_password',
      DB_NAME: process.env.DB_NAME ?? 'events_test_db',
      JWT_SECRET:
        process.env.JWT_SECRET ??
        'test_jwt_secret_key_with_at_least_32_characters_long',
      JWT_EXPIRES_IN: '15m',
      REDIS_URL: process.env.REDIS_URL ?? 'redis://localhost:6379',
      CACHE_TTL_SECONDS: '60',
    },
  },
});
