import {
  type CallHandler,
  Controller,
  Get,
  Injectable,
  Module,
  type NestInterceptor,
} from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import { map, type Observable } from 'rxjs';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createApp } from '../../bootstrap';
import { CommonModule } from '../../common/common.module';
import { RedisService } from '../../common/redis/redis.module';
import { AuthConfig } from './auth.config';
import { audienceOfPath } from './auth.guard';
import { Public, RequirePhone } from './decorators';
import { type Principal, TOKEN_ISSUER } from './principal';
import { FakeRedis, fakeRedisService } from './testing.redis';
import { TokenService } from './token.service';

/** 把 request.user 回显到响应里（避免在测试控制器里使用参数装饰器语法） */
@Injectable()
class UserEchoInterceptor implements NestInterceptor {
  intercept(
    context: Parameters<NestInterceptor['intercept']>[0],
    next: CallHandler,
  ): Observable<unknown> {
    const req = context.switchToHttp().getRequest<{ user?: Principal }>();
    const user = req.user;
    return next.handle().pipe(map(() => ({ user: user ?? null })));
  }
}

/** 放在 CommonModule 之后导入：使 Echo 拦截器位于信封拦截器内层（信封最后包装） */
@Module({ providers: [{ provide: APP_INTERCEPTOR, useClass: UserEchoInterceptor }] })
class EchoModule {}

@Controller('app/auth-test')
class AppTestController {
  @Get('hello')
  hello() {
    return { ok: true };
  }

  @Get('public')
  @Public()
  publicRoute() {
    return { ok: 'public' };
  }

  @Get('phone')
  @RequirePhone()
  phoneRequired() {
    return { ok: 'phone' };
  }
}

@Controller('app/auth-test-class-public')
@Public()
class ClassPublicController {
  @Get()
  classLevel() {
    return { ok: 'class-public' };
  }
}

@Controller('admin/auth-test')
class AdminTestController {
  @Get('hello')
  hello() {
    return { ok: true };
  }
}

@Controller('hospital/auth-test')
class HospitalTestController {
  @Get('hello')
  hello() {
    return { ok: true };
  }
}

@Controller('webhook/auth-test')
class WebhookTestController {
  @Get('callback')
  callback() {
    return { ok: 'webhook' };
  }
}

