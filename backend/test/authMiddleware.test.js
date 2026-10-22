const test = require("node:test");
const assert = require("node:assert/strict");
const jwt = require("jsonwebtoken");

process.env.JWT_SECRET = "unit-test-secret-that-is-at-least-32-characters-long";
const { requireAuth } = require("../src/middleware/auth");

function responseMock() {
  return {
    statusCode: 200,
    body: null,
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; },
  };
}

test("requireAuth accepts a valid administrator session", () => {
  const req = { cookies: { token: jwt.sign({ sub: "admin-id", role: "admin" }, process.env.JWT_SECRET) } };
  const res = responseMock();
  let nextCalled = false;
  requireAuth(req, res, () => { nextCalled = true; });
  assert.equal(nextCalled, true);
  assert.equal(req.user.sub, "admin-id");
  assert.equal(res.statusCode, 200);
});

test("requireAuth rejects a missing session cookie", () => {
  const res = responseMock();
  requireAuth({ cookies: {} }, res, () => assert.fail("next should not run"));
  assert.equal(res.statusCode, 401);
  assert.equal(res.body.message, "Authentication required");
});

test("requireAuth rejects non-administrator tokens", () => {
  const token = jwt.sign({ sub: "user-id", role: "user" }, process.env.JWT_SECRET);
  const res = responseMock();
  requireAuth({ cookies: { token } }, res, () => assert.fail("next should not run"));
  assert.equal(res.statusCode, 403);
  assert.equal(res.body.message, "Administrator access required");
});

test("requireAuth rejects expired or invalid tokens", () => {
  const res = responseMock();
  requireAuth({ cookies: { token: "not-a-jwt" } }, res, () => assert.fail("next should not run"));
  assert.equal(res.statusCode, 401);
  assert.equal(res.body.message, "Invalid or expired session");
});
