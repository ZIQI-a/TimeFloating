
const { contextBridge, ipcRenderer } = require('electron');

// 暴露安全的 API 给渲染进程
contextBridge.exposeInMainWorld('electronAPI', {
  // 窗口控制
  openFloating: () => ipcRenderer.send('open-floating'),
  closeFloating: () => ipcRenderer.send('close-floating'),
  setAlwaysOnTop: (flag) => ipcRenderer.send('set-always-on-top', flag),
  
  // 数据持久化
  saveSettings: (settings) => ipcRenderer.invoke('save-settings', settings),
  getSettings: () => ipcRenderer.invoke('get-settings')
});
