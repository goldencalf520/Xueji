import { createParamDecorator, type ExecutionContext, SetMetadata } from '@nestjs/common';
import type { Principal } from './principal';

export const PUBLIC_KEY = 'auth:isPublic';
export const REQUIRE_PHONE_KEY = 'auth:requirePhone';

/**
 * 公开接口：不校验令牌（登录、验证码、健康检查等）。
 * webhook 路由本就不在鉴权范围，不需要标注。
 */
export const Public = (): MethodDecorator & ClassDecorator => SetMetadata(PUBLIC_KEY, true);

/**
 * 需要已绑定手机号的正式用户：访客令牌（guest）访问返回 40011，前端引导手机号验证。
 * 仅对用户端（app）接口有意义。
 */
export const RequirePhone = (): MethodDecorator & ClassDecorator =>
  SetMetadata(REQUIRE_PHONE_KEY, true);

/**
 * 取当前登录身份（AuthGuard 校验通过后挂到 request.user 的 Principal）。
 *
 * ```ts
 * @Get('me')
 * me(@CurrentUser() user: Principal) { ... }        // 整个 Principal
 * me(@CurrentUser('staffId') staffId?: string) { ... } // 单个字段
 * ```
 *
 * 注意：在控制器方法参数上使用参数装饰器，需要 biome.json 开启
 * `javascript.parser.unsafeParameterDecoratorsEnabled`（TC39 装饰器标准不含参数装饰器，
 * Biome 默认拒绝解析；biome.json 不归本 issue 所有，待 owner 全局决定）。
 */
export const CurrentUser = createParamDecorator(
  (
    field: keyof Principal | undefined,
    ctx: ExecutionContext,
  ): Principal | Principal[keyof Principal] | undefined => {
    const req = ctx.switchToHttp().getRequest<{ user?: Principal }>();
    const user = req.user;
    return field === undefined ? user : user?.[field];
  },
);
