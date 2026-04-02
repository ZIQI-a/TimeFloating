# 🕐 TimeFloating · 悬浮时钟

> 一款基于 Vue 3 + Vite + Electron 构建的桌面悬浮时钟应用，优先适配 macOS，后续支持 Windows。

---

## ✨ 项目简介

**TimeFloating** 是一款轻量、优雅的桌面时间工具。它以悬浮窗的形式常驻桌面，无论你在做什么，时间始终触手可及。除了实时时钟，还内置了秒表与倒计时（番茄钟）功能，帮助你更专注地管理时间。

应用采用双窗口架构：
- **主面板**：完整的控制与配置界面，左侧大字展示当前时间，右侧提供功能切换与个性化设置。
- **悬浮窗**：无边框透明胶囊小窗，可自由拖拽，支持锁定穿透模式，始终置顶显示在屏幕任意位置。

---

## 🗂️ 目录结构

```
floating-clock/
├── electron/
│   ├── main.js          # Electron 主进程（窗口管理、IPC、配置持久化）
│   └── preload.js       # 预加载脚本（安全暴露 electronAPI 给渲染进程）
├── src/
│   ├── views/
│   │   ├── MainPanel.vue       # 主面板页面
│   │   └── FloatingWindow.vue  # 悬浮时钟窗口页面
│   ├── utils/
│   │   └── time.js       # 秒表 / 倒计时格式化工具函数
│   ├── router/
│   │   └── index.js      # Vue Router（Hash 模式）
│   ├── App.vue
│   ├── main.js
│   └── style.css
├── test/
│   └── time.test.js      # 时间工具单元测试
├── public/
├── index.html
├── vite.config.js
└── package.json
```

---

## 🚀 技术栈

