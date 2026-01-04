# AI-Optimized Social Bookmark

An open-source **social bookmark platform designed for the AI era**, where individuals freely collect links and opinions, and those individual activities can later be bundled into curated channels.

This project focuses on:
- Individual-first bookmarking
- Human comments and opinions as first-class data
- AI used as an assistant (not a replacement): moderation, recommendations, and Q&A
- A calm, non-inflammatory social model
- Self-hosting (OSS) and Cloudflare Workers–based production deployment

## Key Concepts

### 1. Individual Bookmarking (Primary Axis)
- Users bookmark URLs and write **free-form comments**.
- Comments are not structured or constrained.
- AI is used to **filter and control visibility**, not to restrict expression.
- Even without any social features, the system is useful for individuals.

### 2. Curation via Channels (Secondary Axis)
- Users (or organizations) can create **channels**.
- Channels bundle existing bookmarks into curated collections.
- Channels can be followed, liked, and saved by others.
- Channels are *outputs* of individual activity, not the starting point.

### 3. Human-Centered, AI-Assisted
- Humans write bookmarks and comments.
- AI is used only for:
  - Comment moderation (spam / aggressive content detection)
  - Recommendations
  - Q&A over saved bookmarks (via MCP)
- No AI-generated content is required by default.

## Core Features

- Bookmark any URL
- Write free-form comments on bookmarks
- Control visibility (`friends`, `followers`, `public`, `org`)
- Save others’ bookmarks into your own collection (with private notes)
- Create channels to curate bookmarks
- Follow users and channels
- Like and save channel items
- Comment moderation via AI (no manual policing)
- Optional comments disabled for enterprise channels
- AI-powered Q&A over your own bookmarks (MCP)

## Technology Stack

### Production
- **Runtime**: Cloudflare Workers
- **API**: Hono
- **UI**: React Router
- **Database / Auth**: Supabase (PostgreSQL, Auth, RLS)
- **CI/CD**: GitHub Actions

### OSS / Local Development
- **Container orchestration**: Docker Compose
- **Database**: PostgreSQL
- **Supabase**: Self-hosted Supabase stack (recommended)

The OSS version and production version share the same logical architecture.

## Repository Structure (Example)

```text
.
├── apps/
│   ├── api/        # Hono API (Workers-compatible)
│   └── web/        # React Router UI
├── infra/
│   ├── docker/     # docker-compose and local infra
│   └── workers/   # Cloudflare Workers config
├── .github/
│   └── workflows/ # GitHub Actions
├── README.md
└── LICENSE
```

## Getting Started (Local / OSS)

### Prerequisites

* Docker & Docker Compose
* Node.js (LTS recommended)

### 1. Clone the repository

```bash
git clone https://github.com/goofmint/eluma.dev.git
cd eluma.dev
```

### 2. Configure environment variables

```bash
cp .env.example .env
```

Edit `.env` as needed (Supabase, OpenAI API key for moderation, etc.).

### 3. Start local environment

```bash
docker compose up
```

### 4. Access

* UI: `http://localhost:3000`
* API: `http://localhost:8787`

## Deployment (Cloudflare Workers)

### Prerequisites

* Cloudflare account
* `wrangler` configured
* GitHub repository secrets set

### Required Secrets

* `SUPABASE_URL`
* `SUPABASE_ANON_KEY`
* `OPENAI_API_KEY` (for moderation and MCP Q&A)

### Deployment Flow

* Each pull request is expected to be **deployable**
* `main` branch is automatically deployed via GitHub Actions
* API runs on Cloudflare Workers
* UI is deployed via Cloudflare Pages or Workers static assets

## Comment Moderation Model

* Comments are **always accepted on input**
* AI moderation runs asynchronously
* Comments are:

  * `allowed`
  * `hidden`
  * `needs_review`
* Only `allowed` comments are visible by default
* There are:

  * No threads
  * No replies
  * No reactions on comments

This prevents escalation and flame wars while preserving free expression.

## Channels and Enterprises

* Channels can be owned by individuals or organizations.
* Channels can:

  * Enable comments
  * Disable comments entirely
* Enterprise channels typically:

  * Disable comments
  * Allow likes and saves only

This makes channels safe for documentation, DevRel, and research publishing.

## MCP (Model Context Protocol)

The system exposes MCP-compatible endpoints for:

* Searching bookmarks
* Asking questions about saved pages
* Returning answers with explicit references

This enables:

* LLM clients
* IDE integrations
* Research workflows

## License

This project is licensed under the **MIT License**.

See [`LICENSE`](./LICENSE) for details.

## Contributing

Contributions are welcome.

Guidelines:

* Each pull request should be deployable
* Keep changes small and reviewable
* Follow existing patterns for API/UI separation
* Do not introduce features that encourage harassment or flame wars

## Philosophy

This project assumes:

* Humans remain central in the AI era
* Opinions matter
* AI should assist, not dominate
* Calm systems outlast noisy ones

If this aligns with how you think about software, knowledge, and collaboration, you are welcome here.
