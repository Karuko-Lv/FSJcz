<script setup lang="ts">
import { computed } from "vue";
import { graphic } from "echarts/core";

export type TrendSeries = {
  name: string;
  data: number[];
};

const props = withDefaults(
  defineProps<{
    xAxis: string[];
    series: TrendSeries[];
    yUnit?: string;
  }>(),
  {
    yUnit: "",
  }
);

const option = computed(() => {
  const palette = [
    ["#00EAFF", "rgba(0,234,255,0.05)"],
    ["#2D8CFF", "rgba(45,140,255,0.05)"],
    ["#00FFB0", "rgba(0,255,176,0.05)"],
  ] as const;

  return {
    grid: { left: 46, right: 16, top: 24, bottom: 32 },
    tooltip: { trigger: "axis" },
    xAxis: {
      type: "category",
      boundaryGap: false,
      data: props.xAxis,
      axisLine: { lineStyle: { color: "rgba(0,234,255,0.25)" } },
      axisLabel: { color: "rgba(211,214,221,0.65)", fontSize: 10 },
      axisTick: { show: false },
    },
    yAxis: {
      type: "value",
      axisLabel: { color: "rgba(211,214,221,0.65)", fontSize: 10 },
      splitLine: { lineStyle: { color: "rgba(0,234,255,0.12)" } },
      axisLine: { show: false },
      name: props.yUnit ? `(${props.yUnit})` : "",
      nameTextStyle: { color: "rgba(211,214,221,0.55)", padding: [0, 0, 0, 6] },
    },
    series: props.series.map((s, idx) => {
      const [lineColor, areaBottom] = palette[idx % palette.length];
      return {
        name: s.name,
        type: "line",
        data: s.data,
        smooth: true,
        symbol: "circle",
        symbolSize: 5,
        showSymbol: false,
        lineStyle: { width: 2, color: lineColor },
        itemStyle: { color: lineColor },
        areaStyle: {
          color: new graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: lineColor },
            { offset: 1, color: areaBottom },
          ]),
          opacity: 0.22,
        },
      };
    }),
  };
});
</script>

<template>
  <v-chart class="chart" :option="option" autoresize />
</template>

<style scoped lang="scss">
.chart {
  width: 100%;
  height: 100%;
}
</style>

