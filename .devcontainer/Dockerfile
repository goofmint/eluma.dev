# Dev Container Dockerfile for Eluma Development Environment
FROM mcr.microsoft.com/devcontainers/typescript-node:1-20-bookworm

# Set arguments
ARG PNPM_VERSION=8.15.1
ARG WRANGLER_VERSION=latest
ARG SUPABASE_CLI_VERSION=latest

# Switch to root for installations
USER root

# Install system dependencies
RUN apt-get update && export DEBIAN_FRONTEND=noninteractive \
    && apt-get -y install --no-install-recommends \
    # PostgreSQL client for database operations
    postgresql-client \
    # Git for version control (usually pre-installed but ensure latest)
    git \
    # curl and wget for downloading
    curl \
    wget \
    # Build tools that might be needed by npm packages
    build-essential \
    python3 \
    # Useful utilities
    jq \
    vim \
    less \
    # Cleanup
    && apt-get autoremove -y \
    && apt-get clean -y \
    && rm -rf /var/lib/apt/lists/*

# Install pnpm globally
RUN npm install -g pnpm@${PNPM_VERSION}

# Install Cloudflare Wrangler CLI
RUN npm install -g wrangler@${WRANGLER_VERSION}

# Install Supabase CLI (optional but recommended)
RUN curl -fsSL https://raw.githubusercontent.com/supabase/cli/main/install.sh | bash

# Configure Docker-outside-of-Docker permissions
# Add the default non-root user to the docker group (if it exists)
# This will be handled by devcontainer.json features

# Create workspace directory and pnpm store directory
RUN mkdir -p /workspace && chown -R node:node /workspace
RUN mkdir -p /home/node/.pnpm-store && chown -R node:node /home/node/.pnpm-store

# Switch to non-root user
USER node

# Set up pnpm store directory for the non-root user
RUN pnpm config set store-dir /home/node/.pnpm-store

# Set working directory
WORKDIR /workspace

# Install global tools for the non-root user
RUN npm install -g \
    # TypeScript language server
    typescript-language-server \
    # ESLint for linting
    eslint \
    # Prettier for formatting
    prettier

# Set environment variables
ENV NODE_ENV=development
ENV SHELL=/bin/bash

# Expose common development ports
# 3000: Web UI
# 8787: API (Hono/Wrangler dev server)
# 5432: PostgreSQL (for external tools)
# 8000: Supabase Kong Gateway
# 54323: Supabase Studio
EXPOSE 3000 8787 5432 8000 54323
# Install Claude CLI
RUN curl -fsSL https://claude.ai/install.sh | bash
# Default command (will be overridden by devcontainer.json)
CMD ["sleep", "infinity"]
