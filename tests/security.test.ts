import test from "node:test";
import assert from "node:assert/strict";
import { authorized, sessionKey } from "../src/validation.js";
test("only exact internal bearer credentials authenticate", () => {
  assert.equal(authorized(undefined, "private"), false);
  assert.equal(authorized("Bearer wrong", "private"), false);
  assert.equal(authorized("Bearer private", "private"), true);
  assert.notEqual(sessionKey("one"), sessionKey("two"));
});
