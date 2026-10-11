import { Module } from '@nestjs/common';

/**
 * 魔镜：人设、会话、消息、风险、记忆
 * 文档：§5.3 P-03、§9.8、§10.6–10.8
 * 拥有的表：prisma/schema/mirror.prisma：mirror_persona, h_mirror_session, h_mirror_message, h_mirror_memory
 *
 * 占位模块：已在 modules/index.ts 预注册，认领对应 issue 后在本目录内实现。
 * 负责 issue 见 docs/architecture/ownership.md。
 */
@Module({})
export class MirrorModule {}
