import { Global, Module } from '@nestjs/common';

/**
 * 字段加密：AES-256-GCM 信封加密、HMAC 查找哈希、KMS 适配、Prisma 自动加解密扩展（§11.4、§13.5）
 *
 * 占位：已在 CommonModule 注册，由「SRV-02 字段加密」issue 在本目录内实现（见 docs/architecture/ownership.md）。
 * 全局守卫 / 拦截器在本模块的 providers 中以 APP_GUARD / APP_INTERCEPTOR 注册。
 */
@Global()
@Module({})
export class CryptoModule {}
