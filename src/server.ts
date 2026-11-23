import 'reflect-metadata';
import { createApp } from './app';
import { env } from './config/env';

const bootstrap = async (): Promise<void> => {
  const app = createApp();

  app.listen(env.PORT, () => {
    console.log(`Server running on port ${env.PORT} in ${env.NODE_ENV} mode`);
  });
};

void bootstrap();
