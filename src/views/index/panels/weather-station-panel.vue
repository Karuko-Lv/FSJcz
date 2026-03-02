<script setup lang="ts">
import PanelWrap from "@/components/panel-wrap";
import MetricCard from "@/components/metric-card";
import { computed, ref, onMounted, watch, onUnmounted } from "vue";
import CountUp from "@/components/count-up";
import * as echarts from "echarts";
import { useWeatherStationStore } from "@/stores";

const props = defineProps<{
  title: string;
}>();

const store = useWeatherStationStore();

const items = computed(() => {
  return [
    { label: "风速", value: store.windSpeed !== undefined ? store.windSpeed : "-", unit: "m/s" },
    { label: "风向", value: store.windDirection || "-", unit: "" },
    { label: "大气压强", value: store.pressure !== undefined ? store.pressure : "-", unit: "hPa" },
    { label: "雨量", value: store.rainfall !== undefined ? store.rainfall : "-", unit: "mm" },
    { label: "雨强", value: store.rainIntensity !== undefined ? store.rainIntensity : "-", unit: "mm/min" },
  ];
});

// 温度图表引用
const temperatureChart = ref<HTMLElement | null>(null);
let temperatureInstance: echarts.ECharts | null = null;

// 湿度图表引用
const humidityChart = ref<HTMLElement | null>(null);
let humidityInstance: echarts.ECharts | null = null;

// 天气数据
const weatherData = computed(() => {
  return {
    temperature: store.temperature,
    humidity: store.humidity
  };
});

// 温度趋势数据
const temperatureTrendData = computed(() => {
  return {
    timestamps: store.temperatureTrend.timestamps,
    values: store.temperatureTrend.values
  };
});

// 湿度趋势数据
const humidityTrendData = computed(() => {
  return {
    timestamps: store.humidityTrend.timestamps,
    values: store.humidityTrend.values
  };
});

// 初始化趋势图表
const initTrendCharts = () => {
  // 温度图表
  if (temperatureChart.value) {
    // 确保容器大小正确
    temperatureChart.value.style.width = '100%';
    temperatureChart.value.style.height = '100%';
    temperatureChart.value.style.position = 'relative';
    temperatureChart.value.style.overflow = 'hidden';
    
    // 强制容器重新计算尺寸
    temperatureChart.value.style.display = 'none';
    temperatureChart.value.offsetHeight; // 触发重排
    temperatureChart.value.style.display = 'block';
    
    temperatureInstance = echarts.init(temperatureChart.value);
    const tempOption = {
      grid: { left: 0, right: 0, top: 0, bottom: 0 },
      xAxis: {
        type: 'category',
        show: false,
        data: temperatureTrendData.value.timestamps
      },
      yAxis: { type: 'value', show: false },
      series: [{
        type: 'line',
        data: temperatureTrendData.value.values,
        smooth: true,
        lineStyle: { color: '#ff6b6b', width: 2 },
        areaStyle: { color: 'rgba(255, 107, 107, 0.1)' },
        symbol: 'none'
      }]
    };
    temperatureInstance.setOption(tempOption);
    
    // 调整图表大小以适应容器
    temperatureInstance.resize();
  }
  
  // 湿度图表
  if (humidityChart.value) {
    // 确保容器大小正确
    humidityChart.value.style.width = '100%';
    humidityChart.value.style.height = '100%';
    humidityChart.value.style.position = 'relative';
    humidityChart.value.style.overflow = 'hidden';
    
    // 强制容器重新计算尺寸
    humidityChart.value.style.display = 'none';
    humidityChart.value.offsetHeight; // 触发重排
    humidityChart.value.style.display = 'block';
    
    humidityInstance = echarts.init(humidityChart.value);
    const humidityOption = {
      grid: { left: 0, right: 0, top: 0, bottom: 0 },
      xAxis: {
        type: 'category',
        show: false,
        data: humidityTrendData.value.timestamps
      },
      yAxis: { type: 'value', show: false },
      series: [{
        type: 'line',
        data: humidityTrendData.value.values,
        smooth: true,
        lineStyle: { color: '#4ecdc4', width: 2 },
        areaStyle: { color: 'rgba(78, 205, 196, 0.1)' },
        symbol: 'none'
      }]
    };
    humidityInstance.setOption(humidityOption);
    
    // 调整图表大小以适应容器
    humidityInstance.resize();
  }
};

// 更新趋势图表数据
const updateTrendCharts = () => {
  // 更新温度图表
  if (temperatureInstance && temperatureChart.value) {
    // 确保容器大小正确
    temperatureChart.value.style.width = '100%';
    temperatureChart.value.style.height = '100%';
    
    temperatureInstance.setOption({
      xAxis: { data: temperatureTrendData.value.timestamps },
      series: [{ data: temperatureTrendData.value.values }]
    });
    // 确保图表大小适应容器
    temperatureInstance.resize();
  }
  
  // 更新湿度图表
  if (humidityInstance && humidityChart.value) {
    // 确保容器大小正确
    humidityChart.value.style.width = '100%';
    humidityChart.value.style.height = '100%';
    
    humidityInstance.setOption({
      xAxis: { data: humidityTrendData.value.timestamps },
      series: [{ data: humidityTrendData.value.values }]
    });
    // 确保图表大小适应容器
    humidityInstance.resize();
  }
};

