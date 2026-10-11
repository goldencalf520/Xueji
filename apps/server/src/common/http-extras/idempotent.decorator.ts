import { SetMetadata } from '@nestjs/common';

export const IDEMPOTENT_KEY = 'xueji:idempotent';

/**
 * 幂等保护（§12.1）：创建类接口标注后，携带相同 `Idempotency-Key` 的请求
 * 24 小时内返回首次成功结果；首次请求仍在处理中时，重复请求返回 40900。
 * 只缓存成功响应；失败会释放幂等键允许重试。流式接口（@SkipEnvelope）不适用。
 */
export const Idempotent = () => SetMetadata(IDEMPOTENT_KEY, true);
