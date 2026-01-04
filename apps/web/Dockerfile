FROM node:20-slim AS builder

RUN corepack enable && corepack prepare pnpm@9 --activate

WORKDIR /app

# Copy package files
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY apps/web/package.json ./apps/web/

# Install dependencies
RUN pnpm install --frozen-lockfile --filter @eluma/web...

# Copy source
COPY apps/web ./apps/web

WORKDIR /app/apps/web

# Build
RUN pnpm build

EXPOSE 3000

CMD ["pnpm", "start"]
