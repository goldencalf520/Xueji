/**
 * 业务词汇表：所有在数据库、接口、前端中出现的枚举值都从这里取，禁止各模块自行发明同义值。
 * 取值严格对应《产品设计与开发文档 v1.0》（docs/product），章节号见注释。
 *
 * 修改规则：只允许「追加」取值；重命名或删除取值必须走架构评审（会影响已落库数据）。
 */

const values = <const T extends readonly string[]>(...v: T) => v;

/* ───────────────────────── 端与身份 ───────────────────────── */

/** JWT `aud`：三个端的令牌互不通用（§12.1） */
export const AUDIENCES = values('app', 'admin', 'hospital');
export type Audience = (typeof AUDIENCES)[number];

/** 后台员工角色（§2.2） */
export const STAFF_ROLES = values(
  'super_admin',
  'ops',
  'store_manager',
  'advisor',
  'health_advisor',
  'finance',
);
export type StaffRole = (typeof STAFF_ROLES)[number];

/** 员工数据范围（§6.2.19、§13.5） */
export const DATA_SCOPES = values('all', 'store', 'self');
export type DataScope = (typeof DATA_SCOPES)[number];

/** 医院账号角色（§11.3.1） */
export const HOSPITAL_ROLES = values('admin', 'coordinator', 'doctor');
export type HospitalRole = (typeof HOSPITAL_ROLES)[number];

/* ───────────────────────── 客户 ───────────────────────── */

/** 会员等级（§4.1）。前台只能出现 TIER_NAMES，禁止出现"高端/中端/低端" */
export const TIERS = values('A', 'B', 'C');
export type Tier = (typeof TIERS)[number];
export const TIER_NAMES: Record<Tier, string> = {
  A: '臻享会员',
  B: '尊享会员',
  C: '悦享会员',
};

export const TIER_CHANGE_REASONS = values('auto_up', 'auto_down', 'manual', 'new');
export type TierChangeReason = (typeof TIER_CHANGE_REASONS)[number];

export const GENDERS = values('female', 'male', 'unknown');
export type Gender = (typeof GENDERS)[number];

/** 语言：普通话 / 粤语（§4.2） */
export const LANGS = values('zh', 'yue');
export type Lang = (typeof LANGS)[number];

export const CUSTOMER_SOURCES = values(
  'store_qr',
  'wecom',
  'family_invite',
  'share',
  'activity',
  'import',
);
export type CustomerSource = (typeof CUSTOMER_SOURCES)[number];

export const CUSTOMER_STATUSES = values('active', 'deactivating', 'deleted');
export type CustomerStatus = (typeof CUSTOMER_STATUSES)[number];

/** 运营标签（非健康，§11.3.2） */
export const CUSTOMER_LABELS = values('dormant', 'to_wake', 'vip_priority');

export const QRCODE_PURPOSES = values('store', 'staff', 'activity', 'family');
export type QrcodePurpose = (typeof QRCODE_PURPOSES)[number];

/** 家人关系与可见范围（§5.3 P-32～P-35、§11.3.2） */
export const FAMILY_RELATIONS = values('daughter', 'son', 'spouse', 'other');
export type FamilyRelation = (typeof FAMILY_RELATIONS)[number];
export const FAMILY_PERMISSIONS = values('view_report', 'receive_reminder', 'book_for', 'fill_for');
export type FamilyPermission = (typeof FAMILY_PERMISSIONS)[number];
export const FAMILY_LINK_STATUSES = values('pending', 'active', 'revoked');

/* ───────────────────────── 授权 ───────────────────────── */

