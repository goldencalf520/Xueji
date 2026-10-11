/** 字段加密相关错误：内部错误，经 AllExceptionsFilter 以 5xx 信封返回，不暴露密钥信息 */
export class CryptoConfigError extends Error {
  constructor(message: string) {
    super(`字段加密配置错误：${message}`);
    this.name = CryptoConfigError.name;
  }
}

/** 密文不完整、被篡改、认证标签不匹配或密钥版本未知 */
export class EncryptedDataError extends Error {
  constructor(message: string) {
    super(`加密数据错误：${message}`);
    this.name = EncryptedDataError.name;
  }
}
