<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from "vue";
import ItemWrap from "@/components/item-wrap";
import { useAerosolSamplerStore, useWetDryDepositionStore } from "@/stores";
import SensorMetricCard from "./components/sensor-metric-card.vue";
import SensorTrendChart from "./components/sensor-trend-chart.vue";
import { dashboardDemo } from "../demo-data";

const aerosolStore = useAerosolSamplerStore();
const depositionStore = useWetDryDepositionStore();

const aerosolStatusText = computed(() => {
  const s = aerosolStore.status?.systemStatus;
  if (!s) return "—";
  if (s === "运行") return "运行正常";
  return s;
});

const depositionStatusText = computed(() => {
  const s = depositionStore.systemStatus;
  if (s === "正常运行") return "运行正常";
  return s;
});

const depositionStatus = computed(() => depositionStore.status);
const depositionRainSenseText = computed(() => depositionStatus.value?.rainSenseStatus ?? "无雨");
const depositionRainIntensityText = computed(() => {
  const v = depositionStatus.value?.rainIntensityMmMin;
  if (typeof v === "number" && Number.isFinite(v)) return v.toFixed(1);
  const mmh = depositionStatus.value?.rainIntensityMmH;
  if (typeof mmh === "number" && Number.isFinite(mmh)) return (mmh / 60).toFixed(1);
  return "0.0";
});

const formatNumber = (v: unknown, fixed = 1) => {
  if (typeof v === "number" && Number.isFinite(v)) return v.toFixed(fixed);
  return "-";
};

const depositionRainTotalText = computed(() => formatNumber(depositionStatus.value?.rainTotalMm, 1));
const depositionRainCurrentText = computed(() => formatNumber(depositionStatus.value?.rainCurrentMm, 1));

const depositionTempRainGaugeText = computed(() => formatNumber(depositionStatus.value?.tempRainGauge, 1));
const depositionTempRainSensorText = computed(() => formatNumber(depositionStatus.value?.tempRainSensor, 1));
const depositionTempSamplingBucketText = computed(() => formatNumber(depositionStatus.value?.tempSamplingBucket, 1));
const depositionTempDustCoverText = computed(() => formatNumber(depositionStatus.value?.tempDustCover, 1));
const depositionTempCabinetText = computed(() => formatNumber(depositionStatus.value?.tempCabinet, 1));
const depositionTempAmbientText = computed(() => formatNumber(depositionStatus.value?.tempAmbient, 1));

const airIodineStatusText = "运行正常";

const updatedAt = ref(dashboardDemo.aerosolSampler.updatedAt ?? "");

let timer: number | undefined;
onMounted(async () => {
  await Promise.all([aerosolStore.fetchStatus?.(), depositionStore.fetchStatus?.()]);
  timer = window.setInterval(() => {
    aerosolStore.fetchStatus?.();
    depositionStore.fetchStatus?.();
    const now = new Date();
    const pad2 = (n: number) => `${n}`.padStart(2, "0");
    updatedAt.value = `${pad2(now.getHours())}:${pad2(now.getMinutes())}:${pad2(now.getSeconds())}`;
  }, 5000);
});

onUnmounted(() => {
  if (timer) window.clearInterval(timer);
});

const aerosolBadgeText = computed(() => {
  const s = aerosolStore.status?.systemStatus;
  if (s === "运行") return "运行正常";
  if (s === "待机") return "待机";
  if (s === "故障") return "故障";
  return dashboardDemo.aerosolSampler.statusText ?? "运行正常";
});

const aerosolBadgeClass = computed(() => {
  const s = aerosolStore.status?.systemStatus;
  if (s === "故障") return "badge-fault";
  if (s === "待机") return "badge-idle";
  if (s === "运行") return "badge-ok";
  return "badge-ok";
});

const depositionBadgeClass = computed(() => {
  const s = depositionStore.systemStatus;
  if (s === "故障") return "badge-fault";
  if (s === "维护中") return "badge-warn";
  if (s === "待机") return "badge-idle";
  return "badge-ok";
});

const airIodineBadgeClass = "badge-ok";

const aerosolMetrics = computed(() => {
  const s = aerosolStore.status;
  if (!s) return dashboardDemo.aerosolSampler.metrics;
  const flow = Number.isFinite(s.realTimeFlow) ? Number(s.realTimeFlow.toFixed(1)) : dashboardDemo.aerosolSampler.metrics[0].value;
  const samplingFlow = dashboardDemo.aerosolSampler.metrics[1];
  const volume = Number.isFinite(s.samplingVolume) ? Number(s.samplingVolume.toFixed(2)) : dashboardDemo.aerosolSampler.metrics[3].value;
  const durationMin = (() => {
    const raw = s.samplingDuration ?? "";
    const hMatch = raw.match(/(\d+)h/);
    const mMatch = raw.match(/(\d+)min/);
    const h = hMatch ? Number(hMatch[1]) : 0;
    const m = mMatch ? Number(mMatch[1]) : 0;
    return h * 60 + m;
  })();
  return [
    { label: "瞬时采样流量", value: flow, unit: "m³/h" },
    { label: "采样流量", value: samplingFlow.value, unit: "m³/h" },
    { label: "采样时长", value: durationMin, unit: "min" },
    { label: "累计采样体积", value: volume, unit: "m³" },
  ];
});
</script>

