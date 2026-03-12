"use strict";
const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const fs = require("fs");
const os = require("os");
const configPath = path.join(os.homedir(), ".floating-clock-config.json");
function saveConfig(data) {
  try {
    fs.writeFileSync(configPath, JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error("保存配置失败:", error);
    return false;
  }
}
function loadConfig() {
  try {
    if (fs.existsSync(configPath)) {
      return JSON.parse(fs.readFileSync(configPath, "utf8"));
    }
  } catch (error) {
    console.error("读取配置失败:", error);
  }
  return {
    font: "Geometric",
    background: "gradient-1",
    muteSound: false
  };
}
let mainWindow = null;
let floatingWindow = null;
function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1e3,
    height: 700,
    minWidth: 900,
    minHeight: 650,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false
    },
    titleBarStyle: "default",
    // macOS 默认标题栏
    vibrancy: "under-window",
    // macOS 毛玻璃效果
    backgroundColor: "#00000000"
  });
  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, "../dist/index.html"));
  }
  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}
function createFloatingWindow() {
  if (floatingWindow) {
    floatingWindow.show();
    return;
  }
  floatingWindow = new BrowserWindow({
    width: 280,
    height: 80,
    frame: false,
    // 无边框
    transparent: true,
    // 透明背景
    alwaysOnTop: true,
    // 始终置顶
    resizable: false,
    skipTaskbar: true,
    // 不显示在任务栏
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false
    }
  });
  if (process.env.VITE_DEV_SERVER_URL) {
    floatingWindow.loadURL(process.env.VITE_DEV_SERVER_URL + "#/floating");
  } else {
    floatingWindow.loadFile(path.join(__dirname, "../dist/index.html"), {
      hash: "floating"
    });
  }
  floatingWindow.on("closed", () => {
    floatingWindow = null;
  });
}
ipcMain.on("open-floating", () => {
  if (mainWindow) {
    mainWindow.hide();
  }
  createFloatingWindow();
});
ipcMain.on("close-floating", () => {
  if (floatingWindow) {
    floatingWindow.close();
    floatingWindow = null;
  }
  if (mainWindow) {
    mainWindow.show();
  }
});
ipcMain.on("set-always-on-top", (event, flag) => {
  if (floatingWindow) {
    floatingWindow.setAlwaysOnTop(flag);
  }
});
ipcMain.handle("save-settings", (event, settings) => {
  const success = saveConfig(settings);
  return { success };
});
ipcMain.handle("get-settings", () => {
  return loadConfig();
});
app.whenReady().then(() => {
  createMainWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });
});
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
