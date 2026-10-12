/**
 * 微信小程序服务端 SDK 的公开类型（SRV-10 / #29）。
 *
 * 约定（docs/conventions/backend.md 第 9 条）：所有对微信服务端 API 的调用都集中在本模块，
 * 其它模块注入 `WechatClient` 使用，不要自己拼 HTTP 请求、不要各处维护 access_token。
 */

/** 小程序码 `scene` 参数上限（产品文档 §5.3 P-05：最长 32 个字符，只放一个短码，如 `q=K7P2X9`） */
export const WECHAT_QRCODE_SCENE_MAX_LENGTH = 32;

/** `WX_ENV_VERSION` 取值，对应小程序「开发版 / 体验版 / 正式版」 */
export type WechatEnvVersion = 'develop' | 'trial' | 'release';

/** 订阅消息 `miniprogram_state` 取值（与 WX_ENV_VERSION 的对应关系见 wechat.config.ts） */
export type WechatMiniprogramState = 'developer' | 'trial' | 'formal';

/** code2Session 结果：用小程序 `wx.login` 的 code 换取的会话信息（文档 §9.1） */
export interface WechatSession {
  openid: string;
  /**
   * 会话密钥。**只在服务端使用**：禁止下发客户端、禁止写日志、禁止入库明文
   * （如需落库由调用方按 SRV-02 的字段加密处理）。
   */
  sessionKey: string;
  /** 开放平台账号下才返回 */
  unionid?: string;
}

/** 手机号快速验证结果 */
export interface WechatPhoneInfo {
  /** 带区号的手机号，如 +8613800000000 */
  phoneNumber: string;
  /** 纯手机号，用于与收银系统导入的老客户做哈希匹配（§9.1） */
  purePhoneNumber: string;
  countryCode: string;
}

/** 订阅消息模板数据：key 为模板里的字段名（thing1 / time2 …），值为 { value } */
export type SubscribeMessageData = Record<string, { value: string }>;

export interface SendSubscribeMessageInput {
  /** 接收者 openid */
  openid: string;
  templateId: string;
  /** 点击消息卡片跳转的小程序页面，如 `pages/index/index` */
  page?: string;
  data: SubscribeMessageData;
  lang?: 'zh_CN' | 'zh_TW' | 'en_US';
  /** 缺省按 `WX_ENV_VERSION` 推断 */
  miniprogramState?: WechatMiniprogramState;
}

export interface UnlimitedQrcodeInput {
  /** 短码（≤ {@link WECHAT_QRCODE_SCENE_MAX_LENGTH} 字符），对应 qrcode 表的一条记录（§5.3 P-05） */
  scene: string;
  /** 扫码后打开的小程序页面 */
  page?: string;
  /** 二维码边长（px） */
  width?: number;
  /** 是否校验 page 必须为已发布页面 */
  checkPath?: boolean;
  /** 缺省按 `WX_ENV_VERSION` 推断 */
  envVersion?: WechatEnvVersion;
}

export interface UnlimitedQrcodeResult {
  /** PNG 二进制内容 */
  buffer: Buffer;
  contentType: string;
}

/**
 * 微信服务端 SDK 门面。
 *
 * 两种实现：
 * - `WechatRealClient`：真实调用微信（`WX_APPID` 有值时启用）；
 * - `WechatFakeClient`：本地开发与测试用的固定实现（`WX_APPID` 为空时启用）。
 *
 * 所有方法失败时抛 `WechatApiError`（见 wechat.errors.ts），调用方按 errcode 决定文案与兜底。
 */
export abstract class WechatClient {
  abstract code2Session(code: string): Promise<WechatSession>;
  abstract getPhoneNumber(phoneCode: string): Promise<WechatPhoneInfo>;
  abstract sendSubscribeMessage(input: SendSubscribeMessageInput): Promise<void>;
  abstract getUnlimitedQrcode(input: UnlimitedQrcodeInput): Promise<UnlimitedQrcodeResult>;
}
