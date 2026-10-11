import { Module } from '@nestjs/common';
import { LoggerModule as PinoLoggerModule } from 'nestjs-pino';
import { genRequestId } from '../http/request-id';

/**
 * 结构化日志（pino）。生产环境输出 JSON 供腾讯云 CLS 采集（§13.1）。
 * 日志中不得出现手机号、姓名、健康数据明文 —— redact 列表由 SRV-02（加密）issue 补充维护。
 */
@Module({
  imports: [
    PinoLoggerModule.forRoot({
      pinoHttp: {
        level: process.env.LOG_LEVEL ?? 'info',
        genReqId: genRequestId,
        redact: {
          paths: ['req.headers.authorization', 'req.headers.cookie', '*.phone', '*.password'],
          censor: '[REDACTED]',
        },
        transport:
          process.env.NODE_ENV === 'development'
            ? { target: 'pino-pretty', options: { singleLine: true } }
            : undefined,
        autoLogging: {
          ignore: (req) => req.url === '/api/v1/health',
        },
      },
    }),
  ],
})
export class LoggerModule {}
