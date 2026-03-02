<script setup lang="ts">
import { computed, onMounted } from "vue";
import { useDeviceStore } from "@/stores";

const deviceStore = useDeviceStore();

const isRefreshing = computed(() => deviceStore.loadingList);
const isBulkWorking = computed(() => deviceStore.bulkWorking);
const devices = computed(() => deviceStore.devices);

const anyBusy = computed(() =>
  devices.value.some((d) => d.status === "connecting" || d.status === "disconnecting")
);

const allConnected = computed(() => {
  if (!devices.value.length) return false;
  return devices.value.every((d) => d.status === "connected" || d.status === "offline");
});

const anyConnected = computed(() => devices.value.some((d) => d.status === "connected"));

const overallStatusText = computed(() => {
  if (deviceStore.loadingList) return "设备列表加载中…";
  if (!devices.value.length) return "暂无设备";
  if (deviceStore.bulkWorking) return allConnected.value ? "断开中…" : "连接中…";
  if (anyBusy.value) return "状态同步中…";
  if (allConnected.value) return "已连接";
  if (anyConnected.value) return "部分连接";
  return "已断开";
});

const deviceStatusText = (status: string) => {
  if (status === "connected") return "已连接";
  if (status === "connecting") return "连接中…";
  if (status === "disconnecting") return "断开中…";
  if (status === "online") return "已断开";
  if (status === "offline") return "离线";
  if (status === "error") return "连接失败";
  return status;
};

const refresh = async () => {
  await deviceStore.discoverDevices();
};

const toggleAll = async () => {
  if (!devices.value.length) return;
  if (deviceStore.loadingList || deviceStore.bulkWorking) return;
  if (allConnected.value) await deviceStore.disconnectAll();
  else await deviceStore.connectAll();
};

const toggleOne = async (id: string, status: string) => {
  if (deviceStore.loadingList || deviceStore.bulkWorking) return;
  if (status === "connecting" || status === "disconnecting") return;
  if (status === "offline") return;
  if (status === "connected") await deviceStore.disconnectDevice(id);
  else await deviceStore.connectDevice(id);
};

onMounted(() => {
  if (!deviceStore.devices.length) {
    refresh();
  }
});
</script>

<template>
  <div class="device-manager">
    <div class="device-list">
      <div class="device-row device-row-all">
        <div class="row-left">
          <div class="row-title">所有设备</div>
          <div class="row-sub">{{ overallStatusText }}</div>
        </div>
        <button
          class="switch"
          :class="{ on: allConnected }"
          :disabled="isRefreshing || isBulkWorking || anyBusy"
          :aria-pressed="allConnected"
          @click="toggleAll"
        >
          <span class="switch-label">{{ allConnected ? "开" : "关" }}</span>
        </button>
      </div>

      <div class="divider" />

      <div v-if="isRefreshing && !devices.length" class="loading">加载中…</div>

      <div v-else-if="!devices.length" class="empty">暂无设备</div>

      <div v-else>
        <div v-for="d in devices" :key="d.id" class="device-row">
          <div class="row-left">
            <div class="row-title">{{ d.name }}</div>
            <div class="row-sub">
              {{ deviceStatusText(d.status) }}
              <span v-if="d.status === 'error' && d.lastError">：{{ d.lastError }}</span>
            </div>
          </div>
          <button
            class="switch"
            :class="{ on: d.status === 'connected' }"
            :disabled="isRefreshing || isBulkWorking || d.status === 'offline' || d.status === 'connecting' || d.status === 'disconnecting'"
            :aria-pressed="d.status === 'connected'"
            @click="toggleOne(d.id, d.status)"
          >
            <span class="switch-label">
              {{
                d.status === "connecting" || d.status === "disconnecting"
                  ? "…"
                  : d.status === "connected"
                    ? "开"
                    : "关"
              }}
            </span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.device-manager {
  padding: 6px 0 4px;
  container-type: inline-size;
}

.device-list {
  width: 100%;
  background: #fff;
}

.device-row {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 14px 0;
}

.device-row-all {
  padding-top: 8px;
  padding-bottom: 18px;
}

.row-left {
  min-width: 0;
  flex: 1;
}

.row-title {
  font-size: 14px;
  font-weight: 400;
  color: #555454;
  line-height: 1.5;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.row-sub {
  margin-top: 6px;
  font-size: 12px;
  color: rgba(0, 0, 0, 0.55);
  line-height: 1.2;
  word-break: break-word;
}

.divider {
  height: 1px;
  width: 100%;
  background: rgba(0, 0, 0, 0.08);
}

.loading,
.empty {
  padding: 16px 0;
  font-size: 13px;
  color: rgba(0, 0, 0, 0.55);
}

.switch {
  --sw-w: 56px;
  --sw-h: 24px;
  --sw-gap: 3px;
  width: var(--sw-w);
  height: var(--sw-h);
  border: none;
  border-radius: calc(var(--sw-h) / 2);
  background: rgba(0, 0, 0, 0.18);
  position: relative;
  padding: 0 12px;
  box-sizing: border-box;
  cursor: pointer;
  transition: background-color 0.2s ease;
  flex: 0 0 auto;
}

.switch::after {
  content: "";
  position: absolute;
  top: var(--sw-gap);
  left: var(--sw-gap);
  width: calc(var(--sw-h) - var(--sw-gap) * 2);
  height: calc(var(--sw-h) - var(--sw-gap) * 2);
  border-radius: 50%;
  background: #fff;
  transition: left 0.2s ease;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.18);
}

.switch.on {
  background: #409eff;
}

.switch.on::after {
  left: calc(var(--sw-w) - (var(--sw-h) - var(--sw-gap) * 2) - var(--sw-gap));
}

.switch-label {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 100%;
  left: 0;
  padding: 0 12px;
  box-sizing: border-box;
  font-size: 14px;
  font-weight: 700;
  color: #fff;
  text-align: right;
}

.switch.on .switch-label {
  text-align: left;
}

.switch:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

@container (max-width: 520px) {
  .row-title {
    font-size: 14px;
  }
  .switch {
    --sw-w: 52px;
    --sw-h: 22px;
  }
}
</style>
