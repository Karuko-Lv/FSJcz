<script setup lang="ts">
import { computed, onMounted, onUnmounted } from "vue";
import BorderBox13 from "@/components/datav/border-box-13";
import { useNaISpectrometerStore } from "@/stores";
import { ElMessageBox } from "element-plus";
import SensorMetricCard from "./components/sensor-metric-card.vue";

const props = defineProps<{
  title: string;
  subtitle: string;
}>();

const store = useNaISpectrometerStore();

const isBusy = computed(() => store.loadingAction || store.loadingStatus || store.loadingSpectrum);
const isCalibrating = computed(() => store.workStatus === "刻度中");

const workTagClass = computed(() => {
  const s = store.workStatus;
  if (s === "刻度成功") return "tag-ok";
  if (s === "刻度中") return "tag-warn";
  return "tag-idle";
});

const spectrumSize = computed(() => store.status?.spectrumSize ?? store.spectrum?.size ?? 1024);
const counts = computed(() => {
  const data = store.spectrumData.length > 0 ? store.spectrumData : (store.spectrum?.counts ?? []);
  console.log(`组件使用的能谱数据长度: ${data.length}`);
  console.log(`能谱数据是否全为0: ${data.every(v => v === 0)}`);
  return data;
});

const infoItems = computed(() => {
  const s = store.status;
  return [
    { 
      label: "谱仪工作状态", 
      value: store.spectrometerState === 1 ? "刻度中" : store.spectrometerState === 2 ? "刻度成功" : store.spectrometerState === 3 ? "刻度失败" : "未开始", 
      unit: "" 
    },
    { label: "气溶胶开关状态", value: store.aerosolState === 1 ? "开启" : "关闭", unit: "" },
    { label: "瞬时CPS", value: store.cps || "-", unit: "CPS" },
    { label: "γ剂量率", value: store.gammaDoseRate || "-", unit: "µSv/h" },
    { label: "γ累积剂量", value: store.gammaTotalDose || "-", unit: "µSv" },
    {
      label: "能谱累积时间",
      value: store.spectrumAccumSeconds > 0 ? `${Math.floor(store.spectrumAccumSeconds / 3600).toString().padStart(2, "0")}:${Math.floor((store.spectrumAccumSeconds % 3600) / 60).toString().padStart(2, "0")}:${Math.floor(store.spectrumAccumSeconds % 60).toString().padStart(2, "0")}` : (s ? `${Math.floor(s.spectrumAccumSeconds / 3600).toString().padStart(2, "0")}:${Math.floor((s.spectrumAccumSeconds % 3600) / 60).toString().padStart(2, "0")}:${Math.floor(s.spectrumAccumSeconds % 60).toString().padStart(2, "0")}` : "-"),
      unit: "",
    },
  ];
});

const option = computed(() => {
  const size = spectrumSize.value;
  const data = counts.value.length
    ? counts.value.map((y, x) => [x, y])
    : Array.from({ length: size }, (_, x) => [x, 0]);

  return {
    grid: { left: 52, right: 16, top: 22, bottom: 46 },
    tooltip: {
      trigger: "axis",
      axisPointer: { type: "line" },
      formatter: (params: any) => {
        const p = Array.isArray(params) ? params[0] : params;
        const x = p?.data?.[0];
        const y = p?.data?.[1];
        return `Channel: ${x}<br/>Counts: ${y}`;
      },
    },
    dataZoom: [
      { type: "inside", xAxisIndex: 0, filterMode: "none" },
      {
        type: "slider",
        xAxisIndex: 0,
        height: 18,
        bottom: 6,
        borderColor: "rgba(44, 247, 254, 0.18)",
        fillerColor: "rgba(44, 247, 254, 0.12)",
        handleStyle: { color: "rgba(44, 247, 254, 0.65)" },
        textStyle: { color: "rgba(175, 211, 231, 0.65)" },
      },
    ],
    xAxis: {
      type: "value",
      min: 0,
      max: size - 1,
      axisLine: { lineStyle: { color: "rgba(175, 211, 231, 0.18)" } },
      axisTick: { show: false },
      axisLabel: { color: "rgba(175, 211, 231, 0.65)", fontSize: 10 },
      splitLine: { show: false },
      name: "Channel",
      nameTextStyle: { color: "rgba(175, 211, 231, 0.55)", padding: [0, 0, 0, 6] },
    },
    yAxis: {
      type: "value",
      axisLabel: { color: "rgba(175, 211, 231, 0.65)", fontSize: 10 },
      axisLine: { show: false },
      axisTick: { show: false },
      splitLine: { lineStyle: { color: "rgba(175, 211, 231, 0.12)" } },
      name: "Counts",
      nameTextStyle: { color: "rgba(175, 211, 231, 0.55)", padding: [0, 0, 0, 6] },
    },
    series: [
      {
        type: "line",
        data,
        showSymbol: false,
        smooth: false,
        lineStyle: { width: 1.5, color: "#2cf7fe" },
        itemStyle: { color: "#2cf7fe" },
      },
    ],
  };
});

