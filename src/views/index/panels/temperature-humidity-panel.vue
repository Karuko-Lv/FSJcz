<script setup lang="ts">
import PanelWrap from "@/components/panel-wrap";
import { onMounted, onUnmounted } from "vue";
import { useSensorDataStore } from "@/stores";

const props = defineProps<{
  title: string;
}>();

const store = useSensorDataStore();

// 使用store中的传感器数据
const sensors = [
  store.sensorWsd001,
  store.sensorWsd002,
  store.sensorWsd003
];

let eventSource: EventSource | null = null;

onMounted(() => {
  // 创建SSE连接
  eventSource = new EventSource("http://192.168.1.233:8080/api/sse/wsd");
  
  // 监听消息事件
  eventSource.addEventListener("message", (event) => {
    try {
      const data = JSON.parse(event.data);
      if (data.deviceId && data.data) {
        // 提取温度和湿度数据
        const temperature = parseFloat(data.data.temperature);
        const humidity = parseFloat(data.data.humidity);
        
        // 更新传感器数据
        store.updateSensorData(data.deviceId, {
          temperature: temperature,
          humidity: humidity
        });
      }
    } catch (error) {
      console.error("Error parsing SSE data:", error);
    }
  });
  
  // 监听错误事件
  eventSource.addEventListener("error", (error) => {
    console.error("SSE connection error:", error);
    // 可以在这里添加重试逻辑
  });
});

onUnmounted(() => {
  // 清理SSE连接
  if (eventSource) {
    eventSource.close();
    eventSource = null;
  }
});
</script>

<template>
  <PanelWrap class="humidity-sensor-panel" :title="props.title">
    <div class="content">
      <div v-for="sensor in sensors" :key="sensor.id" class="sensor-card">
        <div class="sensor-header">
          <div class="sensor-id">{{ sensor.id }}</div>
          <div class="sensor-status">
            <span class="status-text">{{ sensor.status }}</span>
            <span class="status-indicator" :class="sensor.status"></span>
          </div>
        </div>
        <div class="sensor-data">
          <div class="data-item temperature">
            <span class="data-label">温度：</span>
            <span class="data-value">{{ sensor.temperature }} °C</span>
          </div>
          <div class="data-item humidity">
            <span class="data-label">湿度：</span>
            <span class="data-value">{{ sensor.humidity }} %</span>
          </div>
        </div>
      </div>
    </div>
  </PanelWrap>
</template>

<style scoped lang="scss">
.humidity-sensor-panel {
  width: 100%;
  flex: 1;
  container-type: inline-size;
}

.content {
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 12px;
  box-sizing: border-box;
  justify-content: space-between;
}

.sensor-card {
  background: rgba(3, 5, 12, 0.3);
  border: 1px solid rgba(0, 234, 255, 0.2);
  border-radius: 8px;
  padding: 14px;
  box-sizing: border-box;
  backdrop-filter: blur(10px);
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.sensor-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.sensor-id {
  font-size: 16px;
  font-weight: 800;
  color: rgba(211, 214, 221, 0.95);
  letter-spacing: 1px;
}

.sensor-status {
  display: flex;
  align-items: center;
  gap: 6px;
}

.status-text {
  font-size: 14px;
  font-weight: 600;
  color: #4ade80;
}

.status-indicator {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #4ade80;
  box-shadow: 0 0 8px rgba(74, 222, 128, 0.6);
}

.status-indicator.在线 {
  background: #4ade80;
  box-shadow: 0 0 8px rgba(74, 222, 128, 0.6);
}

.sensor-data {
  display: flex;
  justify-content: space-around;
  align-items: center;
  gap: 20px;
}

.data-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.data-label {
  font-size: 14px;
  color: rgba(211, 214, 221, 0.8);
  display: flex;
  align-items: center;
  gap: 4px;
}

.data-label::before {
  content: '';
  display: inline-block;
  width: 16px;
  height: 16px;
  background-size: contain;
  background-repeat: no-repeat;
  background-position: center;
}

.data-item.temperature .data-label::before {
  background-image: url('data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="rgba(255, 107, 107, 0.8)"%3E%3Cpath d="M14 10V4c0-1.1-.9-2-2-2s-2 .9-2 2v6c0 .55-.45 1-1 1H7c-1.1 0-2 .9-2 2v8c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2v-8c0-1.1-.9-2-2-2h-3c-.55 0-1-.45-1-1zM12 20c-1.1 0-2-.9-2-2h4c0 1.1-.9 2-2 2z"/%3E%3C/svg%3E');
}

.data-item.humidity .data-label::before {
  background-image: url('data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="rgba(102, 187, 255, 0.8)"%3E%3Cpath d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/%3E%3C/svg%3E');
}

.data-value {
  font-size: 18px;
  font-weight: 800;
  color: rgba(211, 214, 221, 0.95);
}

@container (max-width: 520px) {
  .content {
    gap: 10px;
    padding: 10px;
  }
  
  .sensor-card {
    padding: 12px;
  }
  
  .sensor-header {
    margin-bottom: 10px;
  }
  
  .sensor-id {
    font-size: 14px;
  }
  
  .status-text {
    font-size: 12px;
  }
  
  .data-label {
    font-size: 12px;
  }
  
  .data-value {
    font-size: 16px;
  }
  
  .data-item {
    gap: 6px;
  }
  
  .sensor-data {
    gap: 10px;
  }
}
</style>