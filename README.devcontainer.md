# Dev Container Setup Guide

This document provides detailed instructions for setting up and using the Dev Container environment for the Eluma project.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Architecture Overview](#architecture-overview)
- [Development Workflow](#development-workflow)
- [Available Commands](#available-commands)
- [Port Mappings](#port-mappings)
- [Troubleshooting](#troubleshooting)
- [FAQ](#faq)

---

## Prerequisites

### Required Software

- **Visual Studio Code** (latest version)
  - Install from: https://code.visualstudio.com/
- **Dev Containers Extension**
  - Install from VS Code marketplace: `ms-vscode-remote.remote-containers`
- **Docker Desktop** (macOS/Windows) or Docker Engine (Linux)
  - macOS: https://www.docker.com/products/docker-desktop/
  - Linux: https://docs.docker.com/engine/install/

### System Requirements

- **macOS**: Docker Desktop 4.0+ with at least 4GB RAM allocated to Docker
- **Linux**: Docker Engine 20.10+ and Docker Compose v2
- **Disk Space**: At least 10GB free space for containers and volumes

### Docker Configuration

#### macOS (Docker Desktop)

1. Open Docker Desktop preferences
2. Go to **Resources** → **Advanced**
3. Allocate at least:
   - **CPUs**: 2 or more
   - **Memory**: 4GB or more
   - **Disk**: 10GB or more

#### Linux

Ensure your user is in the `docker` group:

```bash
sudo usermod -aG docker $USER
newgrp docker
```

---

## Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/goofmint/eluma.dev.git
cd eluma.dev
```

### 2. Configure Environment Variables

The Dev Container will automatically copy `.env.example` to `.env` if it doesn't exist. However, you should review and update the values:

```bash
cp .env.example .env
```

**Important**: Update the following values in `.env`:

```env
# Generate secure secrets
JWT_SECRET=your-super-secret-jwt-token-with-at-least-32-characters-long
SECRET_KEY_BASE=your-super-secret-key-base-with-at-least-32-characters-long

# Add your OpenAI API key for moderation features
OPENAI_API_KEY=sk-your-openai-api-key-here

# Optional: Configure SMTP for email authentication
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your-email@example.com
SMTP_PASS=your-password
```

**Generate secure secrets**:

```bash
# Generate JWT_SECRET
openssl rand -base64 32

# Generate SECRET_KEY_BASE
openssl rand -base64 32
```

### 3. Open in Dev Container

#### Option A: Using VS Code Command Palette

1. Open the repository folder in VS Code
2. Press `F1` or `Cmd+Shift+P` (macOS) / `Ctrl+Shift+P` (Windows/Linux)
3. Type and select: **Dev Containers: Reopen in Container**
4. Wait for the container to build and start (this may take 5-10 minutes on first run)

#### Option B: Using Command Line

```bash
# Install devcontainer CLI (if not already installed)
npm install -g @devcontainers/cli

# Open in dev container
devcontainer open .
```

### 4. Start Infrastructure Services

Once inside the Dev Container, start the local infrastructure:

```bash
# Start Supabase stack (PostgreSQL, Auth, Storage, etc.)
pnpm dev:up
```

This command starts:

- PostgreSQL database
- Supabase services (Auth, REST, Realtime, Storage)
- Kong API Gateway
- Supabase Studio (web UI)

### 5. Start Development Servers

Open two terminal windows/tabs and run:

**Terminal 1 - API Server**:

```bash
pnpm dev:api
```

**Terminal 2 - Web UI**:

```bash
pnpm dev:web
```

### 6. Access the Application

- **Web UI**: http://localhost:3000
- **API**: http://localhost:8787
- **Supabase Studio**: http://localhost:54323
- **Supabase API Gateway**: http://localhost:8000

---

## Architecture Overview

### Dev Container Components

```
┌─────────────────────────────────────────────────────────┐
│                    Dev Container                        │
│  ┌───────────────────────────────────────────────────┐  │
│  │  Development Tools                                │  │
│  │  - Node.js 20 (LTS)                              │  │
│  │  - pnpm 8.15.1                                   │  │
│  │  - wrangler (Cloudflare Workers CLI)             │  │
│  │  - supabase CLI                                  │  │
│  │  - PostgreSQL client (psql)                      │  │
│  │  - ESLint, Prettier, TypeScript                  │  │
│  └───────────────────────────────────────────────────┘  │
│                                                         │
│  ┌───────────────────────────────────────────────────┐  │
│  │  Docker-outside-of-Docker                         │  │
│  │  (Uses host's Docker daemon)                      │  │
│  └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
                          │
                          │ Manages
                          ▼
┌─────────────────────────────────────────────────────────┐
│              Docker Compose Services                    │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐    │
│  │ PostgreSQL  │  │    Kong     │  │  Supabase   │    │
│  │     DB      │  │   Gateway   │  │   Services  │    │
│  └─────────────┘  └─────────────┘  └─────────────┘    │
└─────────────────────────────────────────────────────────┘
```

### Persistent Volumes

The Dev Container uses named volumes for performance and data persistence:

- `eluma-pnpm-store`: pnpm package cache
- `eluma-node-modules`: node_modules (faster than bind mounts)
- `eluma-bashhistory`: Bash command history
- `postgres_data`: PostgreSQL database data
- `storage_data`: Supabase storage files

---

## Development Workflow

### Typical Development Session

```bash
# 1. Open repository in Dev Container
# (VS Code will handle this automatically)

# 2. Install dependencies (happens automatically via postCreateCommand)
# But you can run manually if needed:
pnpm install

# 3. Start infrastructure
pnpm dev:up

# 4. Check that services are running
pnpm dev:ps

# 5. View logs (optional)
pnpm dev:logs

# 6. Start development servers (in separate terminals)
pnpm dev:api    # Terminal 1
pnpm dev:web    # Terminal 2

# 7. Make your changes and test

# 8. Run linting and type checking
pnpm lint
pnpm typecheck

# 9. Format code
pnpm format

# 10. Stop infrastructure when done
pnpm dev:down
```

### Database Management

```bash
# Access Supabase Studio (web UI)
pnpm db:studio
# Then open: http://localhost:54323

# Connect to PostgreSQL with psql
psql -h localhost -p 5432 -U postgres -d eluma

# Run migrations (when apps/api is implemented)
pnpm db:migrate

# Seed database (when apps/api is implemented)
pnpm db:seed

# Reset database (DANGEROUS - deletes all data)
pnpm db:reset
```

---

## Available Commands

### Infrastructure Commands

| Command          | Description                                      |
| ---------------- | ------------------------------------------------ |
| `pnpm dev:up`    | Start all infrastructure services                |
| `pnpm dev:down`  | Stop all services                                |
| `pnpm dev:reset` | Stop services and delete all volumes (DANGEROUS) |
| `pnpm dev:logs`  | Follow logs from all services                    |
| `pnpm dev:ps`    | List running services                            |

### Development Commands

| Command          | Description                     |
| ---------------- | ------------------------------- |
| `pnpm dev:api`   | Start API development server    |
| `pnpm dev:web`   | Start Web UI development server |
| `pnpm build`     | Build all apps                  |
| `pnpm build:api` | Build API only                  |
| `pnpm build:web` | Build Web only                  |

### Code Quality Commands

| Command             | Description                  |
| ------------------- | ---------------------------- |
| `pnpm lint`         | Lint all packages            |
| `pnpm lint:fix`     | Fix linting errors           |
| `pnpm format`       | Format code with Prettier    |
| `pnpm format:check` | Check code formatting        |
| `pnpm typecheck`    | Run TypeScript type checking |
| `pnpm test`         | Run tests                    |

### Database Commands

| Command           | Description                  |
| ----------------- | ---------------------------- |
| `pnpm db:studio`  | Open Supabase Studio         |
| `pnpm db:migrate` | Run database migrations      |
| `pnpm db:seed`    | Seed database with test data |
| `pnpm db:reset`   | Reset database (DANGEROUS)   |

---

## Port Mappings

| Port  | Service    | Description                      |
| ----- | ---------- | -------------------------------- |
| 3000  | Web UI     | React Router development server  |
| 8787  | API        | Hono/Wrangler development server |
| 5432  | PostgreSQL | Database (for external tools)    |
| 8000  | Kong       | Supabase API Gateway (HTTP)      |
| 8443  | Kong       | Supabase API Gateway (HTTPS)     |
| 54323 | Studio     | Supabase Studio web UI           |

VS Code will automatically forward these ports. You can access them at:

- `http://localhost:<port>` (inside the container)
- `http://localhost:<port>` (on your host machine)

---

## Troubleshooting

### Container Build Issues

**Problem**: Container fails to build

**Solutions**:

1. Ensure Docker is running:
   ```bash
   docker info
   ```
2. Rebuild container without cache:
   - `F1` → **Dev Containers: Rebuild Container Without Cache**
3. Check Docker disk space:
   ```bash
   docker system df
   docker system prune -a
   ```

### Docker Socket Permission Issues (Linux)

**Problem**: Cannot connect to Docker daemon

**Solutions**:

1. Ensure you're in the docker group:
   ```bash
   groups | grep docker
   ```
2. If not, add yourself:
   ```bash
   sudo usermod -aG docker $USER
   newgrp docker
   ```
3. Restart Docker:
   ```bash
   sudo systemctl restart docker
   ```

### Services Not Starting

**Problem**: `pnpm dev:up` fails or services won't start

**Solutions**:

1. Check logs:
   ```bash
   docker compose logs
   ```
2. Check for port conflicts:
   ```bash
   # Check if ports are already in use
   lsof -i :5432  # PostgreSQL
   lsof -i :8000  # Kong
   lsof -i :54323 # Studio
   ```
3. Reset everything:
   ```bash
   pnpm dev:down
   docker compose down -v
   pnpm dev:up
   ```

### Slow Performance (macOS)

**Problem**: File operations are slow

**Solutions**:

1. The Dev Container already uses named volumes for `node_modules` (fast)
2. Ensure Docker Desktop has enough resources allocated
3. Consider using Docker Desktop's VirtioFS:
   - Docker Desktop → Settings → General → Enable VirtioFS

### Missing Environment Variables

**Problem**: Services fail with missing environment variables

**Solutions**:

1. Ensure `.env` file exists:
   ```bash
   ls -la .env
   ```
2. If not, copy from example:
   ```bash
   cp .env.example .env
   ```
3. Rebuild container to pick up new environment:
   - `F1` → **Dev Containers: Rebuild Container**

### pnpm Install Fails

**Problem**: `pnpm install` fails with dependency errors

**Solutions**:

1. Clear pnpm cache:
   ```bash
   pnpm store prune
   ```
2. Delete node_modules and reinstall:
   ```bash
   rm -rf node_modules
   pnpm install
   ```
3. Check Node.js version:
   ```bash
   node --version  # Should be 20.x
   ```

### PostgreSQL Connection Issues

**Problem**: Cannot connect to PostgreSQL

**Solutions**:

1. Check if database is running:
   ```bash
   docker compose ps db
   ```
2. Check database logs:
   ```bash
   docker compose logs db
   ```
3. Verify connection from inside container:
   ```bash
   psql -h localhost -p 5432 -U postgres -d eluma
   ```
4. Ensure `.env` has correct credentials

---

## FAQ

### Q: Do I need to install Node.js on my host machine?

**A**: No. All development tools (Node.js, pnpm, wrangler) are installed inside the Dev Container.

### Q: Can I use this setup on Windows?

**A**: Yes, but you'll need Docker Desktop for Windows with WSL 2 backend. The setup is primarily tested on macOS and Linux.

### Q: How do I update dependencies?

**A**: Run `pnpm update` inside the Dev Container. The pnpm store is persisted in a volume.

### Q: Can I use npm or yarn instead of pnpm?

**A**: The project is configured for pnpm. Using npm/yarn may cause issues. Stick with pnpm.

### Q: How do I access the database from a GUI tool on my host?

**A**: Use the following connection settings:

- Host: `localhost`
- Port: `5432`
- Database: `eluma`
- Username: `postgres`
- Password: (from your `.env` file)

Alternatively, use Supabase Studio at http://localhost:54323

### Q: What's the difference between `pnpm dev:up` and `docker compose up`?

**A**: `pnpm dev:up` only starts infrastructure services (DB, Supabase). The API and Web apps are started separately with `pnpm dev:api` and `pnpm dev:web` for faster hot-reloading.

### Q: How do I run the API and Web apps in Docker?

**A**: Use the `apps` profile:

```bash
docker compose --profile apps up
```

However, for development, it's recommended to run them directly with pnpm for faster rebuilds.

### Q: How do I clean up everything and start fresh?

**A**:

```bash
# Stop and remove all containers and volumes
pnpm dev:reset

# Rebuild the dev container
# In VS Code: F1 → "Dev Containers: Rebuild Container Without Cache"
```

### Q: Can I use this setup without VS Code?

**A**: Yes, use the devcontainer CLI:

```bash
npm install -g @devcontainers/cli
devcontainer open .
```

### Q: How do I debug the API or Web app?

**A**: VS Code debugging is pre-configured. Use the Debug panel (F5) to start debugging sessions.

---

## Additional Resources

- [Dev Containers Documentation](https://code.visualstudio.com/docs/devcontainers/containers)
- [Docker Documentation](https://docs.docker.com/)
- [Supabase Self-Hosting Guide](https://supabase.com/docs/guides/self-hosting)
- [Cloudflare Workers Documentation](https://developers.cloudflare.com/workers/)
- [pnpm Documentation](https://pnpm.io/)

---

## Getting Help

If you encounter issues not covered in this guide:

1. Check the [Troubleshooting](#troubleshooting) section
2. Search existing issues: https://github.com/goofmint/eluma.dev/issues
3. Create a new issue with:
   - Your OS and Docker version
   - Dev Container logs (`F1` → `Dev Containers: Show Container Log`)
   - Steps to reproduce the problem

---

**Happy coding!** 🚀
