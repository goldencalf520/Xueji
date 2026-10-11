<script setup lang="ts">
import { computed } from 'vue';
import { featureRoutes } from '../router';

/**
 * 医院端布局骨架（§7.1 菜单：转介单 · 预约日历 · 回传记录 · 服务与套餐 · 对账 · 账号设置）。
 * 登录（账号 + 短信动态码）、水印、审计提示由医院端框架 issue 补全。
 */
const menu = computed(() => featureRoutes.filter((r) => !r.meta.hidden));
</script>

<template>
  <el-container class="layout">
    <el-header class="header">
      <span class="brand">雪姬 · 合作医院工作台</span>
      <el-menu mode="horizontal" router :default-active="$route.path" :ellipsis="false">
        <el-menu-item v-for="item in menu" :key="String(item.name)" :index="`/${String(item.path)}`">
          {{ item.meta.title }}
        </el-menu-item>
      </el-menu>
    </el-header>
    <el-main>
      <router-view />
    </el-main>
  </el-container>
</template>

<style scoped>
.layout {
  min-height: 100vh;
}
.header {
  display: flex;
  align-items: center;
  gap: 24px;
  border-bottom: 1px solid var(--el-border-color-light);
}
.brand {
  font-weight: 700;
  color: var(--xj-care);
}
</style>
