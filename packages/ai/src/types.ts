/**
 * AI 网关契约（§10.2）。业务代码只能通过网关调用模型，禁止直接引用模型 SDK。
 */
import type { AiScene } from '@xueji/shared';

export type ChatRole = 'system' | 'user' | 'assistant';

export interface ChatMessage {
  role: ChatRole;
  content: string;
}

export interface ChatOptions {
  scene: AiScene;
  /** 流式返回（魔镜） */
  stream?: boolean;
  /** 要求模型输出 JSON，并按此 schema 校验（zod / JSON Schema） */
  jsonSchema?: unknown;
  /** 超时：方案 30 秒；魔镜首字 5 秒（§10.2） */
  timeoutMs?: number;
  /** 提示词版本号，写入 ai_call_log */
  promptVersion?: string;
  /** 关联业务记录，写入 ai_call_log */
  ref?: { table: string; id: string };
}

export interface ChatResult {
  content: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  latencyMs: number;
}

/** 调用记录（默认不保存对话原文，§10.2） */
export interface AiCallRecord {
  scene: AiScene;
  model: string;
  promptVersion?: string;
  inputTokens: number;
  outputTokens: number;
  latencyMs: number;
  status: 'ok' | 'error' | 'timeout' | 'circuit_open' | 'blocked';
  error?: string;
  ref?: { table: string; id: string };
}

export interface AiGateway {
  chat(messages: ChatMessage[], options: ChatOptions): Promise<ChatResult>;
  chatStream(messages: ChatMessage[], options: ChatOptions): AsyncIterable<string>;
}

/** 场景 → 模型配置（来自系统参数，§10.2 "在系统参数里按场景配置模型"） */
export interface SceneModelConfig {
  model: string;
  fallbackModel?: string;
  temperature?: number;
  maxOutputTokens?: number;
}
