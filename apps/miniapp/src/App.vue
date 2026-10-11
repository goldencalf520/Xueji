<script setup lang="ts">
import { onLaunch } from '@dcloudio/uni-app';

onLaunch(() => {
  // 登录态恢复、乐龄模式检测（微信关怀模式 / 系统大字体）、埋点 app_open 由 MP-01 / MP-02 issue 实现
});
</script>

<style lang="scss">
page {
  background: $xj-bg;
  color: $xj-ink;
  font-family: $xj-font-family;
  font-size: $xj-std-body;
  line-height: $xj-std-line-height;
}

/* 占位页样式：页面实现后自然不再使用 */
.xj-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16rpx;
  padding: 160rpx 48rpx;
  &__code {
    font-family: $xj-font-number;
    color: $xj-brand;
    font-size: 28rpx;
  }
  &__title {
    font-size: $xj-elder-title;
    font-weight: 700;
  }
  &__desc {
    color: $xj-ink-2;
  }
}
</style>
