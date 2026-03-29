const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const fs = require("fs");
const os = require("os");

// ── 配置持久化 ────────────────────────────────────────────────────────────────
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
    font: "Rounded",
    background: "gradient-1",
    muteSound: false,
    alwaysOnTop: true,
    showDate: true,
    hour24: true,
    showMs: true,
  };
}

// ── 悬浮窗状态缓存（主进程做中转）────────────────────────────────────────────
// 由主面板在"开启悬浮模式"前写入，悬浮窗启动后读取
let floatingStateCache = {
  mode: "clock", // 'clock' | 'stopwatch' | 'countdown'
  settings: {}, // 同步自主面板 settings
};

// ── 窗口尺寸配置 ──────────────────────────────────────────────────────────────
const FLOATING_SIZES = {
  clock: { width: 280, height: 130 },
  stopwatch: { width: 280, height: 130 },
  countdown: { width: 280, height: 130 },
};

// ── 窗口引用 ──────────────────────────────────────────────────────────────────
let mainWindow = null;
let floatingWindow = null;

function notifyFloatingClosed() {
  if (mainWindow && mainWindow.webContents) {
    mainWindow.webContents.send("floating-action", "close");
    mainWindow.show();
  }
}

// ── 创建主窗口 ────────────────────────────────────────────────────────────────
function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1000,
    height: 700,
    minWidth: 900,
    minHeight: 650,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
    titleBarStyle: "hiddenInset",
    vibrancy: "fullscreen-ui",
    backgroundColor: "#00000000",
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

// ── 创建悬浮窗 ────────────────────────────────────────────────────────────────
function createFloatingWindow() {
  if (floatingWindow) {
    floatingWindow.show();
    return;
  }

  const config = loadConfig();
  const alwaysOnTop =
    config.alwaysOnTop !== undefined ? config.alwaysOnTop : true;
  const mode = floatingStateCache.mode || "clock";
  const size = FLOATING_SIZES[mode] || FLOATING_SIZES.clock;

  floatingWindow = new BrowserWindow({
    width: size.width,
    height: size.height,
    frame: false,
    transparent: true,
    alwaysOnTop: alwaysOnTop,
    resizable: false,
    skipTaskbar: true,
    hasShadow: false,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (process.env.VITE_DEV_SERVER_URL) {
    floatingWindow.loadURL(process.env.VITE_DEV_SERVER_URL + "#/floating");
  } else {
    floatingWindow.loadFile(path.join(__dirname, "../dist/index.html"), {
      hash: "floating",
    });
  }

  floatingWindow.on("closed", () => {
    floatingWindow = null;
    notifyFloatingClosed();
  });
}

// ── IPC：开启悬浮窗（主面板携带状态）────────────────────────────────────────
ipcMain.on("open-floating", (_event, floatingState) => {
  // 缓存主面板传来的模式和设置
  if (floatingState) {
    floatingStateCache = { ...floatingStateCache, ...floatingState };
  }
  if (mainWindow) {
    mainWindow.hide();
  }
  createFloatingWindow();
});

// ── IPC：关闭悬浮窗 ───────────────────────────────────────────────────────────
ipcMain.on("close-floating", () => {
  if (floatingWindow) {
    floatingWindow.close();
    floatingWindow = null;
  } else {
    notifyFloatingClosed();
  }
});

// ── IPC：设置置顶 ─────────────────────────────────────────────────────────────
ipcMain.on("set-always-on-top", (_event, flag) => {
  if (floatingWindow) {
    floatingWindow.setAlwaysOnTop(flag);
  }
});

// ── IPC：动态调整悬浮窗尺寸 ──────────────────────────────────────────────────
ipcMain.on("resize-floating", (_event, width, height) => {
  if (floatingWindow) {
    floatingWindow.setSize(width, height);
  }
});

// ── IPC：主面板缓存悬浮状态（开启前调用）────────────────────────────────────
ipcMain.on("push-floating-state", (_event, state) => {
  floatingStateCache = { ...floatingStateCache, ...state };
  // 如果悬浮窗已开着，直接推送更新
  if (floatingWindow && floatingWindow.webContents) {
    floatingWindow.webContents.send("state-update", floatingStateCache);
  }
});

// ── IPC：悬浮窗读取初始状态 ──────────────────────────────────────────────────
ipcMain.handle("get-floating-state", () => {
  return floatingStateCache;
});

// ── IPC：主面板推送计时器实时数据 → 转发给悬浮窗 ────────────────────────────
ipcMain.on("push-timer-tick", (_event, data) => {
  if (floatingWindow && floatingWindow.webContents) {
    floatingWindow.webContents.send("timer-tick", data);
  }
});

// ── IPC：悬浮窗操作（开始/暂停/重置）→ 转发给主面板 ────────────────────────
ipcMain.on("floating-action", (_event, action) => {
  if (mainWindow && mainWindow.webContents) {
    mainWindow.webContents.send("floating-action", action);
  }
});

// ── IPC：保存配置 ─────────────────────────────────────────────────────────────
ipcMain.handle("save-settings", (_event, settings) => {
  const success = saveConfig(settings);
  return { success };
});

// ── IPC：读取配置 ─────────────────────────────────────────────────────────────
ipcMain.handle("get-settings", () => {
  return loadConfig();
});

// ── 应用生命周期 ──────────────────────────────────────────────────────────────
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
