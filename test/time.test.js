import test from "node:test";
import assert from "node:assert/strict";

import {
    clampCountdownValue,
    formatCountdown,
    formatStopwatch,
} from "../src/utils/time.js";

test("formatStopwatch omits hours until needed", () => {
    assert.equal(formatStopwatch(65_430, true), "01:05.4");
    assert.equal(formatStopwatch(65_430, false), "01:05");
});

test("formatStopwatch includes hours for long durations", () => {
    assert.equal(formatStopwatch(3_661_280, true), "01:01:01.2");
    assert.equal(formatStopwatch(3_661_280, false), "01:01:01");
});

test("formatCountdown respects hour visibility and millisecond toggle", () => {
    assert.equal(
        formatCountdown({ hours: 0, minutes: 5, seconds: 9, ms: 820 }),
        "05:09",
    );
    assert.equal(
        formatCountdown({
            hours: 0,
            minutes: 5,
            seconds: 9,
            ms: 820,
            showMs: true,
        }),
        "05:09.8",
    );
    assert.equal(
        formatCountdown({
            hours: 0,
            minutes: 5,
            seconds: 9,
            forceHours: true,
        }),
        "00:05:09",
    );
});

test("clampCountdownValue keeps values in range", () => {
    assert.equal(clampCountdownValue(12, 59), 12);
    assert.equal(clampCountdownValue(-4, 59), 0);
    assert.equal(clampCountdownValue(77, 59), 59);
    assert.equal(clampCountdownValue(Number.NaN, 99), 0);
});