/** 个人信息授权 C1–C9（§4.11、附录 J） */
export const CONSENT_TYPES = values('C1', 'C2', 'C3', 'C4', 'C5', 'C6', 'C7', 'C8', 'C9');
export type ConsentType = (typeof CONSENT_TYPES)[number];
export const CONSENT_NAMES: Record<ConsentType, string> = {
  C1: '用户协议与隐私政策',
  C2: '健康信息处理',
  C3: '向合作医院提供信息',
  C4: '医院向平台回传结果',
  C5: '人脸 / 身体照片',
  C6: '家人查看',
  C7: '个性化推荐',
  C8: '向境外机构提供信息',
  C9: '魔镜记忆',
};
export const CONSENT_CHANNELS = values('self', 'staff_assisted', 'paper');
export type ConsentChannel = (typeof CONSENT_CHANNELS)[number];

/* ───────────────────────── 健康与风险 ───────────────────────── */

/** 风险等级（§4.4）：一次测评取所有命中规则中的最高级 */
export const RISK_LEVELS = values('L0', 'L1', 'L2', 'L3');
export type RiskLevel = (typeof RISK_LEVELS)[number];

/** 数据来源标签（§4.10.1） */
export const SOURCE_LABELS = values('HOSPITAL', 'STORE', 'SELF');
export type SourceLabel = (typeof SOURCE_LABELS)[number];
export const SOURCE_LABEL_NAMES: Record<SourceLabel, string> = {
  HOSPITAL: '医院出具',
  STORE: '门店测量',
  SELF: '本人记录',
};

export const HEALTH_TAG_SOURCES = values('assessment', 'hospital', 'staff', 'measurement');
export type HealthTagSource = (typeof HEALTH_TAG_SOURCES)[number];

/** 测评关卡（§6.2.6、附录 C） */
export const ASSESSMENT_LEVELS = values(
  'safety',
  'skin',
  'shape',
  'contour',
  'fitness',
  'posture',
  'mind',
  'women',
);
export type AssessmentLevel = (typeof ASSESSMENT_LEVELS)[number];
/** 计入六维指数的六个维度（安全关、女性进阶关不计分） */
export const DIMENSIONS = values('skin', 'shape', 'contour', 'fitness', 'posture', 'mind');
export type Dimension = (typeof DIMENSIONS)[number];
export const DIMENSION_NAMES: Record<Dimension, string> = {
  skin: '肌肤',
  shape: '体型',
  contour: '轮廓',
  fitness: '体能',
  posture: '体态',
  mind: '心灵',
};

export const QUESTION_TYPES = values(
  'single',
  'multi',
  'slider',
  'number',
  'image_choice',
  'timer',
  'counter',
  'photo',
);
export type QuestionType = (typeof QUESTION_TYPES)[number];

export const ASSESSMENT_MODES = values('self', 'staff_assisted', 'family');
export type AssessmentMode = (typeof ASSESSMENT_MODES)[number];
export const ASSESSMENT_STATUSES = values('in_progress', 'completed', 'abandoned');
export const ANSWER_INPUT_METHODS = values('tap', 'voice');

/** 规则种类（§11.3.7）：红旗、风险信号、禁忌、测量 */
export const RULE_KINDS = values('red_flag', 'risk_signal', 'contraindication', 'measurement');
export type RuleKind = (typeof RULE_KINDS)[number];
export const RULE_STATUSES = values('draft', 'active', 'retired');
export const CONTRAINDICATION_EFFECTS = values('block', 'warn');
export type ContraindicationEffect = (typeof CONTRAINDICATION_EFFECTS)[number];

/** 门店项目属性标签（附录 D.1） */
export const PROJECT_ATTRIBUTES = values(
  'manual',
  'deep_pressure',
  'spinal_manipulation',
  'heat',
  'high_temp_bath',
  'rf_energy',
  'electrical',
  'bia_measure',
  'facial_device',
  'abdominal',
  'leg_massage',
  'body_shaping',
  'strong_aroma',
  'exercise',
);
export type ProjectAttribute = (typeof PROJECT_ATTRIBUTES)[number];

