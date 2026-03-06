# Architecture Spec — Go Learning App

_Version: 0.3 | Status: Review | Last updated: 2025-03-06_

---

## 1. Purpose

This document defines the high-level architecture, monorepo structure, toolchain decisions, and development philosophy for a fullstack JavaScript application that allows users to learn and play the board game Go.

It is the root document of the spec system. All other specs are children of this one.

---

## 2. Scope

**In scope:**
- Monorepo structure and package boundaries
- Frontend and backend framework choices
- Database and persistence strategy
- Testing stack and methodology
- Spec system organization
- CI/tooling conventions

**Out of scope:**
- Feature-level behavior (see feature specs)
- Game rules implementation detail (see rules spec)
- Deployment and hosting (deferred to post-MVP)

---

## 3. Development Philosophy

This project follows an **AI-first, Spec-Driven Development** approach:

1. **Spec before code.** No feature is implemented without a corresponding spec.
2. **BDD bridges spec and tests.** Acceptance criteria are expressed as executable Gherkin scenarios.
3. **TDD governs implementation.** Tests are written before implementation code, against locked specs.
4. **Progressive elaboration.** Specs are written just-in-time per phase — not upfront for the whole system.
5. **Specs are living documents.** When code changes behavior, the spec is updated first, then tests, then code.

### Definition of Done (per feature)
- [ ] Spec is written and reviewed
- [ ] BDD scenarios cover all acceptance criteria
- [ ] Tests are written and failing before implementation
- [ ] Implementation passes all tests
- [ ] Spec updated if implementation revealed new understanding
- [ ] Spec index regenerated

---

## 4. Phased Delivery

| Phase | Goal | Spec Location |
|---|---|---|
| **POC** | Prove core technical loop (render board, place stone) | `/specs/poc.spec.md` |
| **Primitive** | Full end-to-end game loop, barely usable | `/specs/primitive.spec.md` |
| **MVP** | Complete, playable game for two authenticated players over the network | Feature specs, co-located with code |
| **Feature Sets** | Progressive enhancement (scoring, AI, history, accounts) | Co-located with feature code |

---

## 5. Monorepo Structure

```
/
├── specs/                              # System-level documents
│   ├── INDEX.md                        # Auto-generated — never edit
│   ├── architecture.spec.md            # This document
│   ├── taxonomy.spec.md                # Document type definitions
│   ├── poc.spec.md                     # Phase-level spec
│   ├── primitive.spec.md               # Phase-level spec
│   │
│   ├── domain/                         # Platonic domain models
│   │   ├── go-game.domain.md
│   │   ├── scoring.domain.md
│   │   └── player.domain.md
│   │
│   ├── adr/                            # Architecture Decision Records
│   │   ├── 20260306__adr__auth-provider.md
│   │   ├── 20260306__adr__realtime-stack.md
│   │   └── 20260306__adr__monorepo-shape.md
│   │
│   ├── research/                       # Prior art and spike records
│   │   └── 20260306__research__board-rendering-spike.md
│   │
│   └── runbooks/                       # Operational procedures (post-MVP)
│
├── apps/
│   ├── client/
│   │   └── src/
│   │       └── features/
│   │           └── [feature]/
│   │               ├── [feature].spec.md           # Living behavior spec
│   │               ├── YYYYMMDD__plan__[feature].md # Transient plan
│   │               ├── [feature].tsx
│   │               └── [feature].test.ts
│   │
│   └── server/
│       └── src/
│           └── [domain]/
│               ├── [domain].spec.md
│               ├── YYYYMMDD__plan__[domain].md
│               ├── [domain].service.ts
│               └── [domain].test.ts
│
├── packages/
│   └── shared/
│       └── src/
│           └── [module]/
│               ├── [module].spec.md
│               ├── [module].ts
│               └── [module].test.ts
│
├── scripts/
│   └── index-specs.mjs                 # Spec index generator
│
├── .husky/
└── package.json
```

---

## 6. Toolchain

### Monorepo
| Concern | Tool | Rationale |
|---|---|---|
| Workspace management | `pnpm workspaces` | Fast, efficient, first-class monorepo support |
| Build orchestration | `turbo` | Incremental builds, caching across packages |

