import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import { beforeAll, describe, expect, it } from 'vitest';
import { RedisModule, RedisService } from '../redis/redis.module';
import { AuthConfig } from './auth.config';
import { AuthCoreModule } from './auth.module';
import type { Audience } from './principal';
import { TOKEN_ISSUER } from './principal';
import { FakeRedis, fakeRedisService } from './testing.redis';
import { TokenService } from './token.service';

describe('TokenService（safety-critical）', () => {
  let tokens: TokenService;
  let jwt: JwtService;
  let config: AuthConfig;
  let fake: FakeRedis;

  beforeAll(async () => {
    fake = new FakeRedis();
    const moduleRef = await Test.createTestingModule({
      imports: [AuthCoreModule, RedisModule],
    })
      .overrideProvider(RedisService)
      .useValue(fakeRedisService(fake))
      .compile();
    tokens = moduleRef.get(TokenService);
    jwt = moduleRef.get(JwtService);
    config = moduleRef.get(AuthConfig);
  });

  it('签发与校验往返：Principal 字段完整（不命中：同端令牌正常通过）', async () => {
    const pair = await tokens.issueTokens({
      aud: 'app',
      sub: '1001',
      customerId: '1001',
      roles: [],
      storeIds: [],
      dataScope: 'self',
      guest: true,
    });
    const principal = await tokens.verifyAccessToken(pair.accessToken, 'app');
    expect(principal).toEqual({
      aud: 'app',
      sub: '1001',
      customerId: '1001',
      roles: [],
      storeIds: [],
      dataScope: 'self',
      guest: true,
    });
    expect(pair.expiresIn).toBe(config.accessTtlSeconds);
  });

  it.each([
    ['app', 'admin'],
    ['app', 'hospital'],
    ['admin', 'app'],
    ['admin', 'hospital'],
    ['hospital', 'app'],
    ['hospital', 'admin'],
  ])('三端隔离：%s 令牌访问 %s 接口返回 40001（命中）', async (from, to) => {
    const pair = await tokens.issueTokens({ aud: from as Audience, sub: '1', roles: ['r'] });
    await expect(tokens.verifyAccessToken(pair.accessToken, to as Audience)).rejects.toMatchObject({
      code: 40001,
    });
  });

  it('同端令牌全部通过（不命中）', async () => {
    for (const aud of ['app', 'admin', 'hospital'] as const) {
      const pair = await tokens.issueTokens({
        aud,
        sub: '1',
        roles: [],
        storeIds: [],
        dataScope: 'all',
      });
      const principal = await tokens.verifyAccessToken(pair.accessToken, aud);
      expect(principal.aud).toBe(aud);
    }
  });

  it('过期访问令牌返回 40001（命中）', async () => {
    const expired = await jwt.signAsync(
      { typ: 'access', pl: { roles: [], storeIds: [], dataScope: 'self' } },
      {
        secret: config.secrets.app,
        audience: 'app',
        issuer: TOKEN_ISSUER,
        subject: '1001',
        jwtid: 'x',
        expiresIn: -10,
      },
    );
    await expect(tokens.verifyAccessToken(expired, 'app')).rejects.toMatchObject({ code: 40001 });
  });

  it('刷新令牌当访问令牌用返回 40001（命中）', async () => {
    const pair = await tokens.issueTokens({ aud: 'app', sub: '1' });
    await expect(tokens.verifyAccessToken(pair.refreshToken, 'app')).rejects.toMatchObject({
      code: 40001,
    });
  });

  it('伪造签名（跨端密钥签发）返回 40001（命中）', async () => {
    const forged = await jwt.signAsync(
      { typ: 'access', pl: { roles: [], storeIds: [], dataScope: 'self' } },
      {
        secret: config.secrets.admin,
        audience: 'app',
        issuer: TOKEN_ISSUER,
        subject: '1',
        jwtid: 'x',
        expiresIn: 60,
      },
    );
    await expect(tokens.verifyAccessToken(forged, 'app')).rejects.toMatchObject({ code: 40001 });
  });

  describe('刷新轮换与重放检测', () => {
    it('正常轮换：旧换新，新令牌可用（不命中）', async () => {
      const pair = await tokens.issueTokens({ aud: 'app', sub: '2001', customerId: '2001' });
      const rotated = await tokens.rotateRefreshToken(pair.refreshToken, 'app');
      expect(rotated.refreshToken).not.toBe(pair.refreshToken);
      const principal = await tokens.verifyAccessToken(rotated.accessToken, 'app');
      expect(principal.sub).toBe('2001');
      expect(principal.customerId).toBe('2001');
    });

    it('旧刷新令牌重放：40001 且吊销整个族（命中）', async () => {
      const pair = await tokens.issueTokens({ aud: 'app', sub: '2002' });
      const rotated = await tokens.rotateRefreshToken(pair.refreshToken, 'app');

      // 旧令牌再用 → 拒绝
      await expect(tokens.rotateRefreshToken(pair.refreshToken, 'app')).rejects.toMatchObject({
        code: 40001,
      });
      // 族已被吊销：连最新的刷新令牌也失效
      await expect(tokens.rotateRefreshToken(rotated.refreshToken, 'app')).rejects.toMatchObject({
        code: 40001,
      });
    });

    it('跨端刷新令牌轮换返回 40001（命中）', async () => {
      const pair = await tokens.issueTokens({ aud: 'app', sub: '1' });
      await expect(tokens.rotateRefreshToken(pair.refreshToken, 'admin')).rejects.toMatchObject({
        code: 40001,
      });
    });

    it('访问令牌当刷新令牌用返回 40001（命中）', async () => {
      const pair = await tokens.issueTokens({ aud: 'app', sub: '1' });
      await expect(tokens.rotateRefreshToken(pair.accessToken, 'app')).rejects.toMatchObject({
        code: 40001,
      });
    });
  });

  describe('后台无操作退出（§6.2.1）', () => {
    it('超过 30 分钟无操作：轮换被拒并吊销族（命中）', async () => {
      const pair = await tokens.issueTokens({ aud: 'admin', sub: '3001', staffId: '3001' });
      // 把最后活动时间伪造成 31 分钟前
      fake.setRawString('auth:act:admin:3001', String(Date.now() - 31 * 60 * 1000));
      await expect(tokens.rotateRefreshToken(pair.refreshToken, 'admin')).rejects.toMatchObject({
        code: 40001,
      });
      // 族已吊销：活动时间恢复后旧刷新令牌也不再可用
      await tokens.touchActivity('admin', '3001');
      await expect(tokens.rotateRefreshToken(pair.refreshToken, 'admin')).rejects.toMatchObject({
        code: 40001,
      });
    });

    it('活动时间在窗口内：轮换成功（不命中）', async () => {
      const pair = await tokens.issueTokens({ aud: 'admin', sub: '3002', staffId: '3002' });
      await tokens.touchActivity('admin', '3002');
      const rotated = await tokens.rotateRefreshToken(pair.refreshToken, 'admin');
      expect(rotated.refreshToken.length).toBeGreaterThan(0);
    });

    it('用户端不做无操作校验（不命中）', async () => {
      const pair = await tokens.issueTokens({ aud: 'app', sub: '3003' });
      // 用户端没有活动时间记录，仍可刷新
      const rotated = await tokens.rotateRefreshToken(pair.refreshToken, 'app');
      expect(rotated.refreshToken.length).toBeGreaterThan(0);
    });
  });

  it('revokeAllFor 吊销该主体全部族：登出 / 员工停用（命中）', async () => {
    const p1 = await tokens.issueTokens({ aud: 'admin', sub: '4001', staffId: '4001' });
    const p2 = await tokens.issueTokens({ aud: 'admin', sub: '4001', staffId: '4001' });
    const other = await tokens.issueTokens({ aud: 'admin', sub: '4002', staffId: '4002' });

    const count = await tokens.revokeAllFor('admin', '4001');
    expect(count).toBe(2);
    await expect(tokens.rotateRefreshToken(p1.refreshToken, 'admin')).rejects.toMatchObject({
      code: 40001,
    });
    await expect(tokens.rotateRefreshToken(p2.refreshToken, 'admin')).rejects.toMatchObject({
      code: 40001,
    });
    // 其它主体不受影响
    const rotated = await tokens.rotateRefreshToken(other.refreshToken, 'admin');
    expect(rotated.refreshToken.length).toBeGreaterThan(0);
  });

  it('访客令牌只允许用户端签发（命中：admin 签 guest 报错）', async () => {
    await expect(tokens.issueTokens({ aud: 'admin', sub: '1', guest: true })).rejects.toThrow(
      /访客令牌/,
    );
  });
});