| 技术 | 版本 | 用途 |
|------|------|------|
| [Vue 3](https://vuejs.org/) | ^3.5 | 前端框架（Options API） |
| [Vite](https://vitejs.dev/) | ^7.3 | 构建工具 / 开发服务器 |
| [Electron](https://www.electronjs.org/) | ^41 | 桌面应用壳 |
| [Vue Router](https://router.vuejs.org/) | ^5.0 | 路由管理（主面板 / 悬浮窗） |
| [electron-builder](https://www.electron.build/) | ^26 | 应用打包与分发 |
| [concurrently](https://github.com/open-cli-tools/concurrently) | ^9 | 并发启动 Vite + Electron |

---

## ⚙️ 核心功能

### 🕰️ 时钟
- 实时显示当前时间，支持 12 / 24 小时制切换
- 显示完整日期和星期
- 可选毫秒（1位精度）显示
- 悬浮窗完全本地独立计时，不依赖主面板推送，彻底避免跳秒

### ⏱️ 秒表
- 开始 / 暂停 / 重置
- RAF（requestAnimationFrame）驱动，毫秒精度
- 悬浮窗本地推算，IPC 仅做状态校正

### ⏳ 倒计时 / 番茄钟
- 自由输入时、分、秒
- 快捷预设：🍅 25分钟 / ☕ 5分钟 / 🧘 10分钟
- 可选毫秒显示
- 精确按结束时间戳推导剩余时间，整点时刻（如 10:00.0）显示正确
- 最后 10 秒红色脉冲提醒

### 🎨 个性化设置
- 5 款渐变背景主题
- 字体切换：圆润（SF Pro Rounded）/ 等线（Mono）/ 衬线（Serif）
- 悬浮窗不透明度滑条（10%–100%，实时生效）

### 🪟 悬浮模式
- 无边框 + 透明背景，毛玻璃质感胶囊窗口
- 全局置顶，可关闭置顶开关
- **JS 拖拽**：主进程轮询系统光标坐标驱动移动，彻底避免透明窗口丢失鼠标事件
- **锁定模式**：点击锁定按钮后禁止拖拽，隐藏所有操作按钮，鼠标事件完全穿透到下层应用；鼠标悬停在锁定按钮上时自动恢复可点击，再次点击解锁
- **Hover 显示控制按钮**：鼠标移入悬浮窗时渐显操作按钮，移出后延迟隐藏

### 💾 配置持久化
- 用户设置（字体、主题、置顶、毫秒开关、悬浮窗透明度等）存储至 `~/.floating-clock-config.json`
- 应用启动时自动读取上次配置

---

## 🏗️ 架构说明

### 双窗口模型

```
主进程 (electron/main.js)
├── mainWindow     →  加载 /#/          (主面板)
└── floatingWindow →  加载 /#/floating  (悬浮窗)
```

两个渲染进程通过主进程的 **IPC** 协作，主面板是计时状态的唯一权威来源。

### IPC 事件总表

| IPC 事件 | 方向 | 说明 |
|----------|------|------|
| `open-floating` | 渲染 → 主 | 隐藏主窗口，创建悬浮窗，携带初始状态 |
| `close-floating` | 渲染 → 主 | 销毁悬浮窗，恢复主窗口 |
| `set-always-on-top` | 渲染 → 主 | 切换悬浮窗置顶状态 |
| `resize-floating` | 渲染 → 主 | 动态调整悬浮窗尺寸 |
| `push-floating-state` | 渲染 → 主 | 主面板推送完整状态快照（低频） |
| `get-floating-state` | 渲染 → 主（invoke） | 悬浮窗启动时读取初始状态 |
| `push-timer-tick` | 渲染 → 主 | 主面板推送高频实时计时数据（80ms） |
| `timer-tick` | 主 → 悬浮窗 | 转发实时 tick 给悬浮窗 |
| `state-update` | 主 → 悬浮窗 | 转发完整状态快照给悬浮窗 |
| `floating-action` | 双向 | 悬浮窗操作上报 / 主进程转发给主面板 |
| `save-settings` / `get-settings` | 渲染 → 主（invoke） | 配置持久化读写 |
| `start-drag` / `stop-drag` | 渲染 → 主 | 启动 / 停止主进程轮询拖拽 |
| `set-ignore-mouse-events` | 渲染 → 主 | 锁定模式鼠标穿透开关 |
| `set-floating-opacity` | 渲染 → 主 | 设置悬浮窗不透明度 |

### 计时同步策略

```
主面板（状态权威）
  ├── 低频快照（push-floating-state）  →  悬浮窗初始化 & 关键动作后校正
  └── 高频 tick（80ms interval）       →  同步运行标志、剩余时间基准

悬浮窗（本地乐观更新）
  ├── RAF 循环  →  按结束时间戳本地逐帧推导，不等 IPC
  └── tick 到达  →  仅在状态变化时才覆盖本地推算值
```

### macOS 原生特性
- `titleBarStyle: 'hiddenInset'`：隐藏标题栏，保留红绿灯按钮
- `vibrancy: 'fullscreen-ui'`：主面板原生毛玻璃背景
- 悬浮窗 `transparent: true` + `frame: false`
- `setIgnoreMouseEvents(ignore, { forward: true })`：锁定穿透 + 光标仍能触发渲染进程 mousemove

---

## 🛠️ 本地开发

### 环境要求

- Node.js >= 18
- macOS（主力适配平台）

### 安装依赖

```bash
cd floating-clock
npm install
```

### 启动开发模式

```bash
npm run electron:dev
```

> 并发启动 Vite 开发服务器（端口 5173）和 Electron，等待 Vite 就绪后自动打开应用窗口。

### 运行单元测试

```bash
npm test
```

### 仅启动 Web 预览

```bash
npm run dev
```

---

## 📦 打包构建

```bash
npm run electron:build
```

构建产物输出至 `dist-electron/` 目录：

| 平台 | 格式 |
|------|------|
| macOS | `.dmg` + `.zip` |
| Windows | `.exe`（NSIS 安装包）+ 便携版 |

---

## 🗺️ 开发路线图

- [x] 主面板双栏布局（时钟 + 控制区）
- [x] 悬浮窗（无边框、透明、毛玻璃胶囊）
- [x] 秒表 & 倒计时（RAF 精确毫秒）
- [x] 番茄钟快捷预设
- [x] 背景渐变主题切换（5 种）
- [x] 字体切换（圆润 / 等线 / 衬线）
- [x] 配置本地持久化
- [x] 悬浮窗 JS 拖拽（主进程光标轮询，解决透明窗口事件丢失）
- [x] 锁定穿透模式（鼠标直接操作下层应用）
- [x] 悬浮窗 Hover 显示操作按钮
- [x] 悬浮窗不透明度实时调节
- [x] 倒计时整点时刻精确显示修复
- [x] macOS 原生毛玻璃 + 标题栏适配
- [ ] 秒表计次记录
- [ ] 系统通知（倒计时结束）
- [ ] macOS 菜单栏图标模式
- [ ] 数字翻页动画
- [ ] Windows 平台适配与测试
- [ ] 多语言支持（中文 / 英文）

---

## 📄 License

MIT © TimeFloating


| 视图 | 描述 |
|------|------|
| 时钟模式 | 左侧大字时钟 + 右侧日期/24小时制开关 |
| 秒表模式 | 支持毫秒显示，一键开始/重置 |
| 倒计时模式 | 滚轮选时 + 提醒设置 |
| 主题设置 | 文本色/背景色滑块、动画效果、字体选择 |

---

## 🗂️ 目录结构

```
floating-clock/
├── electron/
│   ├── main.js          # Electron 主进程（窗口管理、IPC、配置持久化）
│   └── preload.js       # 预加载脚本（安全暴露 electronAPI 给渲染进程）
├── src/
│   ├── views/
│   │   ├── MainPanel.vue       # 主面板页面
│   │   └── FloatingWindow.vue  # 悬浮时钟窗口页面
│   ├── router/
│   │   └── index.js     # Vue Router（Hash 模式）
│   ├── App.vue
│   ├── main.js
│   └── style.css
├── public/
├── index.html
├── vite.config.js
└── package.json
```

---

## 🚀 技术栈

| 技术 | 版本 | 用途 |
|------|------|------|
| [Vue 3](https://vuejs.org/) | ^3.5 | 前端框架（Options API） |
| [Vite](https://vitejs.dev/) | ^7.3 | 构建工具 / 开发服务器 |
| [Electron](https://www.electronjs.org/) | ^41 | 桌面应用壳 |
| [Vue Router](https://router.vuejs.org/) | ^5.0 | 路由管理（主面板 / 悬浮窗） |
| [electron-builder](https://www.electron.build/) | ^26 | 应用打包与分发 |
| [concurrently](https://github.com/open-cli-tools/concurrently) | ^9 | 并发启动 Vite + Electron |

---

## ⚙️ 核心功能

### 🕰️ 时钟
- 实时显示当前时间（24小时制）
- 显示完整日期和星期
- 等宽数字字体，防止秒跳动时界面抖动

### ⏱️ 秒表
- 开始 / 暂停 / 重置
- 支持毫秒精度显示

### ⏳ 倒计时 / 番茄钟
- 自由输入时、分、秒
- 快捷预设：🍅 25分钟 / ☕ 5分钟 / 🧘 10分钟
- 倒计时结束提醒

### 🎨 个性化设置
- 多款渐变背景主题（5种预设色）
- 字体切换：Geometric / Dot Matrix / 系统字体
- 文本色 / 背景色自定义（设计稿阶段）
- 系统主题跟随 / 数字动画效果（规划中）

### 🪟 悬浮模式
- 无边框 + 透明背景，毛玻璃质感
- 全局置顶，覆盖任意窗口
- 支持「贴顶模式」开关
- 一键在主面板与悬浮窗之间切换

### 💾 配置持久化
- 使用 Node.js `fs` 模块将用户设置存储至本地 JSON 文件（`~/.floating-clock-config.json`）
- 应用启动时自动读取上次配置

---

## 🏗️ 架构说明

### 双窗口模型

```
主进程 (electron/main.js)
├── mainWindow    →  加载 /#/        (主面板)
└── floatingWindow →  加载 /#/floating (悬浮窗)
```

两个窗口通过 **IPC（进程间通信）** 协作：

| IPC 事件 | 方向 | 说明 |
|----------|------|------|
| `open-floating` | 渲染 → 主 | 隐藏主窗口，创建悬浮窗 |
| `close-floating` | 渲染 → 主 | 销毁悬浮窗，恢复主窗口 |
| `set-always-on-top` | 渲染 → 主 | 切换悬浮窗置顶状态 |
| `save-settings` | 渲染 → 主 | 持久化用户配置 |
| `get-settings` | 渲染 → 主 | 读取已保存配置 |

### macOS 原生特性
- `titleBarStyle: 'hiddenInset'`：隐藏标题栏，保留红绿灯按钮
- `vibrancy: 'fullscreen-ui'`：原生毛玻璃背景效果
- 透明窗口背景（`transparent: true`）
- `-webkit-app-region: drag` 实现窗口拖拽区域

---

## 🛠️ 本地开发

### 环境要求

- Node.js >= 18
- macOS（主力适配平台）

### 安装依赖

```bash
cd floating-clock
npm install
```

### 启动开发模式

```bash
npm run electron:dev
```

> 该命令会并发启动 Vite 开发服务器（端口 5173）和 Electron，并在 Vite 服务就绪后自动打开应用窗口。

### 仅启动 Web 预览

```bash
npm run dev
```

---

## 📦 打包构建

```bash
npm run electron:build
```

构建产物输出至 `dist-electron/` 目录：

| 平台 | 格式 |
|------|------|
| macOS | `.dmg` + `.zip` |
| Windows | `.exe`（NSIS 安装包）+ 便携版 |

---

## 🗺️ 开发路线图

- [x] 主面板双栏布局（时钟 + 控制区）
- [x] 悬浮窗（无边框、透明、置顶）
- [x] 倒计时 / 番茄钟（预设快捷键）
- [x] 背景渐变主题切换
- [x] 配置本地持久化
- [x] macOS 原生毛玻璃 + 标题栏适配
- [ ] 秒表功能完善（计次记录）
- [ ] 自定义颜色选择器
- [ ] 数字动画效果（翻页 / 渐变）
- [ ] 系统通知支持（倒计时结束）
- [ ] 菜单栏图标（macOS Menu Bar）
- [ ] Windows 平台适配与测试
- [ ] 多语言支持（中文 / 英
文）

---

## 📄 License

MIT © TimeFloating