// 响应窗口大小变化
const handleResize = () => {
  if (temperatureInstance && temperatureChart.value) {
    // 确保容器大小正确
    temperatureChart.value.style.width = '100%';
    temperatureChart.value.style.height = '100%';
    temperatureInstance.resize();
  }
  if (humidityInstance && humidityChart.value) {
    // 确保容器大小正确
    humidityChart.value.style.width = '100%';
    humidityChart.value.style.height = '100%';
    humidityInstance.resize();
  }
};

// 生命周期钩子
onMounted(() => {
  // 初始化图表
  initTrendCharts();
  // 初始更新一次数据
  updateTrendCharts();
  // 添加窗口大小变化监听
  window.addEventListener('resize', handleResize);
  
  // 清理函数
  onUnmounted(() => {
    window.removeEventListener('resize', handleResize);
    if (temperatureInstance) {
      temperatureInstance.dispose();
      temperatureInstance = null;
    }
    if (humidityInstance) {
      humidityInstance.dispose();
      humidityInstance = null;
    }
  });
});

// 监听趋势数据变化
watch(
  () => [store.temperatureTrend.values, store.temperatureTrend.timestamps, store.humidityTrend.values, store.humidityTrend.timestamps],
  () => {
    updateTrendCharts();
  },
  { deep: true }
);
</script>

<template>
  <PanelWrap
    class="weather-panel"
    :title="props.title"
    :statusText="store.isConnected ? '在线' : '离线'"
    :updatedAt="store.lastUpdated"
  >
    <div class="content">
      <div class="header-section">
        <div class="header-title">气象监测数据</div>
        <div class="header-status">运行正常</div>
      </div>
      <div class="charts-container">
        <div class="temperature-section">
          <div class="section-title">温度</div>
          <div class="chart-item">
            <div class="chart-value">
              <CountUp :end-val="(weatherData?.temperature || 0) / 10" :decimal-places="1" />
              <span class="chart-unit">°C</span>
            </div>
            <div class="trend-chart" ref="temperatureChart"></div>
          </div>
        </div>
        <div class="humidity-section">
          <div class="section-title">湿度</div>
          <div class="chart-item">
            <div class="chart-value">
              <CountUp :end-val="(weatherData?.humidity || 0) / 10" :decimal-places="1" />
              <span class="chart-unit">%</span>
            </div>
            <div class="trend-chart" ref="humidityChart"></div>
          </div>
        </div>
      </div>
      <div class="metrics">
        <MetricCard
          v-for="m in items"
          :key="m.label"
          :label="m.label"
          :value="m.value"
          :unit="m.unit"
        />
      </div>
    </div>
  </PanelWrap>
</template>

<style scoped lang="scss">
.weather-panel {
  width: 100%;
  flex: 1;
  container-type: inline-size;
}

.content {
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

// 头部区域样式
.header-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 10px;
  
  .header-title {
    font-size: 16px;
    font-weight: 600;
    color: #a5c2e0;
  }
  
  .header-status {
    font-size: 14px;
    color: #4ecdc4;
    font-weight: 500;
  }
}

// 图表容器样式
.charts-container {
  flex: 1;
  min-height: 0;
  display: flex;
  gap: 4px;
  height: 50%;
  min-height: 200px;
}

// 温度区域样式
.temperature-section {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  width: 50%;
  min-height: 200px;
  
  .section-title {
    font-size: 15px;
    color: #a5c2e0;
    margin-bottom: 4px;
    text-align: center;
  }
  
  .chart-item {
    flex: 1;
    background: rgba(0, 57, 109, 0.2);
    border: 1px solid rgba(25, 186, 255, 0.15);
    border-radius: 6px;
    padding: 4px;
    display: flex;
    flex-direction: column;
    min-height: 0;
    
    .chart-value {
      font-size: 16px;
      color: #c0deff;
      font-weight: 600;
      text-align: center;
      margin-bottom: 3px;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 2px;
      
      .chart-unit {
        font-size: 13px;
        color: #89a7c3;
        font-weight: normal;
      }
    }
    
    .trend-chart {
      flex: 1;
      min-height: 40px;
      width: 100%;
      height: 100%;
    }
  }
}

// 湿度区域样式
.humidity-section {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  width: 50%;
  min-height: 200px;
  
  .section-title {
    font-size: 15px;
    color: #a5c2e0;
    margin-bottom: 4px;
    text-align: center;
  }
  
  .chart-item {
    flex: 1;
    background: rgba(0, 57, 109, 0.2);
    border: 1px solid rgba(25, 186, 255, 0.15);
    border-radius: 6px;
    padding: 4px;
    display: flex;
    flex-direction: column;
    min-height: 0;
    
    .chart-value {
      font-size: 16px;
      color: #c0deff;
      font-weight: 600;
      text-align: center;
      margin-bottom: 3px;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 2px;
      
      .chart-unit {
        font-size: 13px;
        color: #89a7c3;
        font-weight: normal;
      }
    }
    
    .trend-chart {
      flex: 1;
      min-height: 40px;
      width: 100%;
      height: 100%;
    }
  }
}

.metrics {
  flex: 1;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  grid-template-rows: repeat(2, 1fr);
  gap: 10px;
  min-height: 0;
  
  .metric-card:nth-child(3) {
    grid-row: span 2;
  }
}

@container (max-width: 520px) {
  .metrics {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    grid-template-rows: auto;
    
    .metric-card:nth-child(3) {
      grid-row: span 1;
    }
  }
  
  .charts-container {
    flex-direction: column;
  }
  
  .temperature-section {
    width: 100%;
  }
  
  .humidity-section {
    width: 100%;
  }
}
</style>