const confirmAndRun = async (title: string, action: () => Promise<void>) => {
  try {
    await ElMessageBox.confirm(title, "确认操作", {
      confirmButtonText: "确认",
      cancelButtonText: "取消",
      type: "warning",
    });
    await action();
  } catch {
    return;
  }
};

const onClearDose = async () => {
  await confirmAndRun("确认清空累积剂量？", store.clearDose);
};

const onRecalibrate = async () => {
  await confirmAndRun("确认触发谱仪重新刻度？", store.recalibrate);
};

const onRestartSpectrum = async () => {
  await confirmAndRun("确认重新采集能谱？当前能谱数据将被清空。", store.restartSpectrum);
};

let spectrumEventSource: EventSource | null = null;
onMounted(async () => {
  // 初始加载一次数据，确保界面有数据显示
  await Promise.all([store.fetchStatus(), store.fetchSpectrumData()]);
  // 移除定时轮询，因为SSE会实时推送数据

  try {
    const sseUrl = "/api/sse/dianhn/spectrum";
    console.log("正在建立能谱SSE连接:", sseUrl);
    spectrumEventSource = new EventSource(sseUrl);

    spectrumEventSource.onopen = (event) => {
      console.log("能谱SSE连接已建立", event);
    };

    spectrumEventSource.addEventListener('device.data', (event) => {
      try {
        console.log("收到能谱SSE数据, 长度:", event.data?.length);
        
        // 尝试去除可能的BOM字符
        let cleanData = event.data.replace(/^\ufeff/, '');
        
        // 尝试修复常见的JSON格式问题
        // 1. 移除尾部多余的逗号
        cleanData = cleanData.replace(/,\s*}/g, '}');
        cleanData = cleanData.replace(/,\s*\]/g, ']');
        // 2. 确保所有键值对都有引号
        cleanData = cleanData.replace(/([{,])\s*([a-zA-Z0-9_]+)\s*:/g, '$1 "$2":');
        // 3. 确保所有字符串值都有引号
        cleanData = cleanData.replace(/:\s*([^"\d\[\]{}:,\s]+)([,}])/g, ': "$1"$2');
        
        // 尝试解析JSON
        let data;
        try {
          data = JSON.parse(cleanData);
        } catch (jsonError) {
          console.warn("JSON parse failed, trying eval as fallback:", jsonError);
          // 尝试使用eval作为最后的手段
          try {
             data = eval('(' + event.data + ')');
          } catch(evalError) {
             console.error("Eval failed:", evalError);
          }
        }

        if (data) {
          console.log("能谱数据解析成功, 更新store");
          store.updateSpectrumData(data);
        } else {
           console.error("未能解析能谱数据");
        }
      } catch (error) {
        console.error("能谱数据处理异常:", error);
      }
    });

    spectrumEventSource.onerror = (error) => {
      console.error("能谱SSE连接错误:", error);
      // 不要立即关闭，EventSource会自动重连。或者可以在多次失败后关闭。
    };
  } catch (error) {
    console.error("建立能谱SSE连接失败:", error);
  }
});

onUnmounted(() => {
  if (spectrumEventSource) {
    spectrumEventSource.close();
    spectrumEventSource = null;
  }
});
</script>

<template>
  <BorderBox13 class="nai-panel">
    <div class="panel">
      <div class="head">
        <div class="head-deco head-deco-left" />
        <div class="head-title">{{ props.title }}</div>
        <div class="head-deco head-deco-right" />
      </div>

      <div class="subhead">
        <div class="subtitle">{{ props.subtitle }}</div>
        <div class="tags">
          <div class="tag" :class="workTagClass">{{ store.workStatus }}</div>
          <div class="tag tag-ghost">{{ store.aerosolSwitch }}</div>
        </div>
      </div>

      <div class="main">
        <div class="left">
          <div class="info">
            <div class="info-title">状态信息</div>
            <div class="metrics">
              <SensorMetricCard
                v-for="i in infoItems"
                :key="i.label"
                :label="i.label"
                :value="i.value"
                :unit="i.unit"
              />
            </div>
          </div>

          <div class="controls">
            <button class="btn btn-danger" :disabled="isBusy || isCalibrating" @click="onClearDose">
              清空累积剂量
            </button>
            <button class="btn btn-primary" :disabled="isBusy || isCalibrating" @click="onRecalibrate">
              谱仪重新刻度
            </button>
            <button class="btn btn-ghost" :disabled="isBusy || isCalibrating" @click="onRestartSpectrum">
              重新采集能谱
            </button>
          </div>
        </div>

        <div class="chart-box">
          <div class="chart-head">
            <div class="chart-title">能谱图</div>
            <div class="chart-meta">道数：{{ spectrumSize }}</div>
          </div>
          <v-chart class="chart" :option="option" autoresize />
        </div>
      </div>
    </div>
  </BorderBox13>
</template>

<style scoped lang="scss">
.nai-panel {
  width: 100%;
  height: 100%;
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

.tags {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 0 0 auto;
}

.tag {
  height: 26px;
  padding: 0 10px;
  border-radius: 6px;
  border: 1px solid rgba(44, 247, 254, 0.22);
  background: rgba(3, 5, 12, 0.12);
  box-sizing: border-box;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 800;
  line-height: 1;
  color: rgba(175, 211, 231, 0.92);
}

.tag-ok {
  border-color: rgba(5, 148, 101, 0.35);
  background: rgba(5, 148, 101, 0.12);
  color: rgba(165, 240, 208, 0.95);
}

.tag-warn {
  border-color: rgba(245, 158, 11, 0.35);
  background: rgba(245, 158, 11, 0.12);
  color: rgba(255, 219, 163, 0.95);
}

.tag-idle {
  border-color: rgba(211, 214, 221, 0.22);
  color: rgba(211, 214, 221, 0.8);
  background: rgba(3, 5, 12, 0.12);
}

.tag-ghost {
  border-color: rgba(44, 247, 254, 0.22);
  color: rgba(44, 247, 254, 0.92);
  background: rgba(12, 63, 80, 0.2);
}

.main {
  flex: 1;
  min-height: 0;
  display: grid;
  grid-template-columns: 340px 1fr;
  gap: 12px;
}

.left {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.info {
  border-radius: 8px;
  border: 1px solid rgba(44, 247, 254, 0.18);
  background: rgba(0, 20, 35, 0.35);
  box-shadow: inset 0 0 18px rgba(44, 247, 254, 0.05);
  padding: 10px 12px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.info-title {
  font-size: 13px;
  color: rgba(175, 211, 231, 0.9);
  font-weight: 800;
  letter-spacing: 1px;
}

.metrics {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}

.controls {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.btn {
  height: 34px;
  padding: 0 12px;
  border-radius: 8px;
  border: 1px solid rgba(0, 0, 0, 0.12);
  background: #fff;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
}

.btn:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.btn-primary {
  border-color: rgba(0, 82, 217, 0.25);
  background: rgba(0, 82, 217, 0.12);
  color: rgba(190, 220, 255, 0.95);
}

.btn-danger {
  border-color: rgba(198, 71, 81, 0.25);
  background: rgba(198, 71, 81, 0.12);
  color: rgba(255, 190, 196, 0.95);
}

.btn-ghost {
  border-color: rgba(44, 247, 254, 0.22);
  background: rgba(3, 5, 12, 0.12);
  color: rgba(175, 211, 231, 0.92);
}

.chart-box {
  min-width: 0;
  border-radius: 8px;
  border: 1px solid rgba(44, 247, 254, 0.18);
  background: rgba(0, 20, 35, 0.35);
  box-shadow: inset 0 0 18px rgba(44, 247, 254, 0.05);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.chart-head {
  height: 38px;
  padding: 0 12px;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid rgba(44, 247, 254, 0.14);
}

.chart-title {
  font-size: 13px;
  font-weight: 800;
  color: rgba(175, 211, 231, 0.9);
  letter-spacing: 1px;
}

.chart-meta {
  font-size: 12px;
  color: rgba(175, 211, 231, 0.65);
}

.chart {
  flex: 1;
  min-height: 0;
  width: 100%;
}

@container (max-width: 720px) {
  .main {
    grid-template-columns: 1fr;
    grid-template-rows: auto 1fr;
  }
  .controls {
    flex-direction: row;
    flex-wrap: wrap;
  }
  .btn {
    flex: 1 1 140px;
  }
}

@container (max-width: 520px) {
  .metrics {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@container (max-width: 380px) {
  .metrics {
    grid-template-columns: 1fr;
  }
}
</style>
