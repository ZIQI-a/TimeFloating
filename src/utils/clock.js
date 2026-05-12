// 统一封装时钟字符串格式化，避免主面板和悬浮窗各自维护一套时间文案逻辑。

const CLOCK_LOCALE = "zh-CN";
const DAY_PERIOD_REGEX = /^(上午|下午|AM|PM)\s*/i;

export function formatClockTime(date = new Date(), hour24 = true) {
  return date.toLocaleTimeString(CLOCK_LOCALE, {
    hour12: !hour24,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

export function formatClockDate(date = new Date()) {
  return date.toLocaleDateString(CLOCK_LOCALE, {
    month: "long",
    day: "numeric",
    weekday: "long",
  });
}

export function stripClockDayPeriod(timeText = "") {
  return timeText.replace(DAY_PERIOD_REGEX, "").trim();
}

export function getClockDayPeriod(timeText = "") {
  const match = timeText.match(DAY_PERIOD_REGEX);
  return match ? match[1].trim() : "";
}

export function getTenthsMsDigit(timestamp = Date.now()) {
  return Math.floor((timestamp % 1000) / 100);
}
