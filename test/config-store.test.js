import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { DEFAULT_SETTINGS, normalizeSettings } = require("../electron/configStore.cjs");

test("normalizeSettings fills defaults and ignores unknown keys", () => {
  const normalized = normalizeSettings({
    hour24: false,
    floatingOpacity: 0.7,
    extraField: "ignored",
  });

  assert.equal(normalized.hour24, false);
  assert.equal(normalized.floatingOpacity, 0.7);
  assert.equal(normalized.extraField, undefined);
  assert.deepEqual(Object.keys(normalized).sort(), Object.keys(DEFAULT_SETTINGS).sort());
});
