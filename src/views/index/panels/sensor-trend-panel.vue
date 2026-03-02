<script setup lang="ts">
import BorderBox13 from "@/components/datav/border-box-13";
import SensorMetricCard from "./components/sensor-metric-card.vue";
import SensorTrendChart from "./components/sensor-trend-chart.vue";
import type { Metric } from "../demo-data";

const props = defineProps<{
  title: string;
  subtitle: string;
  statusText?: string;
  updatedAt?: string;
  metrics: Metric[];
  chartTitle: string;
  chartUnit: string;
  chartXAxis: string[];
  chartData: number[];
  chartYMin?: number;
  chartYMax?: number;
  extraRow?: {
    label: string;
    value: string;
  };
}>();
</script>

<template>
  <BorderBox13 class="sensor-panel">
    <div class="panel">
      <div class="head">
        <div class="head-deco head-deco-left" />
        <div class="head-title">{{ props.title }}</div>
        <div class="head-deco head-deco-right" />
      </div>

      <div class="subhead">
        <div class="subtitle">{{ props.subtitle }}</div>
        <div class="status">{{ props.statusText ?? "运行正常" }}</div>
      </div>

      <div class="metrics" :class="{ single: props.metrics.length === 1 }">
        <SensorMetricCard
          v-for="m in props.metrics"
          :key="m.label"
          :label="m.label"
          :value="m.value"
          :unit="m.unit"
        />
      </div>

      <div v-if="props.extraRow" class="extra">
        <div class="extra-label">{{ props.extraRow.label }}</div>
        <div class="extra-value">{{ props.extraRow.value }}</div>
      </div>

      <div class="chart-meta">
        <div v-if="props.updatedAt" class="update">更新：{{ props.updatedAt }}</div>
      </div>

      <div class="chart-box">
        <SensorTrendChart
          :title="props.chartTitle"
          :unit="props.chartUnit"
          :xAxis="props.chartXAxis"
          :data="props.chartData"
          :yMin="props.chartYMin"
          :yMax="props.chartYMax"
        />
      </div>
    </div>
  </BorderBox13>
</template>

<style scoped lang="scss">
.sensor-panel {
  width: 100%;
  flex: 1;
  container-type: inline-size;
}

.panel {
  width: 100%;
  height: 100%;
  box-sizing: border-box;
  padding: 14px 14px 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.head {
  height: 38px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0;
}

.head-title {
  font-size: 21px;
  font-weight: 900;
  letter-spacing: 2px;
  background: linear-gradient(92deg, #0072ff 0%, #00eaff 48.8525%, #01aaff 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  text-shadow: 0 0 18px rgba(0, 234, 255, 0.2);
}

.head-deco {
  width: 58px;
  height: 14px;
  background-image: url("@/assets/img/titles/zuo.png");
  background-repeat: no-repeat;
  background-position: center;
  background-size: contain;
}

.head-deco-right {
  transform: rotate(180deg);
}

.subhead {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.subtitle {
  font-size: 16px;
  font-weight: 800;
  color: rgba(175, 211, 231, 0.92);
  letter-spacing: 1px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.status {
  height: 28px;
  padding: 0 12px;
  box-sizing: border-box;
  border-radius: 4px;
  border: 1px solid rgba(44, 247, 254, 0.45);
  background: rgba(12, 63, 80, 0.35);
  color: rgba(44, 247, 254, 0.95);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 700;
}

.metrics {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
}

.metrics.single {
  grid-template-columns: 1fr;
}

.extra {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 0 2px;
}

.extra-label {
  font-size: 13px;
  color: rgba(175, 211, 231, 0.85);
}

.extra-value {
  font-size: 13px;
  color: rgba(230, 250, 255, 0.92);
  font-weight: 700;
  letter-spacing: 0.5px;
}

.chart-meta {
  display: flex;
  align-items: center;
  justify-content: flex-end;
}

.update {
  font-size: 12px;
  color: rgba(175, 211, 231, 0.72);
}

.chart-box {
  flex: 1;
  min-height: 0;
  border-radius: 6px;
  border: 1px solid rgba(44, 247, 254, 0.22);
  background: rgba(0, 20, 35, 0.4);
  box-shadow: inset 0 0 18px rgba(44, 247, 254, 0.06);
  overflow: hidden;
}

/* 参考图左列为 540px 宽的面板，窄容器下需要把 4 指标卡降级为 2 列以避免溢出 */
@container (max-width: 520px) {
  .metrics {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
