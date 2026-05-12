import { getCountdownRemainingMs } from "./countdown.js";

// 统一维护秒表、倒计时的状态切换规则，避免主面板和悬浮窗各写一套分支。

export function toggleStopwatchState(
  { running = false, time = 0, startAt },
  now = Date.now(),
) {
  if (running) {
    return {
      running: false,
      time: startAt !== undefined ? now - startAt : time,
      startAt: undefined,
    };
  }

  return {
    running: true,
    time,
    startAt: now - time,
  };
}

export function resetStopwatchState() {
  return {
    running: false,
    time: 0,
    startAt: undefined,
  };
}

export function startCountdownState(
  { hours = 0, minutes = 0, seconds = 0 },
  now = Date.now(),
) {
  const totalSeconds = hours * 3600 + minutes * 60 + seconds;
  if (totalSeconds <= 0) return null;

  return {
    initHours: hours,
    initMinutes: minutes,
    initSeconds: seconds,
    running: true,
    finished: false,
    ending: false,
    endAt: now + totalSeconds * 1000,
    remainingMs: totalSeconds * 1000,
  };
}

export function pauseCountdownState(endAt, now = Date.now()) {
  return {
    running: false,
    endAt: undefined,
    remainingMs: endAt !== undefined ? Math.max(0, endAt - now) : 0,
  };
}

export function resumeCountdownState(remainingMs, now = Date.now()) {
  if (remainingMs <= 0) return null;

  return {
    running: true,
    endAt: now + remainingMs,
  };
}

export function resetCountdownState({
  initHours = 0,
  initMinutes = 0,
  initSeconds = 0,
} = {}) {
  return {
    running: false,
    finished: false,
    ending: false,
    ms: 0,
    endAt: undefined,
    hours: initHours,
    minutes: initMinutes,
    seconds: initSeconds,
  };
}

export function finishCountdownState() {
  return {
    running: false,
    finished: true,
    ending: false,
    ms: 0,
    endAt: undefined,
    hours: 0,
    minutes: 0,
    seconds: 0,
  };
}

export function applyCountdownPresetState(minutes) {
  return {
    hours: 0,
    minutes,
    seconds: 0,
    initHours: 0,
    initMinutes: minutes,
    initSeconds: 0,
    finished: false,
    ending: false,
  };
}

export function getCountdownDisplayRemainingMs({
  hours = 0,
  minutes = 0,
  seconds = 0,
  ms = 0,
} = {}) {
  return getCountdownRemainingMs({ hours, minutes, seconds, ms });
}
