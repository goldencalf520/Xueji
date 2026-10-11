import { Global, Module } from '@nestjs/common';
import { APP_FILTER, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ZodValidationPipe } from 'nestjs-zod';
import { AuditCoreModule } from './audit/audit.module';
import { AuthCoreModule } from './auth/auth.module';
import { CryptoModule } from './crypto/crypto.module';
import { AllExceptionsFilter } from './errors/all-exceptions.filter';
import { EnvelopeInterceptor } from './http/envelope.interceptor';
import { HttpExtrasModule } from './http-extras/http-extras.module';
import { LoggerModule } from './logger/logger.module';
import { ObservabilityModule } from './observability/observability.module';
import { PrismaModule } from './prisma/prisma.module';
import { QueueModule } from './queue/queue.module';
import { RbacModule } from './rbac/rbac.module';
import { RedisModule } from './redis/redis.module';

/**
 * 横切基础设施的唯一注册点。所有子模块都已预注册（多数是占位），各基础设施 issue 只在自己的
 * common/<子目录>/ 内实现，不修改本文件。注册顺序即全局守卫执行顺序：先鉴权（auth）再权限（rbac）。
 *
 *   logger / prisma / redis / errors / http(envelope)   架构骨架（已实现）
 *   crypto        SRV-02 字段加密              auth   SRV-03 令牌与鉴权
 *   rbac          SRV-05 RBAC 与数据范围        audit  SRV-06 审计日志
 *   http-extras   SRV-01 接口防护              queue  SRV-08 队列与定时任务框架
 *   observability INF-02 可观测性与告警
 */
@Global()
@Module({
  imports: [
    LoggerModule,
    PrismaModule,
    RedisModule,
    CryptoModule,
    AuthCoreModule,
    RbacModule,
    AuditCoreModule,
    HttpExtrasModule,
    QueueModule,
    ObservabilityModule,
    // 跨域协作优先用领域事件（如 consent.revoked、referral.returned），避免模块间循环依赖
    EventEmitterModule.forRoot({ wildcard: true, delimiter: '.' }),
  ],
  providers: [
    { provide: APP_PIPE, useClass: ZodValidationPipe },
    { provide: APP_INTERCEPTOR, useClass: EnvelopeInterceptor },
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
  ],
  exports: [PrismaModule, RedisModule],
})
export class CommonModule {}
