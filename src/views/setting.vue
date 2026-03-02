<script setup lang="ts">
import { useSettingStore, useSensorDataStore, useNaISpectrometerStore, useWeatherStationStore } from "@/stores/index";
import { ref, computed, onUnmounted } from "vue";
import {storeToRefs} from "pinia";
import { ElMessage } from "element-plus";

// 传感器数据 store
const sensorStore = useSensorDataStore();
const naiStore = useNaISpectrometerStore();
const weatherStore = useWeatherStationStore();
const isScaleRadio = ref(false);
const leftBottomRadio=ref(true)
const rightBottomRadio=ref(true)
const settingStore = useSettingStore();
const {indexConfig}=storeToRefs(settingStore)

// 设备管理相关状态
// 气象站
const isConnecting = ref(false);
const isDisconnecting = ref(false);
const isConnected = ref(false);
const weatherStationEventSource = ref<EventSource | null>(null);

// 温湿度传感器 - WSD-001
const isWsd001Connecting = ref(false);
const isWsd001Disconnecting = ref(false);
const isWsd001Connected = ref(false);

// 温湿度传感器 - WSD-002
const isWsd002Connecting = ref(false);
const isWsd002Disconnecting = ref(false);
const isWsd002Connected = ref(false);

// 温湿度传感器 - WSD-003
const isWsd003Connecting = ref(false);
const isWsd003Disconnecting = ref(false);
const isWsd003Connected = ref(false);

const eventSource = ref<EventSource | null>(null);

// 超大流量采样器
const isCdllConnecting = ref(false);
const isCdllDisconnecting = ref(false);
const isCdllConnected = ref(false);

// 干湿沉降采样器
const isGscjConnecting = ref(false);
const isGscjDisconnecting = ref(false);
const isGscjConnected = ref(false);

// 碘采样器
const isDcyqConnecting = ref(false);
const isDcyqDisconnecting = ref(false);
const isDcyqConnected = ref(false);

// 碘化钠谱仪
const isDhnConnecting = ref(false);
const isDhnDisconnecting = ref(false);
const isDhnConnected = ref(false);
const dhnEventSource = ref<EventSource | null>(null);
const dhnSpectrumEventSource = ref<EventSource | null>(null);

// 高压电离室
const isGydlsConnecting = ref(false);
const isGydlsDisconnecting = ref(false);
const isGydlsConnected = ref(false);

const init = () => {
  settingStore.initSetting();
  isScaleRadio.value = settingStore.isScale;

  leftBottomRadio.value=indexConfig.value.leftBottomSwiper
  rightBottomRadio.value=indexConfig.value.rightBottomSwiper

};
init();
const handleClose = () => {};

const cancelClick = () => {
  settingStore.setSettingShow(false);
};

const confirmClick = () => {};
const isScaleChange = (flag: boolean) => {
  settingStore.setIsScale(flag);
};
const radiochange = (blag: boolean) => {
  settingStore.setIsScale(blag);
  // this.$store.commit('setting/updateSwiper', { val, type })
};
const indexRadioChange=(flag: boolean)=>{
  settingStore.setIndexConfig({
    leftBottomSwiper: leftBottomRadio.value,//左轮播
    rightBottomSwiper:rightBottomRadio.value,//右下轮播
  });
};

// 设备连接方法
const connectWeatherStation = async () => {
  // 防止重复点击
  if (isConnecting.value || isDisconnecting.value) return;
  
  isConnecting.value = true;
  
  try {
    // 使用代理后的路径，通过Vite代理服务器发送请求，解决跨域问题
    const apiUrl = "/api/devices/connect";
    const requestBody = {
      deviceId: "QX-001"
    };
    
    console.log(`API URL: ${apiUrl}`);
    console.log(`请求参数: ${JSON.stringify(requestBody)}`);
    console.log("准备发送请求...");
    
    // 设置请求超时
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10秒超时
    
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal // 添加信号以支持超时
    });
    
    clearTimeout(timeoutId); // 清除超时
    
    console.log(`请求响应状态: ${response.status} ${response.statusText}`);
    
    // 尝试读取响应文本
    const responseText = await response.text();
    console.log(`响应文本: ${responseText}`);
    
    // 尝试解析响应数据
    let responseData;
    try {
      responseData = JSON.parse(responseText);
      console.log(`解析后的响应数据:`, responseData);
    } catch (parseError) {
      console.log("解析响应数据失败:", parseError);
      // 解析失败时，认为连接失败
      isConnected.value = false;
      return;
    }
    
    // 根据响应数据设置连接状态
    // 检查响应是否成功，并且responseData.success为true
    if (response.ok && responseData.success) {
      console.log("响应成功");
      isConnected.value = true;
      weatherStore.setConnected(true);
      
      // 建立 EventSource 连接，监听气象站数据
      try {
        const sseUrl = "/api/sse/qix";
        weatherStationEventSource.value = new EventSource(sseUrl);
        
        // 监听设备数据事件
        weatherStationEventSource.value.addEventListener('device.data', (event) => {
          try {
            console.log("原始气象站数据:", event.data);
            console.log("数据长度:", event.data.length);
            console.log("数据前100个字符:", event.data.substring(0, 100));
            console.log("数据后100个字符:", event.data.substring(event.data.length - 100));
            
            // 尝试去除可能的BOM字符
            let cleanData = event.data.replace(/^\ufeff/, '');
            
            // 尝试解析JSON
            const data = JSON.parse(cleanData);
            console.log("收到气象站数据:", data);
            
            // 更新气象站数据到store
            if (data) {
              // 直接使用数据，因为格式看起来是扁平化的
              weatherStore.updateWeatherData(data);
              
              // 更新温度和湿度趋势数据
              const timestamp = new Date().toLocaleTimeString();
              if (data.temperature) {
                weatherStore.updateTemperatureTrend(timestamp, parseFloat(data.temperature));
              }
              if (data.humidity) {
                weatherStore.updateHumidityTrend(timestamp, parseFloat(data.humidity));
              }
            }
          } catch (error) {
            console.error("解析气象站数据失败:", error);
            console.error("失败的原始数据:", event.data);
            console.error("数据编码:", encodeURIComponent(event.data));
            
            // 显示数据解析失败的详细原因
            ElMessage.error(`气象站数据解析失败: ${error instanceof Error ? error.message : '未知错误'}`);
            
            // 尝试使用更宽松的解析方法
            try {
              // 尝试使用eval作为最后的手段（仅用于调试）
              console.log("尝试使用eval解析...");
              const evalData = eval('(' + event.data + ')');
              console.log("eval解析成功:", evalData);
              
              if (evalData) {
                weatherStore.updateWeatherData(evalData);
                const timestamp = new Date().toLocaleTimeString();
                if (evalData.temperature) {
                  weatherStore.updateTemperatureTrend(timestamp, parseFloat(evalData.temperature));
                }
                if (evalData.humidity) {
                  weatherStore.updateHumidityTrend(timestamp, parseFloat(evalData.humidity));
                }
              }
            } catch (evalError) {
              console.error("eval解析也失败:", evalError);
              ElMessage.error(`气象站数据解析失败（尝试修复后）: ${evalError instanceof Error ? evalError.message : '未知错误'}`);
            }
          }
        });
        
        // 监听连接错误
        weatherStationEventSource.value.addEventListener('error', (error) => {
          console.error("气象站 EventSource 连接错误:", error);
          ElMessage.error(`气象站数据连接失败: ${error instanceof Error ? error.message : '连接被关闭或网络错误'}`);
          if (weatherStationEventSource.value) {
            weatherStationEventSource.value.close();
            weatherStationEventSource.value = null;
          }
        });
        
        console.log("气象站 EventSource 连接建立成功");
        // 显示成功提示
        ElMessage.success("连接气象站成功并开始获取数据");
      } catch (error) {
        console.error("建立气象站 EventSource 连接失败:", error);
        ElMessage.error(`建立气象站数据监听连接失败: ${error instanceof Error ? error.message : '未知错误'}`);
        // 即使数据监听失败，连接状态仍然保持为成功
      }
    } else {
      console.log("响应失败");
      isConnected.value = false;
      // 显示详细的错误提示
      const errorMsg = responseData.message || responseData.msg || "连接气象站失败";
      ElMessage.error(`连接气象站失败: ${errorMsg}`);
    }
  } catch (error) {
    console.log("捕获到异常:", error);
    // 发生异常时，设置为未连接状态
    isConnected.value = false;
    // 显示错误提示
    const errorMsg = error instanceof Error ? error.message : "连接气象站异常";
    ElMessage.error(errorMsg);
  } finally {
    isConnecting.value = false;
    console.log("连接操作完成");
  }
};

