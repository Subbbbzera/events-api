import 'reflect-metadata';
import { createApp } from './app';
import { env } from './config/env';
import { AppDataSource } from './db/data-source';

const bootstrap = async (): Promise<void> => {
  try {
    await AppDataSource.initialize();
    console.log('Database connection established');

    const app = createApp();

    app.listen(env.PORT, () => {
      console.log(`Server running on port ${env.PORT} in ${env.NODE_ENV} mode`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

void bootstrap();

