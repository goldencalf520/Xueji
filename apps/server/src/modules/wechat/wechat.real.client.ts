import { ErrorCode } from '@xueji/shared';
import { BizException } from '../../common/errors/biz.exception';
import type { WechatAccessTokenProvider, WechatLogger } from './wechat.access-token';
import { resolveMiniprogramState, type WechatEnv } from './wechat.config';
import { isWechatApiError, WECHAT_UNEXPECTED_RESPONSE_CODE, WechatApiError } from './wechat.errors';
import type { WechatTransport } from './wechat.transport';
import {
  type SendSubscribeMessageInput,
  type UnlimitedQrcodeInput,
  type UnlimitedQrcodeResult,
  WECHAT_QRCODE_SCENE_MAX_LENGTH,
  WechatClient,
  type WechatPhoneInfo,
  type WechatSession,
} from './wechat.types';

/** 微信接口返回体（只声明用到的字段） */
interface RawSession {
  openid?: string;
  session_key?: string;
  unionid?: string;
}

interface RawPhoneInfo {
  phoneNumber?: string;
  purePhoneNumber?: string;
  countryCode?: string;
}

interface RawPhoneResponse {
  phone_info?: RawPhoneInfo;
}

/**
 * 真实实现（SRV-10 / #29）：`WX_APPID` 有值时由 `createWechatClient` 装配。
 *
 * 统一的令牌处理放在 {@link WechatRealClient.withToken}：任何需要 access_token 的调用，
 * 遇到「令牌失效」（errcode 40001 / 40014 / 42001 …）会强制刷新令牌并**只重试一次**；
 * 其余错误直接向上抛，由调用方决定文案与兜底。
 */
export class WechatRealClient extends WechatClient {
  constructor(
    private readonly transport: WechatTransport,
    private readonly tokens: WechatAccessTokenProvider,
    private readonly env: WechatEnv,
    private readonly logger?: WechatLogger,
  ) {
    super();
  }

  /** 用 `wx.login` 的 code 换取 openid / unionid / session_key（§9.1 第 1 步） */
  async code2Session(code: string): Promise<WechatSession> {
    const raw = await this.transport.getJson<RawSession>('/sns/jscode2session', {
      appid: this.env.WX_APPID,
      secret: this.env.WX_SECRET,
      js_code: code,
      grant_type: 'authorization_code',
    });
    if (!raw.openid || !raw.session_key) {
      throw new WechatApiError(WECHAT_UNEXPECTED_RESPONSE_CODE, '微信未返回 openid / session_key');
    }
    return {
      openid: raw.openid,
      sessionKey: raw.session_key,
      ...(raw.unionid ? { unionid: raw.unionid } : {}),
    };
  }

  /** 用手机号快速验证返回的 code 换取手机号（§9.1 第 3 步） */
  async getPhoneNumber(phoneCode: string): Promise<WechatPhoneInfo> {
    return this.withToken(async (accessToken) => {
      const raw = await this.transport.postJson<RawPhoneResponse>(
        '/wxa/business/getuserphonenumber',
        { code: phoneCode },
        { access_token: accessToken },
        // 手机号 code 是一次性的，网络结果未知时不盲目重发
        { retry: false },
      );
      const info = raw.phone_info;
      if (!info?.phoneNumber || !info.purePhoneNumber) {
        throw new WechatApiError(WECHAT_UNEXPECTED_RESPONSE_CODE, '微信未返回手机号');
      }
      return {
        phoneNumber: info.phoneNumber,
        purePhoneNumber: info.purePhoneNumber,
        countryCode: info.countryCode ?? '',
      };
    });
  }

  /**
   * 发送订阅消息（§13.5）。
   *
   * 注意 errcode `43101`（用户未订阅）会以 `WechatApiError` 抛出：调用方按「用户没同意接收」处理，
   * 不要当作系统故障；本方法**不重试**（避免重复下发消息）。
   */
  async sendSubscribeMessage(input: SendSubscribeMessageInput): Promise<void> {
    const miniprogramState =
      input.miniprogramState ?? resolveMiniprogramState(this.env.WX_ENV_VERSION);
    await this.withToken(async (accessToken) => {
      await this.transport.postJson(
        '/cgi-bin/message/subscribe/send',
        {
          touser: input.openid,
          template_id: input.templateId,
          miniprogram_state: miniprogramState,
          data: input.data,
          ...(input.page ? { page: input.page } : {}),
          ...(input.lang ? { lang: input.lang } : {}),
        },
        { access_token: accessToken },
        { retry: false },
      );
    });
  }

  /**
   * 生成不限量小程序码（§5.3 P-05）。`scene` 最长 32 字符，超长/为空是调用方的编程错误，
   * 直接抛 40020，不消耗微信配额。
   */
  async getUnlimitedQrcode(input: UnlimitedQrcodeInput): Promise<UnlimitedQrcodeResult> {
    assertScene(input.scene);
    const envVersion = input.envVersion ?? this.env.WX_ENV_VERSION;
    const checkPath = input.checkPath ?? envVersion === 'release';
    return this.withToken(async (accessToken) => {
      const result = await this.transport.postBinary(
        '/wxa/getwxacodeunlimit',
        {
          scene: input.scene,
          env_version: envVersion,
          check_path: checkPath,
          ...(input.page ? { page: input.page } : {}),
          ...(input.width ? { width: input.width } : {}),
        },
        { access_token: accessToken },
      );
      return { buffer: result.buffer, contentType: result.contentType };
    });
  }

  /** 带令牌执行：令牌失效时强制刷新并只重试一次 */
  private async withToken<T>(operation: (accessToken: string) => Promise<T>): Promise<T> {
    const accessToken = await this.tokens.getToken();
    try {
      return await operation(accessToken);
    } catch (error) {
      if (!isWechatApiError(error) || !error.tokenInvalid) throw error;
      this.logger?.warn('微信 access_token 失效，刷新后重试一次', { errcode: error.errcode });
      const refreshed = await this.tokens.refreshToken();
      return operation(refreshed);
    }
  }
}

/** scene 校验：与产品文档 §5.3 P-05 的「最长 32 字符」一致。属于调用方的参数错误 → 40020 */
export function assertScene(scene: string): void {
  if (scene.length === 0) {
    throw new BizException(ErrorCode.INVALID_PARAMS, '小程序码 scene 不能为空');
  }
  if (scene.length > WECHAT_QRCODE_SCENE_MAX_LENGTH) {
    throw new BizException(
      ErrorCode.INVALID_PARAMS,
      `小程序码 scene 最长 ${String(WECHAT_QRCODE_SCENE_MAX_LENGTH)} 个字符（当前 ${String(scene.length)}），请改用短码`,
    );
  }
}
