import { test } from "node:test";
import assert from "node:assert/strict";
import type { Config } from "../src/config.js";
process.env.NODE_ENV = "test";
const { createServer } = await import("../src/server.js");
const config: Config = { host: "127.0.0.1", port: 8084, token: "a".repeat(40), gateway: new URL("http://gateway.test"), gatewayPort: 18789, gatewayToken: "b".repeat(40), timeout: 1000, agentModel: "gpt-6-astra", core: new URL("http://core.test"), coreToken: "c".repeat(40), evidenceTimeout: 1000 };
const body = { text: "Compare astronomy", session_id: "test", model: "gpt-6-astra", language: "en" };
test("adapter protects inference and rejects arbitrary providers before network access", async () => {
  const app = createServer(config);
  assert.equal((await app.inject({ method: "GET", url: "/health" })).statusCode, 200);
  assert.equal((await app.inject({ method: "POST", url: "/v1/agent", payload: body })).statusCode, 401);
  assert.equal((await app.inject({ method: "POST", url: "/v1/agent", headers: { authorization: `Bearer ${config.token}` }, payload: { ...body, model: "attacker/model" } })).statusCode, 400);
  assert.equal((await app.inject({ method: "POST", url: "/v1/agent", headers: { authorization: `Bearer ${config.token}` }, payload: { ...body, language: "zh" } })).statusCode, 400);
  await app.close();
});
