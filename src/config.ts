function required(name: string): string {
  const value = process.env[name];
  if (!value?.trim()) throw new Error(`Missing ${name}`);
  return value;
}
function secret(name: string): string {
  const value = required(name);
  if (value.length < 32 || value.startsWith("replace-")) throw new Error(`${name} requires at least 32 random characters`);
  return value;
}
function integer(name: string, fallback?: string): number {
  const value = Number(process.env[name] ?? fallback ?? required(name));
  if (!Number.isSafeInteger(value) || value < 1 || value > (name.endsWith("PORT") ? 65535 : 300000)) throw new Error(`Invalid ${name}`);
  return value;
}
function endpoint(name: string): URL {
  const value = new URL(required(name));
  if (!["http:", "https:"].includes(value.protocol) || value.username || value.password || value.search || value.hash || value.pathname !== "/") throw new Error(`Invalid ${name}`);
  return value;
}
export function loadCoreConfig() {
  return { core: endpoint("TOMI_CORE_URL"), coreToken: secret("TOMI_CORE_TOKEN"), evidenceTimeout: integer("TOMI_EVIDENCE_TIMEOUT_MS", "60000") };
}
export function loadConfig() {
  return {
    host: required("TOMI_COVENANT_HOST"), port: integer("TOMI_COVENANT_PORT"), token: secret("TOMI_COVENANT_TOKEN"),
    gateway: endpoint("TOMI_OPENCLAW_URL"), gatewayPort: integer("TOMI_OPENCLAW_PORT"), gatewayToken: secret("TOMI_OPENCLAW_TOKEN"),
    timeout: integer("TOMI_TIMEOUT_MS", "120000"), agentModel: required("TOMI_AGENT_MODEL"), ...loadCoreConfig(),
  };
}
export type Config = ReturnType<typeof loadConfig>;
export type CoreConfig = ReturnType<typeof loadCoreConfig>;