// 设备断开连接方法
const disconnectWeatherStation = async () => {
  // 防止重复点击
  if (isConnecting.value || isDisconnecting.value) return;
  
  isDisconnecting.value = true;
  
  try {
    // 使用代理后的路径，通过Vite代理服务器发送请求，解决跨域问题
    const apiUrl = "/api/devices/disconnect";
    const requestBody = {
      deviceId: "QX-001"
    };
    
    console.log(`API URL: ${apiUrl}`);
    console.log(`请求参数: ${JSON.stringify(requestBody)}`);
    console.log("准备发送请求...");
    
    // 设置请求超时
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10秒超时
    
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal // 添加信号以支持超时
    });
    
    clearTimeout(timeoutId); // 清除超时
    
    console.log(`请求响应状态: ${response.status} ${response.statusText}`);
    
    // 尝试读取响应文本
    const responseText = await response.text();
    console.log(`响应文本: ${responseText}`);
    
    // 尝试解析响应数据
    let responseData;
    try {
      responseData = JSON.parse(responseText);
      console.log(`解析后的响应数据:`, responseData);
    } catch (parseError) {
      console.log("解析响应数据失败:", parseError);
      responseData = {};
    }
    
    // 设置为未连接状态
    isConnected.value = false;
    weatherStore.setConnected(false);
    weatherStore.resetData();
    
    // 关闭 EventSource 连接
    if (weatherStationEventSource.value) {
      weatherStationEventSource.value.close();
      weatherStationEventSource.value = null;
      console.log("气象站 EventSource 连接已关闭");
    }
    
    // 显示提示信息
    if (response.ok && responseData.success) {
      ElMessage.success("断开气象站连接成功");
    } else {
      const errorMsg = responseData.message || responseData.msg || "断开气象站连接失败";
      ElMessage.error(errorMsg);
    }
  } catch (error) {
    console.log("捕获到异常:", error);
    // 发生异常时，也设置为未连接状态
    isConnected.value = false;
    
    // 关闭 EventSource 连接
    if (weatherStationEventSource.value) {
      weatherStationEventSource.value.close();
      weatherStationEventSource.value = null;
      console.log("气象站 EventSource 连接已关闭");
    }
    
    // 显示错误提示
    const errorMsg = error instanceof Error ? error.message : "断开气象站连接异常";
    ElMessage.error(errorMsg);
  } finally {
    isDisconnecting.value = false;
    console.log("断开连接操作完成");
  }
};

// 切换设备连接状态方法
const toggleWeatherStationConnection = async () => {
  if (isConnected.value) {
    await disconnectWeatherStation();
  } else {
    await connectWeatherStation();
  }
};

// 温湿度传感器连接方法
const connectWsdSensor = async (deviceId: string) => {
  // 防止重复点击
  const isConnecting = getWsdConnectingRef(deviceId);
  const isDisconnecting = getWsdDisconnectingRef(deviceId);
  const isConnected = getWsdConnectedRef(deviceId);
  
  if (isConnecting.value || isDisconnecting.value) return;
  
  isConnecting.value = true;
  
  try {
    // 使用代理后的路径，通过Vite代理服务器发送请求，解决跨域问题
    const apiUrl = "/api/devices/connect";
    const requestBody = {
      deviceId
    };
    
    console.log(`API URL: ${apiUrl}`);
    console.log(`请求参数: ${JSON.stringify(requestBody)}`);
    console.log("准备发送请求...");
    
    // 设置请求超时
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10秒超时
    
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal // 添加信号以支持超时
    });
    
    clearTimeout(timeoutId); // 清除超时
    
    console.log(`请求响应状态: ${response.status} ${response.statusText}`);
    
    // 尝试读取响应文本
    const responseText = await response.text();
    console.log(`响应文本: ${responseText}`);
    
    // 尝试解析响应数据
    let responseData;
    try {
      responseData = JSON.parse(responseText);
      console.log(`解析后的响应数据:`, responseData);
    } catch (parseError) {
      console.log("解析响应数据失败:", parseError);
      // 解析失败时，认为连接失败
      isConnected.value = false;
      return;
    }
    
    // 根据响应数据设置连接状态
    // 检查响应是否成功，并且responseData.success为true
    if (response.ok && responseData.success) {
      console.log("响应成功");
      isConnected.value = true;
      
      // 建立 EventSource 连接，监听设备数据（仅在首次连接时建立）
      if (!eventSource.value) {
        try {
          const sseUrl = "/api/sse/wsd";
          eventSource.value = new EventSource(sseUrl);
          
          // 监听设备数据事件
          eventSource.value.addEventListener('device.data', (event) => {
            try {
              console.log("原始温湿度传感器数据:", event.data);
              console.log("数据长度:", event.data.length);
              console.log("数据前100个字符:", event.data.substring(0, 100));
              console.log("数据后100个字符:", event.data.substring(event.data.length - 100));
              
              // 尝试去除可能的BOM字符
              let cleanData = event.data.replace(/^\ufeff/, '');
              
              // 尝试解析JSON
              const data = JSON.parse(cleanData);
              
              // 处理温度和湿度，保留小数点后两位
              if (data.temperature !== undefined) {
                data.temperature = parseFloat(data.temperature).toFixed(2);
              }
              if (data.humidity !== undefined) {
                data.humidity = parseFloat(data.humidity).toFixed(2);
              }
              
              console.log("收到设备数据:", data);
              
              // 更新传感器数据到 store
              if (data.deviceId) {
                sensorStore.updateSensorData(data.deviceId, data);
                console.log("传感器数据已更新:", data.deviceId);
              }
            } catch (error) {
              console.error("解析设备数据失败:", error);
              console.error("失败的原始数据:", event.data);
              console.error("数据编码:", encodeURIComponent(event.data));
              
              // 显示数据解析失败的详细原因
              ElMessage.error(`温湿度传感器数据解析失败: ${error instanceof Error ? error.message : '未知错误'}`);
            }
          });
          
          // 监听连接错误
          eventSource.value.addEventListener('error', (error) => {
            console.error("EventSource 连接错误:", error);
            ElMessage.error(`温湿度传感器数据连接失败: ${error instanceof Error ? error.message : '连接被关闭或网络错误'}`);
            if (eventSource.value) {
              eventSource.value.close();
              eventSource.value = null;
            }
          });
          
          console.log("EventSource 连接建立成功");
        } catch (error) {
          console.error("建立 EventSource 连接失败:", error);
          ElMessage.error(`建立温湿度传感器数据监听连接失败: ${error instanceof Error ? error.message : '未知错误'}`);
        }
      }
      
      // 显示成功提示
      ElMessage.success(`连接温湿度传感器 ${deviceId} 成功并开始获取数据`);
    } else {
      console.log("响应失败");
      isConnected.value = false;
      // 显示详细的错误提示
      const errorMsg = responseData.message || responseData.msg || `连接温湿度传感器 ${deviceId} 失败`;
      ElMessage.error(`连接温湿度传感器 ${deviceId} 失败: ${errorMsg}`);
    }
  } catch (error) {
    console.log("捕获到异常:", error);
    // 发生异常时，设置为未连接状态
    isConnected.value = false;
    // 显示错误提示
    const errorMsg = error instanceof Error ? error.message : `连接温湿度传感器 ${deviceId} 异常`;
    ElMessage.error(errorMsg);
  } finally {
    isConnecting.value = false;
    console.log("连接操作完成");
  }
};

