# Document Taxonomy

_Version: 1.0 | Status: Locked | Last updated: 2025-03-06_
_Parent: [architecture.spec.md](./architecture.spec.md)_

---

## Purpose

This document defines the official taxonomy of document types used across this project. Every file in the spec system belongs to one of these types. Each type has a distinct purpose, lifespan, naming convention, and set of rules about what it may and may not contain.

The goal is expressive, non-redundant documentation where the filename alone communicates what kind of document you're opening and how current it is.

---

## Document Types

### 1. `spec` — Living Behavior Contract

**What it is:** The canonical, always-current description of how a feature or system behaves from a product perspective. A spec is never "done" — it is updated whenever behavior changes.

**Who it's for:** Anyone who wants to understand what a feature does — developers, collaborators, or an AI working in the codebase. It should be readable without knowledge of the implementation.

**What it contains:**
- Purpose and scope
- Acceptance criteria (numbered, plain English)
- BDD scenarios (Gherkin)
- Domain model as it relates to the product experience
- Current status and open questions

**What it never contains:**
- Technology or implementation choices
- Migration or rollout notes
- References to specific plans or how something was built

**Lifespan:** Permanent and living. Updated in place. Never superseded — only revised.

**Naming:** `[subject].spec.md`
**Examples:** `game.spec.md`, `board.spec.md`, `auth.spec.md`

---

### 2. `plan` — Transient Implementation Document

**What it is:** A time-bound document describing how a specific slice of a spec will be implemented. Plans are written before building and become historical record once shipped. They are never updated retroactively.

**Who it's for:** The developer(s) actively building the feature right now.

**What it contains:**
- Reference to the spec it implements (required)
- Technical approach and data model changes
- The specific acceptance criteria slice being addressed
- Migration or rollout steps
- Known risks and open implementation questions
- Outcome notes once complete (appended after shipping)

**What it never contains:**
- Behavioral definitions (those belong in the spec)
- Domain knowledge (that belongs in a domain doc)

**Lifespan:** Transient. Written once, never edited after the work ships. Superseded plans are kept as historical record.

**Naming:** `YYYYMMDD__plan__[subject].md`
**Examples:** `20260306__plan__board-svg-poc.md`, `20260310__plan__game-session-primitive.md`

---

### 3. `domain` — Platonic Domain Model

**What it is:** A definition of a concept as it exists in the real world, completely independent of this application or any technology. Domain docs establish the shared vocabulary for the entire project.

**Who it's for:** Everyone. Domain docs are the glossary. Specs and plans cite them rather than redefining terms inline.

**What it contains:**
- Concept definitions in plain English
- Natural rules and constraints (e.g. the rules of Go)
- Relationships between concepts
- Diagrams where helpful
- Zero technology or application-specific content

**What it never contains:**
- Application behavior or UI
- Implementation details
- References to any technology

**Lifespan:** Permanent and living. Updated only when domain understanding deepens, not when the application changes.

**Naming:** `[concept].domain.md` — lives in `/specs/domain/`
**Examples:** `go-game.domain.md`, `scoring.domain.md`, `player.domain.md`

---

### 4. `research` — Explorations and Prior Art

