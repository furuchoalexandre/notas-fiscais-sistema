FROM node:22-alpine AS base
WORKDIR /app

# Install pnpm
RUN npm install -g pnpm@10.4.1

# ── Dependencies ──────────────────────────────────────────────────────────────
FROM base AS deps
COPY package.json pnpm-lock.yaml ./
# Use --no-frozen-lockfile to avoid lockfile version mismatch issues
RUN pnpm install --no-frozen-lockfile

# ── Build ─────────────────────────────────────────────────────────────────────
FROM deps AS builder
COPY . .
RUN pnpm build

# ── Production ────────────────────────────────────────────────────────────────
FROM node:22-alpine AS runner
WORKDIR /app

RUN npm install -g pnpm@10.4.1

# Copy only production dependencies
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --no-frozen-lockfile --prod

# Copy built server (esbuild output)
COPY --from=builder /app/dist ./dist

# Expose port (Railway injects PORT env var automatically)
EXPOSE 3000

ENV NODE_ENV=production

CMD ["node", "dist/index.js"]
