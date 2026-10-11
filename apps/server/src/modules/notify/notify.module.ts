import { Module } from '@nestjs/common';

/**
 * 消息通知：订阅消息、企微应用消息、短信、站内消息
 * 文档：§8.2、§13.5
 * 拥有的表：prisma/schema/notify.prisma：notification_log, subscribe_quota, inbox_message
 *
 * 占位模块：已在 modules/index.ts 预注册，认领对应 issue 后在本目录内实现。
 * 负责 issue：#31（SRV-12）。
 */
@Module({})
export class NotifyModule {}
