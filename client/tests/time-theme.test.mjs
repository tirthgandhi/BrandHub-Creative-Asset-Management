import test from "node:test";
import assert from "node:assert/strict";
import { themeAt } from "../src/data/time-theme.mjs";
for (const [hour, minute, expected] of [
  [0, 0, "night"],
  [4, 59, "night"],
  [5, 0, "morning"],
  [10, 59, "morning"],
  [11, 0, "afternoon"],
  [16, 29, "afternoon"],
  [16, 30, "sunset"],
  [19, 29, "sunset"],
  [19, 30, "night"],
  [23, 59, "night"],
]) {
  test(`browser-local ${hour}:${String(minute).padStart(2, "0")} selects ${expected}`, () => {
    assert.equal(themeAt(new Date(2026, 9, 24, hour, minute)), expected);
  });
}
