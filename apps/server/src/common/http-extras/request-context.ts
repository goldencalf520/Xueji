import type { Request } from 'express';

/** 全局路由前缀（bootstrap.ts 中 setGlobalPrefix('api/v1')） */
const API_ROOT = '/api/v1';

/** 存活探活端点（modules/health），不参与全局默认限流（负载均衡 / 容器编排高频探测） */
const HEALTH_PATH = `${API_ROOT}/health`;

/**
 * 鉴权守卫（SRV-03）挂在请求上的 JWT 载荷形状；实现后 req.user 会带 sub。
 * route / id 是「运行时才存在」的属性（Express 类型里声明为必需），Omit 后重声明为可选。
 */
export interface AuthenticatedRequest extends Omit<Request, 'route' | 'id'> {
  user?: { sub?: string | number };
  /** pino-http 注入的请求 ID */
  id?: string;
  /** Express 路由模板（如 /app/family/links/:id） */
  route?: { path?: string };
}

/**
 * 从路径推导调用方命名空间（/api/v1/app/... → app；管理端 admin、医院端 hospital、回调 webhook）。
 * 幂等与防重放的 Redis 键按它隔离，避免不同端共用键空间。
 */
export function audienceOf(req: Pick<Request, 'path'>): string {
  const m = req.path.match(new RegExp(`^${API_ROOT}/([a-z][a-z0-9-]*)`, 'i'));
  return m?.[1]?.toLowerCase() ?? 'root';
}

/** 幂等 / 限流用的主体：登录用户优先，未登录回退到客户端 IP */
export function principalOf(req: AuthenticatedRequest): string {
  const sub = req.user?.sub;
  if (sub !== undefined && sub !== null && `${sub}` !== '') return `u:${sub}`;
  return `ip:${req.ip ?? 'unknown'}`;
}

/** 路由模板（限流桶按模板聚合，避免 /:id 这类路径打散计数）；匹配不到时退回 path */
export function routeTemplateOf(req: AuthenticatedRequest): string {
  const path = req.route?.path ?? req.path;
  return path.replaceAll(/[:/]/g, '_').replace(/^_+/, '');
}

/** 存活探活端点不参与全局默认限流 */
export function isHealthPath(req: Pick<Request, 'path'>): boolean {
  return req.path.replace(/\/+$/, '') === HEALTH_PATH;
}
