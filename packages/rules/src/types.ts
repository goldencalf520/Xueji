/**
 * 规则引擎的输入输出类型（§4.4–§4.8、§13.5、附录 A–E）。
 *
 * 这是 RULE-* 系列 issue 共同依赖的契约，先于实现定稿，使计分、红旗、禁忌、骨架几个子包可以并行开发。
 * 修改字段请同步通知依赖方（engine、assessment、plan 模块）。
 */
import type {
  AssessmentLevel,
  ContraindicationEffect,
  CouponType,
  Dimension,
  Gender,
  ProjectAttribute,
  RiskLevel,
  RuleKind,
  Tier,
} from '@xueji/shared';

/** JSON Logic 表达式（https://jsonlogic.com），规则条件、题目显示条件、方案包触发条件统一使用 */
export type JsonLogic = { [operator: string]: unknown } | boolean;

/** 单题答案的值：单选为 value，多选为 value 数组，滑块 / 数字 / 计时 / 计数为数字 */
export type AnswerValue = string | number | string[] | null;

/** 由答案计算出的量表与指标（§4.6、附录 C） */
export interface ComputedValues {
  bmi?: number;
  waistCm?: number;
  /** OSTA 指数 =（体重 kg − 年龄）× 0.2 */
  osta?: number;
  /** SARC-F 0–10 分，≥ 4 阳性 */
  sarcf?: number;
  /** PHQ-2 0–6 分，≥ 3 阳性 */
  phq2?: number;
  /** GAD-2 0–6 分，≥ 3 阳性 */
  gad2?: number;
  /** 30 秒坐站次数 */
  chairStand?: number;
  /** 坐站是否低于同年龄段参考值 */
  chairStandLow?: boolean;
  /** 单腿站立秒数 */
  balanceSec?: number;
  /** 跌倒风险 3 问任一为"是" */
  fallRisk?: boolean;
  /** 允许扩展其它计算值（需同步更新本文件） */
  [key: string]: number | boolean | undefined;
}

/**
 * 事实对象：规则引擎唯一输入。服务端从数据库组装，后台"模拟"功能手工构造，二者共用同一套引擎代码。
 * JSON Logic 中以 `{"var":"answers.W05"}`、`{"var":"computed.osta"}`、`{"var":"age"}` 引用。
 */
export interface Facts {
  age: number | null;
  gender: Gender;
  tier?: Tier;
  elderMode?: boolean;
  /** 是否开启个性化推荐（C7），影响 R14 / PK06 的 M9 */
  personalization?: boolean;
  /** 题目编码 → 答案 */
  answers: Record<string, AnswerValue>;
  computed: ComputedValues;
  /** 当前有效的健康标签（含 red_flag_active、doctor_hold_* 等） */
  tags: string[];
  /** 最近一次门店测量：指标编码 → 数值，如 { SBP: 150, DBP: 95 } */
  measurements: Record<string, number>;
}

/** 规则定义（与 h_rule 表一一对应，§11.3.7） */
export interface RuleDefinition {
  code: string;
  kind: RuleKind;
  /** 红旗：L3 / L2；风险信号：L1 */
  level?: Extract<RiskLevel, 'L1' | 'L2' | 'L3'>;
  condition: JsonLogic;
  action: RuleAction;
  version: number;
}

export interface RuleAction {
  /** 推荐的医疗服务 M 编码 */
  services?: string[];
  /** 命中后产生的健康标签 */
  tags?: string[];
  /** 禁忌：触发的健康标签 */
  tag?: string;
  /** 禁忌：作用的项目属性；`*` 表示全部项目 */
  attributes?: Array<ProjectAttribute | '*'>;
  effect?: ContraindicationEffect;
  /** 禁忌提示文案（顾问版） */
  message?: string;
}

export interface RuleHit {
  code: string;
  kind: RuleKind;
  level?: RiskLevel;
  services: string[];
  tags: string[];
}

/** 风险判定结果（§4.4：取所有命中规则的最高级） */
export interface RiskEvaluation {
  riskLevel: RiskLevel;
  hits: RuleHit[];
  /** 新产生的健康标签（去重） */
  tags: string[];
  /** 推荐的医疗服务（去重、保持命中顺序） */
  services: string[];
}

/** 维度计分结果（附录 C.1） */
export interface DimensionScores {
  scores: Partial<Record<Dimension, number>>;
  /** 六维年轻化指数：已完成维度的平均分（取整） */
  index: number | null;
  /** 有未完成维度时为 false，前端标注"未完成" */
  complete: boolean;
}

export type DimensionGrade = 'excellent' | 'good' | 'attention';

/** 门店项目（附录 D.2，与 project 表对应） */
export interface StoreProject {
  code: string;
  name: string;
  dimension: Dimension;
  attributes: ProjectAttribute[];
}

/** 禁忌筛查结果 */
export interface ContraindicationResult {
  project: string;
  effect: ContraindicationEffect | 'pass';
  /** 命中的禁忌规则编码与原因，如 `htn_uncontrolled → heat` */
  reasons: Array<{
    rule: string;
    tag: string;
    attribute: ProjectAttribute | '*';
    message?: string;
  }>;
}

/** 方案包定义（附录 E，与 plan_package 表对应） */
export interface PlanPackageDefinition {
  code: string;
  name: string;
  trigger: JsonLogic;
  priority: number;
  items: Array<{ project: string; freq: string; elderNote?: string }>;
  medicalLinks: string[];
  tiers?: Tier[];
  weeks: number | null;
}

/** 方案骨架（§4.7.3）：规则定骨架，AI 只写文案，不得增删改其中任何项目 */
export interface PlanSkeleton {
  planVersion: string;
  customer: { salutation: string; ageBand: string; elderMode: boolean };
  riskLevel: RiskLevel;
  packages: Array<{ code: string; name: string; role: 'primary' | 'secondary' }>;
  medical: Array<{
    service: string;
    name: string;
    reasonCode: string;
    facts: Record<string, unknown>;
  }>;
  coupon: { type: CouponType; eligible: boolean } | null;
  storeItems: Array<{ project: string; name: string; freq: string; flags: string[] }>;
  removedItems: Array<{ project: string; reason: string }>;
  lifestyleCodes: string[];
  followUps: Array<{ when: string; action: string }>;
}

/** 测评中逐题即时检查（§4.5：任何一题触发 L3 立即中断） */
export interface InstantCheckResult {
  urgent: boolean;
  hits: RuleHit[];
}

export type { AssessmentLevel };
