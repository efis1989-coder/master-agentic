# Production Agentic Systems — Master Curriculum

A comprehensive, failure-driven curriculum for expert-level competence in designing, shipping, and operating agentic AI systems in production.

**Live course:** https://efishachaf.github.io/Master-agentic-systems-on-prod/

---

## What You'll Learn

Master production-grade agentic systems through a first-principles, spiral curriculum anchored in real failure modes:

- **LLM & Agent Fundamentals** (10%) — Inference mechanics, context economics, tool-calling anatomy
- **Agentic Building Blocks** (15%) — Tools, MCP, retrieval, memory, control loops, orchestration
- **Systems Architecture** (20%) — Deterministic/agentic boundaries, state design, HITL, containment
- **Production Operations** (30%) — Evals, observability, reliability, cost, change management
- **Security, Governance & Compliance** (15%) — Threat modeling, defenses, AI Act/NIST/OWASP
- **Advanced & Frontier** (10%) — Multi-agent coordination, long-horizon operation, fleet governance

**32 chapters** of structured content covering every aspect of production agentic systems—from first principles to capstone design exercises.

---

## How to Use

### On Mobile or Web (No Installation)

1. **Open the course**: [https://efishachaf.github.io/Master-agentic-systems-on-prod/](https://efishachaf.github.io/Master-agentic-systems-on-prod/)
2. **Works on**: Desktop, tablet, mobile (responsive design)
3. **Track progress locally**: Your progress, bookmarks, and notes are saved in your browser

### Run Locally (Development)

```bash
# Clone and install
git clone <repo-url>
cd Master-agentic-systems-on-prod
pnpm install

# Development server (with hot reload)
pnpm dev

# Run tests
pnpm test

# Build for production
pnpm build

# Preview the built site
pnpm preview
```

---

## Curriculum Structure

### Part 0: Foundations (Chapters 0–3)
Mental models and first-principles thinking.

- **0.1** — The Agentic Spectrum
- **0.2** — Why Production Is a Different Sport
- **0.3** — Process to Specification: The Core Boundary
- **Capstone** — Regulated Domain Agent Platform

### Part I: The Mental Models (Chapters 1–3)
Core concepts that unlock everything else.

### Part II: Architecture (Chapters 4–6)
System design patterns and tradeoff tables.

### Part III: Operations at Scale (Chapters 5–7)
Running production systems: monitoring, reliability, cost.

### Part IV: Certification & Beyond (Chapters 7–8)
Practice exams, incident case studies, advanced topics.

---

## Course Features

✅ **Fully interactive** — Read, annotate, bookmark chapters
✅ **Mermaid diagrams** — Architecture visualizations
✅ **Syntax-highlighted code** — Reference implementations
✅ **Progress tracking** — Bookmark chapters, track where you are
✅ **Offline-capable** — Works without internet after first load
✅ **No account needed** — Everything stored locally in your browser

---

## Design Philosophy

- **Failure-driven**: Every concept answers a real production failure class
- **Spiral learning**: Major themes repeat at increasing depth (mental model → architecture → operations)
- **First-principles ordering**: Nothing is referenced before it's built
- **Vendor-neutral doctrine**: Anchored in leading industry practice, with Claude/MCP sidebars
- **Assessment by artifact**: Master through design exercises, not just recall

---

## Technology Stack

- **Frontend**: React 19 + Vite
- **Routing**: React Router
- **Content**: Markdown with syntax highlighting, Mermaid diagrams
- **Storage**: IndexedDB (browser-local, no backend needed)
- **Testing**: Vitest
- **Code quality**: Biome (linting, formatting)

---

## Development

### Prerequisites
- Node.js 22+
- pnpm 10+

### Common Commands

```bash
# Lint and fix formatting
pnpm lint:fix

# Run test suite
pnpm test:watch

# Validate content structure
pnpm content:check

# Build for deployment
pnpm build
```

### Adding Content

Content chapters are Markdown files in `content/`. Each chapter includes:
1. Failure story — production incident class
2. Mental model — first-principles derivation
3. Architecture patterns — 2–4 diagrams + tradeoff table
4. Production lens — monitoring, cost, degradation
5. Edge-case catalog — traps + mitigations
6. Claude/MCP sidebar — vendor stack mapping

---

## Sharing & Deployment

### Share the Link
Course is live at: **https://efishachaf.github.io/Master-agentic-systems-on-prod/**

Share this URL with anyone—works on desktop, tablet, or mobile.

### Deploy Changes
Every push to `main` branch auto-deploys via GitHub Actions. To publish updates:

```bash
git add .
git commit -m "Your message"
git push origin main
```

Course updates live within ~2 minutes.

---

## License

This curriculum is the intellectual property of the author. All rights reserved.

---

## Questions?

- **Usage issues**: Check that JavaScript is enabled; clear browser cache if needed
- **Content feedback**: File an issue or submit a PR
- **Technical help**: See the `/help` in Claude Code

---

**Version**: 1.2
**Last updated**: July 2026
**Status**: Active development
