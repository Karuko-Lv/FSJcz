import { computed, ref } from "vue";
import { defineStore } from "pinia";
import { ElMessage } from "element-plus";
import type { WetDryDepositionStatus, WetDryDepositionSystemStatus } from "@/api";
import { fetchWetDryDepositionStatus } from "@/api";

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

export const useWetDryDepositionStore = defineStore("wetDryDeposition", () => {
  const status = ref<WetDryDepositionStatus | null>(null);
  const loadingStatus = ref(false);

  const systemStatus = computed<WetDryDepositionSystemStatus>(() => status.value?.systemStatus ?? "待机");
  const updatedAt = computed(() => status.value?.updatedAt ?? "");

  const fetchStatus = async () => {
    loadingStatus.value = true;
    try {
      const res = (await fetchWetDryDepositionStatus()) as CommonResponse<WetDryDepositionStatus>;
      if (!res?.success || !res?.data) throw new Error(res?.msg || "获取干湿沉降状态失败");
      status.value = res.data;
    } catch (err) {
      console.error(normalizeErrorMessage(err instanceof Error ? err.message : err));
    } finally {
      loadingStatus.value = false;
    }
  };

  return {
    status,
    loadingStatus,
    systemStatus,
    updatedAt,
    fetchStatus,
  };
});

