import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { createApp } from './bootstrap';
import { loadAppEnv } from './config/app.config';

async function main() {
  const env = loadAppEnv();
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  await createApp(app, { openapi: env.OPENAPI_ENABLED && env.NODE_ENV !== 'production' });
  await app.listen(env.PORT);
}

void main();