/** 预警（§4.4、§10.7、§11.3.12） */
export const ALERT_SOURCES = values('assessment', 'measurement', 'mirror', 'staff');
export type AlertSource = (typeof ALERT_SOURCES)[number];
export const ALERT_LEVELS = values('L3', 'L2', 'high', 'watch');
export type AlertLevel = (typeof ALERT_LEVELS)[number];
export const ALERT_STATUSES = values('open', 'contacting', 'closed');
export const ALERT_CONTACT_RESULTS = values(
  'contacted',
  'no_answer',
  'visited_doctor',
  'refused',
  'other',
);

/* ───────────────────────── 档案、设备、报告 ───────────────────────── */

export const RECORD_TYPES = values(
  'assessment',
  'measurement',
  'hospital_report',
  'service',
  'plan',
  'checkin',
  'photo',
);
export type RecordType = (typeof RECORD_TYPES)[number];

export const DEVICE_ADMISSION_STATUSES = values(
  'pending',
  'reviewing',
  'approved',
  'rejected',
  'retired',
);
export type DeviceAdmissionStatus = (typeof DEVICE_ADMISSION_STATUSES)[number];
export const METRIC_DIRECTIONS = values('higher_better', 'lower_better', 'range');
export const MEASUREMENT_INGEST_METHODS = values('api', 'file', 'ocr', 'manual');

export const REPORT_TYPES = values('assessment', 'measurement', 'hospital', 'annual');
export const REPORT_REVIEW_STATUSES = values(
  'auto_published',
  'pending_review',
  'approved',
  'rejected',
);

/* ───────────────────────── 方案 ───────────────────────── */

export const PLAN_TRIGGERS = values('assessment', 'hospital_return', 'alert_closed', 'manual');
export const PLAN_ENGINES = values('template', 'ai');
export const PLAN_REVIEW_STATUSES = values('pending', 'approved', 'rejected', 'auto');
export const PLAN_STATUSES = values(
  'draft',
  'ready',
  'sent',
  'active',
  'paused',
  'completed',
  'void',
);
export type PlanStatus = (typeof PLAN_STATUSES)[number];

/* ───────────────────────── 体检、转介、对账 ───────────────────────── */

export const COUPON_TYPES = values('BASIC', 'BASIC_ELDER', 'SPECIAL');
export type CouponType = (typeof COUPON_TYPES)[number];
export const COUPON_STATUSES = values('issued', 'claimed', 'booked', 'used', 'expired', 'void');
export type CouponStatus = (typeof COUPON_STATUSES)[number];

export const REFERRAL_STATUSES = values(
  'created',
  'sent',
  'accepted',
  'booked',
  'arrived',
  'returned',
  'closed',
  'cancelled',
);
export type ReferralStatus = (typeof REFERRAL_STATUSES)[number];

/** 医院回传的门店限制 → 健康标签（§7.4、附录 D CI17–CI21） */
export const DOCTOR_HOLD_TAGS = values(
  'doctor_hold_manual',
  'doctor_hold_heavy_manual',
  'doctor_hold_heat',
  'doctor_hold_device',
  'doctor_hold_all',
);

export const MEDICAL_PRICE_TYPES = values('coupon', 'self_pay', 'member');
export const STATEMENT_STATUSES = values('draft', 'sent', 'confirmed', 'disputed', 'settled');

/* ───────────────────────── 模块、首页、线索、合作方 ───────────────────────── */

export const MODULE_CATEGORIES = values(
  'travel',
  'mall',
  'medical',
  'benefit',
  'interactive',
  'activity',
  'builtin',
);
export type ModuleCategory = (typeof MODULE_CATEGORIES)[number];
export const MODULE_ENTRY_TYPES = values('page', 'miniprogram', 'form', 'builtin');
export type ModuleEntryType = (typeof MODULE_ENTRY_TYPES)[number];
export const MODULE_STATUSES = values('offline', 'online');
/** 合规审核状态流转（§4.16）：draft → pending_review → approved（→ 上线）/ rejected */
export const COMPLIANCE_STATUSES = values('draft', 'pending_review', 'approved', 'rejected');
export type ComplianceStatus = (typeof COMPLIANCE_STATUSES)[number];