### Frontend
| Concern | Tool | Notes |
|---|---|---|
| Primary framework | React | Host shell and default component framework |
| Alt frameworks | Svelte, Solid, Mithril, Elm (future) | Web Components boundary pattern when experimentation begins — see Section 9 |
| Language | TypeScript | Required across all packages |
| Styling | Tailwind CSS | Utility-first, minimal config |
| Testing | Vitest + React Testing Library | Co-located with components |
| BDD | `@vitest/bdd` or Cucumber.js | TBD based on POC findings |
| E2E | Playwright | MVP phase and beyond |

### Backend
| Concern | Tool | Notes |
|---|---|---|
| Runtime | Node.js (LTS) | |
| Framework | Express | Familiar, flexible, unobtrusive |
| Language | TypeScript | |
| API style | REST | tRPC deferred to post-MVP consideration |
| Real-time | Socket.io | WebSocket layer for live game play; chat deferred to Feature Sets |
| Auth | Auth.js | Session management, JWT strategy, OAuth-ready; Socket.io handshake auth included |
| Testing | Vitest + Supertest | |

### Shared
| Concern | Tool |
|---|---|
| Game logic | Pure TS in `/packages/shared` |
| Types | Shared across client and server |
| Validation | Zod |

### Database
| Concern | Tool | Notes |
|---|---|---|
| Local dev | SQLite | Zero-config, file-based |
| Production | PostgreSQL | ? Deferred to post-MVP |
| ORM | Drizzle | Lightweight, TypeScript-native |

### CI / Tooling
| Concern | Tool |
|---|---|
| Linting | ESLint + Prettier |
| Git hooks | Husky + lint-staged |
| Spec indexing | Custom script — `scripts/index-specs.mjs` |
| CI | GitHub Actions |

---

## 7. Spec System

### Document Taxonomy
This project uses a structured taxonomy of six document types, each with distinct purpose, lifespan, and naming conventions. See **[taxonomy.spec.md](./taxonomy.spec.md)** for the full definition.

| Type | Pattern | Lifespan |
|---|---|---|
| `spec` | `[subject].spec.md` | Permanent, living |
| `plan` | `YYYYMMDD__plan__[subject].md` | Transient, historical |
| `domain` | `[concept].domain.md` | Permanent, living |
| `research` | `YYYYMMDD__research__[subject].md` | Permanent, static |
| `adr` | `YYYYMMDD__adr__[decision].md` | Permanent, append-only |
| `runbook` | `[procedure].runbook.md` | Permanent, living |

### Auto-Generated Index
`/specs/INDEX.md` is generated by `scripts/index-specs.mjs` and must never be edited manually.

The script runs:
- As a pre-commit hook (via Husky)
- As a CI step on every push to `main`

The index captures per spec:
- File path and link
- Title (from H1)
- Acceptance criteria count
- BDD scenario count
- Open questions count

### Spec Status Values
Each spec carries a status in its header:

| Status | Meaning |
|---|---|
| `Draft` | Being written, not yet reviewed |
| `Review` | Ready for collaborative review |
| `Locked` | Approved — implementation may begin |
| `Superseded` | Replaced by a newer spec |

---

## 8. Open Questions

- ? **Database for production:** SQLite confirmed for local dev. PostgreSQL is the assumed production target — hosting and migration strategy deferred to post-MVP.
- ? **BDD tooling:** `@vitest/bdd` keeps the stack unified. Cucumber.js has broader ecosystem support. Decide during POC test setup.

### Resolved
- ~~Multi-framework isolation~~ → Web Components pattern, React-only until experimentation is wanted
- ~~Auth provider~~ → Auth.js confirmed. JWT learning deferred to a separate lower-stakes side project.
- ~~Socket.io vs raw `ws`~~ → Socket.io confirmed
- ~~Real-time scope~~ → Live game play at MVP; chat deferred to Feature Sets
- ~~API style~~ → REST confirmed; tRPC deferred to post-MVP

---

## 9. Multi-Framework Frontend Strategy

React serves as the **host shell** — routing, layout, auth context, and shared UI all live in React. All development is React-only until the project is stable and experimentation is explicitly desired.

When alternative framework experimentation begins, the **Web Components boundary pattern** is the chosen approach: each alternative framework (Svelte, Solid, Mithril, Elm) compiles its component to a Web Component that React renders as a standard custom element. This enables component-level granularity without forking the routing or shell.

```
/apps/client/src/features/
  board-svelte/               ← future experiment, not built yet
    Board.svelte              ← compiles to <go-board> Web Component
    board-svelte.spec.md
```

No Web Component infrastructure needs to be scaffolded now. This section is a recorded decision, not an active build requirement.
