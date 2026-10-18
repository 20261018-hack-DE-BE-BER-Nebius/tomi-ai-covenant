FROM node:24.22.0-bookworm-slim AS dependencies
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts
FROM dependencies AS build
COPY tsconfig.json ./
COPY src ./src
RUN npm run build
FROM build AS verified
RUN npm prune --omit=dev --ignore-scripts
# Release is blocked while the locked bundled npm tree has reported advisories.
RUN npm audit --omit=dev --audit-level=moderate
FROM node:24.22.0-bookworm-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY --from=verified --chown=node:node /app/node_modules ./node_modules
COPY --from=verified --chown=node:node /app/dist ./dist
COPY --chown=node:node package.json ./
COPY --chown=node:node plugins ./plugins
COPY --chown=node:node scripts ./scripts
RUN mkdir runtime workspace && chown node:node runtime workspace
USER node
CMD ["node", "scripts/start-all.mjs"]
