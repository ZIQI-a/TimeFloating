// 倒计时的显示推导统一放在这里，避免主面板和悬浮窗各自维护边界规则。

export function getCountdownRemainingMs({
  hours = 0,
  minutes = 0,
  seconds = 0,
  ms = 0,
} = {}) {
  return Math.max(0, (hours * 3600 + minutes * 60 + seconds) * 1000 + ms);
}

export function deriveCountdownParts(remainingMs, options = {}) {
  const { excludeCurrentSecond = false } = options;
  const safeRemainingMs = Math.max(0, remainingMs);
  // 运行中的倒计时采用开区间显示，开始瞬间直接进入下一秒段。
  const normalizedMs = excludeCurrentSecond
    ? Math.max(0, safeRemainingMs - 1)
    : safeRemainingMs;
  const totalSeconds = Math.floor(normalizedMs / 1000);

  return {
    hours: Math.floor(totalSeconds / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60,
    ms: normalizedMs % 1000,
    ending: totalSeconds < 10 && safeRemainingMs > 0,
  };
}
