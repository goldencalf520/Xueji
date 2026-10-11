import { Global, Logger, Module } from '@nestjs/common';
import { loadCryptoEnv } from './crypto.config';
import { CryptoService } from './crypto.service';
import { HashService } from './hash.service';
import { assertProviderAllowed, DataKeyProvider, LocalDataKeyProvider, loadHmacKey } from './keys';
import { TencentKmsDataKeyProvider } from './kms';

const logger = new Logger('CryptoModule');

/** 按 CRYPTO_PROVIDER 构造数据密钥提供者，并执行启动策略校验（staging / production 拒绝 local） */
function buildDataKeyProvider(): DataKeyProvider {
  const env = loadCryptoEnv();
  assertProviderAllowed(env);
  const provider =
    env.CRYPTO_PROVIDER === 'tencent-kms'
      ? new TencentKmsDataKeyProvider(env)
      : new LocalDataKeyProvider(env);
  logger.log(`字段加密就绪：provider=${env.CRYPTO_PROVIDER} env=${env.NODE_ENV}`);
  return provider;
}

/**
 * 字段加密：AES-256-GCM 信封加密、HMAC 查找哈希、KMS 适配、Prisma 自动加解密扩展（§11.4、§13.5）。
 * 全局模块：业务模块直接注入 CryptoService / HashService。
 * 启动即校验：密钥缺失、配置非法、dev 密钥用于 staging / production 时直接抛错，进程起不来。
 */
@Global()
@Module({
  providers: [
    { provide: DataKeyProvider, useFactory: buildDataKeyProvider },
    CryptoService,
    { provide: HashService, useFactory: () => new HashService(loadHmacKey(loadCryptoEnv())) },
  ],
  exports: [CryptoService, HashService],
})
export class CryptoModule {}
