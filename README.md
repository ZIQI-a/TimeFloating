# 🕐 TimeFloating · 悬浮时钟

> 一款基于 Vue 3 + Vite + Electron 构建的桌面悬浮时钟应用，当前以 macOS 为主力适配平台。

---

## ✨ 项目简介

**TimeFloating** 是一个轻量的桌面时间工具，提供主面板、悬浮窗和菜单栏入口三种使用形态：

- **主面板**：完整设置与操作入口
- **悬浮窗**：透明置顶小窗，适合常驻桌面
- **菜单栏入口**：关闭主界面后仍可从菜单栏重新打开应用

应用内置时钟、秒表、倒计时三种核心模式，强调简洁、低打扰和桌面常驻体验。

---

## 🚀 技术栈

| 技术 | 版本 | 用途 |
|------|------|------|
| [Vue 3](https://vuejs.org/) | ^3.5 | 前端框架 |
| [Vite](https://vitejs.dev/) | ^7.3 | 构建工具 |
| [Electron](https://www.electronjs.org/) | ^41 | 桌面应用 |
| [Vue Router](https://router.vuejs.org/) | ^5.0 | 路由管理 |
| [electron-builder](https://www.electron.build/) | ^26 | 应用打包 |

---

## ⚙️ 核心功能

### 🕰️ 时钟
- 实时显示当前时间
- 支持 12 / 24 小时制
- 支持日期、星期、毫秒显示
- 悬浮窗独立刷新，减少跳秒感

![时钟界面](public/introImg/time.png)

### ⏱️ 秒表
- 开始 / 暂停 / 重置
- 毫秒级显示
- 主面板与悬浮窗状态同步

![秒表界面](public/introImg/second.png)

### ⏳ 倒计时 / 番茄钟
- 自由输入时、分、秒
- 支持 25 / 5 / 10 分钟快捷预设
- 倒计时结束可发送系统通知
- 支持静默通知

![倒计时界面](public/introImg/daojishi.png)

### 🎨 个性化设置
- 5 款渐变背景主题
- 自定义背景图片
- 字体切换
- 悬浮窗不透明度调节

### 🪟 悬浮模式
- 无边框透明窗口
- 始终置顶
- 自适应窗口宽度
- 支持拖拽
- 支持锁定穿透
- Hover 显示控制按钮

![悬浮窗界面](public/introImg/float.png)

### 🍎 菜单栏模式
- 应用启动后菜单栏图标常驻
- 主界面点击红色关闭按钮后仅隐藏，不退出应用
- 主界面隐藏后 Dock 图标自动隐藏
- 可通过菜单栏重新打开主界面或悬浮窗

### 💾 配置持久化
- 使用本地配置存储保存设置
- 启动后自动恢复上次配置
- 兼容旧版 JSON 配置迁移

---

## 🏗️ 架构说明

### 双窗口模型

```text
主进程 (electron/main.cjs)
├── mainWindow     →  加载 /#/          (主面板)
└── floatingWindow →  加载 /#/floating  (悬浮窗)
```

### IPC 通信

- 主面板是计时状态的权威来源
- 悬浮窗负责轻量展示和局部交互
- 高频 tick 用于显示同步
- 低频快照用于状态恢复与校正

### 主进程能力

- 配置存储
- 系统通知
- 菜单栏托盘
- 窗口生命周期控制

---

## 🛠️ 本地开发

### 环境要求

- Node.js >= 20
- macOS

### 安装运行

```bash
cd floating-clock
npm install
npm run electron:dev
```

### 测试

```bash
npm test
```

---

## 📦 打包构建

```bash
npm run electron:build
```

| 平台 | 格式 |
|------|------|
| macOS | `.dmg` + `.zip` |
| Windows | `.exe`（NSIS）+ 便携版 |

---

## 📚 文档说明

- [README](./README.md)：项目介绍、功能说明、运行方式
- [优化规划](./优化规划.md)：优化记录、阶段进展、后续方向

---

## 📄 License

MIT © TimeFloating
