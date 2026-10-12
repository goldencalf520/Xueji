import { createHash } from 'node:crypto';
import { assertScene } from './wechat.real.client';
import {
  type SendSubscribeMessageInput,
  type UnlimitedQrcodeInput,
  type UnlimitedQrcodeResult,
  WechatClient,
  type WechatPhoneInfo,
  type WechatSession,
} from './wechat.types';

/**
 * Fake 实现（SRV-10 / #29）：`WX_APPID` 为空时启用，让本地开发与单元测试不必连微信。
 *
 * - openid / session_key 由 code 的哈希派生：同一个 code 永远得到同一个结果，便于断言与联调；
 * - 手机号是固定的**假号**，不对应任何真实用户（§13.6 禁止真实客户数据进入 dev / 测试）；
 * - 订阅消息只记录到内存（{@link WechatFakeClient.sentMessages}），不真的发给用户；
 * - 小程序码返回 1×1 的 PNG 占位图。
 *
 * 生产环境（NODE_ENV=production）不允许启用 Fake，见 wechat.factory.ts。
 */

/** 固定的假手机号：仅本地开发 / 测试使用 */
export const FAKE_PHONE_NUMBER_PURE = '13900000000';
export const FAKE_PHONE_NUMBER = `+86${FAKE_PHONE_NUMBER_PURE}`;

/** 1×1 透明 PNG，用于占位小程序码 */
const FAKE_QRCODE_PNG_BASE64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';

export class WechatFakeClient extends WechatClient {
  /** 记录被「发送」的订阅消息，便于本地开发时确认通知链路 */
  readonly sentMessages: SendSubscribeMessageInput[] = [];

  async code2Session(code: string): Promise<WechatSession> {
    const digest = deriveDigest(code);
    return {
      openid: `fake-openid-${digest}`,
      sessionKey: `fake-session-key-${digest}`,
      unionid: `fake-unionid-${digest}`,
    };
  }

  async getPhoneNumber(phoneCode: string): Promise<WechatPhoneInfo> {
    // 仍然要求有 code，避免前端漏传参数在本地被掩盖
    if (phoneCode.trim() === '') {
      throw new Error('Fake 微信 SDK：phoneCode 不能为空');
    }
    return {
      phoneNumber: FAKE_PHONE_NUMBER,
      purePhoneNumber: FAKE_PHONE_NUMBER_PURE,
      countryCode: '86',
    };
  }

  async sendSubscribeMessage(input: SendSubscribeMessageInput): Promise<void> {
    this.sentMessages.push(input);
  }

  async getUnlimitedQrcode(input: UnlimitedQrcodeInput): Promise<UnlimitedQrcodeResult> {
    assertScene(input.scene);
    return {
      buffer: Buffer.from(FAKE_QRCODE_PNG_BASE64, 'base64'),
      contentType: 'image/png',
    };
  }
}

function deriveDigest(seed: string): string {
  if (seed.trim() === '') throw new Error('Fake 微信 SDK：code 不能为空');
  return createHash('sha1').update(seed).digest('hex').slice(0, 16);
}