<template>
  <ItemWrap class="sampler-list-panel" title="采样数据">
    <div class="panel">
      <div class="status-container aerosol-section">
        <div class="sampler-head">
          <div class="sampler-title">NAS1000 超大流量气溶胶采样器</div>
          <div class="sampler-badge" :class="aerosolBadgeClass">{{ aerosolBadgeText }}</div>
        </div>
        <div class="sampler-line" />

        <div class="metrics">
          <SensorMetricCard
            v-for="m in aerosolMetrics"
            :key="m.label"
            :label="m.label"
            :value="m.value"
            :unit="m.unit"
          />
        </div>

        <div class="update-row">
          <div class="update-text">更新：{{ updatedAt }}</div>
        </div>

        <div class="chart-frame">
          <SensorTrendChart
            class="chart"
            :title="dashboardDemo.aerosolSampler.chartTitle"
            :unit="dashboardDemo.aerosolSampler.chartUnit"
            :xAxis="dashboardDemo.aerosolSampler.chartXAxis"
            :data="dashboardDemo.aerosolSampler.chartData"
            :yMin="dashboardDemo.aerosolSampler.chartYMin"
            :yMax="dashboardDemo.aerosolSampler.chartYMax"
          />
        </div>
      </div>

      <div class="status-container deposition-section">
        <div class="sampler-head">
          <div class="sampler-title">GS-1000 干湿沉降采样器</div>
          <div class="sampler-badge" :class="depositionBadgeClass">{{ depositionStatusText }}</div>
        </div>
        <div class="sampler-line" />

        <div class="deposition-grid">
          <div class="deposition-card">
            <div class="deposition-card-head">
              <div class="deposition-label">感雨状态</div>
            </div>
            <div class="deposition-card-body">
              <div class="deposition-icon">
                <svg viewBox="0 0 64 64" aria-hidden="true">
                  <path
                    d="M22 42c-6.6 0-12-5.4-12-12 0-6.1 4.6-11.2 10.5-11.9C22.3 12.7 27 9 32.7 9c7 0 12.8 5.5 13.2 12.4 5.2 1.3 9.1 6 9.1 11.6 0 6.6-5.4 12-12 12H22z"
                    fill="rgba(175,211,231,0.92)"
                    opacity="0.18"
                  />
                  <path
                    d="M22 41h21c5.5 0 10-4.5 10-10 0-4.9-3.7-9-8.4-9.8l-1.6-.3-.1-1.6C42.6 13.7 38.1 10 32.7 10c-4.4 0-8.2 2.6-9.7 6.4l-.5 1.2-1.3.1C16 18.2 12 21.8 12 26.9 12 35 17.1 41 22 41z"
                    fill="rgba(44,247,254,0.9)"
                    opacity="0.9"
                  />
                  <path d="M22 49l-4 6" stroke="rgba(44,247,254,0.75)" stroke-width="3" stroke-linecap="round" />
                  <path d="M32 49l-4 6" stroke="rgba(44,247,254,0.75)" stroke-width="3" stroke-linecap="round" />
                  <path d="M42 49l-4 6" stroke="rgba(44,247,254,0.75)" stroke-width="3" stroke-linecap="round" />
                </svg>
              </div>
              <div class="deposition-value">{{ depositionRainSenseText }}</div>
            </div>
          </div>

          <div class="deposition-card">
            <div class="deposition-card-head">
              <div class="deposition-label">降水强度</div>
            </div>
            <div class="deposition-card-body">
              <div class="deposition-icon">
                <svg viewBox="0 0 64 64" aria-hidden="true">
                  <path
                    d="M32 6c10 14 18 24 18 34 0 10-8.1 18-18 18S14 50 14 40C14 30 22 20 32 6z"
                    fill="rgba(44,247,254,0.9)"
                    opacity="0.9"
                  />
                  <path
                    d="M28 49c0 0 4 2 8 0"
                    stroke="rgba(230,250,255,0.85)"
                    stroke-width="3"
                    stroke-linecap="round"
                    opacity="0.7"
                  />
                </svg>
              </div>
              <div class="deposition-value">
                <span class="deposition-num">{{ depositionRainIntensityText }}</span>
                <span class="deposition-unit">mm/min</span>
              </div>
            </div>
          </div>
        </div>

        <div class="env-box">
          <div class="env-panel rainfall-panel">
            <div class="env-panel-title">
              <span class="env-panel-accent" />
              <span>降水监测</span>
            </div>
            <div class="rain-lines">
              <div class="rain-line">
                <span class="rain-label">总降雨量：</span>
                <span class="rain-num">{{ depositionRainTotalText }}</span>
                <span class="rain-unit">mm</span>
              </div>
              <div class="rain-line">
                <span class="rain-label">当前雨量：</span>
                <span class="rain-num">{{ depositionRainCurrentText }}</span>
                <span class="rain-unit">mm</span>
              </div>
            </div>
          </div>

          <div class="env-panel temp-panel">
            <div class="env-panel-title">
              <span class="env-panel-accent" />
              <span>设备温度监控</span>
            </div>
            <div class="temp-grid">
              <div class="temp-item">
                <span class="temp-label">环境温度：</span>
                <span class="temp-num">{{ depositionTempAmbientText }}</span>
                <span class="temp-unit">°C</span>
              </div>
              <div class="temp-item">
                <span class="temp-label">机箱温度：</span>
                <span class="temp-num">{{ depositionTempCabinetText }}</span>
                <span class="temp-unit">°C</span>
              </div>
              <div class="temp-item">
                <span class="temp-label">感雨器温度：</span>
                <span class="temp-num">{{ depositionTempRainSensorText }}</span>
                <span class="temp-unit">°C</span>
              </div>
              <div class="temp-item">
                <span class="temp-label">采样桶温度：</span>
                <span class="temp-num">{{ depositionTempSamplingBucketText }}</span>
                <span class="temp-unit">°C</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="sampler-block compact">
        <div class="sampler-head">
          <div class="sampler-title">1号空气碘采样器</div>
          <div class="sampler-badge" :class="airIodineBadgeClass">{{ airIodineStatusText }}</div>
        </div>
        <div class="sampler-line" />
      </div>
    </div>
  </ItemWrap>
