<script setup lang="ts">
import BorderBox13 from "@/components/datav/border-box-13";

const props = withDefaults(
  defineProps<{
    title: string;
    statusText?: string;
    updatedAt?: string;
  }>(),
  {
    statusText: "运行正常",
    updatedAt: "",
  }
);
</script>

<template>
  <BorderBox13>
    <div class="panel">
      <div class="panel-header">
        <div class="panel-title">{{ props.title }}</div>
        <div class="panel-meta">
          <slot name="meta">
            <div v-if="props.updatedAt" class="panel-update">
              更新：{{ props.updatedAt }}
            </div>
          </slot>
        </div>
      </div>
      <div class="panel-body">
        <slot />
      </div>
    </div>
  </BorderBox13>
</template>

<style scoped lang="scss">
.panel {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  padding-top: 6px;
}

.panel-header {
  height: 38px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 12px;
  box-sizing: border-box;
  position: relative;
}

.panel-title {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  font-size: 21px;
  font-weight: 900;
  letter-spacing: 2px;
  background: linear-gradient(92deg, #0072ff 0%, #00eaff 48.8525%, #01aaff 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  text-shadow: 0 0 18px rgba(0, 234, 255, 0.2);
}

.panel-title::before,
.panel-title::after {
  content: "";
  width: 58px;
  height: 14px;
  background-image: url("@/assets/img/titles/zuo.png");
  background-repeat: no-repeat;
  background-position: center;
  background-size: contain;
  transform: none;
}

.panel-title::after {
  transform: rotate(180deg);
}

.panel-meta {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 12px;
  color: rgba(211, 214, 221, 0.85);
}

.panel-update {
  color: rgba(211, 214, 221, 0.7);
}

.panel-body {
  flex: 1;
  min-height: 0;
  padding: 8px 12px 12px;
  box-sizing: border-box;
}

:deep(.dv-border-box-content) {
  box-sizing: border-box;
  padding: 0;
}
</style>
