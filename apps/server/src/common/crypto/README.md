# 字段加密（common/crypto，SRV-02）

手机号、姓名、敏感测评答案、医院结论、魔镜消息等以密文落库（§11.4）：
AES-256-GCM 信封加密 + 版本化密钥 + 独立 HMAC 查找哈希，业务代码只接触明文。

## 1. 声明加密字段

1. 在你负责的域 schema 里按 ADR 0003 约定建列：明文字段名以 `Enc` 结尾（`Bytes @db.VarBinary(...)`），
   查找列以 `Hash` 结尾（`String @db.Char(64)`）。例：

   ```prisma
   model Customer {
     phoneEnc  Bytes? @map("phone_enc") @db.VarBinary(255)
     phoneHash String? @map("phone_hash") @db.Char(64) @unique
   }
   ```

2. 在你的模块文件顶部注册，之后通过 `PrismaService.client` 读写即自动加解密：

   ```ts
   import { registerEncryptedFields } from '../common/prisma/encryption.registry';

   registerEncryptedFields('Customer', ['phoneEnc', 'nameEnc']);
   ```

3. 业务代码只写明文（string），读取拿回的也是明文；`null` 原样落库 `NULL`。

   ```ts
   // 写：明文进，密文存
   await prisma.client.customer.create({
     data: { phoneEnc: '13812345678', phoneHash: hash.phoneHash('13812345678') },
   });
   // 读：行里的 phoneEnc 已是明文 string
   const customer = await prisma.client.customer.findUnique({ where: { phoneHash } });
   ```

规则（`encryption.extension.ts` 强制）：

- **where 条件禁止出现 Enc 字段**（密文不可比较），报错并提示改用 `*_hash`；
- 传 `Uint8Array` 视为"调用方已加密"原样放行（迁移 / 轮换工具用）；
- 传 `number` 等其它类型直接报错，不静默丢失明文；
- **嵌套写**（如 `data.relation.create`）里的 Enc 字段不会自动加密 —— Enc 字段请扁平写在顶层 `data`；
  读取时同模型自关联的嵌套行会解密，跨模型 `include` 的行请单独查询（ADR 0003 本就要求跨域在服务层拼装）；
- `queryRaw` / `executeRaw` 不经过扩展，拿到的是密文，仅限迁移与轮换脚本使用。

## 2. 查找：HMAC 哈希

加密字段不可比较、不可索引查找。需要按手机号找客户时，写入与查询都用
`HashService.phoneHash`（先规范化：去空格 / 连字符 / `+86` 前缀，再 HMAC-SHA256 输出 64 位十六进制）：

```ts
constructor(private readonly hash: HashService, private readonly prisma: PrismaService) {}

async findByPhone(phone: string) {
  return this.prisma.client.customer.findUnique({ where: { phoneHash: this.hash.phoneHash(phone) } });
}
```

HMAC 密钥（`CRYPTO_HMAC_KEY`）与数据密钥相互独立，数据密钥轮换不影响 `*_hash` 的稳定性。

## 3. 密钥配置与启动规则

| 环境 | CRYPTO_PROVIDER | 说明 |
|---|---|---|
| development / test | `local` | 从 `CRYPTO_LOCAL_DATA_KEY` 读密钥；未配置时回退内置 dev 密钥（全零）并打 WARN |
| staging / production | `tencent-kms` | 启动时用 KMS Decrypt 解出数据密钥，只存内存；**`local` 直接拒绝启动** |

- 本地多版本（轮换演练）：`CRYPTO_LOCAL_DATA_KEY="1:base64:<b64>,2:base64:<b64>"`，编号最大者为当前加密版本；
- KMS：`TENCENT_KMS_REGION` / `TENCENT_SECRET_ID` / `TENCENT_SECRET_KEY` /
  `TENCENT_KMS_ENCRYPTED_DATA_KEY`（`<CiphertextBlob>` 或 `1:<blob>,2:<blob>`）；
  直接按腾讯云 API 3.0（TC3-HMAC-SHA256）调用 `kms.<region>.tencentcloudapi.com`，未引入 SDK 依赖；
- 启动即失败（不给缺省值悄悄跑）：密钥未配置、base64/长度不合法、dev 全零密钥、`local` 提供者出现在
  staging / production —— 均抛 `CryptoConfigError`，进程起不来；
- 密钥只从环境变量 / 云密钥管理注入（§14.2），严禁写进代码、测试、种子、日志。

## 4. 密钥轮换步骤（§11.4）

1. 生成新数据密钥，在 KMS（或 staging 演练时 `CRYPTO_LOCAL_DATA_KEY`）里以**新版本号**追加，
   如 `1:<blob>,2:<blob>` —— 新版本号最大，即为当前加密版本；
2. 发布：所有新写入的密文头部版本号 = 2；旧数据（版本 1）读取不受影响（多版本并存）；
3. 存量重加密（后台任务，分批进行）：
   - 用 `PrismaService` 正常读出（自动解密为明文），把明文以 `Uint8Array` 之外的形式临时持有；
   - 通过 `prisma.client` 正常 update 写回即自动用版本 2 重加密；为避免读写都走明文造成二次加解密，
     也可以用 `cryptoService.encrypt()` 显式加密后以 `Uint8Array` 直写（扩展放行已加密二进制）；
   - 批间限速，避免打满数据库；
4. 全部行重加密完成后（抽查 `phone_enc[0]` 全为 2），从配置中移除旧版本密钥并重启；
   旧版本密文将无法解出（`EncryptedDataError`）—— 移除前务必确认存量已清零；
5. HMAC 密钥不随数据密钥轮换；如需更换 HMAC 密钥，需一次性重算全部 `*_hash` 列（维护窗口内完成）。

## 5. 相关文件

| 文件 | 职责 |
|---|---|
| `crypto.config.ts` | 环境变量 zod 校验 |
| `keys.ts` | 密钥提供者接口、local 提供者、启动策略（dev 回退 / 生产严格） |
| `kms.ts` | TC3 签名、KMS Decrypt、tencent-kms 提供者 |
| `crypto.service.ts` | AES-256-GCM 加解密（版本号 + 随机数 + 密文 + 认证标签） |
| `hash.service.ts` | HMAC-SHA256 查找哈希、手机号规范化 |
| `../prisma/encryption.registry.ts` / `encryption.extension.ts` | 按模型注册加密字段、Prisma 自动加解密 |
| `../logger/logger.module.ts` | `REDACT_PATHS` 日志脱敏清单 |
