import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { Logger } from 'nestjs-pino';
import { AppModule } from './app.module';
import { QueueService } from './common/queue/queue.service';
import { loadAppEnv } from './config/app.config';

/**
 * worker 进程（§13.2）：不监听 HTTP，只运行 BullMQ 处理器与定时任务，且只在 worker 进程运行
 * （api 进程的 QueueJobsBootstrap 会跳过装配）。
 *
 * 处理器与定时任务由队列框架在启动时自动装配：给处理器类加 `@QueueProcessor({ queue })`、
 * 给定时方法加 `@CronJob({...})`，并在自己的模块 `providers` 里用 `workerOnly([...])` 注册。
 * 详见 common/queue/README.md。
 */
async function main() {
  process.env.APP_ROLE = 'worker';
  loadAppEnv();
  const app = await NestFactory.createApplicationContext(AppModule, { bufferLogs: true });
  const logger = app.get(Logger);
  app.useLogger(logger);
  // 优雅退出：SIGTERM 时先等待进行中的任务结束，再关闭队列与 Redis 连接（QueueService.onModuleDestroy）
  app.enableShutdownHooks();
  await app.init();

  const summary = app.get(QueueService).describe();
  logger.log(
    `worker 就绪：处理器队列 [${summary.queues.join(', ') || '无'}]，` +
      `定时任务 [${summary.cronJobs.join(', ') || '无'}]，worker 数 ${summary.workers}`,
    'Bootstrap',
  );
}

void main();
