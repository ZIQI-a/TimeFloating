const { contextBridge, ipcRenderer } = require("electron");

// 预加载层只暴露白名单 API。
// 渲染进程不直接接触 ipcRenderer，避免把 Electron 能力无约束地下放到页面里。
contextBridge.exposeInMainWorld("electronAPI", {
  // 窗口控制
  openFloating: (floatingState) =>
    ipcRenderer.send("open-floating", floatingState),
  closeFloating: () => ipcRenderer.send("close-floating"),
  setAlwaysOnTop: (flag) => ipcRenderer.send("set-always-on-top", flag),
  setFloatingOpacity: (opacity) => ipcRenderer.send("set-floating-opacity", opacity),
  resizeFloating: (width, height) =>
    ipcRenderer.send("resize-floating", width, height),

  // 数据持久化
  saveSettings: (settings) => ipcRenderer.invoke("save-settings", settings),
  getSettings: () => ipcRenderer.invoke("get-settings"),

  // 主面板完整状态快照：既写入主进程缓存，也可转发给已打开的悬浮窗
  pushFloatingState: (state) => ipcRenderer.send("push-floating-state", state),

  // 悬浮窗读取主面板传来的初始状态
  getFloatingState: () => ipcRenderer.invoke("get-floating-state"),

  // 悬浮窗操作 → 主进程转发给主面板（用于秒表/倒计时控制）
  floatingAction: (action) => ipcRenderer.send("floating-action", action),

  // 监听主进程推送过来的状态更新（悬浮窗订阅）
  onStateUpdate: (callback) => {
    ipcRenderer.on("state-update", (_event, state) => callback(state));
  },

  // 高频实时 tick：只负责同步正在变化的显示数据
  onTimerTick: (callback) => {
    ipcRenderer.on("timer-tick", (_event, data) => callback(data));
  },

  // 主面板主动推送高频 tick
  pushTimerTick: (data) => ipcRenderer.send("push-timer-tick", data),

  // 悬浮窗操作 → 主面板（主进程转发过来的指令）
  onFloatingAction: (callback) => {
    ipcRenderer.removeAllListeners("floating-action");
    ipcRenderer.on("floating-action", (_event, action) => callback(action));
  },

  // 移除监听（防止内存泄漏）
  removeStateUpdateListener: () =>
    ipcRenderer.removeAllListeners("state-update"),
  removeTimerTickListener: () => ipcRenderer.removeAllListeners("timer-tick"),
  removeFloatingActionListener: () =>
    ipcRenderer.removeAllListeners("floating-action"),

  // 悬浮窗手动拖拽（替代 -webkit-app-region: drag，避免吞掉鼠标事件）
  startDrag: () => ipcRenderer.send("start-drag"),
  stopDrag: () => ipcRenderer.send("stop-drag"),

  // 鼠标穿透（锁定模式）
  setIgnoreMouseEvents: (ignore) => ipcRenderer.send("set-ignore-mouse-events", ignore),
});
