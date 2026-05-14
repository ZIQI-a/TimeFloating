const { Notification } = require("electron");

// 桌面通知统一收口到主进程服务，便于后续接托盘、提醒类型和统计埋点。
function notifyCountdownFinished({
  title = "浮光时钟",
  body = "倒计时已结束",
  silent = false,
} = {}) {
  if (!Notification || typeof Notification.isSupported !== "function") {
    return { success: false, reason: "unavailable" };
  }

  if (!Notification.isSupported()) {
    return { success: false, reason: "unsupported" };
  }

  try {
    const notification = new Notification({
      title,
      body,
      silent,
    });
    notification.show();
    return { success: true };
  } catch (error) {
    console.error("发送系统通知失败:", error);
    return { success: false, reason: "error" };
  }
}

module.exports = {
  notifyCountdownFinished,
};
