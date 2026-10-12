import { Module } from '@nestjs/common';
import { RedisService } from '../../common/redis/redis.module';
import { createWechatClient, defaultWechatLogger } from './wechat.factory';
import { RedisWechatTokenStore } from './wechat.token-store';
import { WechatClient } from './wechat.types';

/**
 * 微信小程序服务端 SDK：access_token、code2Session、手机号、订阅消息、小程序码
 * 文档：§8、§9.1、§13.5
 *
 * 负责 issue：#29（SRV-10）。
 *
 * 按 `WX_APPID` 是否为真实值装配实现（见 wechat.factory.ts）：
 * - 有值 → `WechatRealClient`（Redis 缓存 + 分布式锁刷新 access_token）；
 * - 空值 → `WechatFakeClient`（仅 dev / test；production 下直接启动失败）。
 *
 * 其它模块按 docs/conventions/backend.md 第 4、9 条 `imports: [WechatModule]` 后注入 `WechatClient`
 * （类 token），不要自己拼 HTTP 请求、不要各处维护 access_token。
 */
@Module({
  providers: [
    {
      provide: WechatClient,
      useFactory: (redis: RedisService) =>
        createWechatClient({
          // RedisWechatTokenStore 懒连接：Fake 模式（WX_APPID 为空）下不会真的连 Redis
          store: new RedisWechatTokenStore(redis),
          logger: defaultWechatLogger(),
        }),
      inject: [RedisService],
    },
  ],
  exports: [WechatClient],
})
export class WechatModule {}
