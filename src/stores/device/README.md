# 设备管理 Store 接口文档

## 概述

设备管理 Store 提供了设备连接和断开的核心功能，包括单个设备操作和批量设备操作。本文档详细说明所有公开接口的使用方法和参数说明。

## 核心接口

### 1. connectAll

**功能**：建立所有目标设备的连接

**参数**：无

**返回值**：
```typescript
{
  total: number;      // 总设备数
  success: number;    // 成功连接的设备数
  failed: number;     // 连接失败的设备数
  details: Array<{    // 详细连接结果
    id: string;       // 设备ID
    name: string;     // 设备名称
    success: boolean; // 是否连接成功
    error?: string;   // 错误信息（如果失败）
  }>;
}
```

**功能特性**：
- 自动过滤离线设备，只连接在线设备
- 处理连接序列和状态管理
- 实现30秒超时设置
- 支持部分成功的情况处理
- 完善的错误处理和日志记录

### 2. disconnectAll

**功能**：安全地断开所有已连接设备的连接

**参数**：无

**返回值**：
```typescript
{
  total: number;      // 总设备数
  success: number;    // 成功断开的设备数
  failed: number;     // 断开失败的设备数
  details: Array<{    // 详细断开结果
    id: string;       // 设备ID
    name: string;     // 设备名称
    success: boolean; // 是否断开成功
    error?: string;   // 错误信息（如果失败）
  }>;
}
```

**功能特性**：
- 只处理已连接的设备
- 确保资源被正确释放
- 实现30秒超时设置
- 支持部分成功的情况处理
- 完善的错误处理和日志记录

### 3. connectDevice

**功能**：连接单个设备（通过批量接口实现）

**参数**：
- `id: string` - 设备ID
- `options?: { silent?: boolean }` - 可选参数，silent为true时不显示消息提示

**返回值**：
- `boolean` - 连接是否成功

### 4. disconnectDevice

**功能**：断开单个设备的连接（通过批量接口实现）

**参数**：
- `id: string` - 设备ID
- `options?: { silent?: boolean }` - 可选参数，silent为true时不显示消息提示

**返回值**：
- `boolean` - 断开是否成功

### 5. discoverDevices

**功能**：发现和更新设备列表

**参数**：无

**返回值**：无

### 6. 状态管理

**公开状态**：
- `devices: DeviceItem[]` - 设备列表
- `loadingList: boolean` - 设备列表加载状态
- `bulkWorking: boolean` - 批量操作（连接/断开所有）的工作状态

**DeviceItem 类型**：
```typescript
{
  id: string;                  // 设备ID
  name: string;                // 设备名称
  status: DeviceConnectionStatus; // 设备连接状态
  lastError?: string;          // 最后一次错误信息
}
```

**DeviceConnectionStatus 类型**：
```typescript
type DeviceConnectionStatus =
  | "offline"      // 离线
  | "online"       // 在线
  | "connecting"   // 连接中
  | "connected"    // 已连接
  | "disconnecting" // 断开中
  | "error";       // 错误
```

## 错误处理

所有接口都实现了完善的错误处理机制：

1. **超时处理**：所有批量操作都有30秒的超时设置
2. **错误记录**：所有错误都会被记录到设备的lastError字段
3. **日志记录**：所有操作都会在控制台输出详细的日志信息
4. **消息提示**：操作结果会通过ElMessage组件显示给用户
5. **部分成功处理**：支持部分设备成功、部分设备失败的情况

## 使用示例

### 示例1：批量连接所有设备

```typescript
import { useDeviceStore } from '@/stores/device/device';

const deviceStore = useDeviceStore();

async function connectAllDevices() {
  const result = await deviceStore.connectAll();
  console.log(`连接结果：成功 ${result.success} 个，失败 ${result.failed} 个`);
  
  // 处理部分成功的情况
  if (result.success > 0 && result.failed > 0) {
    console.log('部分设备连接成功，失败设备：');
    result.details.forEach(d => {
      if (!d.success) {
        console.log(`${d.name}: ${d.error}`);
      }
    });
  }
}
```

### 示例2：批量断开所有设备

```typescript
import { useDeviceStore } from '@/stores/device/device';

const deviceStore = useDeviceStore();

async function disconnectAllDevices() {
  const result = await deviceStore.disconnectAll();
  console.log(`断开结果：成功 ${result.success} 个，失败 ${result.failed} 个`);
}
```

### 示例3：单个设备操作

```typescript
import { useDeviceStore } from '@/stores/device/device';

const deviceStore = useDeviceStore();

async function toggleDevice(id: string, status: string) {
  if (status === 'connected') {
    const result = await deviceStore.disconnectDevice(id);
    console.log(`断开设备 ${id}：${result ? '成功' : '失败'}`);
  } else {
    const result = await deviceStore.connectDevice(id);
    console.log(`连接设备 ${id}：${result ? '成功' : '失败'}`);
  }
}
```

## 注意事项

1. **批量操作优先**：所有设备操作都通过批量接口实现，确保操作的一致性和可靠性
2. **状态管理**：操作过程中会自动管理设备状态，确保UI显示正确
3. **错误处理**：调用方应适当处理接口返回的错误情况
4. **性能优化**：批量操作已优化，支持同时处理多个设备
5. **向后兼容**：保持了与原有接口的兼容性，对外API行为一致
