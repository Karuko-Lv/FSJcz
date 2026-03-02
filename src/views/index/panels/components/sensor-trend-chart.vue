<script setup lang="ts">
import { computed } from "vue";
import { graphic } from "echarts/core";

const props = defineProps<{
  title: string;
  unit: string;
  xAxis: string[];
  data: number[];
  yMin?: number;
  yMax?: number;
}>();

const option = computed(() => {
  const color = "#2cf7fe";
  const values = props.data.filter((n) => typeof n === "number" && Number.isFinite(n));
  const minVal = values.length ? Math.min(...values) : 0;
  const maxVal = values.length ? Math.max(...values) : 1;
  const padding = Math.max(1, (maxVal - minVal) * 0.2);
  const yMin =
    typeof props.yMin === "number"
      ? props.yMin
      : Math.max(0, Math.floor((minVal - padding) / 10) * 10);
  const yMax =
    typeof props.yMax === "number" ? props.yMax : Math.ceil((maxVal + padding) / 10) * 10;
  const xLen = props.xAxis.length;

  return {
    title: {
      text: props.title,
      left: "center",
      top: 6,
      textStyle: {
        color: "rgba(175, 211, 231, 0.9)",
        fontSize: 12,
        fontWeight: 600,
      },
    },
    grid: { left: 44, right: 16, top: 40, bottom: 28 },
    tooltip: { trigger: "axis" },
    xAxis: {
      type: "category",
      boundaryGap: false,
      data: props.xAxis,
      axisLine: { lineStyle: { color: "rgba(175, 211, 231, 0.18)" } },
      axisTick: { show: false },
      axisLabel: {
        color: "rgba(175, 211, 231, 0.65)",
        fontSize: 10,
        formatter: (_: string, idx: number) => {
          if (idx === 0 || idx === xLen - 1) return props.xAxis[idx] ?? "";
          return "";
        },
      },
      splitLine: { show: false },
    },
    yAxis: {
      type: "value",
      min: yMin,
      max: yMax,
      axisLabel: { color: "rgba(175, 211, 231, 0.65)", fontSize: 10 },
      axisLine: { show: false },
      axisTick: { show: false },
      splitLine: { lineStyle: { color: "rgba(175, 211, 231, 0.12)" } },
    },
    series: [
      {
        type: "line",
        data: props.data,
        smooth: true,
        showSymbol: true,
        symbol: "circle",
        symbolSize: 8,
        itemStyle: {
          color: "#E6FAFF",
          borderColor: color,
          borderWidth: 2,
        },
        lineStyle: { width: 2, color },
        areaStyle: {
          opacity: 0.25,
          color: new graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: "rgba(44, 247, 254, 0.25)" },
            { offset: 1, color: "rgba(44, 247, 254, 0.0)" },
          ]),
        },
      },
    ],
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
