import test from "node:test";
import assert from "node:assert/strict";

import {
  applyCountdownPresetState,
  finishCountdownState,
  pauseCountdownState,
  resetCountdownState,
  resetStopwatchState,
  resumeCountdownState,
  startCountdownState,
  toggleStopwatchState,
} from "../src/utils/timerState.js";

test("toggleStopwatchState starts and pauses with consistent offsets", () => {
  const started = toggleStopwatchState(
    { running: false, time: 1_500, startAt: undefined },
    10_000,
  );
  assert.deepEqual(started, {
    running: true,
    time: 1_500,
    startAt: 8_500,
  });

  const paused = toggleStopwatchState(started, 12_000);
  assert.deepEqual(paused, {
    running: false,
    time: 3_500,
    startAt: undefined,
  });

  assert.deepEqual(resetStopwatchState(), {
    running: false,
    time: 0,
    startAt: undefined,
  });
});

test("countdown state helpers cover start pause resume finish reset", () => {
  const started = startCountdownState(
    { hours: 0, minutes: 1, seconds: 5 },
    2_000,
  );
  assert.deepEqual(started, {
    initHours: 0,
    initMinutes: 1,
    initSeconds: 5,
    running: true,
    finished: false,
    ending: false,
    endAt: 67_000,
    remainingMs: 65_000,
  });

  const paused = pauseCountdownState(started.endAt, 12_000);
  assert.deepEqual(paused, {
    running: false,
    endAt: undefined,
    remainingMs: 55_000,
  });

  assert.deepEqual(resumeCountdownState(paused.remainingMs, 20_000), {
    running: true,
    endAt: 75_000,
  });

  assert.deepEqual(finishCountdownState(), {
    running: false,
    finished: true,
    ending: false,
    ms: 0,
    endAt: undefined,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  assert.deepEqual(
    resetCountdownState({ initHours: 1, initMinutes: 2, initSeconds: 3 }),
    {
      running: false,
      finished: false,
      ending: false,
      ms: 0,
      endAt: undefined,
      hours: 1,
      minutes: 2,
      seconds: 3,
    },
  );
});

test("applyCountdownPresetState normalizes preset values", () => {
  assert.deepEqual(applyCountdownPresetState(25), {
    hours: 0,
    minutes: 25,
    seconds: 0,
    initHours: 0,
    initMinutes: 25,
    initSeconds: 0,
    finished: false,
    ending: false,
  });
});
