const { contextBridge, ipcRenderer } = require("electron");

// 暴露安全的 API 给渲染进程
contextBridge.exposeInMainWorld("electronAPI", {
  // 窗口控制
  openFloating: (floatingState) =>
    ipcRenderer.send("open-floating", floatingState),
  closeFloating: () => ipcRenderer.send("close-floating"),
  setAlwaysOnTop: (flag) => ipcRenderer.send("set-always-on-top", flag),
  resizeFloating: (width, height) =>
    ipcRenderer.send("resize-floating", width, height),

  // 数据持久化
  saveSettings: (settings) => ipcRenderer.invoke("save-settings", settings),
  getSettings: () => ipcRenderer.invoke("get-settings"),

  // 悬浮窗状态同步：主面板 → 悬浮窗
  // 主面板调用此方法把最新状态写入 main 进程缓存
  pushFloatingState: (state) => ipcRenderer.send("push-floating-state", state),

  // 悬浮窗读取主面板传来的初始状态
  getFloatingState: () => ipcRenderer.invoke("get-floating-state"),

  // 悬浮窗操作 → 主进程转发给主面板（用于秒表/倒计时控制）
  floatingAction: (action) => ipcRenderer.send("floating-action", action),

  // 监听主进程推送过来的状态更新（悬浮窗订阅）
  onStateUpdate: (callback) => {
    ipcRenderer.on("state-update", (_event, state) => callback(state));
  },

  // 监听主面板发来的计时器实时数据（悬浮窗订阅）
  onTimerTick: (callback) => {
    ipcRenderer.on("timer-tick", (_event, data) => callback(data));
  },

  // 主面板推送计时器实时数据给悬浮窗
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
});
