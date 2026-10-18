# Tomi Covenant

Tomi Covenant runs an OpenClaw 2026.10.4 gateway and a small authenticated Fastify adapter. Its single agent tool requests historical and modern source evidence from the Rust AI core. All model inference and provider credentials remain in that core. Covenant uses separate service-to-service bearer credentials for its own API, the internal gateway, and the core.

## Prerequisites

Use Node.js 24.22.0, npm, and a running Tomi AI core. Install Gitleaks to use the pre-commit hook. Container builds use the pinned Node image in the Dockerfile and require a Docker-compatible or Apple Container builder.

## Setup

```sh
npm ci
cp .env.example .env
npm run hooks:install
npm run build
```

Set three distinct random service tokens of at least 32 characters in `.env`; replace every example token. Keep `.env` local. Set `TOMI_CORE_TOKEN` to the internal bearer accepted by the core. Do not put OpenAI, Azure, Nebius, or NVIDIA provider credentials in this service.

| Variable | Purpose |
| --- | --- |
| `TOMI_COVENANT_HOST` | Adapter bind address; loopback for native development |
| `TOMI_COVENANT_PORT` | Adapter port |
| `TOMI_COVENANT_TOKEN` | Bearer required by the adapter `/v1/agent` route |
| `TOMI_OPENCLAW_URL` | Origin of the internal gateway |
| `TOMI_OPENCLAW_PORT` | Loopback gateway listener port |
| `TOMI_OPENCLAW_TOKEN` | Internal gateway bearer |
| `TOMI_CORE_URL` | Core origin, without an API path |
| `TOMI_CORE_TOKEN` | Core service bearer; never a provider key |
| `TOMI_AGENT_MODEL` | Initial model, one of the IDs in `src/validation.ts` |
| `TOMI_TIMEOUT_MS` | Maximum adapter inference wait |
| `TOMI_EVIDENCE_TIMEOUT_MS` | Maximum evidence retrieval wait |

Start both processes together:

```sh
node --env-file=.env scripts/start-all.mjs
```

For separate development terminals, run `npm run openclaw` and `npm run dev`. The adapter exposes liveness at `/health` and gateway readiness at `/ready`. Readiness confirms the gateway can accept work; provider availability is evaluated by the core during inference.

The startup script creates private files inside ignored `runtime/`, including the gateway config containing internal service credentials. Keep that directory private. Agent bootstrap/context injection is disabled. The gateway's workspace remains isolated in ignored `workspace/`; do not populate it with private project data.

## Request the agent

POST JSON to `/v1/agent` with `Authorization: Bearer <TOMI_COVENANT_TOKEN>`:

```json
{
  "session_id": "your-unique-session",
  "model": "gpt-6-astra",
  "language": "en",
  "text": "Use source evidence to compare historical and modern astronomy."
}
```

The language must be `en`, `es`, `de`, or `fr`. Session IDs are hashed before forwarding to OpenClaw. The response is an OpenAI-compatible completed chat response. Source lookup uses the core `/v1/evidence/search` endpoint with fixed `top_k: 4`. The evidence tool accepts only `query` and `language`; it cannot choose a URL or execute commands. Retrieved text is labeled untrusted source data.

The provider list deliberately includes only conversation-capable models. Parse3.5, embeddings, reranking, transcription, image generation, and realtime models remain task-specific core APIs rather than being presented as chat models here.

## Verify and build

```sh
npm run check
npm audit --audit-level=moderate

for dir in src plugins scripts tests; do
  gitleaks dir "$dir" --redact --no-banner
done

docker compose config --quiet
docker compose build
```

The pre-commit hook checks exact staged content, TypeScript, tests, and the npm audit. Installation of the hook does not create or stage a commit.

The production Dockerfile fails at its `verified` stage when the locked dependency graph reports moderate or more severe vulnerabilities. Resolve the audit before building the runtime image; there is no bypass build argument or release waiver. The machine-readable results from this implementation session are under `verification/`.

After the gate passes, configure a core origin reachable from the container and use `docker compose up --build`. The gateway stays on container loopback and has no published port. The adapter is published only on host loopback. Compose drops capabilities, enables `no-new-privileges`, and uses a read-only filesystem with separate runtime/workspace volumes. The core must be reachable at the configured origin; a native loopback core URL does not reach the host from a container.

## Development workflow

`npm test` validates authentication, invalid model/language requests, evidence input boundaries, fixed-core routing, upstream-error redaction, response bounds, disabled autonomous features, and provider-secret exclusion from the gateway environment. `npm run check` additionally compiles the source, checks plugin syntax, and asks the installed OpenClaw version to validate the generated configuration.

The custom GPT routes use the core `/v1/responses` transport for function tools with low reasoning effort. The Nemotron route uses Chat Completions. The single evidence tool is exposed directly; tool-search indirection is disabled.

Changes to `src/` require `npm run build` before restarting the gateway because the plugin imports compiled helpers from `dist/`. To stop both processes, send SIGTERM to the supervisor; it forwards termination and bounds shutdown to ten seconds.