describe('AuthGuard（safety-critical，全局 e2e）', () => {
  let app: Awaited<ReturnType<typeof createApp>>;
  let tokens: TokenService;
  let jwt: JwtService;
  let fake: FakeRedis;

  beforeAll(async () => {
    fake = new FakeRedis();
    const moduleRef = await Test.createTestingModule({
      imports: [CommonModule, EchoModule],
      controllers: [
        AppTestController,
        ClassPublicController,
        AdminTestController,
        HospitalTestController,
        WebhookTestController,
      ],
    })
      .overrideProvider(RedisService)
      .useValue(fakeRedisService(fake))
      .compile();
    app = await createApp(moduleRef.createNestApplication(), { openapi: false });
    await app.init();
    tokens = app.get(TokenService);
    jwt = app.get(JwtService);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('路由前缀 → 期望 aud', () => {
    it.each([
      ['/api/v1/app/me', 'app'],
      ['/api/v1/app', 'app'],
      ['/api/v1/admin/staff', 'admin'],
      ['/api/v1/hospital/referrals', 'hospital'],
      ['/api/v1/webhook/wechat', null],
      ['/api/v1/health', null],
      ['/api/v1/adminx/other', null],
      ['/api/v1/appointments', null],
    ])('%s → %s', (path, aud) => {
      expect(audienceOfPath(path)).toBe(aud);
    });
  });

  describe('未登录（命中）', () => {
    it('无 Authorization 头返回 40001', async () => {
      const res = await request(app.getHttpServer()).get('/api/v1/app/auth-test/hello').expect(401);
      expect(res.body.code).toBe(40001);
      expect(res.body.requestId).toBeTypeOf('string');
    });

    it('非 Bearer 格式返回 40001', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/app/auth-test/hello')
        .set('Authorization', 'Basic abc')
        .expect(401);
      expect(res.body.code).toBe(40001);
    });
  });

  describe('@Public() 与范围外路由放行（不命中）', () => {
    it('方法级 @Public() 无令牌可访问', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/app/auth-test/public')
        .expect(200);
      expect(res.body.code).toBe(0);
    });

    it('类级 @Public() 无令牌可访问', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/app/auth-test-class-public')
        .expect(200);
      expect(res.body.code).toBe(0);
    });

    it('webhook 路由放行', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/webhook/auth-test/callback')
        .expect(200);
      expect(res.body.code).toBe(0);
    });
  });

  describe('三端令牌隔离（命中）', () => {
    it.each([
      ['app', 'admin'],
      ['app', 'hospital'],
      ['admin', 'app'],
      ['admin', 'hospital'],
      ['hospital', 'app'],
      ['hospital', 'admin'],
    ])('%s 令牌访问 %s 接口返回 40001', async (from, to) => {
      const pair = await tokens.issueTokens({ aud: from as Principal['aud'], sub: '1', roles: [] });
      const res = await request(app.getHttpServer())
        .get(`/api/v1/${to}/auth-test/hello`)
        .set('Authorization', `Bearer ${pair.accessToken}`)
        .expect(401);
      expect(res.body.code).toBe(40001);
    });
  });

  describe('同端有效令牌（不命中）', () => {
    it.each(['app', 'admin', 'hospital'])(
      '%s 令牌访问本端接口：200 且回显 Principal',
      async (aud) => {
        const pair = await tokens.issueTokens({
          aud: aud as Principal['aud'],
          sub: `${aud}-1`,
          roles: ['r1'],
          storeIds: ['5'],
          dataScope: 'store',
        });
        const res = await request(app.getHttpServer())
          .get(`/api/v1/${aud}/auth-test/hello`)
          .set('Authorization', `Bearer ${pair.accessToken}`)
          .expect(200);
        expect(res.body.code).toBe(0);
        expect(res.body.data.user).toMatchObject({
          aud,
          sub: `${aud}-1`,
          roles: ['r1'],
          storeIds: ['5'],
          dataScope: 'store',
        });
      },
    );
  });

  describe('令牌异常（命中）', () => {
    it('过期访问令牌返回 40001', async () => {
      const expired = await jwt.signAsync(
        { typ: 'access', pl: { roles: [], storeIds: [], dataScope: 'self' } },
        {
          secret: app.get(AuthConfig).secrets.app,
          audience: 'app',
          issuer: TOKEN_ISSUER,
          subject: '1',
          jwtid: 'x',
          expiresIn: -10,
        },
      );
      const res = await request(app.getHttpServer())
        .get('/api/v1/app/auth-test/hello')
        .set('Authorization', `Bearer ${expired}`)
        .expect(401);
      expect(res.body.code).toBe(40001);
    });

    it('刷新令牌当访问令牌用返回 40001', async () => {
      const pair = await tokens.issueTokens({ aud: 'app', sub: '1' });
      const res = await request(app.getHttpServer())
        .get('/api/v1/app/auth-test/hello')
        .set('Authorization', `Bearer ${pair.refreshToken}`)
        .expect(401);
      expect(res.body.code).toBe(40001);
    });
  });

  describe('@RequirePhone()（访客隔离）', () => {
    it('访客令牌返回 40011（命中）', async () => {
      const pair = await tokens.issueTokens({
        aud: 'app',
        sub: '9001',
        customerId: '9001',
        guest: true,
      });
      const res = await request(app.getHttpServer())
        .get('/api/v1/app/auth-test/phone')
        .set('Authorization', `Bearer ${pair.accessToken}`)
        .expect(403);
      expect(res.body.code).toBe(40011);
    });

    it('正式令牌通过（不命中）', async () => {
      const pair = await tokens.issueTokens({ aud: 'app', sub: '9002', customerId: '9002' });
      const res = await request(app.getHttpServer())
        .get('/api/v1/app/auth-test/phone')
        .set('Authorization', `Bearer ${pair.accessToken}`)
        .expect(200);
      expect(res.body.code).toBe(0);
    });
  });
});
