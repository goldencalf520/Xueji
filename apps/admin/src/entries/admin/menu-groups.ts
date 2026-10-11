/** 管理端一级菜单（§6.1）。功能路由通过 meta.group 挂到对应分组下 */
export const MENU_GROUPS = [
  { key: 'workbench', title: '工作台', order: 0 },
  { key: 'customer', title: '客户', order: 10 },
  { key: 'health', title: '健康', order: 20 },
  { key: 'config', title: '配置', order: 30 },
  { key: 'marketing', title: '营销', order: 40 },
  { key: 'partner', title: '合作方', order: 50 },
  { key: 'mirror', title: '魔镜', order: 60 },
  { key: 'data', title: '数据', order: 70 },
  { key: 'system', title: '系统', order: 80 },
] as const;

export type MenuGroupKey = (typeof MENU_GROUPS)[number]['key'];
