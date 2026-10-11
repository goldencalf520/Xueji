import type { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Logger } from 'nestjs-pino';
import { cleanupOpenApiDoc } from 'nestjs-zod';

/**
 * 应用装配（api 进程与接口测试共用）：全局前缀、BigInt 序列化、日志、OpenAPI。
 * main.ts 只负责读取环境变量和监听端口；测试用 Test.createTestingModule({ imports: [CommonModule, XxxModule] })
 * 创建应用后同样调用本函数，保证与线上行为一致。
 */
export async function createApp<T extends INestApplication>(
  app: T,
  options: { openapi: boolean },
): Promise<T> {
  app.setGlobalPrefix('api/v1');
  app.enableShutdownHooks();
  app.useLogger(app.get(Logger));

  // 主键是 BIGINT，统一序列化为字符串（接口契约中 ID 均为 string）
  const http = app.getHttpAdapter().getInstance() as { set?: (k: string, v: unknown) => void };
  http.set?.('json replacer', (_key: string, value: unknown) =>
    typeof value === 'bigint' ? value.toString() : value,
  );

  if (options.openapi) {
    const config = new DocumentBuilder()
      .setTitle('雪姬六维健康平台 API')
      .setDescription('用户端 /app、管理端 /admin、医院端 /hospital、回调 /webhook（§12）')
      .setVersion('1.0')
      .addBearerAuth()
      .build();
    const doc = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, cleanupOpenApiDoc(doc));
  }
  return app;
}
