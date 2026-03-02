import { computed, ref } from "vue";
import { defineStore } from "pinia";
import { ElMessage } from "element-plus";
import type { NaISpectrometerStatus, NaISpectrum } from "@/api";
import {
  clearNaIGammaTotalDose,
  fetchNaISpectrometerStatus,
  fetchNaISpectrum,
  recalibrateNaISpectrometer,
  restartNaISpectrum,
} from "@/api";

type CommonResponse<T> = {
  success: boolean;
  msg?: string;
  data?: T;
};

const normalizeErrorMessage = (err: unknown) => {
  if (typeof err === "string" && err.trim()) return err;
  if (typeof err === "object" && err && "msg" in err) {
    const msg = (err as any).msg;
    if (typeof msg === "string" && msg.trim()) return msg;
  }
  return "操作失败，请稍后重试";
};

export const useNaISpectrometerStore = defineStore("naiSpectrometer", () => {
  const status = ref<NaISpectrometerStatus | null>(null);
  const spectrum = ref<NaISpectrum | null>(null);

  const loadingStatus = ref(false);
  const loadingSpectrum = ref(false);
  const loadingAction = ref(false);

  // SSE数据状态
  const aerosolState = ref<number>(0);
  const gammaTotalDose = ref<number>(0);
  const spectrumAccumSeconds = ref<number>(0);
  const cps = ref<number>(0);
  const gammaDoseRate = ref<number>(0);
  const spectrometerState = ref<number>(0);
  const spectrumData = ref<number[]>([]); // 1024道能谱数据

  const workStatus = computed(() => {
    const state = spectrometerState.value;
    if (state === 1) return "刻度中";
    if (state === 2) return "刻度成功";
    if (state === 3) return "刻度失败";
    return "未开始";
  });
  const aerosolSwitch = computed(() => aerosolState.value === 1 ? "开启" : "关闭");

  const fetchStatus = async () => {
    loadingStatus.value = true;
    try {
      const res = (await fetchNaISpectrometerStatus()) as CommonResponse<NaISpectrometerStatus>;
      if (!res?.success || !res?.data) throw new Error(res?.msg || "获取谱仪状态失败");
      status.value = res.data;
    } catch (err) {
      ElMessage.error(normalizeErrorMessage(err instanceof Error ? err.message : err));
    } finally {
      loadingStatus.value = false;
    }
  };

  const fetchSpectrumData = async (size?: 1024 | 2048) => {
    loadingSpectrum.value = true;
    try {
      const res = (await fetchNaISpectrum(size ? { size } : undefined)) as CommonResponse<NaISpectrum>;
      if (!res?.success || !res?.data) throw new Error(res?.msg || "获取能谱数据失败");
      spectrum.value = res.data;
    } catch (err) {
      ElMessage.error(normalizeErrorMessage(err instanceof Error ? err.message : err));
    } finally {
      loadingSpectrum.value = false;
    }
  };

  const clearDose = async () => {
    loadingAction.value = true;
    try {
      const res = (await clearNaIGammaTotalDose()) as CommonResponse<unknown>;
      if (!res?.success) throw new Error(res?.msg || "清空失败");
      ElMessage.success(res?.msg || "已清空");
      await fetchStatus();
    } catch (err) {
      ElMessage.error(normalizeErrorMessage(err instanceof Error ? err.message : err));
    } finally {
      loadingAction.value = false;
    }
  };

  const recalibrate = async () => {
    loadingAction.value = true;
    try {
      const res = (await recalibrateNaISpectrometer()) as CommonResponse<unknown>;
      if (!res?.success) throw new Error(res?.msg || "刻度失败");
      ElMessage.success(res?.msg || "已开始刻度");
      await fetchStatus();
    } catch (err) {
      ElMessage.error(normalizeErrorMessage(err instanceof Error ? err.message : err));
    } finally {
      loadingAction.value = false;
    }
  };

  const restartSpectrum = async () => {
    loadingAction.value = true;
    try {
      const res = (await restartNaISpectrum()) as CommonResponse<unknown>;
      if (!res?.success) throw new Error(res?.msg || "重新采集失败");
      ElMessage.success(res?.msg || "已重新开始采集");
      await Promise.all([fetchStatus(), fetchSpectrumData(status.value?.spectrumSize)]);
    } catch (err) {
      ElMessage.error(normalizeErrorMessage(err instanceof Error ? err.message : err));
    } finally {
      loadingAction.value = false;
    }
  };

  // SSE数据更新方法
  const updateAerosolState = (state: number) => {
    aerosolState.value = state;
  };

  const updateGammaTotalDose = (dose: number) => {
    gammaTotalDose.value = dose;
  };

  const updateSpectrumAccumSeconds = (seconds: number) => {
    spectrumAccumSeconds.value = seconds;
  };

  const updateCps = (value: number) => {
    cps.value = value;
  };

  const updateGammaDoseRate = (rate: number) => {
    gammaDoseRate.value = rate;
  };

  const updateWorkStatus = (state: number) => {
    spectrometerState.value = state;
  };

  // 更新能谱数据
  const updateSpectrumData = (data: any) => {
    try {
      console.log("开始处理能谱数据:", data);
      // 提取所有spectrum_channel_*的值并按通道号排序
      const spectrumChannels: number[] = new Array(1025).fill(0); // 1025个通道（0-1024）
      let channelCount = 0;
      
      // 遍历数据中的所有键
      Object.keys(data).forEach(key => {
        // 处理不同格式的通道命名
        if (key.startsWith('spectrum_channel_')) {
          // 提取通道号
          const channelMatch = key.match(/spectrum_channel_(\d+)/);
          if (channelMatch) {
            const channel = parseInt(channelMatch[1], 10);
            // 确保通道号在有效范围内
            if (channel >= 0 && channel <= 1024) {
              spectrumChannels[channel] = Number(data[key]);
              channelCount++;
            }
          }
        } else if (key.startsWith('spectrumChannel') || key.startsWith('channel')) {
          // 处理其他可能的通道命名格式
          const channelMatch = key.match(/(spectrumChannel|channel)(\d+)/);
          if (channelMatch) {
            const channel = parseInt(channelMatch[2], 10);
            if (channel >= 0 && channel <= 1024) {
              spectrumChannels[channel] = Number(data[key]);
              channelCount++;
            }
          }
        }
      });
      
      console.log(`处理后的能谱数据长度: ${spectrumChannels.length}, 实际提取通道数: ${channelCount}`);
      console.log("处理后的能谱数据示例:", spectrumChannels.slice(0, 10)); // 显示前10个通道的数据
      console.log("能谱数据最大值:", Math.max(...spectrumChannels));
      console.log("能谱数据最小值:", Math.min(...spectrumChannels.filter(v => v > 0)));
      
      // 更新spectrumData状态
      spectrumData.value = spectrumChannels;
      
      // 同时更新spectrum状态，确保图表能够使用这些数据
      spectrum.value = {
        size: 1024,
        counts: spectrumChannels
      };
      
      console.log("能谱数据更新成功");
    } catch (error) {
      console.error('处理能谱数据失败:', error);
      spectrumData.value = [];
      // 出错时也重置spectrum状态
      spectrum.value = {
        size: 1024,
        counts: []
      };
    }
  };

  // 重置状态
  const resetStatus = () => {
    aerosolState.value = 0;
    gammaTotalDose.value = 0;
    spectrumAccumSeconds.value = 0;
    cps.value = 0;
    gammaDoseRate.value = 0;
    spectrometerState.value = 0;
    spectrumData.value = [];
  };

  return {
    status,
    spectrum,
    loadingStatus,
    loadingSpectrum,
    loadingAction,
    workStatus,
    aerosolSwitch,
    fetchStatus,
    fetchSpectrumData,
    clearDose,
    recalibrate,
    restartSpectrum,
    // SSE数据状态
    aerosolState,
    gammaTotalDose,
    spectrumAccumSeconds,
    cps,
    gammaDoseRate,
    spectrometerState,
    spectrumData,
    // SSE数据更新方法
    updateAerosolState,
    updateGammaTotalDose,
    updateSpectrumAccumSeconds,
    updateCps,
    updateGammaDoseRate,
    updateWorkStatus,
    updateSpectrumData,
    resetStatus,
  };
});

