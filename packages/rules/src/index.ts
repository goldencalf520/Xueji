/**
 * @xueji/rules：纯函数规则引擎。无 I/O、无数据库、无时间副作用（"当前时间"作为参数传入）。
 *
 * 子模块按目录拆分，各由独立 issue 实现，通过子路径引用以避免共同修改本文件：
 *   @xueji/rules/core/*               JSON Logic 执行器、事实对象工具、等级合并
 *   @xueji/rules/scoring/*            维度计分、六维指数、OSTA / SARC-F / PHQ-2 / GAD-2 / BMI
 *   @xueji/rules/rulesets/*           红旗（附录 A）、风险信号（附录 B）、禁忌（附录 D）、方案包（附录 E）规则数据
 *   @xueji/rules/contraindication/*   禁忌筛查
 *   @xueji/rules/plan-skeleton/*      方案骨架生成
 *   @xueji/rules/regression/*         回归测试集运行与差异比较
 */
export type * from './types';
