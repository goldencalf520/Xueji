import type { FeatureRoute } from '@/shared/route-registry';

/** 工作台（§6.2.2）。占位页，由工作台 issue 实现 */
export default [
  {
    path: 'workbench',
    name: 'workbench',
    component: () => import('./WorkbenchView.vue'),
    meta: { title: '工作台', group: 'workbench', order: 0 },
  },
] satisfies FeatureRoute[];
