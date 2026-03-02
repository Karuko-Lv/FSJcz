import { ref, reactive } from 'vue'
import { defineStore } from 'pinia'

export const useWeatherStationStore = defineStore('weatherStation', () => {
  // 气象站基本数据
  const temperature = ref(0)
  const humidity = ref(0)
  const windSpeed = ref(0)
  const windDirection = ref('')
  const pressure = ref(0)
  const rainfall = ref(0)
  const rainIntensity = ref(0)
  
  // 温度趋势数据
  const temperatureTrend = reactive({
    timestamps: [] as string[],
    values: [] as number[]
  })
  
  // 湿度趋势数据
  const humidityTrend = reactive({
    timestamps: [] as string[],
    values: [] as number[]
  })
  
  // 状态
  const isConnected = ref(false)
  const lastUpdated = ref('')
  
  // 更新气象站数据
  const updateWeatherData = (data: any) => {
    if (data.temperature !== undefined) {
      temperature.value = parseFloat(data.temperature)
    }
    if (data.humidity !== undefined) {
      humidity.value = parseFloat(data.humidity)
    }
    // 处理风速（支持windSpeed和wind_speed两种格式）
    if (data.windSpeed !== undefined) {
      windSpeed.value = parseFloat(data.windSpeed)
    } else if (data.wind_speed !== undefined) {
      windSpeed.value = parseFloat(data.wind_speed)
    }
    // 处理风向（支持windDirection和wind_direction两种格式）
    if (data.windDirection !== undefined) {
      windDirection.value = data.windDirection
    } else if (data.wind_direction !== undefined) {
      windDirection.value = data.wind_direction
    }
    if (data.pressure !== undefined) {
      pressure.value = parseFloat(data.pressure)
    }
    if (data.rainfall !== undefined) {
      rainfall.value = parseFloat(data.rainfall)
    }
    // 处理雨强（支持rainIntensity和rain_intensity两种格式）
    if (data.rainIntensity !== undefined) {
      rainIntensity.value = parseFloat(data.rainIntensity)
    } else if (data.rain_intensity !== undefined) {
      rainIntensity.value = parseFloat(data.rain_intensity)
    }
    
    // 更新最后更新时间
    lastUpdated.value = new Date().toLocaleTimeString()
  }
  
  // 更新温度趋势数据
  const updateTemperatureTrend = (timestamp: string, value: number) => {
    // 保持最多10个数据点
    if (temperatureTrend.timestamps.length >= 10) {
      temperatureTrend.timestamps.shift()
      temperatureTrend.values.shift()
    }
    
    temperatureTrend.timestamps.push(timestamp)
    temperatureTrend.values.push(value)
  }
  
  // 更新湿度趋势数据
  const updateHumidityTrend = (timestamp: string, value: number) => {
    // 保持最多10个数据点
    if (humidityTrend.timestamps.length >= 10) {
      humidityTrend.timestamps.shift()
      humidityTrend.values.shift()
    }
    
    humidityTrend.timestamps.push(timestamp)
    humidityTrend.values.push(value)
  }
  
  // 设置连接状态
  const setConnected = (connected: boolean) => {
    isConnected.value = connected
  }
  
  // 重置数据
  const resetData = () => {
    temperature.value = 0
    humidity.value = 0
    windSpeed.value = 0
    windDirection.value = ''
    pressure.value = 0
    rainfall.value = 0
    rainIntensity.value = 0
    
    temperatureTrend.timestamps = []
    temperatureTrend.values = []
    humidityTrend.timestamps = []
    humidityTrend.values = []
    
    isConnected.value = false
    lastUpdated.value = ''
  }
  
  return {
    temperature,
    humidity,
    windSpeed,
    windDirection,
    pressure,
    rainfall,
    rainIntensity,
    temperatureTrend,
    humidityTrend,
    isConnected,
    lastUpdated,
    updateWeatherData,
    updateTemperatureTrend,
    updateHumidityTrend,
    setConnected,
    resetData
  }
})
