import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { notifyCountdownFinished } = require("../electron/notificationService.cjs");

test("notifyCountdownFinished returns a result object", () => {
  const result = notifyCountdownFinished({
    title: "test",
    body: "body",
    silent: true,
  });

  assert.equal(typeof result.success, "boolean");
  if (!result.success) {
    assert.ok(["unavailable", "unsupported", "error"].includes(result.reason));
  }
});
