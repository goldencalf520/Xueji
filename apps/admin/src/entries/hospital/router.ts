import { createRouter, createWebHashHistory } from 'vue-router';
import { collectRoutes, type FeatureRoute } from '@/shared/route-registry';
import HospitalLayout from './layouts/HospitalLayout.vue';

const featureRoutes = collectRoutes(
  import.meta.glob<{ default: FeatureRoute[] }>('../../modules/*/hospital.routes.ts', {
    eager: true,
  }),
);

export const router = createRouter({
  history: createWebHashHistory(),
  routes: [{ path: '/', component: HospitalLayout, redirect: '/home', children: featureRoutes }],
});

export { featureRoutes };