/** 首页组件类型（§5.6）。小程序遇到不认识的类型直接跳过 */
export const HOME_COMPONENT_TYPES = values(
  'greeting',
  'tierCard',
  'healthCard',
  'entryGrid',
  'banner',
  'moduleList',
  'activityCard',
  'notice',
  'mirrorFab',
  'divider',
);
export type HomeComponentType = (typeof HOME_COMPONENT_TYPES)[number];
export const HOME_LAYOUT_STATUSES = values('draft', 'published', 'archived');

/** 表单设计器字段类型（§6.2.4） */
export const FORM_FIELD_TYPES = values(
  'text',
  'textarea',
  'number',
  'date',
  'dateRange',
  'radio',
  'checkbox',
  'phone',
);
export type FormFieldType = (typeof FORM_FIELD_TYPES)[number];

export const LEAD_TYPES = values('travel', 'overseas_vip', 'transport', 'other');
export type LeadType = (typeof LEAD_TYPES)[number];
export const LEAD_STATUSES = values('new', 'contacted', 'negotiating', 'won', 'lost');
export type LeadStatus = (typeof LEAD_STATUSES)[number];
export const LEAD_LOST_REASONS = values('price', 'time', 'health', 'family_disagree', 'other');
export const FOLLOWUP_METHODS = values('phone', 'wecom', 'visit');

export const PARTNER_TYPES = values(
  'travel_agency',
  'hot_spring',
  'culture_venue',
  'overseas_medical',
  'other',
);
export type PartnerType = (typeof PARTNER_TYPES)[number];

/* ───────────────────────── 任务与通知 ───────────────────────── */

export const TASK_TYPES = values(
  'alert_call',
  'assessment_followup',
  'plan_review',
  'plan_send',
  'referral_book',
  'plan_adjust',
  'lead_followup',
  'recheck_remind',
  'transport',
);
export type TaskType = (typeof TASK_TYPES)[number];
export const TASK_STATUSES = values('todo', 'done', 'cancelled', 'overdue');

export const NOTIFY_CHANNELS = values('subscribe', 'wecom', 'sms');
export type NotifyChannel = (typeof NOTIFY_CHANNELS)[number];

/* ───────────────────────── 魔镜与 AI ───────────────────────── */

/** AI 网关场景（§10.2） */
export const AI_SCENES = values('plan', 'report', 'hospital_rewrite', 'mirror', 'risk', 'memory');
export type AiScene = (typeof AI_SCENES)[number];

/** 魔镜风险分类（§10.7）：A 自伤、B 急症、C 被骗、D 低落孤独、E 无 */
export const MIRROR_RISK_CATEGORIES = values('A', 'B', 'C', 'D', 'E');
export const MIRROR_RISK_LEVELS = values('high', 'watch', 'none');
export const MIRROR_MEMORY_CATEGORIES = values('家人', '爱好', '重要日子', '近期大事', '偏好');

/* ───────────────────────── 互动 ───────────────────────── */

export const CHECKIN_TYPES = values('sleep', 'exercise', 'water', 'period');
export type CheckinType = (typeof CHECKIN_TYPES)[number];
export const ACTIVITY_TYPES = values('lecture', 'health_day', 'birthday', 'tea');
export const ACTIVITY_SIGNUP_STATUSES = values('signed_up', 'checked_in', 'cancelled');
export const GROUPBUY_STATUSES = values('open', 'success', 'closed');

/* ───────────────────────── 系统 ───────────────────────── */

export const FILE_SENSITIVITIES = values('public', 'internal', 'health');
export type FileSensitivity = (typeof FILE_SENSITIVITIES)[number];
export const DATA_REQUEST_TYPES = values('export', 'delete', 'deactivate');
export const AUDIT_ACTOR_TYPES = values('staff', 'hospital_user', 'system');
export const CONSUMPTION_CATEGORIES = values('service', 'card', 'recharge', 'product');
