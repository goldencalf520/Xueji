import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { HealthStatus } from '@xueji/shared/contracts/health';

/** 存活检查（负载均衡探活用），不依赖数据库，不鉴权 */
@ApiTags('health')
@Controller('health')
export class HealthController {
  @Get()
  check(): HealthStatus {
    return {
      status: 'ok',
      service: process.env.APP_ROLE ?? 'api',
      version: process.env.APP_VERSION ?? 'dev',
      time: new Date().toISOString(),
    };
  }
}
