# 项目前端技术栈学习指南 (Project Learning Guide)

本指南旨在帮助你系统地掌握 FSJcz 项目所使用的前端技术栈，并为相关岗位的求职面试做准备。项目采用了 **Vue 3 + TypeScript + Vite** 的现代化架构，是目前市场上极具竞争力的技术组合。

---

## 🚀 1. 项目技术全景 (Tech Stack Overview)

在面试中，当被问及“你熟悉哪些技术”或“介绍一下你的项目”时，可以自信地列出以下技术栈：

| 领域 | 技术选型 | 版本 | 核心价值 |
| :--- | :--- | :--- | :--- |
| **核心框架** | **Vue 3** | ^3.4 | 使用 Composition API (`<script setup>`)，性能更强，代码复用性更好。 |
| **编程语言** | **TypeScript** | ^5.4 | 提供静态类型检查，增强代码健壮性和可维护性。 |
| **构建工具** | **Vite** | ^5.2 | 极速冷启动和热更新，替代传统的 Webpack。 |
| **状态管理** | **Pinia** | ^2.1 | Vue 官方推荐的新一代状态管理库，替代 Vuex。 |
| **路由系统** | **Vue Router** | ^4.3 | 处理单页应用 (SPA) 的页面跳转与权限控制。 |
| **UI 组件库** | **Element Plus** | ^2.6 | 基于 Vue 3 的企业级中后台组件库。 |
| **CSS 方案** | **Tailwind CSS** + SCSS | ^3.4 | 原子化 CSS (Utility-first) 结合 预处理器，提高样式开发效率。 |
| **HTTP 请求** | **Axios** | ^1.6 | 统一封装的 HTTP 客户端，处理拦截器、Token 等。 |
| **数据可视化** | **ECharts** | ^5.5 | 处理复杂的数据图表展示。 |

---

## 📚 2. 分阶段学习路径 (Learning Path)

请按照以下顺序阅读源码并实践，每个阶段都对应了面试中的高频考点。

### 第一阶段：工程化与构建基础
**目标**：理解项目是如何跑起来的。

*   **入口文件**: 
    *   阅读 [`src/main.ts`](../src/main.ts)：看到 Vue 应用的创建、Pinia/Router 的挂载、全局样式的引入。
    *   阅读 [`index.html`](../index.html)：Vite 项目的 HTML 入口。
*   **Vite 配置**: 
    *   阅读 [`vite.config.ts`](../vite.config.ts)：
        *   **Proxy**: 关注 `server.proxy`，理解开发环境如何解决跨域问题（反向代理到 `192.168.1.233`）。
        *   **Alias**: 关注 `resolve.alias`，理解 `@` 符号是如何指向 `src` 目录的。
        *   **Auto Import**: 关注 `plugins` 中的 `AutoImport` 和 `Components`，理解为什么在组件中不需要手动 import `ref` 或 `ElButton`。

### 第二阶段：Vue 3 核心语法 (Composition API)
**目标**：掌握 `<script setup>` 模式。

*   **组件结构**: 
    *   阅读 [`src/App.vue`](../src/App.vue) 和 [`src/views/HomeView.vue`](../src/views/HomeView.vue)。
    *   **响应式数据**: 找到使用 `ref` (基本类型) 和 `reactive` (对象类型) 的地方。
    *   **生命周期**: 搜索 `onMounted`，理解组件挂载时的数据初始化逻辑。
    *   **组件通信**: 查找 `defineProps` (父传子) 和 `defineEmits` (子传父) 的用法。

### 第三阶段：状态管理 (Pinia)
**目标**：理解数据流向。

*   **Store 定义**: 
    *   阅读 [`src/stores/device/device.ts`](../src/stores/device/device.ts)。
    *   **State**: 类似组件的 `data`，存储全局状态（如设备列表）。
    *   **Getters**: 类似组件的 `computed`，对状态进行计算。
    *   **Actions**: 类似组件的 `methods`，包含业务逻辑和异步请求（如 `connectAll`）。
*   **面试点**: 能够解释为什么把设备连接逻辑放在 Store 里而不是组件里（为了逻辑复用和状态共享）。

### 第四阶段：UI 开发与样式
**目标**：构建像素级还原的界面。

*   **Tailwind CSS**: 
    *   在组件的 `class` 中看到如 `flex items-center justify-between` 这样的类名，查询 Tailwind 文档理解其含义。
*   **Element Plus**: 
    *   查看 [`src/components/device-management/device-management.vue`](../src/components/device-management/device-management.vue)，学习如何使用 `el-table`, `el-button` 等组件。

### 第五阶段：网络请求 (Axios)
**目标**：前后端交互。

*   **封装逻辑**: 
    *   阅读 [`src/api/api.ts`](../src/api/api.ts)。
    *   **拦截器**: 理解 `service.interceptors.request` (请求头加 Token) 和 `service.interceptors.response` (统一解包 data，处理错误)。
*   **API 模块**: 
    *   阅读 [`src/api/modules/device.ts`](../src/api/modules/device.ts)，看如何定义具体的后端接口。

---

## 💡 3. 如何使用本项目备战面试

1.  **动手修改**: 尝试修改 `UtilVar.ts` 中的 `baseUrl`，或者修改某个组件的样式，观察页面变化，验证你的理解。
2.  **模拟场景**: 假设面试官问“你是如何处理接口跨域的？”，你可以结合 `vite.config.ts` 中的 proxy 配置来回答。
3.  **阅读文档**: 遇到不懂的 API（如 `watchEffect`），直接去 Vue 3 官方文档查询。

祝你学习顺利，Offer 多多！
