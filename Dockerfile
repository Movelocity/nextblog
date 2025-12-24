FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install dependencies based on the preferred package manager
COPY web/package.json web/pnpm-lock.yaml* ./
RUN npm install -g pnpm && pnpm install --frozen-lockfile

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY web/ .

# Set environment variables
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# Build the application
RUN npm install -g pnpm && \
    pnpm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create necessary directories
RUN mkdir -p .next

# Copy necessary files
COPY --from=builder /app/public ./public
# Backup public directory for runtime restoration (because tmpfs will overlay it)
COPY --from=builder /app/public ./.public-backup
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY entrypoint.sh ./entrypoint.sh
RUN chmod +x ./entrypoint.sh

# Set environment variables with default values
ENV PORT=3000
ENV API_BASE_URL=http://localhost:8080/api
ENV RUNTIME_ENV_VARS=API_BASE_URL

EXPOSE 3000

ENTRYPOINT ["./entrypoint.sh"]
CMD ["node", "server.js"] 
