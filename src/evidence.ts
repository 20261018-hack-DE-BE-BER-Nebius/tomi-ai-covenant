import type { CoreConfig } from "./config.js";
export function validateEvidence(input: unknown): { query: string; language: string } {
  if (!input || typeof input !== "object" || Array.isArray(input)) throw new Error("Invalid evidence query");
  const p = input as Record<string, unknown>;
  if (Object.keys(p).some(k => !["query", "language"].includes(k)) || typeof p.query !== "string" || !p.query.trim() || p.query.length > 8000 || typeof p.language !== "string" || !["en", "es", "de", "fr"].includes(p.language)) throw new Error("Invalid evidence query");
  return { query: p.query, language: p.language };
}
export async function executeEvidence(input: unknown, config: CoreConfig, transport: typeof fetch = fetch) {
  const params = validateEvidence(input);
  const response = await transport(new URL("/v1/evidence/search", config.core), {
    method: "POST", redirect: "error", headers: { "content-type": "application/json", authorization: `Bearer ${config.coreToken}` },
    body: JSON.stringify({ ...params, top_k: 4 }), signal: AbortSignal.timeout(config.evidenceTimeout),
  });
  if (!response.ok) return { content: [{ type: "text" as const, text: JSON.stringify({ status: "unavailable", http_status: response.status }) }], details: { status: "unavailable" }, isError: true };
  const reader = response.body?.getReader();
  if (!reader) throw new Error("Empty evidence response");
  let text = "";
  let size = 0;
  const decoder = new TextDecoder();
  while (true) {
    const chunk = await reader.read();
    if (chunk.done) break;
    size += chunk.value.byteLength;
    if (size > 512000) { await reader.cancel(); throw new Error("Evidence response exceeds limit"); }
    text += decoder.decode(chunk.value, { stream: true });
  }
  text += decoder.decode();
  const details: unknown = JSON.parse(text);
  return { content: [{ type: "text" as const, text: JSON.stringify({ trust: "untrusted_source_data", evidence: details }) }], details };
}