// 温湿度传感器断开连接方法
const disconnectWsdSensor = async (deviceId: string) => {
  // 防止重复点击
  const isConnecting = getWsdConnectingRef(deviceId);
  const isDisconnecting = getWsdDisconnectingRef(deviceId);
  const isConnected = getWsdConnectedRef(deviceId);
  
  if (isConnecting.value || isDisconnecting.value) return;
  
  isDisconnecting.value = true;
  
  try {
    // 使用代理后的路径，通过Vite代理服务器发送请求，解决跨域问题
    const apiUrl = "/api/devices/disconnect";
    const requestBody = {
      deviceId
    };
    
    console.log(`API URL: ${apiUrl}`);
    console.log(`请求参数: ${JSON.stringify(requestBody)}`);
    console.log("准备发送请求...");
    
    // 设置请求超时
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10秒超时
    
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal // 添加信号以支持超时
    });
    
    clearTimeout(timeoutId); // 清除超时
    
    console.log(`请求响应状态: ${response.status} ${response.statusText}`);
    
    // 尝试读取响应文本
    const responseText = await response.text();
    console.log(`响应文本: ${responseText}`);
    
    // 尝试解析响应数据
    let responseData;
    try {
      responseData = JSON.parse(responseText);
      console.log(`解析后的响应数据:`, responseData);
    } catch (parseError) {
      console.log("解析响应数据失败:", parseError);
      responseData = {};
    }
    
    // 设置为未连接状态
    isConnected.value = false;
    
    // 检查是否所有温湿度传感器都已断开连接，如果是则关闭 EventSource
    if (!isWsd001Connected.value && !isWsd002Connected.value && !isWsd003Connected.value) {
      if (eventSource.value) {
        eventSource.value.close();
        eventSource.value = null;
        console.log("EventSource 连接已关闭");
      }
    }
    
    // 显示提示信息
    if (response.ok && responseData.success) {
      ElMessage.success(`断开温湿度传感器 ${deviceId} 连接成功`);
    } else {
      const errorMsg = responseData.message || responseData.msg || `断开温湿度传感器 ${deviceId} 连接失败`;
      ElMessage.error(errorMsg);
    }
  } catch (error) {
    console.log("捕获到异常:", error);
    // 发生异常时，也设置为未连接状态
    isConnected.value = false;
    
    // 检查是否所有温湿度传感器都已断开连接，如果是则关闭 EventSource
    if (!isWsd001Connected.value && !isWsd002Connected.value && !isWsd003Connected.value) {
      if (eventSource.value) {
        eventSource.value.close();
        eventSource.value = null;
        console.log("EventSource 连接已关闭");
      }
    }
    
    // 显示错误提示
    const errorMsg = error instanceof Error ? error.message : `断开温湿度传感器 ${deviceId} 连接异常`;
    ElMessage.error(errorMsg);
  } finally {
    isDisconnecting.value = false;
    console.log("断开连接操作完成");
  }
};

// 辅助函数：根据设备ID获取对应的状态变量
const getWsdConnectingRef = (deviceId: string) => {
  switch (deviceId) {
    case "WSD-001": return isWsd001Connecting;
    case "WSD-002": return isWsd002Connecting;
    case "WSD-003": return isWsd003Connecting;
    default: return isWsd001Connecting;
  }
};

const getWsdDisconnectingRef = (deviceId: string) => {
  switch (deviceId) {
    case "WSD-001": return isWsd001Disconnecting;
    case "WSD-002": return isWsd002Disconnecting;
    case "WSD-003": return isWsd003Disconnecting;
    default: return isWsd001Disconnecting;
  }
};

const getWsdConnectedRef = (deviceId: string) => {
  switch (deviceId) {
    case "WSD-001": return isWsd001Connected;
    case "WSD-002": return isWsd002Connected;
    case "WSD-003": return isWsd003Connected;
    default: return isWsd001Connected;
  }
};

// 切换温湿度传感器连接状态方法
const toggleWsdSensorConnection = async (deviceId: string) => {
  const isConnected = getWsdConnectedRef(deviceId);
  if (isConnected.value) {
    await disconnectWsdSensor(deviceId);
  } else {
    await connectWsdSensor(deviceId);
  }
};

// 计算属性：是否所有温湿度传感器都已连接
const allWsdConnected = computed(() => {
  return isWsd001Connected.value && isWsd002Connected.value && isWsd003Connected.value;
});

// 计算属性：是否有任何温湿度传感器正在加载
const isAnyWsdLoading = computed(() => {
  return isWsd001Connecting.value || isWsd001Disconnecting.value ||
         isWsd002Connecting.value || isWsd002Disconnecting.value ||
         isWsd003Connecting.value || isWsd003Disconnecting.value;
});

// 延迟函数
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// 同时切换所有温湿度传感器连接状态
const toggleAllWsdSensors = async () => {
  if (allWsdConnected.value) {
    // 断开所有传感器
    await Promise.all([
      disconnectWsdSensor('WSD-001'),
      disconnectWsdSensor('WSD-002'),
      disconnectWsdSensor('WSD-003')
    ]);
  } else {
    // 串行连接所有传感器，每个之间添加1秒延迟
    await connectWsdSensor('WSD-001');
    await delay(1000);
    await connectWsdSensor('WSD-002');
    await delay(1000);
    await connectWsdSensor('WSD-003');
  }
};

// 超大流量采样器连接方法
const connectCdllSampler = async () => {
  // 防止重复点击
  if (isCdllConnecting.value || isCdllDisconnecting.value) return;
  
  isCdllConnecting.value = true;
  
  try {
    // 使用代理后的路径，通过Vite代理服务器发送请求，解决跨域问题
    const apiUrl = "/api/devices/connect";
    const requestBody = {
      deviceId: "CDLL-001"
    };
    
    console.log(`API URL: ${apiUrl}`);
    console.log(`请求参数: ${JSON.stringify(requestBody)}`);
    console.log("准备发送请求...");
    
    // 设置请求超时
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10秒超时
    
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal // 添加信号以支持超时
    });
    
    clearTimeout(timeoutId); // 清除超时
    
    console.log(`请求响应状态: ${response.status} ${response.statusText}`);
    
    // 尝试读取响应文本
    const responseText = await response.text();
    console.log(`响应文本: ${responseText}`);
    
    // 尝试解析响应数据
    let responseData;
    try {
      responseData = JSON.parse(responseText);
      console.log(`解析后的响应数据:`, responseData);
    } catch (parseError) {
      console.log("解析响应数据失败:", parseError);
      // 解析失败时，认为连接失败
      isCdllConnected.value = false;
      return;
    }
    
    // 根据响应数据设置连接状态
    // 检查响应是否成功，并且responseData.success为true
    if (response.ok && responseData.success) {
      console.log("响应成功");
      isCdllConnected.value = true;
      // 显示成功提示
      ElMessage.success("连接超大流量采样器成功");
    } else {
      console.log("响应失败");
      isCdllConnected.value = false;
      // 显示详细的错误提示
      const errorMsg = responseData.message || responseData.msg || "连接超大流量采样器失败";
      ElMessage.error(`连接超大流量采样器失败: ${errorMsg}`);
    }
  } catch (error) {
    console.log("捕获到异常:", error);
    // 发生异常时，设置为未连接状态
    isCdllConnected.value = false;
    // 显示错误提示
    const errorMsg = error instanceof Error ? error.message : "连接超大流量采样器异常";
    ElMessage.error(errorMsg);
  } finally {
    isCdllConnecting.value = false;
    console.log("连接操作完成");
  }
};

// 超大流量采样器断开连接方法
const disconnectCdllSampler = async () => {
  // 防止重复点击
  if (isCdllConnecting.value || isCdllDisconnecting.value) return;
  
  isCdllDisconnecting.value = true;
  
  try {
    // 使用代理后的路径，通过Vite代理服务器发送请求，解决跨域问题
    const apiUrl = "/api/devices/disconnect";
    const requestBody = {
      deviceId: "CDLL-001"
    };
    
    console.log(`API URL: ${apiUrl}`);
    console.log(`请求参数: ${JSON.stringify(requestBody)}`);
    console.log("准备发送请求...");
    
    // 设置请求超时
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10秒超时
    
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal // 添加信号以支持超时
    });
    
    clearTimeout(timeoutId); // 清除超时
    
    console.log(`请求响应状态: ${response.status} ${response.statusText}`);
    
    // 尝试读取响应文本
    const responseText = await response.text();
    console.log(`响应文本: ${responseText}`);
    
    // 尝试解析响应数据
    let responseData;
    try {
      responseData = JSON.parse(responseText);
      console.log(`解析后的响应数据:`, responseData);
    } catch (parseError) {
      console.log("解析响应数据失败:", parseError);
      responseData = {};
    }
    
    // 设置为未连接状态
    isCdllConnected.value = false;
    
    // 显示提示信息
    if (response.ok && responseData.success) {
      ElMessage.success("断开超大流量采样器连接成功");
    } else {
      const errorMsg = responseData.message || responseData.msg || "断开超大流量采样器连接失败";
      ElMessage.error(errorMsg);
    }
  } catch (error) {
    console.log("捕获到异常:", error);
    // 发生异常时，也设置为未连接状态
    isCdllConnected.value = false;
    // 显示错误提示
    const errorMsg = error instanceof Error ? error.message : "断开超大流量采样器连接异常";
    ElMessage.error(errorMsg);
  } finally {
    isCdllDisconnecting.value = false;
    console.log("断开连接操作完成");
  }
};

