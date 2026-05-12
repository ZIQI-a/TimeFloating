import { getCountdownRemainingMs } from "./countdown.js";

function cloneSerializable(data) {
  return JSON.parse(JSON.stringify(data));
}

// 低频完整快照用于初始化和关键动作后的状态校正。
export function buildFloatingStatePayload({
  mode,
  settings,
  stopwatchTime,
  stopwatchRunning,
  countdownHours,
  countdownMinutes,
  countdownSeconds,
  countdownMs = 0,
  countdownInitHours,
  countdownInitMinutes,
  countdownInitSeconds,
  countdownRunning,
  countdownFinished,
  countdownEnding,
  countdownRemainingMs,
}) {
  return cloneSerializable({
    mode,
    settings,
    stopwatchTime,
    stopwatchRunning,
    countdownHours,
    countdownMinutes,
    countdownSeconds,
    countdownInitHours,
    countdownInitMinutes,
    countdownInitSeconds,
    countdownRunning,
    countdownFinished,
    countdownEnding,
    countdownRemainingMs:
      countdownRemainingMs ??
      getCountdownRemainingMs({
        hours: countdownHours,
        minutes: countdownMinutes,
        seconds: countdownSeconds,
        ms: countdownMs,
      }),
  });
}

// 高频增量数据只保留悬浮窗重绘所需字段，避免 IPC 通道继续膨胀。
export function buildFloatingTickPayload({
  mode,
  stopwatchTime,
  stopwatchRunning,
  stopwatchShowMs,
  countdownHours,
  countdownMinutes,
  countdownSeconds,
  countdownMs = 0,
  countdownShowMs,
  countdownInitHours,
  countdownInitMinutes,
  countdownInitSeconds,
  countdownRunning,
  countdownFinished,
  countdownEnding,
  countdownRemainingMs,
  currentTime,
  clockShowMs,
}) {
  return cloneSerializable({
    mode,
    stopwatchTime,
    stopwatchRunning,
    stopwatchShowMs,
    countdownHours,
    countdownMinutes,
    countdownSeconds,
    countdownMs,
    countdownShowMs,
    countdownInitHours,
    countdownInitMinutes,
    countdownInitSeconds,
    countdownRunning,
    countdownFinished,
    countdownEnding,
    countdownRemainingMs:
      countdownRemainingMs ??
      getCountdownRemainingMs({
        hours: countdownHours,
        minutes: countdownMinutes,
        seconds: countdownSeconds,
        ms: countdownMs,
      }),
    currentTime,
    clockShowMs,
  });
}
