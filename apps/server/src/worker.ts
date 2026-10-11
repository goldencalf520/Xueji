import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { Logger } from 'nestjs-pino';
import { AppModule } from './app.module';
import { loadAppEnv } from './config/app.config';

/**
 * worker 进程（§13.2）：不监听 HTTP，只运行 BullMQ 处理器与定时任务。
 * 处理器的注册约定（只在 APP_ROLE=worker 时挂载）由 SRV-08（队列框架）issue 实现。
 */
async function main() {
  process.env.APP_ROLE = 'worker';
  loadAppEnv();
  const app = await NestFactory.createApplicationContext(AppModule, { bufferLogs: true });
  app.useLogger(app.get(Logger));
  app.enableShutdownHooks();
  await app.init();
}

void main();