// 切换超大流量采样器连接状态方法
const toggleCdllSamplerConnection = async () => {
  if (isCdllConnected.value) {
    await disconnectCdllSampler();
  } else {
    await connectCdllSampler();
  }
};

// 干湿沉降采样器连接方法
const connectGscjSampler = async () => {
  // 防止重复点击
  if (isGscjConnecting.value || isGscjDisconnecting.value) return;
  
  isGscjConnecting.value = true;
  
  try {
    // 使用代理后的路径，通过Vite代理服务器发送请求，解决跨域问题
    const apiUrl = "/api/devices/connect";
    const requestBody = {
      deviceId: "GSCJ-001"
    };
    
    console.log(`API URL: ${apiUrl}`);
    console.log(`请求参数: ${JSON.stringify(requestBody)}`);
    console.log("准备发送请求...");
    
    // 设置请求超时
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10秒超时
    
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal // 添加信号以支持超时
    });
    
    clearTimeout(timeoutId); // 清除超时
    
    console.log(`请求响应状态: ${response.status} ${response.statusText}`);
    
    // 尝试读取响应文本
    const responseText = await response.text();
    console.log(`响应文本: ${responseText}`);
    
    // 尝试解析响应数据
    let responseData;
    try {
      responseData = JSON.parse(responseText);
      console.log(`解析后的响应数据:`, responseData);
    } catch (parseError) {
      console.log("解析响应数据失败:", parseError);
      // 解析失败时，认为连接失败
      isGscjConnected.value = false;
      return;
    }
    
    // 根据响应数据设置连接状态
    // 检查响应是否成功，并且responseData.success为true
    if (response.ok && responseData.success) {
      console.log("响应成功");
      isGscjConnected.value = true;
      // 显示成功提示
      ElMessage.success("连接干湿沉降采样器成功");
    } else {
      console.log("响应失败");
      isGscjConnected.value = false;
      // 显示详细的错误提示
      const errorMsg = responseData.message || responseData.msg || "连接干湿沉降采样器失败";
      ElMessage.error(`连接干湿沉降采样器失败: ${errorMsg}`);
    }
  } catch (error) {
    console.log("捕获到异常:", error);
    // 发生异常时，设置为未连接状态
    isGscjConnected.value = false;
    // 显示错误提示
    const errorMsg = error instanceof Error ? error.message : "连接干湿沉降采样器异常";
    ElMessage.error(errorMsg);
  } finally {
    isGscjConnecting.value = false;
    console.log("连接操作完成");
  }
};

// 干湿沉降采样器断开连接方法
const disconnectGscjSampler = async () => {
  // 防止重复点击
  if (isGscjConnecting.value || isGscjDisconnecting.value) return;
  
  isGscjDisconnecting.value = true;
  
  try {
    // 使用代理后的路径，通过Vite代理服务器发送请求，解决跨域问题
    const apiUrl = "/api/devices/disconnect";
    const requestBody = {
      deviceId: "GSCJ-001"
    };
    
    console.log(`API URL: ${apiUrl}`);
    console.log(`请求参数: ${JSON.stringify(requestBody)}`);
    console.log("准备发送请求...");
    
    // 设置请求超时
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10秒超时
    
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal // 添加信号以支持超时
    });
    
    clearTimeout(timeoutId); // 清除超时
    
    console.log(`请求响应状态: ${response.status} ${response.statusText}`);
    
    // 尝试读取响应文本
    const responseText = await response.text();
    console.log(`响应文本: ${responseText}`);
    
    // 尝试解析响应数据
    let responseData;
    try {
      responseData = JSON.parse(responseText);
      console.log(`解析后的响应数据:`, responseData);
    } catch (parseError) {
      console.log("解析响应数据失败:", parseError);
      responseData = {};
    }
    
    // 设置为未连接状态
    isGscjConnected.value = false;
    
    // 显示提示信息
    if (response.ok && responseData.success) {
      ElMessage.success("断开干湿沉降采样器连接成功");
    } else {
      const errorMsg = responseData.message || responseData.msg || "断开干湿沉降采样器连接失败";
      ElMessage.error(errorMsg);
    }
  } catch (error) {
    console.log("捕获到异常:", error);
    // 发生异常时，也设置为未连接状态
    isGscjConnected.value = false;
    // 显示错误提示
    const errorMsg = error instanceof Error ? error.message : "断开干湿沉降采样器连接异常";
    ElMessage.error(errorMsg);
  } finally {
    isGscjDisconnecting.value = false;
    console.log("断开连接操作完成");
  }
};

// 切换干湿沉降采样器连接状态方法
const toggleGscjSamplerConnection = async () => {
  if (isGscjConnected.value) {
    await disconnectGscjSampler();
  } else {
    await connectGscjSampler();
  }
};

// 碘采样器连接方法
const connectDcyqSampler = async () => {
  // 防止重复点击
  if (isDcyqConnecting.value || isDcyqDisconnecting.value) return;
  
  isDcyqConnecting.value = true;
  
  try {
    // 使用代理后的路径，通过Vite代理服务器发送请求，解决跨域问题
    const apiUrl = "/api/devices/connect";
    const requestBody = {
      deviceId: "DCYQ-001"
    };
    
    console.log(`API URL: ${apiUrl}`);
    console.log(`请求参数: ${JSON.stringify(requestBody)}`);
    console.log("准备发送请求...");
    
    // 设置请求超时
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10秒超时
    
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal // 添加信号以支持超时
    });
    
    clearTimeout(timeoutId); // 清除超时
    
    console.log(`请求响应状态: ${response.status} ${response.statusText}`);
    
    // 尝试读取响应文本
    const responseText = await response.text();
    console.log(`响应文本: ${responseText}`);
    
    // 尝试解析响应数据
    let responseData;
    try {
      responseData = JSON.parse(responseText);
      console.log(`解析后的响应数据:`, responseData);
    } catch (parseError) {
      console.log("解析响应数据失败:", parseError);
      // 解析失败时，认为连接失败
      isDcyqConnected.value = false;
      return;
    }
    
    // 根据响应数据设置连接状态
    // 检查响应是否成功，并且responseData.success为true
    if (response.ok && responseData.success) {
      console.log("响应成功");
      isDcyqConnected.value = true;
      // 显示成功提示
      ElMessage.success("连接碘采样器成功");
    } else {
      console.log("响应失败");
      isDcyqConnected.value = false;
      // 显示详细的错误提示
      const errorMsg = responseData.message || responseData.msg || "连接碘采样器失败";
      ElMessage.error(`连接碘采样器失败: ${errorMsg}`);
    }
  } catch (error) {
    console.log("捕获到异常:", error);
    // 发生异常时，设置为未连接状态
    isDcyqConnected.value = false;
    // 显示错误提示
    const errorMsg = error instanceof Error ? error.message : "连接碘采样器异常";
    ElMessage.error(errorMsg);
  } finally {
    isDcyqConnecting.value = false;
    console.log("连接操作完成");
  }
};

