FROM node:20-slim

RUN corepack enable && corepack prepare pnpm@9 --activate

WORKDIR /app

# Copy all package files
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY apps/api/package.json ./apps/api/

# Install all dependencies (including dev for tsx)
RUN pnpm install --frozen-lockfile --filter @eluma/api...

# Copy source
COPY apps/api ./apps/api

WORKDIR /app/apps/api

EXPOSE 8787

# Run directly with tsx (no build step needed)
CMD ["pnpm", "exec", "tsx", "src/server.ts"]
