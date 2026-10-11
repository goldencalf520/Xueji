import { randomUUID } from 'node:crypto';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { REQUEST_ID_HEADER } from '@xueji/shared';

/** pino-http 的 genReqId：沿用网关传入的 X-Request-Id，否则生成新的，并回写到响应头 */
export function genRequestId(req: IncomingMessage, res: ServerResponse): string {
  const incoming = req.headers[REQUEST_ID_HEADER.toLowerCase()];
  const id = (Array.isArray(incoming) ? incoming[0] : incoming) || randomUUID();
  res.setHeader(REQUEST_ID_HEADER, id);
  return id;
}
