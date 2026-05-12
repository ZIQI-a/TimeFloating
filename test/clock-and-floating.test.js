import test from "node:test";
import assert from "node:assert/strict";

import {
  formatClockDate,
  formatClockTime,
  getClockDayPeriod,
  getTenthsMsDigit,
  stripClockDayPeriod,
} from "../src/utils/clock.js";
import {
  deriveCountdownParts,
  getCountdownRemainingMs,
} from "../src/utils/countdown.js";
import {
  buildFloatingStatePayload,
  buildFloatingTickPayload,
} from "../src/utils/floatingState.js";

test("clock helpers keep day period and stripped text consistent", () => {
  const morning = "上午 08:30:45";
  assert.equal(stripClockDayPeriod(morning), "08:30:45");
  assert.equal(getClockDayPeriod(morning), "上午");
  assert.equal(getTenthsMsDigit(987), 9);
});

test("clock formatters produce localized strings", () => {
  const sample = new Date("2026-05-12T08:30:45");
  assert.match(formatClockTime(sample, true), /^\d{2}:\d{2}:\d{2}$/);
  assert.match(formatClockDate(sample), /5月|五月/);
});

test("countdown helpers derive open-interval display state", () => {
  const countdown = deriveCountdownParts(5 * 60 * 1000, {
    excludeCurrentSecond: true,
  });
  assert.deepEqual(countdown, {
    hours: 0,
    minutes: 4,
    seconds: 59,
    ms: 999,
    ending: false,
  });
  assert.equal(
    getCountdownRemainingMs({ hours: 0, minutes: 1, seconds: 2, ms: 300 }),
    62_300,
  );
});

test("floating payload builders keep state serializable and complete", () => {
  const statePayload = buildFloatingStatePayload({
    mode: "countdown",
    settings: { clockShowMs: true },
    stopwatchTime: 1234,
    stopwatchRunning: false,
    countdownHours: 0,
    countdownMinutes: 1,
    countdownSeconds: 2,
    countdownMs: 300,
    countdownInitHours: 0,
    countdownInitMinutes: 1,
    countdownInitSeconds: 2,
    countdownRunning: false,
    countdownFinished: false,
    countdownEnding: false,
  });
  assert.equal(statePayload.countdownRemainingMs, 62_300);

  const tickPayload = buildFloatingTickPayload({
    mode: "clock",
    stopwatchTime: 0,
    stopwatchRunning: false,
    stopwatchShowMs: false,
    countdownHours: 0,
    countdownMinutes: 0,
    countdownSeconds: 5,
    countdownMs: 120,
    countdownShowMs: true,
    countdownInitHours: 0,
    countdownInitMinutes: 0,
    countdownInitSeconds: 5,
    countdownRunning: true,
    countdownFinished: false,
    countdownEnding: true,
    currentTime: "08:30:45",
    clockShowMs: true,
  });
  assert.equal(tickPayload.countdownRemainingMs, 5_120);
  assert.equal(tickPayload.currentTime, "08:30:45");
});
