const path = require("path");
const { Menu, Tray } = require("electron");

// 菜单栏模式由主进程统一维护，避免渲染层直接控制应用生命周期。
let tray = null;

function getTrayImage() {
  // 使用标准 Template 素材路径，让 macOS 按原生菜单栏图标规则布局。
  return path.join(__dirname, "../public/trayTemplate.png");
}

function buildTrayMenu(handlers) {
  return Menu.buildFromTemplate([
    {
      label: "显示主面板",
      click: handlers.showMainWindow,
    },
    {
      label: "显示悬浮窗",
      click: handlers.showFloatingWindow,
    },
    {
      type: "separator",
    },
    {
      label: "退出",
      click: handlers.quitApp,
    },
  ]);
}

function createTray(handlers) {
  if (tray) return tray;

  tray = new Tray(getTrayImage());
  tray.setToolTip("浮光时钟");
  tray.setContextMenu(buildTrayMenu(handlers));

  // 左键点击直接切回主面板，符合菜单栏工具的常见交互。
  tray.on("click", handlers.toggleMainWindow);
  return tray;
}

function destroyTray() {
  if (!tray) return;
  tray.destroy();
  tray = null;
}

function hasTray() {
  return !!tray;
}

module.exports = {
  createTray,
  destroyTray,
};
