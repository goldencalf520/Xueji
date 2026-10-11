import type { FeatureRoute } from '@/shared/route-registry';

/** 移动工作台首页占位：由"我的任务" issue 替换（§6.3） */
export default [
  {
    path: 'home',
    name: 'mobile-home',
    component: () => import('./MobileHomeView.vue'),
    meta: { title: '任务', tab: { icon: 'todo-list-o', order: 0 } },
  },
] satisfies FeatureRoute[];
