import { Global, Module } from '@nestjs/common';

/**
 * 队列与定时任务：BullMQ 连接、队列注册约定、定时任务（Asia/Shanghai）、只在 worker 进程挂载处理器（§13.5）
 *
 * 占位：已在 CommonModule 注册，由「SRV-08 队列与定时任务框架」issue 在本目录内实现（见 docs/architecture/ownership.md）。
 * 全局守卫 / 拦截器在本模块的 providers 中以 APP_GUARD / APP_INTERCEPTOR 注册。
 */
@Global()
@Module({})
export class QueueModule {}
