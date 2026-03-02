import { ref, reactive } from 'vue'
import { defineStore } from 'pinia'

export const useSensorDataStore = defineStore('sensorData', () => {
  // 温湿度传感器数据
  const sensorWsd001 = reactive({
    id: "WSD-001",
    status: "在线",
    temperature: 0,
    humidity: 0
  })
  
  const sensorWsd002 = reactive({
    id: "WSD-002",
    status: "在线",
    temperature: 0,
    humidity: 0
  })

  const sensorWsd003 = reactive({
    id: "WSD-003",
    status: "在线",
    temperature: 0,
    humidity: 0
  })
  
  // 更新传感器数据
  const updateSensorData = (deviceId: string, data: any) => {
    if (deviceId === "WSD-001") {
      if (data.temperature !== undefined) {
        sensorWsd001.temperature = parseFloat(data.temperature);
      }
      if (data.humidity !== undefined) {
        sensorWsd001.humidity = parseFloat(data.humidity);
      }
      if (data.status !== undefined) {
        sensorWsd001.status = data.status;
      }
    } else if (deviceId === "WSD-002") {
      if (data.temperature !== undefined) {
        sensorWsd002.temperature = parseFloat(data.temperature);
      }
      if (data.humidity !== undefined) {
        sensorWsd002.humidity = parseFloat(data.humidity);
      }
      if (data.status !== undefined) {
        sensorWsd002.status = data.status;
      }
    } else if (deviceId === "WSD-003") {
      if (data.temperature !== undefined) {
        sensorWsd003.temperature = parseFloat(data.temperature);
      }
      if (data.humidity !== undefined) {
        sensorWsd003.humidity = parseFloat(data.humidity);
      }
      if (data.status !== undefined) {
        sensorWsd003.status = data.status;
      }
    }
  }
  
  return {
    sensorWsd001,
    sensorWsd002,
    sensorWsd003,
    updateSensorData
  }
})
