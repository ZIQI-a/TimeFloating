const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const { initConfigStore, loadConfig, saveConfig } = require("./configStore.cjs");
const { notifyCountdownFinished } = require("./notificationService.cjs");
const { createTray, destroyTray } = require("./trayService.cjs");

// ── 悬浮窗状态缓存（主进程做中转）────────────────────────────────────────────
// 由主面板在"开启悬浮模式"前写入，悬浮窗启动后读取
let floatingStateCache = {
  mode: "clock", // 'clock' | 'stopwatch' | 'countdown'
  settings: {}, // 同步自主面板 settings
};

// ── 窗口尺寸配置（初始值，渲染后由 resize-floating 精确调整）────────────────
const FLOATING_SIZES = {
  clock: { width: 320, height: 150 },
  stopwatch: { width: 320, height: 150 },
  countdown: { width: 320, height: 150 },
};

// ── 窗口引用 ──────────────────────────────────────────────────────────────────
let mainWindow = null;
let floatingWindow = null;

function notifyFloatingClosed() {
  if (mainWindow && mainWindow.webContents) {
    mainWindow.webContents.send("floating-action", "close");
    showMainWindow();
  }
}

function syncDockVisibility() {
  if (process.platform !== "darwin" || !app.dock) return;

  const shouldShowDock = !!(
    mainWindow &&
    !mainWindow.isDestroyed() &&
    mainWindow.isVisible()
  );

  if (!shouldShowDock) {
    app.dock.hide();
    return;
  }

  app.dock.show();
}

function showMainWindow() {
  if (!mainWindow) {
    createMainWindow();
    return;
  }

  if (mainWindow.isMinimized()) {
    mainWindow.restore();
  }
  mainWindow.show();
  mainWindow.focus();
}

function toggleMainWindow() {
  if (!mainWindow) {
    createMainWindow();
    return;
  }

  if (mainWindow.isVisible()) {
    mainWindow.hide();
    return;
  }

  showMainWindow();
}

function showFloatingWindowFromTray() {
  if (floatingWindow) {
    floatingWindow.show();
    return;
  }

  createFloatingWindow();
}

function quitAppFromTray() {
  app.isQuitting = true;
  app.quit();
}

function initMenuBarApp() {
  createTray({
    showMainWindow,
    toggleMainWindow,
    showFloatingWindow: showFloatingWindowFromTray,
    quitApp: quitAppFromTray,
  });
  syncDockVisibility();
}

// ── 创建主窗口 ────────────────────────────────────────────────────────────────
function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1000,
    height: 700,
    minWidth: 900,
    minHeight: 650,
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
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
    syncDockVisibility();
  });

  // macOS 下点击红色关闭按钮时不退出应用，只隐藏到菜单栏中。
  mainWindow.on("close", (event) => {
    if (process.platform !== "darwin" || app.isQuitting) return;
    event.preventDefault();
    mainWindow.hide();
  });

  // 主窗口显示时恢复 Dock，隐藏时只保留菜单栏入口。
  mainWindow.on("show", syncDockVisibility);
  mainWindow.on("hide", syncDockVisibility);
  mainWindow.on("minimize", syncDockVisibility);
  mainWindow.on("restore", syncDockVisibility);
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
      preload: path.join(__dirname, "preload.cjs"),
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
// ── IPC：设置悬浮窗不透明度 ────────────────────────────────────────────
ipcMain.on("set-floating-opacity", (_event, opacity) => {
  if (floatingWindow) {
    floatingWindow.setOpacity(Math.min(1, Math.max(0.1, opacity)));
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
  // 主进程只做中转和缓存，不在这里派生业务状态。
  // 这样悬浮窗重开时可以直接取到最近一次主面板快照。
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
  // tick 不入缓存，只做瞬时转发。
  // 计时器的长期恢复依赖 floatingStateCache，而不是最后一帧 tick。
  if (floatingWindow && floatingWindow.webContents) {
    floatingWindow.webContents.send("timer-tick", data);
  }
});

// ── IPC：悬浮窗手动拖拽 ─────────────────────────────────────────────────────
let dragStartPos = null;
let dragStartBounds = null;
let dragInterval = null;

ipcMain.on("start-drag", () => {
  if (!floatingWindow) return;
  const { screen } = require("electron");
  const cursor = screen.getCursorScreenPoint();
  const bounds = floatingWindow.getBounds();
  dragStartPos = cursor;
  dragStartBounds = bounds;

  // 用主进程轮询鼠标位置来驱动拖拽，避免渲染进程在透明窗口丢失鼠标事件
  if (dragInterval) clearInterval(dragInterval);
  dragInterval = setInterval(() => {
    if (!floatingWindow || !dragStartPos) {
      clearInterval(dragInterval);
      dragInterval = null;
      return;
    }
    const cur = screen.getCursorScreenPoint();
    const dx = cur.x - dragStartPos.x;
    const dy = cur.y - dragStartPos.y;
    floatingWindow.setBounds({
      x: dragStartBounds.x + dx,
      y: dragStartBounds.y + dy,
      width: dragStartBounds.width,
      height: dragStartBounds.height,
    });
  }, 16);
});

ipcMain.on("stop-drag", () => {
  dragStartPos = null;
  dragStartBounds = null;
  if (dragInterval) {
    clearInterval(dragInterval);
    dragInterval = null;
  }
});

// ── IPC：锁定模式鼠标穿透 ────────────────────────────────────────────────────
ipcMain.on("set-ignore-mouse-events", (_event, ignore) => {
  if (!floatingWindow) return;
  floatingWindow.setIgnoreMouseEvents(ignore, { forward: true });
});

// ── IPC：悬浮窗操作（开始/暂停/重置）→ 转发给主面板 ────────────────────────
ipcMain.on("floating-action", (_event, action) => {
  // 悬浮窗不直接改主进程缓存，只上报动作给主面板处理。
  // 这样业务逻辑仍集中在主面板，避免多处同时维护计时状态。
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

// ── IPC：倒计时完成通知 ─────────────────────────────────────────────────────
ipcMain.handle("notify-countdown-finished", (_event, payload = {}) => {
  return notifyCountdownFinished(payload);
});

// ── 应用生命周期 ──────────────────────────────────────────────────────────────
app.whenReady().then(async () => {
  // 先初始化配置存储，再创建窗口，保证窗口启动时就能读取到稳定配置。
  await initConfigStore();
  initMenuBarApp();
  createMainWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    destroyTray();
    app.quit();
  }
});
