# =============================================================================
# Meridian Backend — NestJS API Gateway
# =============================================================================
# Multi-stage build for minimal production image (~150MB)
# =============================================================================

# ── Stage 1: Build ──────────────────────────────────────
FROM node:18-alpine AS builder

WORKDIR /app

# Install dependencies first (cache layer)
COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts

# Copy source and build
COPY . .
RUN npm run build

# ── Stage 2: Production ────────────────────────────────
FROM node:18-alpine AS runner

WORKDIR /app

# Only production dependencies
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --ignore-scripts && npm cache clean --force

# Copy compiled output
COPY --from=builder /app/dist ./dist

# Non-root user for security
RUN addgroup -g 1001 -S meridian && \
    adduser -S meridian -u 1001 -G meridian
USER meridian

EXPOSE 4000

ENV NODE_ENV=production
ENV PORT=4000

CMD ["node", "dist/main.js"]
