import { Global, Inject, Injectable, Module, type OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';

/**
 * 共享 Redis 连接（缓存、限流、令牌、幂等、验证码）。BullMQ 由 common/queue 使用独立连接。
 * 懒创建：没有 Redis 的单元测试不会因此失败。
 */
@Injectable()
export class RedisService implements OnModuleDestroy {
  private instance?: Redis;

  get client(): Redis {
    this.instance ??= new Redis(process.env.REDIS_URL ?? 'redis://localhost:6379', {
      maxRetriesPerRequest: 3,
    });
    return this.instance;
  }

  async onModuleDestroy() {
    await this.instance?.quit();
  }
}

export const InjectRedis = () => Inject(RedisService);

@Global()
@Module({
  providers: [RedisService],
  exports: [RedisService],
})
export class RedisModule {}
