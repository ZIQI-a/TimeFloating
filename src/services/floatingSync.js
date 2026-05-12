// 悬浮窗同步职责集中在这里，避免页面里同时维护 IPC 分发和状态映射。

export function openFloatingWindow(api, statePayload) {
  if (!api) return;
  api.openFloating(statePayload);
}

export function pushFloatingSnapshot(api, statePayload, tickPayload) {
  if (!api) return;
  // 动作发生后立即推一次完整快照和 tick，减少悬浮窗的等待时间。
  api.pushFloatingState(statePayload);
  api.pushTimerTick(tickPayload);
}

export function startFloatingTicker(api, getTickPayload, intervalMs = 80) {
  if (!api) return null;

  return setInterval(() => {
    api.pushTimerTick(getTickPayload());
  }, intervalMs);
}

export function stopFloatingTicker(timerId) {
  if (!timerId) return null;
  clearInterval(timerId);
  return null;
}

export function handleFloatingAction(action, handlers = {}) {
  const handler = handlers[action];
  if (typeof handler === "function") {
    handler();
    return true;
  }
  return false;
}
