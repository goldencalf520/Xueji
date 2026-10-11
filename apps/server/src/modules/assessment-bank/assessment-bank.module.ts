import { Module } from '@nestjs/common';

/**
 * 测评题库：模板版本、题目、模拟、发布
 * 文档：§6.2.6、附录 C
 * 拥有的表：prisma/schema/assessment.prisma：h_assessment_template, h_assessment_question, h_assessment, h_assessment_answer
 *
 * 占位模块：已在 modules/index.ts 预注册，认领对应 issue 后在本目录内实现。
 * 负责 issue 见 docs/architecture/ownership.md。
 */
@Module({})
export class AssessmentBankModule {}