// 碘采样器断开连接方法
const disconnectDcyqSampler = async () => {
  // 防止重复点击
  if (isDcyqConnecting.value || isDcyqDisconnecting.value) return;
  
  isDcyqDisconnecting.value = true;
  
  try {
    // 使用代理后的路径，通过Vite代理服务器发送请求，解决跨域问题
    const apiUrl = "/api/devices/disconnect";
    const requestBody = {
      deviceId: "DCYQ-001"
    };
    
    console.log(`API URL: ${apiUrl}`);
    console.log(`请求参数: ${JSON.stringify(requestBody)}`);
    console.log("准备发送请求...");
    
    // 设置请求超时
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10秒超时
    
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal // 添加信号以支持超时
    });
    
    clearTimeout(timeoutId); // 清除超时
    
    console.log(`请求响应状态: ${response.status} ${response.statusText}`);
    
    // 尝试读取响应文本
    const responseText = await response.text();
    console.log(`响应文本: ${responseText}`);
    
    // 尝试解析响应数据
    let responseData;
    try {
      responseData = JSON.parse(responseText);
      console.log(`解析后的响应数据:`, responseData);
    } catch (parseError) {
      console.log("解析响应数据失败:", parseError);
      responseData = {};
    }
    
    // 设置为未连接状态
    isDcyqConnected.value = false;
    
    // 显示提示信息
    if (response.ok && responseData.success) {
      ElMessage.success("断开碘采样器连接成功");
    } else {
      const errorMsg = responseData.message || responseData.msg || "断开碘采样器连接失败";
      ElMessage.error(errorMsg);
    }
  } catch (error) {
    console.log("捕获到异常:", error);
    // 发生异常时，也设置为未连接状态
    isDcyqConnected.value = false;
    // 显示错误提示
    const errorMsg = error instanceof Error ? error.message : "断开碘采样器连接异常";
    ElMessage.error(errorMsg);
  } finally {
    isDcyqDisconnecting.value = false;
    console.log("断开连接操作完成");
  }
};

// 切换碘采样器连接状态方法
const toggleDcyqSamplerConnection = async () => {
  if (isDcyqConnected.value) {
    await disconnectDcyqSampler();
  } else {
    await connectDcyqSampler();
  }
};

// 碘化钠谱仪连接方法
const connectDhnSampler = async () => {
  // 防止重复点击
  if (isDhnConnecting.value || isDhnDisconnecting.value) return;
  
  isDhnConnecting.value = true;
  
  try {
    // 使用代理后的路径，通过Vite代理服务器发送请求，解决跨域问题
    const apiUrl = "/api/devices/connect";
    const requestBody = {
      deviceId: "DHN-001"
    };
    
    console.log(`API URL: ${apiUrl}`);
    console.log(`请求参数: ${JSON.stringify(requestBody)}`);
    console.log("准备发送请求...");
    
    // 设置请求超时
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10秒超时
    
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal // 添加信号以支持超时
    });
    
    clearTimeout(timeoutId); // 清除超时
    
    console.log(`请求响应状态: ${response.status} ${response.statusText}`);
    
    // 尝试读取响应文本
    const responseText = await response.text();
    console.log(`响应文本: ${responseText}`);
    
    // 尝试解析响应数据
    let responseData;
    try {
      responseData = JSON.parse(responseText);
      console.log(`解析后的响应数据:`, responseData);
    } catch (parseError) {
      console.log("解析响应数据失败:", parseError);
      // 解析失败时，认为连接失败
      isDhnConnected.value = false;
      return;
    }
    
    // 根据响应数据设置连接状态
    // 检查响应是否成功，并且responseData.success为true
    if (response.ok && responseData.success) {
      console.log("响应成功");
      isDhnConnected.value = true;
      
      // 建立 EventSource 连接，监听碘化钠谱仪数据
      try {
        const sseUrl = "/api/sse/dianhn";
        dhnEventSource.value = new EventSource(sseUrl);
        
        // 监听设备数据事件
        dhnEventSource.value.addEventListener('device.data', (event) => {
          try {
            console.log("原始碘化钠谱仪数据:", event.data);
            console.log("数据长度:", event.data.length);
            console.log("数据前100个字符:", event.data.substring(0, 100));
            console.log("数据后100个字符:", event.data.substring(event.data.length - 100));
            
            // 尝试去除可能的BOM字符
            let cleanData = event.data.replace(/^\ufeff/, '');
            
            // 修复常见的JSON格式错误
            // 1. 修复缺少闭合引号的问题
            cleanData = cleanData.replace(/"deviceId":\s*"([^"]*),/g, '"deviceId": "$1",');
            // 2. 修复奇怪的字符
            cleanData = cleanData.replace(/\x00/g, '0');
            
            // 尝试解析JSON
            const data = JSON.parse(cleanData);
            console.log("收到碘化钠谱仪数据:", data);
            
            // 处理气溶胶开关状态
            if (data.aerosol_state !== undefined) {
              naiStore.updateAerosolState(Number(data.aerosol_state));
            }
            // 处理γ累积剂量
            if (data.gamma_accumulated_dose !== undefined) {
              naiStore.updateGammaTotalDose(Number(data.gamma_accumulated_dose));
            }
            // 处理能谱累积时间
            if (data.spectrum_accumulated_time !== undefined) {
              naiStore.updateSpectrumAccumSeconds(Number(data.spectrum_accumulated_time));
            }
            // 处理瞬时CPS
            if (data.instant_cps !== undefined) {
              naiStore.updateCps(Number(data.instant_cps));
            }
            // 处理谱仪工作状态
            if (data.spectrometer_state !== undefined) {
              naiStore.updateWorkStatus(Number(data.spectrometer_state));
            }
            // 处理γ剂量率
            if (data.gamma_dose_rate !== undefined) {
              naiStore.updateGammaDoseRate(Number(data.gamma_dose_rate));
            }
          } catch (error) {
            console.error("解析碘化钠谱仪数据失败:", error);
            console.error("失败的原始数据:", event.data);
            console.error("数据编码:", encodeURIComponent(event.data));
            
            // 显示数据解析失败的详细原因
            ElMessage.error(`碘化钠谱仪数据解析失败: ${error instanceof Error ? error.message : '未知错误'}`);
            
            // 尝试使用更宽松的解析方法
            try {
              // 尝试使用eval作为最后的手段（仅用于调试）
              console.log("尝试使用eval解析...");
              const evalData = eval('(' + event.data + ')');
              console.log("eval解析成功:", evalData);
              
              // 处理气溶胶开关状态
              if (evalData.aerosol_state !== undefined) {
                naiStore.updateAerosolState(Number(evalData.aerosol_state));
              }
              // 处理γ累积剂量
              if (evalData.gamma_accumulated_dose !== undefined) {
                naiStore.updateGammaTotalDose(Number(evalData.gamma_accumulated_dose));
              }
              // 处理能谱累积时间
              if (evalData.spectrum_accumulated_time !== undefined) {
                naiStore.updateSpectrumAccumSeconds(Number(evalData.spectrum_accumulated_time));
              }
              // 处理瞬时CPS
              if (evalData.instant_cps !== undefined) {
                naiStore.updateCps(Number(evalData.instant_cps));
              }
              // 处理谱仪工作状态
              if (evalData.spectrometer_state !== undefined) {
                naiStore.updateWorkStatus(Number(evalData.spectrometer_state));
              }
              // 处理γ剂量率
              if (evalData.gamma_dose_rate !== undefined) {
                naiStore.updateGammaDoseRate(Number(evalData.gamma_dose_rate));
              }
            } catch (evalError) {
              console.error("eval解析也失败:", evalError);
              ElMessage.error(`碘化钠谱仪数据解析失败（尝试修复后）: ${evalError instanceof Error ? evalError.message : '未知错误'}`);
            }
          }
        });
        
        // 监听连接错误
        dhnEventSource.value.addEventListener('error', (error) => {
          console.error("碘化钠谱仪 EventSource 连接错误:", error);
          ElMessage.error(`碘化钠谱仪数据连接失败: ${error instanceof Error ? error.message : '连接被关闭或网络错误'}`);
          if (dhnEventSource.value) {
            dhnEventSource.value.close();
            dhnEventSource.value = null;
          }
        });
        
        console.log("碘化钠谱仪 EventSource 连接建立成功");
        
        // 建立能谱数据 EventSource 连接
        try {
          const spectrumSseUrl = "/api/sse/dianhn/spectrum";
          dhnSpectrumEventSource.value = new EventSource(spectrumSseUrl);
          
          // 监听能谱数据事件
          dhnSpectrumEventSource.value.addEventListener('device.data', (event) => {
            try {
              console.log("原始能谱数据:", event.data);
              console.log("能谱数据长度:", event.data.length);
              console.log("能谱数据前100个字符:", event.data.substring(0, 100));
              console.log("能谱数据后100个字符:", event.data.substring(event.data.length - 100));
              
              // 尝试去除可能的BOM字符
              let cleanData = event.data.replace(/^\ufeff/, '');
              
              // 修复常见的JSON格式错误
              // 1. 修复缺少闭合引号的问题
              cleanData = cleanData.replace(/"deviceId":\s*"([^"]*),/g, '"deviceId": "$1",');
              // 2. 修复奇怪的字符
              cleanData = cleanData.replace(/\x00/g, '0');
              // 3. 修复其他可能的格式问题
              cleanData = cleanData.replace(/([\w_]+):\s*(\d+)/g, '"$1": $2');
              cleanData = cleanData.replace(/([\w_]+):\s*"([^"]*)"/g, '"$1": "$2"');
              // 4. 确保JSON格式正确
              try {
                JSON.parse(cleanData);
              } catch (e) {
                console.log("初步清洗后仍然解析失败，尝试更严格的清洗...");
                // 尝试使用更宽松的解析方法
                try {
                  // 移除所有非ASCII字符
                  cleanData = cleanData.replace(/[\x00-\x1F\x7F]/g, '');
                  // 确保所有键都有引号
                  cleanData = cleanData.replace(/([^"\s]+):/g, '"$1":');
                } catch (e2) {
                  console.log("严格清洗也失败");
                }
              }
              
              // 尝试解析JSON
              const data = JSON.parse(cleanData);
              console.log("收到能谱数据:", data);
              
              // 更新能谱数据到store
              naiStore.updateSpectrumData(data);
            } catch (error) {
              console.error("解析能谱数据失败:", error);
              console.error("失败的原始能谱数据:", event.data);
              console.error("能谱数据编码:", encodeURIComponent(event.data));
              
              // 显示数据解析失败的详细原因
              ElMessage.error(`能谱数据解析失败: ${error instanceof Error ? error.message : '未知错误'}`);
              
              // 尝试使用更宽松的解析方法
              try {
                // 尝试使用eval作为最后的手段（仅用于调试）
                console.log("尝试使用eval解析能谱数据...");
                const evalData = eval('(' + event.data + ')');
                console.log("eval解析能谱数据成功:", evalData);
                
                // 更新能谱数据到store
                naiStore.updateSpectrumData(evalData);
              } catch (evalError) {
                console.error("eval解析能谱数据也失败:", evalError);
                ElMessage.error(`能谱数据解析失败（尝试修复后）: ${evalError instanceof Error ? evalError.message : '未知错误'}`);
              }
            }
          });
          
          // 监听能谱数据连接错误
          dhnSpectrumEventSource.value.addEventListener('error', (error) => {
            console.error("能谱数据 EventSource 连接错误:", error);
            ElMessage.error(`能谱数据连接失败: ${error instanceof Error ? error.message : '连接被关闭或网络错误'}`);
            if (dhnSpectrumEventSource.value) {
              dhnSpectrumEventSource.value.close();
              dhnSpectrumEventSource.value = null;
            }
          });
          
          console.log("能谱数据 EventSource 连接建立成功");
        } catch (error) {
          console.error("建立能谱数据 EventSource 连接失败:", error);
          ElMessage.error(`建立能谱数据监听连接失败: ${error instanceof Error ? error.message : '未知错误'}`);
          // 即使能谱数据监听失败，连接状态仍然保持为成功
        }
        
        // 显示成功提示
        ElMessage.success("连接碘化钠谱仪成功并开始获取数据");
      } catch (error) {
        console.error("建立碘化钠谱仪 EventSource 连接失败:", error);
        ElMessage.error(`建立碘化钠谱仪数据监听连接失败: ${error instanceof Error ? error.message : '未知错误'}`);
        // 即使数据监听失败，连接状态仍然保持为成功
      }
    } else {
      console.log("响应失败");
      isDhnConnected.value = false;
      // 显示详细的错误提示
      const errorMsg = responseData.message || responseData.msg || "连接碘化钠谱仪失败";
      ElMessage.error(`连接碘化钠谱仪失败: ${errorMsg}`);
    }
  } catch (error) {
    console.log("捕获到异常:", error);
    // 发生异常时，设置为未连接状态
    isDhnConnected.value = false;
    // 显示错误提示
    const errorMsg = error instanceof Error ? error.message : "连接碘化钠谱仪异常";
    ElMessage.error(errorMsg);
  } finally {
    isDhnConnecting.value = false;
    console.log("连接操作完成");
  }
};

