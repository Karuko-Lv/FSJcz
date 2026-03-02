<script setup lang="ts">
const props = defineProps<{
  label: string;
  value: string | number;
  unit?: string;
}>();
</script>

<template>
  <div class="sensor-metric-card">
    <div class="label">{{ props.label }}</div>
    <div class="value">
      <span class="num">{{ props.value }}</span>
      <span v-if="props.unit" class="unit">{{ props.unit }}</span>
    </div>
  </div>
</template>

<style scoped lang="scss">
.sensor-metric-card {
  height: 50px;
  padding: 3px 3px;
  box-sizing: border-box;
  border-radius: 6px;
  border: 1px solid rgba(44, 247, 254, 0.2);
  background: rgba(0, 20, 35, 0.55);
  box-shadow: inset 0 0 14px rgba(44, 247, 254, 0.08);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.label {
  font-size: 12px;
  color: rgba(175, 211, 231, 0.82);
  letter-spacing: 0.5px;
  line-height: 1;
}

.value {
  display: flex;
  align-items: baseline;
  justify-content: center;
  gap: 6px;
  line-height: 1;
}

.num {
  font-size: 20px;
  font-weight: 800;
  color: rgba(230, 250, 255, 0.96);
  letter-spacing: 0.5px;
}

.unit {
  font-size: 12px;
  color: rgba(175, 211, 231, 0.8);
}
</style>

