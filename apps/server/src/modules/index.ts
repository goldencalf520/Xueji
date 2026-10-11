/**
 * 功能模块注册表。所有规划中的模块都已预注册（多数是占位），实现某个模块时只改该模块自己的目录，
 * 不需要改这里 —— 这样多个 agent 并行开发不会在 app.module 上冲突。
 *
 * 确需新增模块时：在数组末尾追加一行（只追加、不重排），合并冲突时保留双方的行即可。
 */

import { ActivityModule } from './activity/activity.module';
import { AiModule } from './ai/ai.module';
import { AlertModule } from './alert/alert.module';
import { AnnualReportModule } from './annual-report/annual-report.module';
import { AppProfileModule } from './app-profile/app-profile.module';
import { ArchiveModule } from './archive/archive.module';
import { AssessmentModule } from './assessment/assessment.module';
import { AssessmentBankModule } from './assessment-bank/assessment-bank.module';
import { AuditModule } from './audit/audit.module';
import { AuthAdminModule } from './auth-admin/auth-admin.module';
import { AuthAppModule } from './auth-app/auth-app.module';
import { AuthHospitalModule } from './auth-hospital/auth-hospital.module';
import { CheckinModule } from './checkin/checkin.module';
import { CheckupModule } from './checkup/checkup.module';
import { CheckupBookingModule } from './checkup-booking/checkup-booking.module';
import { ConsentModule } from './consent/consent.module';
import { ConsumptionModule } from './consumption/consumption.module';
import { CustomerModule } from './customer/customer.module';
import { CustomerAdminModule } from './customer-admin/customer-admin.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { DeviceModule } from './device/device.module';
import { EngineModule } from './engine/engine.module';
import { EngineConfigModule } from './engine-config/engine-config.module';
import { FamilyModule } from './family/family.module';
import { FileModule } from './file/file.module';
import { GroupbuyModule } from './groupbuy/groupbuy.module';
import { HealthModule } from './health/health.module';
import { HomeModule } from './home/home.module';
import { HospitalCatalogModule } from './hospital-catalog/hospital-catalog.module';
import { HospitalReferralModule } from './hospital-referral/hospital-referral.module';
import { LeadModule } from './lead/lead.module';
import { MeasurementModule } from './measurement/measurement.module';
import { MirrorModule } from './mirror/mirror.module';
import { ModuleCenterModule } from './module-center/module-center.module';
import { NotifyModule } from './notify/notify.module';
import { OrgModule } from './org/org.module';
import { OrgSyncModule } from './org-sync/org-sync.module';
import { PartnerModule } from './partner/partner.module';
import { PhotoModule } from './photo/photo.module';
import { PlanModule } from './plan/plan.module';
import { PlanAiModule } from './plan-ai/plan-ai.module';
import { PointsModule } from './points/points.module';
import { PrivacyModule } from './privacy/privacy.module';
import { QrcodeModule } from './qrcode/qrcode.module';
import { QuizModule } from './quiz/quiz.module';
import { ReferralModule } from './referral/referral.module';
import { ReferralAiModule } from './referral-ai/referral-ai.module';
import { ReportModule } from './report/report.module';
import { ReportAiModule } from './report-ai/report-ai.module';
import { ServiceCheckModule } from './service-check/service-check.module';
import { SettingsModule } from './settings/settings.module';
import { SpeechModule } from './speech/speech.module';
import { StatementModule } from './statement/statement.module';
import { StatsModule } from './stats/stats.module';
import { TaskModule } from './task/task.module';
import { TierModule } from './tier/tier.module';
import { TransportModule } from './transport/transport.module';
import { WechatModule } from './wechat/wechat.module';
import { WecomModule } from './wecom/wecom.module';

export const FEATURE_MODULES = [
  HealthModule,
  WechatModule,
  WecomModule,
  OrgModule,
  OrgSyncModule,
  SettingsModule,
  AuditModule,
  FileModule,
  NotifyModule,
  TaskModule,
  AuthAppModule,
  AuthAdminModule,
  AuthHospitalModule,
  CustomerModule,
  CustomerAdminModule,
  AppProfileModule,
  QrcodeModule,
  ConsentModule,
  PrivacyModule,
  FamilyModule,
  ConsumptionModule,
  TierModule,
  PartnerModule,
  ModuleCenterModule,
  HomeModule,
  LeadModule,
  ActivityModule,
  AiModule,
  SpeechModule,
  MirrorModule,
  AlertModule,
  EngineModule,
  EngineConfigModule,
  AssessmentBankModule,
  AssessmentModule,
  ArchiveModule,
  DeviceModule,
  MeasurementModule,
  ReportModule,
  ReportAiModule,
  AnnualReportModule,
  CheckupModule,
  CheckupBookingModule,
  ReferralModule,
  HospitalReferralModule,
  ReferralAiModule,
  HospitalCatalogModule,
  StatementModule,
  PlanModule,
  PlanAiModule,
  ServiceCheckModule,
  PointsModule,
  CheckinModule,
  QuizModule,
  GroupbuyModule,
  TransportModule,
  PhotoModule,
  StatsModule,
  DashboardModule,
];