// 碘化钠谱仪断开连接方法
const disconnectDhnSampler = async () => {
  // 防止重复点击
  if (isDhnConnecting.value || isDhnDisconnecting.value) return;
  
  isDhnDisconnecting.value = true;
  
  try {
    // 使用代理后的路径，通过Vite代理服务器发送请求，解决跨域问题
    const apiUrl = "/api/devices/disconnect";
    const requestBody = {
      deviceId: "DHN-001"
    };
    
    console.log(`API URL: ${apiUrl}`);
    console.log(`请求参数: ${JSON.stringify(requestBody)}`);
    console.log("准备发送请求...");
    
    // 设置请求超时
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10秒超时
    
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal // 添加信号以支持超时
    });
    
    clearTimeout(timeoutId); // 清除超时
    
    console.log(`请求响应状态: ${response.status} ${response.statusText}`);
    
    // 尝试读取响应文本
    const responseText = await response.text();
    console.log(`响应文本: ${responseText}`);
    
    // 尝试解析响应数据
    let responseData;
    try {
      responseData = JSON.parse(responseText);
      console.log(`解析后的响应数据:`, responseData);
    } catch (parseError) {
      console.log("解析响应数据失败:", parseError);
      responseData = {};
    }
    
    // 设置为未连接状态
    isDhnConnected.value = false;
    
    // 关闭 EventSource 连接
    if (dhnEventSource.value) {
      dhnEventSource.value.close();
      dhnEventSource.value = null;
      console.log("碘化钠谱仪 EventSource 连接已关闭");
    }
    
    // 关闭能谱数据 EventSource 连接
    if (dhnSpectrumEventSource.value) {
      dhnSpectrumEventSource.value.close();
      dhnSpectrumEventSource.value = null;
      console.log("能谱数据 EventSource 连接已关闭");
    }

    // 重置Store状态
    naiStore.resetStatus();
    
    // 显示提示信息
    if (response.ok && responseData.success) {
      ElMessage.success("断开碘化钠谱仪连接成功");
    } else {
      const errorMsg = responseData.message || responseData.msg || "断开碘化钠谱仪连接失败";
      ElMessage.error(errorMsg);
    }
  } catch (error) {
    console.log("捕获到异常:", error);
    // 发生异常时，也设置为未连接状态
    isDhnConnected.value = false;
    
    // 关闭 EventSource 连接
    if (dhnEventSource.value) {
      dhnEventSource.value.close();
      dhnEventSource.value = null;
      console.log("碘化钠谱仪 EventSource 连接已关闭");
    }
    
    // 关闭能谱数据 EventSource 连接
    if (dhnSpectrumEventSource.value) {
      dhnSpectrumEventSource.value.close();
      dhnSpectrumEventSource.value = null;
      console.log("能谱数据 EventSource 连接已关闭");
    }
    
    // 显示错误提示
    const errorMsg = error instanceof Error ? error.message : "断开碘化钠谱仪连接异常";
    ElMessage.error(errorMsg);
  } finally {
    isDhnDisconnecting.value = false;
    console.log("断开连接操作完成");
  }
};

// 切换碘化钠谱仪连接状态方法
const toggleDhnSamplerConnection = async () => {
  if (isDhnConnected.value) {
    await disconnectDhnSampler();
  } else {
    await connectDhnSampler();
  }
};

