import type { Config } from "./config.js";
import { models } from "./validation.js";
export function openclawConfig(config: Config, workspace: string, plugin: string) {
  if (!models.includes(config.agentModel)) throw new Error("Unsupported TOMI_AGENT_MODEL");
  return {
    gateway: { mode: "local", bind: "loopback", port: config.gatewayPort, auth: { mode: "token", token: config.gatewayToken }, http: { endpoints: { chatCompletions: { enabled: true } } }, controlUi: { enabled: false } },
    agents: { defaults: { workspace, skipBootstrap: true, contextInjection: "never", skills: [], heartbeat: { every: "0m" }, compaction: { enabled: false, memoryFlush: { enabled: false } }, model: { primary: `tomi/${config.agentModel}` }, thinkingDefault: "low" } },
    models: { mode: "replace", providers: { tomi: { baseUrl: new URL("/v1", config.core).href, apiKey: config.coreToken, api: "openai-completions", models: models.map(id => ({ id, name: id, input: ["text"], contextWindow: 32000, maxTokens: 4096, ...(id.startsWith("gpt-") ? { api: "openai-responses", reasoning: true, compat: { supportsReasoningEffort: true, supportedReasoningEfforts: ["low", "medium", "high", "xhigh"], reasoningEffortMap: { off: "low" } } } : {}) })) } } },
    plugins: { allow: ["openai", "tomi-evidence"], slots: { memory: "none" }, load: { paths: [plugin] }, entries: { "tomi-evidence": { enabled: true } } },
    memory: { search: { enabled: false } },
    hooks: { enabled: false, internal: { enabled: false } },
    skills: { allowBundled: [], load: { watch: false } },
    cron: { enabled: false },
    tools: { toolSearch: false, allow: ["tomi_evidence_search"], deny: ["exec", "process", "read", "write", "edit", "apply_patch", "browser", "web_fetch", "web_search", "message", "cron", "gateway", "nodes", "sessions_spawn", "sessions_send", "memory_search", "memory_get", "heartbeat_respond"] },
    discovery: { mdns: { mode: "off" } },
  };
}
export function childEnvironment(config: Config, inherited: NodeJS.ProcessEnv, configPath: string, root: string): NodeJS.ProcessEnv {
  const env: NodeJS.ProcessEnv = {};
  for (const key of ["PATH", "HOME", "TMPDIR", "TEMP", "USER", "LANG", "TZ", "NODE_EXTRA_CA_CERTS"]) if (inherited[key]) env[key] = inherited[key];
  return { ...env, TOMI_CORE_URL: config.core.href, TOMI_CORE_TOKEN: config.coreToken, TOMI_EVIDENCE_TIMEOUT_MS: String(config.evidenceTimeout), OPENCLAW_CONFIG_PATH: configPath, OPENCLAW_STATE_DIR: root, OPENCLAW_NO_ONBOARD: "1", OPENCLAW_NO_AUTO_UPDATE: "1" };
}
