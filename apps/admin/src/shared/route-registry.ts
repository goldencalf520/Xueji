import type { RouteRecordRaw } from 'vue-router';

/**
 * 路由自动注册：每个功能目录 src/modules/<功能>/ 下放 admin.routes.ts / hospital.routes.ts / mobile.routes.ts，
 * 默认导出 FeatureRoute[]。入口通过 import.meta.glob 收集，新增功能不需要改任何集中路由文件，
 * 多 agent 并行开发互不冲突。
 */
export interface FeatureRouteMeta {
  /** 菜单 / 页面标题 */
  title: string;
  /** 管理端一级菜单分组（见 entries/admin/menu-groups.ts）；医院端、移动端不填 */
  group?: string;
  /** 同组内排序，越小越靠前 */
  order?: number;
  /** 需要的权限码（§2.2），没有权限时菜单隐藏、路由拦截 */
  permission?: string;
  /** 不在菜单中显示（如详情页） */
  hidden?: boolean;
  /** 移动工作台底部标签 */
  tab?: { icon: string; order: number };
  [key: string]: unknown;
}

export type FeatureRoute = RouteRecordRaw & { meta: FeatureRouteMeta };

export function collectRoutes(
  modules: Record<string, { default: FeatureRoute[] }>,
): FeatureRoute[] {
  return Object.values(modules)
    .flatMap((m) => m.default)
    .sort((a, b) => (a.meta.order ?? 100) - (b.meta.order ?? 100));
}