// 高压电离室连接方法
const connectGydlsSampler = async () => {
  // 防止重复点击
  if (isGydlsConnecting.value || isGydlsDisconnecting.value) return;
  
  isGydlsConnecting.value = true;
  
  try {
    // 使用代理后的路径，通过Vite代理服务器发送请求，解决跨域问题
    const apiUrl = "/api/devices/connect";
    const requestBody = {
      deviceId: "GYDLS-001"
    };
    
    console.log(`API URL: ${apiUrl}`);
    console.log(`请求参数: ${JSON.stringify(requestBody)}`);
    console.log("准备发送请求...");
    
    // 设置请求超时
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10秒超时
    
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal // 添加信号以支持超时
    });
    
    clearTimeout(timeoutId); // 清除超时
    
    console.log(`请求响应状态: ${response.status} ${response.statusText}`);
    
    // 尝试读取响应文本
    const responseText = await response.text();
    console.log(`响应文本: ${responseText}`);
    
    // 尝试解析响应数据
    let responseData;
    try {
      responseData = JSON.parse(responseText);
      console.log(`解析后的响应数据:`, responseData);
    } catch (parseError) {
      console.log("解析响应数据失败:", parseError);
      // 解析失败时，认为连接失败
      isGydlsConnected.value = false;
      return;
    }
    
    // 根据响应数据设置连接状态
    // 检查响应是否成功，并且responseData.success为true
    if (response.ok && responseData.success) {
      console.log("响应成功");
      isGydlsConnected.value = true;
      // 显示成功提示
      ElMessage.success("连接高压电离室成功");
    } else {
      console.log("响应失败");
      isGydlsConnected.value = false;
      // 显示详细的错误提示
      const errorMsg = responseData.message || responseData.msg || "连接高压电离室失败";
      ElMessage.error(`连接高压电离室失败: ${errorMsg}`);
    }
  } catch (error) {
    console.log("捕获到异常:", error);
    // 发生异常时，设置为未连接状态
    isGydlsConnected.value = false;
    // 显示错误提示
    const errorMsg = error instanceof Error ? error.message : "连接高压电离室异常";
    ElMessage.error(errorMsg);
  } finally {
    isGydlsConnecting.value = false;
    console.log("连接操作完成");
  }
};

// 高压电离室断开连接方法
const disconnectGydlsSampler = async () => {
  // 防止重复点击
  if (isGydlsConnecting.value || isGydlsDisconnecting.value) return;
  
  isGydlsDisconnecting.value = true;
  
  try {
    // 使用代理后的路径，通过Vite代理服务器发送请求，解决跨域问题
    const apiUrl = "/api/devices/disconnect";
    const requestBody = {
      deviceId: "GYDLS-001"
    };
    
    console.log(`API URL: ${apiUrl}`);
    console.log(`请求参数: ${JSON.stringify(requestBody)}`);
    console.log("准备发送请求...");
    
    // 设置请求超时
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10秒超时
    
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal // 添加信号以支持超时
    });
    
    clearTimeout(timeoutId); // 清除超时
    
    console.log(`请求响应状态: ${response.status} ${response.statusText}`);
    
    // 尝试读取响应文本
    const responseText = await response.text();
    console.log(`响应文本: ${responseText}`);
    
    // 尝试解析响应数据
    let responseData;
    try {
      responseData = JSON.parse(responseText);
      console.log(`解析后的响应数据:`, responseData);
    } catch (parseError) {
      console.log("解析响应数据失败:", parseError);
      responseData = {};
    }
    
    // 设置为未连接状态
    isGydlsConnected.value = false;
    
    // 显示提示信息
    if (response.ok && responseData.success) {
      ElMessage.success("断开高压电离室连接成功");
    } else {
      const errorMsg = responseData.message || responseData.msg || "断开高压电离室连接失败";
      ElMessage.error(errorMsg);
    }
  } catch (error) {
    console.log("捕获到异常:", error);
    // 发生异常时，也设置为未连接状态
    isGydlsConnected.value = false;
    // 显示错误提示
    const errorMsg = error instanceof Error ? error.message : "断开高压电离室连接异常";
    ElMessage.error(errorMsg);
  } finally {
    isGydlsDisconnecting.value = false;
    console.log("断开连接操作完成");
  }
};

// 切换高压电离室连接状态方法
const toggleGydlsSamplerConnection = async () => {
  if (isGydlsConnected.value) {
    await disconnectGydlsSampler();
  } else {
    await connectGydlsSampler();
  }
};
// 组件卸载时关闭所有连接
onUnmounted(() => {
  if (weatherStationEventSource.value) {
    weatherStationEventSource.value.close();
    weatherStationEventSource.value = null;
  }
  if (dhnEventSource.value) {
    dhnEventSource.value.close();
    dhnEventSource.value = null;
  }
  if (eventSource.value) {
    eventSource.value.close();
    eventSource.value = null;
  }
  console.log("组件卸载，已关闭所有 EventSource 连接");
});
</script>

<template>
  <el-drawer v-model="settingStore.settingShow" direction="rtl" size="360px">
    <template #header>
      <h2 class="setting-title">设置</h2>
    </template>
    <template #default>
      <div class="left_shu">全局设置</div>
      <div class="setting_item">
        <span class="setting_label">
          是否进行自动适配<span class="setting_label_tip"
            >(默认分辨率1920*1080)</span
          >:
        </span>
        <div class="setting_content">
          <el-radio-group v-model="isScaleRadio" @change="(flag)=>isScaleChange(flag as boolean)">
            <el-radio :label="true">是</el-radio>
            <el-radio :label="false">否</el-radio>
          </el-radio-group>
        </div>
      </div>
      <div class="left_shu">实时监测</div>
      <div class="setting_item">
        <span class="setting_label">
          设备提醒自动轮询: <span class="setting_label_tip"></span>
        </span>
        <div class="setting_content">
          <el-radio-group
            v-model="leftBottomRadio"
            @change="(flag)=>indexRadioChange(flag as boolean)"
          >
            <el-radio :label="true">是</el-radio>
            <el-radio :label="false">否</el-radio>
          </el-radio-group>
        </div>
      </div>
      <div class="setting_item">
        <span class="setting_label"> 实时预警轮播: </span>
        <div class="setting_content">
          <el-radio-group
            v-model="rightBottomRadio"
            @change="(flag)=>indexRadioChange(flag as boolean)"
          >
            <el-radio :label="true">是</el-radio>
            <el-radio :label="false">否</el-radio>
          </el-radio-group>
        </div>
      </div>

      <!-- 设备管理模块 -->
      <div class="left_shu">设备管理</div>
      <div class="device-management">
        <div class="device-item">
          <div class="device-name">气象站</div>
          <div class="device-control">
            <button 
              class="device-switch" 
              :class="{ 'on': isConnected, 'loading': isConnecting || isDisconnecting }"
              :disabled="isConnecting || isDisconnecting"
              @click="toggleWeatherStationConnection"
            >
              <span class="switch-label">
                {{ isConnecting ? '连接中...' : isDisconnecting ? '断开中...' : isConnected ? '开' : '关' }}
              </span>
            </button>
          </div>
        </div>
        
        <!-- 温湿度传感器组 -->
        <div class="device-item">
          <div class="device-name">温湿度传感器组</div>
          <div class="device-control">
            <button 
              class="device-switch" 
              :class="{ 'on': allWsdConnected, 'loading': isAnyWsdLoading }"
              :disabled="isAnyWsdLoading"
              @click="toggleAllWsdSensors"
            >
              <span class="switch-label">
                {{ isAnyWsdLoading ? '操作中...' : allWsdConnected ? '开' : '关' }}
              </span>
            </button>
          </div>
        </div>
        

        
        <!-- 超大流量采样器 -->
        <div class="device-item">
          <div class="device-name">超大流量采样器</div>
          <div class="device-control">
            <button 
              class="device-switch" 
              :class="{ 'on': isCdllConnected, 'loading': isCdllConnecting || isCdllDisconnecting }"
              :disabled="isCdllConnecting || isCdllDisconnecting"
              @click="toggleCdllSamplerConnection"
            >
              <span class="switch-label">
                {{ isCdllConnecting ? '连接中...' : isCdllDisconnecting ? '断开中...' : isCdllConnected ? '开' : '关' }}
              </span>
            </button>
          </div>
        </div>
        
        <!-- 干湿沉降采样器 -->
        <div class="device-item">
          <div class="device-name">干湿沉降采样器</div>
          <div class="device-control">
            <button 
              class="device-switch" 
              :class="{ 'on': isGscjConnected, 'loading': isGscjConnecting || isGscjDisconnecting }"
              :disabled="isGscjConnecting || isGscjDisconnecting"
              @click="toggleGscjSamplerConnection"
            >
              <span class="switch-label">
                {{ isGscjConnecting ? '连接中...' : isGscjDisconnecting ? '断开中...' : isGscjConnected ? '开' : '关' }}
              </span>
            </button>
          </div>
        </div>
        
        <!-- 碘采样器 -->
        <div class="device-item">
          <div class="device-name">碘采样器</div>
          <div class="device-control">
            <button 
              class="device-switch" 
              :class="{ 'on': isDcyqConnected, 'loading': isDcyqConnecting || isDcyqDisconnecting }"
              :disabled="isDcyqConnecting || isDcyqDisconnecting"
              @click="toggleDcyqSamplerConnection"
            >
              <span class="switch-label">
                {{ isDcyqConnecting ? '连接中...' : isDcyqDisconnecting ? '断开中...' : isDcyqConnected ? '开' : '关' }}
              </span>
            </button>
          </div>
        </div>
        
        <!-- 碘化钠谱仪 -->
        <div class="device-item">
          <div class="device-name">碘化钠谱仪</div>
          <div class="device-control">
            <button 
              class="device-switch" 
              :class="{ 'on': isDhnConnected, 'loading': isDhnConnecting || isDhnDisconnecting }"
              :disabled="isDhnConnecting || isDhnDisconnecting"
              @click="toggleDhnSamplerConnection"
            >
              <span class="switch-label">
                {{ isDhnConnecting ? '连接中...' : isDhnDisconnecting ? '断开中...' : isDhnConnected ? '开' : '关' }}
              </span>
            </button>
          </div>
        </div>
        
        <!-- 高压电离室 -->
        <div class="device-item">
          <div class="device-name">高压电离室</div>
          <div class="device-control">
            <button 
              class="device-switch" 
              :class="{ 'on': isGydlsConnected, 'loading': isGydlsConnecting || isGydlsDisconnecting }"
              :disabled="isGydlsConnecting || isGydlsDisconnecting"
              @click="toggleGydlsSamplerConnection"
            >
              <span class="switch-label">
                {{ isGydlsConnecting ? '连接中...' : isGydlsDisconnecting ? '断开中...' : isGydlsConnected ? '开' : '关' }}
              </span>
            </button>
          </div>
        </div>
      </div>
    </template>
    <!-- <template #footer>
      <div style="flex: auto">
        <el-button @click="cancelClick">取消</el-button>
        <el-button type="primary" @click="confirmClick">确定</el-button>
      </div>
    </template> -->
  </el-drawer>
