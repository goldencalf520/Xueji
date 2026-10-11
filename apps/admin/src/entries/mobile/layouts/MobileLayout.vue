<script setup lang="ts">
import { computed } from 'vue';
import { featureRoutes } from '../router';

/**
 * 顾问移动工作台布局骨架（§6.3）：单列、大按钮、底部标签。
 * 企业微信网页授权免登、JS-SDK（扫码）封装由移动工作台框架 issue 补全。
 */
const tabs = computed(() =>
  featureRoutes
    .filter((r) => r.meta.tab)
    .sort((a, b) => (a.meta.tab?.order ?? 0) - (b.meta.tab?.order ?? 0)),
);
</script>

<template>
  <div class="page">
    <router-view />
    <van-tabbar route placeholder>
      <van-tabbar-item v-for="t in tabs" :key="String(t.name)" :to="`/${String(t.path)}`" :icon="t.meta.tab?.icon">
        {{ t.meta.title }}
      </van-tabbar-item>
    </van-tabbar>
  </div>
</template>

<style scoped>
.page {
  min-height: 100vh;
  background: #f4f2f3;
}
</style>
