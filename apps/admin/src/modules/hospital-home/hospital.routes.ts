import type { FeatureRoute } from '@/shared/route-registry';

/** 医院端首页占位：由医院端框架 issue 替换为转介单待办概览 */
export default [
  {
    path: 'home',
    name: 'hospital-home',
    component: () => import('./HospitalHomeView.vue'),
    meta: { title: '首页', order: 0 },
  },
] satisfies FeatureRoute[];
