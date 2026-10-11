import { createRouter, createWebHashHistory } from 'vue-router';
import { collectRoutes, type FeatureRoute } from '@/shared/route-registry';
import AdminLayout from './layouts/AdminLayout.vue';

const featureRoutes = collectRoutes(
  import.meta.glob<{ default: FeatureRoute[] }>('../../modules/*/admin.routes.ts', { eager: true }),
);

export const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: '/',
      component: AdminLayout,
      redirect: '/workbench',
      children: featureRoutes,
    },
  ],
});

export { featureRoutes };
