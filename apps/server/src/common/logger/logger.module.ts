import { Module } from '@nestjs/common';
import { LoggerModule as PinoLoggerModule } from 'nestjs-pino';
import { genRequestId } from '../http/request-id';

/**
 * 日志脱敏路径（pino redact，§2.2、§11.4）：
 * 不得出现手机号、姓名、令牌、健康数据明文；`*.xxxEnc` 是密文本不该进日志，一并遮蔽。
 * 维护方：SRV-02 字段加密 issue（common/crypto）。新增敏感字段命名时同步补充这里。
 */
export const REDACT_PATHS = [
  // 请求头里的凭证
  'req.headers.authorization',
  'req.headers.cookie',
  // 身份：手机号 / 姓名（含内存中的明文字段与落库密文字段）
  '*.phone',
  '*.phoneEnc',
  '*.mobile',
  '*.realName',
  '*.fullName',
  '*.nameEnc',
  // 凭证与令牌
  '*.password',
  '*.secret',
  '*.secretKey',
  '*.token',
  '*.accessToken',
  '*.refreshToken',
  '*.authorization',
  // 健康数据（测评答案、健康字段、魔镜聊天原文）
  '*.answers',
  '*.answer',
  '*.answerEnc',
  '*.healthData',
  '*.chatContent',
] as const;

/**
 * 结构化日志（pino）。生产环境输出 JSON 供腾讯云 CLS 采集（§13.1）。
 * 日志中不得出现手机号、姓名、健康数据明文 —— redact 列表见 REDACT_PATHS。
 */
@Module({
  imports: [
    PinoLoggerModule.forRoot({
      pinoHttp: {
        level: process.env.LOG_LEVEL ?? 'info',
        genReqId: genRequestId,
        redact: { paths: [...REDACT_PATHS], censor: '[REDACTED]' },
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
