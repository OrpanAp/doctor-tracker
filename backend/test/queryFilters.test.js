const test = require("node:test");
const assert = require("node:assert/strict");
const { escapeRegex, buildDateRange } = require("../src/utils/queryFilters");

test("escapeRegex treats search characters literally", () => {
  const escaped = escapeRegex("Dr. (A+B)");
  assert.equal(new RegExp(escaped).test("Dr. (A+B)"), true);
  assert.equal(new RegExp(escaped).test("DrX AAB"), false);
});

test("buildDateRange returns inclusive date bounds", () => {
  const result = buildDateRange("2026-01-02", "2026-01-03");
  assert.equal(result.error, null);
  assert.equal(result.filter.$gte.getHours(), 0);
  assert.equal(result.filter.$lte.getHours(), 23);
  assert.equal(result.filter.$lte.getDate(), 3);
});

test("buildDateRange rejects invalid or reversed ranges", () => {
  assert.equal(buildDateRange("not-a-date", "").error, "Invalid start date");
  assert.equal(buildDateRange("2026-02-02", "2026-02-01").error, "Start date must be on or before end date");
});
