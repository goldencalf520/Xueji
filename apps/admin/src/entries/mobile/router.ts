import { createRouter, createWebHashHistory } from 'vue-router';
import { collectRoutes, type FeatureRoute } from '@/shared/route-registry';
import MobileLayout from './layouts/MobileLayout.vue';

const featureRoutes = collectRoutes(
  import.meta.glob<{ default: FeatureRoute[] }>('../../modules/*/mobile.routes.ts', {
    eager: true,
  }),
);

export const router = createRouter({
  history: createWebHashHistory(),
  routes: [{ path: '/', component: MobileLayout, redirect: '/home', children: featureRoutes }],
});

export { featureRoutes };