</template>

<style scoped lang="scss">
.setting-title {
  font-size: 20px;
  color: #000;
  font-weight: 900;
  text-align: center;
  line-height: 1;
}
.left_shu {
  color: #000;
  font-weight: 900;
  position: relative;
  text-indent: 10px;
  padding: 16px 0 10px 0;
  line-height: 1;
  &::before {
    display: block;
    content: " ";
    height: 16px;
    width: 4px;
    border-radius: 2px;
    background: #0072ff;
    position: absolute;
    left: 0px;
  }
}

.left_shu.left_shu_with_btn {
  display: flex;
  align-items: center;
  justify-content: space-between;
  text-indent: 0;
  gap: 12px;
}

.left_shu_text {
  padding-left: 10px;
}

.left_shu_btn {
  height: 28px;
  padding: 0 12px;
  border-radius: 8px;
  border: 1px solid rgba(0, 0, 0, 0.12);
  background: rgba(0, 0, 0, 0.04);
  color: rgba(0, 0, 0, 0.72);
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
}

.left_shu_btn:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}
.setting_item {
  font-size: 14px;
  line-height: 1.5;

  // display: flex;
  .setting_label {
    color: #555454;
  }
  .setting_label_tip {
    font-size: 12px;
    color: #838282;
  }
}

.setting_item.full-bleed {
  margin-left: calc(var(--el-drawer-padding-primary, 20px) * -1);
  margin-right: calc(var(--el-drawer-padding-primary, 20px) * -1);
  width: calc(100% + var(--el-drawer-padding-primary, 20px) * 2);
  box-sizing: border-box;
  padding-left: var(--el-drawer-padding-primary, 20px);
  padding-right: var(--el-drawer-padding-primary, 20px);
}

/* 设备管理模块样式 */
.device-management {
  margin-top: 12px;
  padding: 16px;
  /* 移除外边框和背景板 */
  background: none;
  border-radius: 0;
  border: none;
  box-shadow: none;
}

.device-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
}

/* 温湿度传感器组样式 */
.wsd-sensor-group {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  margin: 8px 0;
}

.wsd-sensor-item {
  flex: 1;
  min-width: 200px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.wsd-sensor-item .device-name {
  font-size: 14px;
  color: #333;
  font-weight: 500;
}

.wsd-sensor-item .device-control {
  display: flex;
  justify-content: flex-start;
  align-items: center;
}

.device-name {
  font-size: 14px;
  color: #333;
  font-weight: 500;
}

.device-control {
  display: flex;
  align-items: center;
}

/* 设备开关样式，优化UI设计 */
.device-switch {
  width: 44px;
  height: 24px;
  border: none;
  border-radius: 12px;
  background: #e0e0e0;
  position: relative;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.device-switch::before {
  content: '';
  position: absolute;
  top: 2px;
  left: 2px;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #fff;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
}

/* 主状态 */
.device-switch.on {
  background: #409eff;
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.4);
}

.device-switch.on::before {
  left: 22px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

/* 悬停状态 */
.device-switch:hover:not(:disabled):not(.loading) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.device-switch.on:hover:not(:disabled):not(.loading) {
  background: #0072ff;
  box-shadow: 0 4px 12px rgba(0, 114, 255, 0.5);
}

/* 点击状态 */
.device-switch:active:not(:disabled):not(.loading) {
  transform: translateY(0);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.device-switch.on:active:not(:disabled):not(.loading) {
  background: #0056b3;
  box-shadow: 0 1px 3px rgba(0, 86, 179, 0.3);
}

/* 禁用状态 */
.device-switch:disabled {
  background: #c0c4cc;
  cursor: not-allowed;
  box-shadow: none;
}

.device-switch:disabled::before {
  background: #f5f7fa;
  box-shadow: none;
}

/* 加载状态 */
.device-switch.loading {
  background: #e0e0e0;
  cursor: not-allowed;
  box-shadow: none;
}

.device-switch.loading::before {
  animation: spin 1s linear infinite;
  background: #f5f7fa;
  box-shadow: none;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* 文字样式 */
.switch-label {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  font-size: 11px;
  font-weight: 600;
  color: #fff;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  /* 动态调整文字位置 */
  width: 20px;
  text-align: center;
}

/* 开状态文字位置 */
.device-switch.on .switch-label {
  left: 4px;
}

/* 关状态文字位置 */
.device-switch:not(.on) .switch-label {
  left: 20px;
  color: #606266;
  text-shadow: none;
}

/* 禁用状态文字颜色 */
.device-switch:disabled .switch-label {
  color: #909399;
}

/* 加载状态文字颜色 */
.device-switch.loading .switch-label {
  color: #909399;
}

/* 响应式调整 */
@media screen and (max-width: 480px) {
  .device-switch {
    width: 40px;
    height: 22px;
  }
  
  .device-switch::before {
    width: 18px;
    height: 18px;
  }
  
  .device-switch.on::before {
    left: 20px;
  }
  
  .switch-label {
    font-size: 10px;
    width: 18px;
  }
  
  .device-switch.on .switch-label {
    left: 3px;
  }
  
  .device-switch:not(.on) .switch-label {
    left: 18px;
  }
}

@media screen and (max-width: 360px) {
  .device-switch {
    width: 36px;
    height: 20px;
  }
  
  .device-switch::before {
    width: 16px;
    height: 16px;
  }
  
  .device-switch.on::before {
    left: 18px;
  }
  
  .switch-label {
    font-size: 9px;
    width: 16px;
  }
  
  .device-switch.on .switch-label {
    left: 2px;
  }
  
  .device-switch:not(.on) .switch-label {
    left: 16px;
  }
}




</style>