**What it is:** A recorded investigation — either of external prior art (how other products solve a problem) or an internal spike (we tried three approaches and here's what we found). Research documents are observational and conclude with a finding or recommendation.

**Two flavors:**
- **Prior art** — observational, external-facing. e.g. "How does Lichess handle live scoring?"
- **Spike** — experimental, internal-facing. e.g. "We evaluated three board rendering approaches."

Both flavors are the same document type. The distinction is noted in the document body or filename suffix if useful.

**What it contains:**
- Context and motivation for the research
- Observations, findings, links, screenshots
- **A conclusion or recommendation** — research without a conclusion is just notes

**What it never contains:**
- Behavioral definitions or acceptance criteria
- Implementation instructions (those go in a plan)

**Lifespan:** Permanent but static. Written once, not updated. New research on the same topic is a new document.

**Naming:** `YYYYMMDD__research__[subject].md`
**Examples:** `20260306__research__lichess-live-scoring.md`, `20260306__research__board-rendering-spike.md`

---

### 5. `adr` — Architecture Decision Record

**What it is:** A permanent record of a significant architectural decision — what was decided, why, what alternatives were considered, and what the consequences are. ADRs explain the "why" behind the architecture for anyone who wasn't in the room.

**Who it's for:** Future developers (and future AI collaborators) who encounter a decision and need to understand its rationale before changing it.

**What it contains:**
- Context — what problem or question prompted the decision
- Decision — what was chosen, stated plainly
- Alternatives considered — what else was evaluated and why it was rejected
- Rationale — why this option was chosen
- Consequences — what this decision makes easier or harder going forward

**What it never contains:**
- Implementation instructions
- Behavioral definitions

**Lifespan:** Permanent and append-only. An ADR is never edited after it is written. If a decision is reversed, a new ADR is written that supersedes the old one. The old ADR is marked superseded but kept.

**Naming:** `YYYYMMDD__adr__[decision].md` — lives in `/specs/adr/`
**Examples:** `20260306__adr__auth-provider.md`, `20260306__adr__realtime-stack.md`

---

### 6. `runbook` — Operational Procedure

**What it is:** A step-by-step description of how to operate, maintain, or debug the running system. Runbooks are practical and procedural.

**Who it's for:** Anyone operating the system in production.

**What it contains:**
- Prerequisites
- Step-by-step procedure
- Expected outcomes at each step
- Troubleshooting for common failure modes

**What it never contains:**
- Behavioral definitions or domain knowledge
- Architectural rationale (link to the ADR instead)

**Lifespan:** Permanent and living. Updated whenever the procedure changes.

**Naming:** `[procedure].runbook.md`
**Examples:** `deploy.runbook.md`, `rollback.runbook.md`, `debug-game-session.runbook.md`

**Note:** Not needed until post-MVP. The type is reserved.

---

## Naming Convention Summary

| Type | Naming Pattern | Lifespan | Location |
|---|---|---|---|
| `spec` | `[subject].spec.md` | Permanent, living | Co-located with feature code; phase-level in `/specs/` |
| `plan` | `YYYYMMDD__plan__[subject].md` | Transient, historical | Co-located with feature code |
| `domain` | `[concept].domain.md` | Permanent, living | `/specs/domain/` |
| `research` | `YYYYMMDD__research__[subject].md` | Permanent, static | `/specs/research/` |
| `adr` | `YYYYMMDD__adr__[decision].md` | Permanent, append-only | `/specs/adr/` |
| `runbook` | `[procedure].runbook.md` | Permanent, living | `/specs/runbooks/` |

---

## Rules

1. **The filename communicates the type.** You should never need to open a document to know what kind it is.
2. **Specs never contain implementation detail.** If you find yourself writing about technology in a spec, move it to a plan or ADR.
3. **Plans always reference a spec.** A plan with no parent spec is an orphan and should not exist.
4. **Domain docs cite no technology.** If a domain doc mentions a framework or database, it is wrong.
5. **Research always concludes.** A research document without a conclusion or recommendation is incomplete.
6. **ADRs are never edited.** Changing your mind means writing a new ADR, not revising the old one.
7. **The spec index recognizes all types.** The auto-generated `INDEX.md` groups documents by type, not just by directory.

---

## Relationship Between Types

```
domain doc          ← defines vocabulary used by →         spec
    ↑                                                        ↑
cited by                                               implemented by
    ↑                                                        ↑
  spec              ← behavioral contract referenced by → plan
                                                             ↑
                                              informed by research + ADRs
```

---

## Open Questions

- ? **BDD tooling:** Does the chosen BDD tool (Vitest BDD vs Cucumber.js) affect how scenarios are stored in spec files? Decide during POC test setup.
