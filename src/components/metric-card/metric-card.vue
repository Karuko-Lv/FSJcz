<script setup lang="ts">
const props = defineProps<{
  label: string;
  value: string | number;
  unit?: string;
}>();
</script>

<template>
  <div class="metric-card">
    <div class="metric-label">{{ props.label }}</div>
    <div class="metric-value">
      <span class="metric-number">{{ props.value }}</span>
      <span v-if="props.unit" class="metric-unit">{{ props.unit }}</span>
    </div>
  </div>
</template>

<style scoped lang="scss">
.metric-card {
  height: 64px;
  padding: 10px 12px;
  box-sizing: border-box;
  border-radius: 8px;
  border: 1px solid rgba(0, 234, 255, 0.18);
  background: linear-gradient(
    180deg,
    rgba(14, 59, 150, 0.2) 0%,
    rgba(3, 5, 12, 0.06) 100%
  );
  box-shadow: inset 0 0 18px rgba(0, 234, 255, 0.08);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.metric-label {
  font-size: 12px;
  color: rgba(211, 214, 221, 0.75);
  line-height: 1;
}

.metric-value {
  display: flex;
  align-items: baseline;
  gap: 6px;
  line-height: 1;
}

.metric-number {
  font-size: 22px;
  font-weight: 800;
  color: rgba(0, 234, 255, 0.95);
  letter-spacing: 1px;
}

.metric-unit {
  font-size: 12px;
  color: rgba(211, 214, 221, 0.7);
}
</style>