</template>

<style scoped lang="scss">
.sampler-list-panel {
  width: 100%;
  height: 100%;
}

.panel {
  width: 100%;
  height: 100%;
  box-sizing: border-box;
  padding: 12px 0 10px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.status-container {
  border: none;
  background: transparent;
  box-shadow: none;
  padding: 0;
}

.deposition-section {
  padding: 0 12px;
}

.aerosol-section {
  padding: 0 12px;
}

.sampler-block {
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-width: 0;
}

.sampler-block.compact {
  padding: 0 12px;
}

.sampler-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  min-width: 0;
}

.sampler-title {
  min-width: 0;
  font-size: 17px;
  font-weight: 400;
  letter-spacing: 1px;
  color: rgba(175, 211, 231, 0.92);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.sampler-badge {
  flex: 0 0 auto;
  height: 26px;
  padding: 0 10px;
  border-radius: 6px;
  border: 1px solid rgba(44, 247, 254, 0.22);
  background: rgba(3, 5, 12, 0.12);
  color: rgba(175, 211, 231, 0.92);
  font-size: 12px;
  font-weight: 800;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
  box-shadow: none;
}

.badge-ok {
  border-color: rgba(5, 148, 101, 0.35);
  background: rgba(5, 148, 101, 0.12);
  color: rgba(165, 240, 208, 0.95);
}

.badge-warn {
  border-color: rgba(245, 158, 11, 0.35);
  background: rgba(245, 158, 11, 0.12);
  color: rgba(255, 219, 163, 0.95);
}

.badge-idle {
  border-color: rgba(211, 214, 221, 0.22);
  color: rgba(211, 214, 221, 0.8);
  background: rgba(3, 5, 12, 0.12);
}

.badge-fault {
  border-color: rgba(198, 71, 81, 0.35);
  color: rgba(255, 170, 176, 0.95);
  background: rgba(198, 71, 81, 0.12);
}

.sampler-line {
  height: 1px;
  width: 100%;
  background: linear-gradient(
    90deg,
    rgba(0, 234, 255, 0.0) 0%,
    rgba(0, 234, 255, 0.35) 20%,
    rgba(0, 234, 255, 0.25) 80%,
    rgba(0, 234, 255, 0.0) 100%
  );
  opacity: 0.9;
}

.metrics {
  margin-top: 12px;
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}

.update-row {
  margin-top: 10px;
  padding: 0 2px;
  display: flex;
  align-items: center;
  justify-content: flex-end;
}

.update-text {
  font-size: 14px;
  font-weight: 700;
  color: rgba(175, 211, 231, 0.72);
  letter-spacing: 0.5px;
}

.chart-frame {
  margin-top: 10px;
  height: 230px;
  border-radius: 10px;
  border: 1px solid rgba(44, 247, 254, 0.22);
  background: rgba(0, 20, 35, 0.4);
  box-shadow: inset 0 0 18px rgba(44, 247, 254, 0.06);
  overflow: hidden;
}

.chart {
  width: 100%;
  height: 100%;
}

.deposition-grid {
  margin-top: 12px;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.deposition-card {
  height: 72px;
  border-radius: 10px;
  border: 1px solid rgba(44, 247, 254, 0.18);
  background: rgba(0, 20, 35, 0.42);
  box-shadow: inset 0 0 16px rgba(44, 247, 254, 0.06);
  padding: 10px 12px 8px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.deposition-card-head {
  display: flex;
  align-items: center;
  justify-content: flex-start;
}

.deposition-label {
  font-size: 14px;
  font-weight: 800;
  color: rgba(175, 211, 231, 0.82);
  letter-spacing: 0.5px;
  line-height: 1;
}

.deposition-card-body {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.deposition-icon {
  width: 24px;
  height: 24px;
  flex: 0 0 auto;
  filter: drop-shadow(0 0 10px rgba(44, 247, 254, 0.18));
}

.deposition-icon svg {
  width: 100%;
  height: 100%;
  display: block;
}

.deposition-value {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: baseline;
  justify-content: flex-start;
  gap: 6px;
  color: rgba(230, 250, 255, 0.95);
  font-weight: 900;
}

.deposition-value .deposition-num,
.deposition-value {
  font-size: 24px;
  line-height: 1;
}

.deposition-unit {
  font-size: 14px;
  font-weight: 700;
  color: rgba(175, 211, 231, 0.8);
}

.env-box {
  margin-top: 12px;
  display: grid;
  grid-template-columns: 1fr 2fr;
  gap: 12px;
  font-size: 18px;
  min-width: 0;
}

.env-panel {
  border-radius: 12px;
  border: 1px solid rgba(44, 247, 254, 0.18);
  background: rgba(0, 20, 35, 0.38);
  box-shadow: inset 0 0 18px rgba(44, 247, 254, 0.05);
  padding: 12px 12px 12px;
  min-width: 0;
}

.env-panel-title {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 18px;
  font-weight: 900;
  color: rgba(230, 250, 255, 0.9);
  letter-spacing: 0.5px;
  border-bottom: 1px solid rgba(44, 247, 254, 0.12);
  padding-bottom: 8px;
  box-sizing: border-box;
  min-width: 0;
  line-height: 1.2;
}

.env-panel-accent {
  width: 3px;
  height: 18px;
  border-radius: 2px;
  background: rgba(44, 247, 254, 0.85);
  box-shadow: 0 0 14px rgba(44, 247, 254, 0.18);
}

.env-panel-title span:last-child {
  min-width: 0;
  white-space: normal;
  overflow-wrap: anywhere;
}

.rain-lines {
  padding: 14px 4px 2px;
  display: flex;
  flex-direction: column;
  gap: 18px;
  min-width: 0;
}

.rain-line {
  display: flex;
  align-items: baseline;
  justify-content: flex-start;
  gap: 8px;
  flex-wrap: wrap;
  min-width: 0;
}

.rain-label {
  font-size: inherit;
  font-weight: 900;
  color: rgba(175, 211, 231, 0.78);
  flex: 0 0 auto;
}

.rain-num {
  font-size: inherit;
  font-weight: 900;
  color: rgba(230, 250, 255, 0.96);
  text-shadow: 0 0 18px rgba(44, 247, 254, 0.12);
  letter-spacing: 0.5px;
}

.rain-unit {
  font-size: inherit;
  font-weight: 900;
  color: rgba(175, 211, 231, 0.85);
  flex: 0 0 auto;
}

.temp-grid {
  padding: 14px 4px 2px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px 18px;
  min-width: 0;
}

.temp-item {
  display: flex;
  align-items: baseline;
  justify-content: flex-start;
  gap: 6px;
  flex-wrap: wrap;
  min-width: 0;
  overflow-wrap: anywhere;
}

.temp-label {
  font-size: 18px;
  font-weight: 900;
  color: rgba(175, 211, 231, 0.78);
  flex: 0 0 auto;
}

.temp-num {
  font-size: inherit;
  font-weight: 900;
  color: rgba(230, 250, 255, 0.96);
  letter-spacing: 0.5px;
}

.temp-unit {
  font-size: 18px;
  font-weight: 900;
  color: rgba(175, 211, 231, 0.85);
  flex: 0 0 auto;
}

@container (max-width: 520px) {
  .metrics {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .chart-frame {
    height: 210px;
  }
  .deposition-grid {
    grid-template-columns: 1fr;
  }
  .env-box {
    grid-template-columns: 1fr;
    gap: 10px;
  }
  .temp-grid {
    grid-template-columns: 1fr;
  }
}
</style>
