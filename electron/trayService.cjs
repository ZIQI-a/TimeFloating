const { Menu, Tray, nativeImage } = require("electron");

// 菜单栏模式由主进程统一维护，避免渲染层直接控制应用生命周期。
let tray = null;

function getTrayImage() {
  // 直接在主进程生成模板图标，避免开发态读取 icns 失败，也更符合 macOS 菜单栏样式。
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 18 18">
      <g fill="none" stroke="#000" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="9" cy="9" r="6.25"/>
        <path d="M9 5.5v4l2.5 1.5"/>
      </g>
    </svg>
  `;
  const image = nativeImage.createFromDataURL(
    `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`,
  );
  image.setTemplateImage(true);
  return image;
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
