<script setup lang="ts">
import TemperatureHumidityPanel from "./panels/temperature-humidity-panel.vue";
import NaISpectrometerPanel from "./panels/nai-spectrometer-panel.vue";
import SamplerListPanel from "./panels/sampler-list-panel.vue";
import SensorTrendPanel from "./panels/sensor-trend-panel.vue";
import WeatherStationPanel from "./panels/weather-station-panel.vue";
import { dashboardDemo } from "@/stores/sampler/demo-data";
</script>

<template>
  <div class="index-box">
    <div class="contetn_left">
      <SamplerListPanel class="left-fixed" />
    </div>
    <div class="contetn_center">
      <NaISpectrometerPanel
        class="center-top"
        :title="dashboardDemo.iodideMonitor.title"
        :subtitle="dashboardDemo.iodideMonitor.subtitle"
      />
      <SensorTrendPanel class="center-bottom" v-bind="dashboardDemo.highPressureIonChamber" />
    </div>
    <div class="contetn_right">
      <WeatherStationPanel :title="dashboardDemo.weatherStation.title" />
      <TemperatureHumidityPanel v-bind="dashboardDemo.wetDryDeposition" />
    </div>
  </div>
</template>

<style scoped lang="scss">
.index-box {
  width: 100%;
  display: flex;
  height: calc(100% - 64px);
  justify-content: space-between;
}

.contetn_left,
.contetn_right {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  position: relative;
  width: 540px;
  box-sizing: border-box;
  flex-shrink: 0;
  gap: 16px;
}

.contetn_left {
  justify-content: flex-start;
  gap: 24px;
}

.contetn_left :deep(.left-fixed) {
  flex: 1;
  min-height: 0;
}
.contetn_center {
  flex: 1;
  margin: 0 54px;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  gap: 16px;
}

.contetn_center :deep(.center-top) {
  flex: 2;
  min-height: 0;
}

.contetn_center :deep(.center-bottom) {
  flex: 1;
  min-height: 0;
}
</style>
