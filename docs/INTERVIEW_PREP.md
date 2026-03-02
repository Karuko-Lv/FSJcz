# 前端面试常见问题与项目实战映射 (Interview Preparation)

本文档整理了针对 **Vue 3 + TS** 技术栈的常见面试题，并指出了答案在本项目中的具体代码位置，帮助你结合实战进行回答。

---

## 1. Vue 3 框架相关

### Q: Vue 3 的 Composition API 和 Vue 2 的 Options API 有什么区别？
**参考回答思路**: 
Composition API 能够更好地组织逻辑（Logical Concern），方便代码复用（Hooks），且对 TypeScript 支持更友好。
**代码映射**:
*   对比 [`src/views/HomeView.vue`](../src/views/HomeView.vue) (Composition API)。所有的逻辑（状态、方法、生命周期）都写在 `<script setup>` 中，而不是分散在 `data`, `methods`, `mounted` 选项里。

### Q: `ref` 和 `reactive` 有什么区别？什么时候用哪个？
**参考回答思路**:
*   `ref` 用于基本数据类型（也可以用于对象，会自动包裹 reactive），在 JS 中需要 `.value` 访问。
*   `reactive` 用于对象引用类型，不需要 `.value`。
**代码映射**:
*   查看 [`src/stores/device/device.ts`](../src/stores/device/device.ts)：`const devices = ref<Device[]>(...)` 使用了 `ref`。

### Q: Vue 3 的生命周期钩子有哪些？
**参考回答思路**:
`setup` (取代 beforeCreate, created) -> `onMounted` -> `onUpdated` -> `onUnmounted`。
**代码映射**:
*   搜索项目中使用的 `onMounted`（通常用于初始化数据获取）。

---

## 2. 工程化与构建 (Vite & TS)

### Q: 为什么选择 Vite 而不是 Webpack？
**参考回答思路**:
Vite 开发环境下使用 ES Modules 原生加载，无需打包，启动极快；生产环境使用 Rollup 打包。
**代码映射**:
*   [`vite.config.ts`](../vite.config.ts) 展示了 Vite 的简洁配置。

### Q: TypeScript 中的 `interface` 和 `type` 区别？
**参考回答思路**:
大部分情况通用。`interface` 可以合并（Declaration Merging），`type` 可以定义基本类型别名、联合类型。
**代码映射**:
*   查看 [`src/api/modules/device.ts`](../src/api/modules/device.ts) 或 `types/` 目录下的定义。

---

## 3. 状态管理 (Pinia)

### Q: Pinia 和 Vuex 的区别？
**参考回答思路**:
Pinia 去掉了 mutations，只有 state, getters, actions；对 TS 支持极好；体积更小；支持多 Store 自动拆分。
**代码映射**:
*   查看 [`src/stores/device/device.ts`](../src/stores/device/device.ts)，可以看到直接在 `actions` 中修改 `state`，无需 mutation。

---

## 4. 网络请求 (Axios)

### Q: 你们是如何封装 Axios 的？
**参考回答思路**:
创建 axios 实例，设置 baseURL 和超时时间；配置请求拦截器（加 Token）；配置响应拦截器（解包数据，全局错误处理）。
**代码映射**:
*   **核心代码**: [`src/api/api.ts`](../src/api/api.ts)。详细阅读拦截器部分的逻辑。

### Q: 遇到跨域问题怎么解决？
**参考回答思路**:
开发环境使用 Vite/Webpack 的 proxy 代理；生产环境通常由 Nginx 反向代理或后端开启 CORS。
**代码映射**:
*   [`vite.config.ts`](../vite.config.ts) 中的 `server.proxy` 配置：
    ```typescript
    '/api': {
      target: 'http://192.168.1.233:8080',
      changeOrigin: true
    }
    ```

---

## 5. 组件与通信

### Q: 父子组件如何通信？
**参考回答思路**:
Props (父传子), Emits (子传父), Provide/Inject (跨层级), Pinia (全局状态), Refs (父调子方法)。
**代码映射**:
*   查找 `defineProps` 和 `defineEmits` 的使用。

---

## 6. 简历亮点 (结合本项目)

在简历或面试中，你可以这样描述这个项目经验：

*   **项目描述**: 基于 Vue 3 + TypeScript + Vite 构建的环境监测管理系统。
*   **你的职责**:
    1.  使用 **Pinia** 实现了设备状态的全局管理，解决了多组件间设备状态同步的问题。
    2.  封装了基于 **Axios** 的网络请求模块，统一处理了接口的防抖、错误提示和 Token 校验。
    3.  使用 **ECharts** 完成了环境数据的实时可视化大屏展示。
    4.  通过 **Tailwind CSS** 实现了原子化样式开发，提升了 30% 的 UI 开发效率。
