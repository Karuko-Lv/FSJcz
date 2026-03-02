import { ref } from "vue";
import { defineStore } from "pinia";
import { ElMessage } from "element-plus";
import {
  connectDevice as apiConnectDevice,
  disconnectDevice as apiDisconnectDevice,
  connectAllDevices as apiConnectAllDevices,
  disconnectAllDevices as apiDisconnectAllDevices,
  fetchDeviceList,
} from "@/api";
import { getLocalStorage, setLocalStorage } from "@/utils/storage";

export type DeviceConnectionStatus =
  | "offline"
  | "online"
  | "connecting"
  | "connected"
  | "disconnecting"
  | "error";

export type DeviceItem = {
  id: string;
  name: string;
  status: DeviceConnectionStatus;
  lastError?: string;
};

type DeviceListResponse = {
  success: boolean;
  msg?: string;
  data?: {
    list: Array<{ id: string; name: string; online?: boolean }>;
  };
};

type CommonResponse = {
  success: boolean;
  msg?: string;
  message?: string;
};

const DEVICE_STORAGE_KEY = "loftv-deviceManager-devices";

const normalizeErrorMessage = (err: unknown) => {
  if (typeof err === "string" && err.trim()) return err;
  if (typeof err === "object" && err && "msg" in err) {
    const msg = (err as any).msg;
    if (typeof msg === "string" && msg.trim()) return msg;
  }
  if (typeof err === "object" && err && "message" in err) {
    const message = (err as any).message;
    if (typeof message === "string" && message.trim()) return message;
  }
  return "操作失败，请稍后重试";
};

const getResponseMessage = (res: unknown) => {
  if (!res || typeof res !== "object") return "";
  const anyRes = res as any;
  const msg = typeof anyRes.msg === "string" ? anyRes.msg : "";
  const message = typeof anyRes.message === "string" ? anyRes.message : "";
  return message || msg;
};

export const useDeviceStore = defineStore("device", () => {
  const devices = ref<DeviceItem[]>([]);
  const loadingList = ref(false);
  const bulkWorking = ref(false);

  const initFromStorage = () => {
    const cached = getLocalStorage(DEVICE_STORAGE_KEY);
    if (Array.isArray(cached)) {
      devices.value = cached
        .filter((d) => d && typeof d.id === "string" && typeof d.name === "string")
        .map((d) => ({
          id: d.id,
          name: d.name,
          status: d.status ?? "offline",
          lastError: d.lastError,
        }));
    }
  };

  const persist = () => {
    setLocalStorage(DEVICE_STORAGE_KEY, devices.value);
  };

  const setDevice = (id: string, patch: Partial<DeviceItem>) => {
    const idx = devices.value.findIndex((d) => d.id === id);
    if (idx < 0) return;
    devices.value[idx] = { ...devices.value[idx], ...patch };
    persist();
  };

  const discoverDevices = async () => {
    loadingList.value = true;
    try {
      const res = (await fetchDeviceList()) as DeviceListResponse;
      if (!res?.success) {
        ElMessage.warning(res?.msg || "获取设备列表失败");
        return;
      }
      const list = res?.data?.list ?? [];
      const prevMap = new Map(devices.value.map((d) => [d.id, d]));
      devices.value = list.map((d) => {
        const prev = prevMap.get(d.id);
        const baseStatus: DeviceConnectionStatus = d.online ? "online" : "offline";
        if (!prev) return { id: d.id, name: d.name, status: baseStatus };
        const keepStatus =
          prev.status === "connecting" ||
          prev.status === "disconnecting" ||
          prev.status === "connected"
            ? prev.status
            : baseStatus;
        return {
          id: d.id,
          name: d.name,
          status: keepStatus,
          lastError: prev.lastError,
        };
      });
      persist();
    } catch (err) {
      console.error(normalizeErrorMessage(err));
    } finally {
      loadingList.value = false;
    }
  };

  const connectDevice = async (id: string, options?: { silent?: boolean }) => {
    const dev = devices.value.find((d) => d.id === id);
    if (!dev) return false;
    if (dev.status === "connecting" || dev.status === "connected") return false;
    if (dev.status === "offline") return false;
    setDevice(id, { status: "connecting", lastError: undefined });
    try {
      const res = (await apiConnectDevice({ deviceId: id })) as CommonResponse;
      if (!res?.success) throw new Error(getResponseMessage(res) || "连接失败");
      setDevice(id, { status: "connected", lastError: undefined });
      if (!options?.silent) ElMessage.success("连接成功");
      return true;
    } catch (err) {
      const msg = normalizeErrorMessage(err instanceof Error ? err.message : err);
      setDevice(id, { status: "error", lastError: msg });
      if (!options?.silent) console.error(msg);
      return false;
    }
  };

  const disconnectDevice = async (id: string, options?: { silent?: boolean }) => {
    const dev = devices.value.find((d) => d.id === id);
    if (!dev) return false;
    if (dev.status !== "connected") return false;
    setDevice(id, { status: "disconnecting", lastError: undefined });
    try {
      const res = (await apiDisconnectDevice({ deviceId: id })) as CommonResponse;
      if (!res?.success) throw new Error(getResponseMessage(res) || "断开失败");
      setDevice(id, { status: "online", lastError: undefined });
      if (!options?.silent) ElMessage.success("断开成功");
      return true;
    } catch (err) {
      const msg = normalizeErrorMessage(err instanceof Error ? err.message : err);
      setDevice(id, { status: "error", lastError: msg });
      if (!options?.silent) console.error(msg);
      return false;
    }
  };

  const connectAll = async () => {
    if (bulkWorking.value) return;
    bulkWorking.value = true;
    try {
      const res = (await apiConnectAllDevices()) as CommonResponse;
      if (!res?.success) throw new Error(getResponseMessage(res) || "连接所有设备失败");

      devices.value = devices.value.map((d) => {
        if (d.status === "offline") return d;
        return { ...d, status: "connected", lastError: undefined };
      });
      persist();

      ElMessage.success(getResponseMessage(res) || "连接所有设备成功");
      await discoverDevices();
    } catch (err) {
      console.error(normalizeErrorMessage(err instanceof Error ? err.message : err));
    } finally {
      bulkWorking.value = false;
    }
  };

  const disconnectAll = async () => {
    if (bulkWorking.value) return;
    bulkWorking.value = true;
    try {
      const res = (await apiDisconnectAllDevices()) as CommonResponse;
      if (!res?.success) throw new Error(getResponseMessage(res) || "断开所有设备失败");

      devices.value = devices.value.map((d) => {
        if (d.status === "connected" || d.status === "disconnecting") return { ...d, status: "online", lastError: undefined };
        return d;
      });
      persist();

      ElMessage.success(getResponseMessage(res) || "断开所有设备连接成功");
      await discoverDevices();
    } catch (err) {
      console.error(normalizeErrorMessage(err instanceof Error ? err.message : err));
    } finally {
      bulkWorking.value = false;
    }
  };

  initFromStorage();

  return {
    devices,
    loadingList,
    bulkWorking,
    discoverDevices,
    connectDevice,
    disconnectDevice,
    connectAll,
    disconnectAll,
  };
});
