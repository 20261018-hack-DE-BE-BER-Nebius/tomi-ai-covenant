import { createHash, timingSafeEqual } from "node:crypto";
export const models = ["nemotron-3.5-super-vl", "gpt-6-astra", "gpt-5.6-terra", "gpt-5.6-luna"];
export function authorized(header: string | undefined, token: string): boolean {
  if (!header) return false;
  const digest = (value: string) => createHash("sha256").update(value).digest();
  return timingSafeEqual(digest(header), digest(`Bearer ${token}`));
}
export function sessionKey(id: string): string { return createHash("sha256").update(id).digest("hex"); }
export const agentSchema = {
  type: "object", additionalProperties: false, required: ["text", "session_id", "model", "language"],
  properties: {
    text: { type: "string", minLength: 1, maxLength: 16000 },
    session_id: { type: "string", minLength: 1, maxLength: 160 },
    model: { type: "string", enum: models },
    language: { type: "string", enum: ["en", "es", "de", "fr"] },
  },
};
export type AgentRequest = { text: string; session_id: string; model: string; language: string };
