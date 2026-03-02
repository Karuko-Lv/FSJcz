import { computed, ref } from "vue";
import { defineStore } from "pinia";
import { ElMessage } from "element-plus";
import type { AerosolSamplerMode } from "@/api";
import {
  commCheckAerosolSampler,
  fetchAerosolSamplerStatus,
  setAerosolSamplerMode,
  startAerosolSampler,
  stopAerosolSampler,
} from "@/api";

export type AerosolSamplerStatus = {
  mode: AerosolSamplerMode;
  realTimeFlow: number;
  systemStatus: "待机" | "运行" | "故障";
  filterBoxNo: string;
  samplingDuration: string;
  samplingVolume: number;
  dustMass: number;
  filmThickness: number;
  startTime: string;
  endTime: string;
};

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

export const useAerosolSamplerStore = defineStore("aerosolSampler", () => {
  const status = ref<AerosolSamplerStatus | null>(null);
  const loadingStatus = ref(false);
  const loadingMode = ref(false);
  const loadingStartStop = ref(false);
  const loadingCommCheck = ref(false);
  const lastCommResult = ref<{ ok: boolean; message: string } | null>(null);

  const mode = computed<AerosolSamplerMode>(() => status.value?.mode ?? "1h");
  const isRunning = computed(() => status.value?.systemStatus === "运行");

  const fetchStatus = async () => {
    loadingStatus.value = true;
    try {
      const res = (await fetchAerosolSamplerStatus()) as CommonResponse<AerosolSamplerStatus>;
      if (!res?.success || !res?.data) throw new Error(res?.msg || "获取采样器状态失败");
      status.value = res.data;
    } catch (err) {
      console.error(normalizeErrorMessage(err instanceof Error ? err.message : err));
    } finally {
      loadingStatus.value = false;
    }
  };

  const setMode = async (m: AerosolSamplerMode) => {
    loadingMode.value = true;
    try {
      const res = (await setAerosolSamplerMode({ mode: m })) as CommonResponse<unknown>;
      if (!res?.success) throw new Error(res?.msg || "工作模式下发失败");
      await fetchStatus();
      ElMessage.success(res?.msg || "工作模式已下发");
    } catch (err) {
      console.error(normalizeErrorMessage(err instanceof Error ? err.message : err));
    } finally {
      loadingMode.value = false;
    }
  };

  const start = async () => {
    loadingStartStop.value = true;
    try {
      const res = (await startAerosolSampler()) as CommonResponse<unknown>;
      if (!res?.success) throw new Error(res?.msg || "启动失败");
      await fetchStatus();
      ElMessage.success(res?.msg || "启动成功");
    } catch (err) {
      console.error(normalizeErrorMessage(err instanceof Error ? err.message : err));
    } finally {
      loadingStartStop.value = false;
    }
  };

  const stop = async () => {
    loadingStartStop.value = true;
    try {
      const res = (await stopAerosolSampler()) as CommonResponse<unknown>;
      if (!res?.success) throw new Error(res?.msg || "停止失败");
      await fetchStatus();
      ElMessage.success(res?.msg || "停止成功");
    } catch (err) {
      console.error(normalizeErrorMessage(err instanceof Error ? err.message : err));
    } finally {
      loadingStartStop.value = false;
    }
  };

  const commCheck = async () => {
    loadingCommCheck.value = true;
    try {
      const res = (await commCheckAerosolSampler()) as CommonResponse<unknown>;
      if (!res?.success) throw new Error(res?.msg || "通信异常");
      lastCommResult.value = { ok: true, message: res?.msg || "通信正常" };
      ElMessage.success(lastCommResult.value.message);
    } catch (err) {
      const msg = normalizeErrorMessage(err instanceof Error ? err.message : err);
      lastCommResult.value = { ok: false, message: msg };
      console.error(msg);
    } finally {
      loadingCommCheck.value = false;
    }
  };

  return {
    status,
    mode,
    isRunning,
    loadingStatus,
    loadingMode,
    loadingStartStop,
    loadingCommCheck,
    lastCommResult,
    fetchStatus,
    setMode,
    start,
    stop,
    commCheck,
  };
});

