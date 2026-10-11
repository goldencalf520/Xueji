<script setup lang="ts">
import { computed } from 'vue';
import { MENU_GROUPS } from '../menu-groups';
import { featureRoutes } from '../router';

/**
 * 管理端布局骨架：按 §6.1 分组生成侧边菜单。
 * 登录态、权限过滤、页面水印（员工姓名 + 工号）、30 分钟无操作退出由 ADM-01 issue 补全。
 */
const menu = computed(() =>
  MENU_GROUPS.map((g) => ({
    ...g,
    items: featureRoutes.filter((r) => r.meta.group === g.key && !r.meta.hidden),
  })).filter((g) => g.items.length > 0),
);
</script>

<template>
  <el-container class="layout">
    <el-aside width="220px" class="aside">
      <div class="brand">雪姬 · 管理端</div>
      <el-menu router :default-active="$route.path">
        <template v-for="group in menu" :key="group.key">
          <el-menu-item v-if="group.items.length === 1" :index="`/${String(group.items[0]?.path)}`">
            {{ group.items[0]?.meta.title }}
          </el-menu-item>
          <el-sub-menu v-else :index="group.key">
            <template #title>{{ group.title }}</template>
            <el-menu-item v-for="item in group.items" :key="String(item.name)" :index="`/${String(item.path)}`">
              {{ item.meta.title }}
            </el-menu-item>
          </el-sub-menu>
        </template>
      </el-menu>
    </el-aside>
    <el-main>
      <router-view />
    </el-main>
  </el-container>
</template>

<style scoped>
.layout {
  min-height: 100vh;
}
.aside {
  border-right: 1px solid var(--el-border-color-light);
}
.brand {
  padding: 20px;
  font-weight: 700;
  color: var(--xj-brand);
}
</style>
