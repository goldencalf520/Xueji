/**
 * 三端统一身份与令牌 claims 类型（SRV-03，§12.1、§13.5）。
 *
 * 三端令牌签发方（aud）不同、互不通用：app（小程序用户）/ admin（管理端员工）/
 * hospital（医院端账号）。Principal 是鉴权通过后挂在 `request.user` 上的统一身份。
 */

/** 三端受众 */
export const AUDIENCES = ['app', 'admin', 'hospital'] as const;
export type Audience = (typeof AUDIENCES)[number];

/** 员工端（后台）受众：刷新令牌 12 小时 + 30 分钟无操作退出（§6.2.1） */
export const STAFF_AUDIENCES: readonly Audience[] = ['admin', 'hospital'];

export function isStaffAudience(aud: Audience): boolean {
  return STAFF_AUDIENCES.includes(aud);
}

/** 鉴权通过后的统一身份（@CurrentUser() 取到的对象） */
export interface Principal {
  aud: Audience;
  /** 主体 ID：app=customerId、admin=staffId、hospital=hospitalUserId */
  sub: string;
  customerId?: string;
  staffId?: string;
  hospitalUserId?: string;
  hospitalId?: string;
  roles: string[];
  storeIds: string[];
  dataScope: 'all' | 'store' | 'self';
  /** 用户端未绑手机号的访客令牌；@RequirePhone() 接口对访客返回 40011 */
  guest?: boolean;
}

/** 访问令牌中的身份字段（Principal 去掉 aud / sub 后的业务快照） */
export interface PrincipalClaims {
  customerId?: string;
  staffId?: string;
  hospitalUserId?: string;
  hospitalId?: string;
  roles: string[];
  storeIds: string[];
  dataScope: Principal['dataScope'];
  guest?: boolean;
}

/** 访问令牌 claims（有效期 2 小时，可配置） */
export interface AccessTokenPayload {
  iss: typeof TOKEN_ISSUER;
  aud: Audience;
  sub: string;
  /** 令牌类型：访问令牌；刷新令牌不得当访问令牌用 */
  typ: 'access';
  jti: string;
  iat: number;
  exp: number;
  pl: PrincipalClaims;
}

/** 刷新令牌 claims：jti 每次轮换更新，fam 标识令牌族（重放检测的单位） */
export interface RefreshTokenPayload {
  iss: typeof TOKEN_ISSUER;
  aud: Audience;
  sub: string;
  typ: 'refresh';
  jti: string;
  fam: string;
  iat: number;
  exp: number;
}

export const TOKEN_ISSUER = 'xueji';

/** 签发令牌的入参：业务模块登录成功后按端传参 */
export interface IssueTokensInput {
  aud: Audience;
  sub: string;
  customerId?: string;
  staffId?: string;
  hospitalUserId?: string;
  hospitalId?: string;
  roles?: string[];
  storeIds?: string[];
  dataScope?: Principal['dataScope'];
  /** 仅用户端：未绑手机号的访客 */
  guest?: boolean;
}

export function toClaims(input: IssueTokensInput): PrincipalClaims {
  return {
    customerId: input.customerId,
    staffId: input.staffId,
    hospitalUserId: input.hospitalUserId,
    hospitalId: input.hospitalId,
    roles: input.roles ?? [],
    storeIds: input.storeIds ?? [],
    dataScope: input.dataScope ?? 'self',
    guest: input.guest,
  };
}
