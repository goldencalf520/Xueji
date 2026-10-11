import { Global, Module } from '@nestjs/common';

/**
 * 可观测性：就绪检查、错误率 / 慢请求 / 队列积压 / AI 失败率 / 预警超时告警，推送企微群机器人（§13.1、§16）
 *
 * 占位：已在 CommonModule 注册，由 #35（INF-02）issue 在本目录内实现（见 docs/architecture/ownership.md）。
 * 全局守卫 / 拦截器在本模块的 providers 中以 APP_GUARD / APP_INTERCEPTOR 注册。
 */
@Global()
@Module({})
export class ObservabilityModule {}
