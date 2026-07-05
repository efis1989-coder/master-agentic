# Audit — Key-Terms Coverage vs. Source Content (all 32 chapters)

**Date:** 2026-07-05
**Scope:** Every chapter rendered on the Doctrine page (`/doctrine`) — Parts 0–5, 32 chapters.
**Deliverable:** Report first (this document) → apply agreed fixes after approval.
**Ground truth:** `npx tsx scripts/dump-glossary.ts` (reads `content/*.md`, builds the Course, prints each chapter's captured `glossary`). Current state: **32 chapters, 130 captured terms, 13 chapters at ZERO.**

---

## 1. How "Key terms" are produced (and why they drift)

Key terms are **not authored**. They are a by-product of which words happen to be wrapped in inline `**bold**`:

- Extraction — `extractGlossaryTerms()` (`src/content/parseUtils.ts:149-169`): scans each section, captures inline `**bold**` spans.
- Skipped lines: markdown-table rows (`|…`), list-item leads (`- `/`1. `), and standalone fully-bold lines (`STANDALONE_BOLD_RE`).
- Heuristic filter — `looksLikeTerm()` (`parseUtils.ts:131-136`): drops spans starting with a digit/`$`, containing a comma, or longer than 4 words.
- Regex ceiling — `INLINE_BOLD_RE = /\*\*([^*]{2,40})\*\*/g`: bold spans **> 40 chars are never matched** (explains much of Part 5's zero-capture).
- Global dedupe — `dedupeGlossaryGlobally()` (`buildCourse.ts:32-42`): the first chapter (in reading order) to introduce a term owns it; later chapters drop it.

**Consequence:** the list tracks *emphasis formatting*, not *concepts*. Two failure modes result:

1. **Coverage gaps** — genuine vocabulary is present in the source but authored as `*italic*`, inside a table, or as a heading, so it is invisible to the extractor. This is the dominant problem: the house style bolds **doctrine sentences** (skipped) and puts definitions in **italics** or **tables**.
2. **False terms** — captured spans that are emphasis, not vocabulary: §1 failure-story numbers, §6 design-exercise deliverable labels, and the `> **Doctrine check.**` blockquote label.

---

## 2. Executive summary

| Part | Chapters | Captured now | False positives | Coverage gaps | Zero-capture chapters |
|------|----------|-------------|-----------------|---------------|-----------------------|
| 0 | 0.1–0.3 | 44 | 14 | 18 | — |
| 1 | 1.1–1.3 | 24 | 9 | 23 | — |
| 2 | 2.1–2.5 | 2 | 2 | 105 | 2.1, 2.2, 2.4 |
| 3 | 3.1–3.6 | 6 | 6 | 118 | 3.2, 3.3, 3.6 |
| 4 | 4.1–4.7 | 45 | 41 | 100 | — |
| 5 | 5.1–5.8 | 9 | 2 | 113 | 5.1–5.7 |
| **Total** | **32** | **130** | **~74** | **~477** | **13** |

Headlines:
- **~57% of captured terms are false or mis-anchored** (74 of 130) — concentrated in Part 4, where §6 deliverable labels and §1 numbers dominate.
- **~477 genuine concepts are missing.** Parts 2, 3, and 5 are near-empty despite being the most concept-dense.
- **13 chapters capture zero terms**, including all of 5.1–5.7 (e.g. 5.5 Reinforcement Learning — the densest vocabulary chapter in the course).

---

## 3. Systematic patterns

Two distinct root causes need different fixes.

### 3a. True extractor bugs → fix in `parseUtils.ts` + regression tests

| # | Bug | Symptom | Fix |
|---|-----|---------|-----|
| B1 | Blockquote defeats the standalone-bold skip. `> **Doctrine check.**` and `> **Memory can amplify sycophancy.**` start with `> `, so `STANDALONE_BOLD_RE` (`/^\*\*…\*\*$/`) doesn't match and the label leaks as a "term". | `Doctrine check` (0.1), `Memory can amplify sycophancy` (2.3), `Router misclassification cascades` (2.5) | Strip leading blockquote markers/whitespace before the standalone-bold test in `extractGlossaryTerms()`. |
| B2 | Leading non-word char bypasses the number guard. `STARTS_WITH_NUMBER_RE = /^[\d$]/` misses `≤12 …`. | `≤12 agent-facing tools` (1.3) | Strip leading non-alphanumerics before the digit test. |

These two changes remove 4 false terms across the course and are covered by new cases in `tests/parseUtils.test.ts`.

> Note: the "`pass@k`/`pass^k` dropped by tokenization" theory is **not** a bug — both are correctly captured in **0.2** and then globally deduped away from later chapters (4.1). No code change needed.

### 3b. Authoring-convention mismatch → fix in content markdown

The extractor is working as designed; the source just doesn't bold its vocabulary. These are **not** heuristic-fixable without over-capturing. They are corrected per-chapter:

- **Gaps** → bold the *first, definitional* mention (dedupe keeps the first occurrence). Convert `*italic*` → `**bold**`, or add bold to a not-bolded/heading/table first mention.
- **False emphasis (§1 numbers, §6 deliverable labels)** → convert `**bold**` → `*italic*`. This **preserves the author's visible emphasis** in the reading view while removing it from extraction. Nothing is deleted.
- **Never touch** the standalone doctrine sentence or the `> **Doctrine check.**` blockquote lines.

The §6 design-exercise labels (all of Part 4's false positives) and §1 failure-story numbers are the two biggest false-positive families; both are pure `**`→`*` conversions.

---

## 4. Per-chapter findings

Status legend: **FALSE** = captured but not a term (recommend `**`→`*` or unbold); **GAP** = genuine concept missing (recommend bolding the definitional first mention). § = section number.

## Part 0 — Foundations

### 0.1 — The Agentic Spectrum & Design Philosophy

**False / junk captured:**

| Term | § | Why it's false | Fix |
|---|---|---|---|
| who owns control flow | §2 | Rhetorical question-fragment, not a noun term | `**`→`*` |
| Verification surface | §3 | Production-lens paragraph-lead label | `**`→`*` |
| Unit economics | §3 | Production-lens paragraph-lead label | `**`→`*` |
| Debuggability | §3 | Production-lens paragraph-lead label | `**`→`*` |
| On-call semantics | §3 | Production-lens paragraph-lead label | `**`→`*` |
| Doctrine check | §3 | Blockquote callout label (every chapter) | **B1 heuristic** |
| single call | §5 | Sidebar shorthand, thin vocabulary | `**`→`*` |

**Coverage gaps:**

| Term | § | Source state | Fix |
|---|---|---|---|
| earned autonomy | §2 | heading + standalone-bold sentence | bold definitional mention |
| task profile analysis | §2 | heading-only | bold definitional mention |
| agent-washing | §4 | in-table | bold definitional mention |
| hybrid drift | §4 | in-table | bold definitional mention |

### 0.2 — Why Production Is a Different Sport

**False / junk captured:**

| Term | § | Why it's false | Fix |
|---|---|---|---|
| architecture | §1 | Failure-story emphasis on a common word | `**`→`*` |
| Adversarial and hostile inputs | §2 | Paragraph-lead label; contains "and" | `**`→`*` |
| Accountability | §2 | Single common noun used as a label | `**`→`*` |

**Coverage gaps:**

| Term | § | Source state | Fix |
|---|---|---|---|
| compounding-error law | §2 | heading + standalone-bold sentence | bold definitional mention |
| silent success bias | §3/§4 | italic / in-table | bold definitional mention |
| horizon | §2 | not-bolded | bold definitional mention |
| nondeterminism | §2 | heading + standalone-bold sentence | bold definitional mention |
| deterministic validator | §2 | in-list (leading bold) | bold definitional mention |
| horizon creep | §4 | in-table | bold definitional mention |

### 0.3 — From Process to Specification

**False / junk captured:**

| Term | § | Why it's false | Fix |
|---|---|---|---|
| documentation and interviews | §2 | Discovery-source lead; contains "and" | `**`→`*` |
| tacit | §2 | Adjective, not a noun term | promote to `**tacit knowledge**` |
| observation | §2 | Bare common noun, thin lead | `**`→`*` |
| subrogation recovery | §6 | Design-exercise scenario instance | `**`→`*` |

**Coverage gaps:**

| Term | § | Source state | Fix |
|---|---|---|---|
| specification stack | §2 | heading-only | bold definitional mention |
| graderability test | §2/§4 | not-bolded | bold definitional mention |
| tacit knowledge | §2 | only "tacit" bolded | bold full noun-phrase |
| the fictional SOP | §4 | in-table | bold definitional mention |
| expert disagreement laundering | §4 | in-table | bold definitional mention |
| exception blindness | §4 | in-table | bold definitional mention |
| spec–reality drift | §4 | in-table | bold definitional mention |
| override rate | §1/§3 | not-bolded / list-lead | bold definitional mention |

## Part 1 — The Model Interface

### 1.1 — LLM Mechanics for System Builders

**False / junk captured:**

| Term | § | Why it's false | Fix |
|---|---|---|---|
| On-call reality | §3 | Production-lens paragraph-lead label | `**`→`*` |
| support agent | §6 | Design-exercise workload instance | `**`→`*` |

**Coverage gaps:**

| Term | § | Source state | Fix |
|---|---|---|---|
| prompt caching | §2 | inline-bold (likely > 40-char span) | ensure captured / bold term alone |
| cache-aware layout | §2 | standalone-bold sentence | bold definitional mention |
| lost in the middle | §2/§4 | list-lead / in-table | bold definitional mention |
| context rot | §2/§4 | list-lead / in-table | bold definitional mention |
| quadratic tax | §2 | heading-only | bold definitional mention |
| primacy and recency | §2 | list-lead; "and" would filter | bold each noun separately |

### 1.2 — Prompting as an Interface Contract

**False / junk captured:**

| Term | § | Why it's false | Fix |
|---|---|---|---|
| six days | §1 | Spelled-out failure-story duration | `**`→`*` |
| output-contract section | §6 | Design-exercise deliverable label | `**`→`*` |
| ledger-posting engine | §6 | Design-exercise scenario instance | `**`→`*` |

**Coverage gaps:**

| Term | § | Source state | Fix |
|---|---|---|---|
| interface contract | §2 | standalone-bold sentence + heading | bold definitional mention |
| instruction hierarchy | §2 | italic + heading | bold definitional mention |
| output contract | §2 | list-lead | bold definitional mention |
| delimit and label | §2 | list-lead | bold definitional mention |
| silent contract break | §4 | in-table | bold definitional mention |
| precedence ambiguity | §4 | in-table | bold definitional mention |
| token-boundary sensitivity | §4 | in-table | bold definitional mention |

### 1.3 — Tool Calling Anatomy & ACI Design

**False / junk captured:**

| Term | § | Why it's false | Fix |
|---|---|---|---|
| Selection-error cost | §3 | Production-lens paragraph-lead label | `**`→`*` |
| Silent-failure cost | §3 | Production-lens paragraph-lead label | `**`→`*` |
| ≤12 agent-facing tools | §6 | Deliverable label; leads with symbol/digit | **B2 heuristic** + `**`→`*` |
| one tool completely | §6 | Design-exercise instruction fragment | `**`→`*` |

**Coverage gaps:**

| Term | § | Source state | Fix |
|---|---|---|---|
| agent–computer interface (ACI) | §2 | not-bolded | bold definitional mention |
| tool loop | §2 | heading-only | bold definitional mention |
| tool choice mode | §2 | italic | bold definitional mention |
| poka-yoke | §2 | italic + heading | bold definitional mention |
| validation-with-feedback | §2 | italic | bold definitional mention |
| hallucinated tool / parameter | §4 | in-table | bold definitional mention |
| over-eager tool use | §4 | in-table | bold definitional mention |
| silent partial failure | §4 | in-table | bold definitional mention |
| tool schema drift | §4 | in-table | bold definitional mention |
| bloated return payload | §4 | in-table | bold definitional mention |

## Part 2 — Core Components

### 2.1 — Tools at Scale & the Model Context Protocol

**False / junk captured:** None.

**Coverage gaps:** Model Context Protocol (MCP) §2·not-bolded; host / client / server / tools / resources / prompts §2·italic (MCP primitives); integration substrate §2·italic; tool portfolio §2·heading; deferred/dynamic loading, tool search, per-task tool budgets §2·italic; selection-error curve, consolidation §2·not-bolded; granularity, idempotency keys, pagination discipline §2·italic; error contract §2·not-bolded; wrap vs. expose §2·italic; egress allow-list, provenance gate §2·in-diagram; governance layer §3·italic. → bold first definitional mention of each.

### 2.2 — Retrieval & Knowledge Systems

**False / junk captured:** None.

**Coverage gaps:** chunking, embedding choice, hybrid retrieval, reranking, citation grounding §2·italic; structure-aware chunking §2·not-bolded; agentic retrieval, just-in-time retrieval, context preloading §2·italic; lost-in-the-middle §2·not-bolded; source-of-truth hierarchy, live-API fallthrough §2·italic; volatility classification, freshness SLA §2·not-bolded; attributability gate, volatility router §2(caption)·not-bolded; ACL-aware retrieval, precedence policy §3·not-bolded; grounding-and-freshness contract §3·italic. → bold first definitional mention.

### 2.3 — Memory Architectures

**False / junk captured:**

| Term | § | Why it's false | Fix |
|---|---|---|---|
| Memory can amplify sycophancy | §3 | Full claim-sentence from a `>`-blockquote doctrine lead | **B1 heuristic**; keep as `*` emphasis |

**Coverage gaps:** working / episodic / semantic / procedural memory §2·italic; cache over truth §2·heading; write policy, retrieval policy §2·heading; scope isolation §2·italic; recency weighting §2·not-bolded; turn-level compaction, structured note-taking, sub-agent scratchpads, TTL, user-initiated deletion, contradiction-triggered invalidation §2·not-bolded; reconciliation gate §3·italic; sycophancy, write provenance, memory poisoning §3·not-bolded. → bold first definitional mention.

### 2.4 — Control Loops, Planning & Termination

**False / junk captured:** None.

**Coverage gaps:** ReAct, plan-then-execute, reflection/self-critique, evaluator-in-the-loop, search over plans, extended-thinking budgets §2·italic; max turns, token/cost budgets, confidence gates, progress metrics, oscillation detectors §2·italic; oscillation, sunk-cost retrying, progress illusion, effective progress §2·italic; escalate-after-N §2·not-bolded; plan staleness, replanning triggers §2·italic; commit vs. explore §2·not-bolded; budget propagation, "always leave fuel to land" §2·not-bolded; freeze rule §3·not-bolded; termination policy §3·italic. → bold first definitional mention.

### 2.5 — Orchestration Topologies

**False / junk captured:**

| Term | § | Why it's false | Fix |
|---|---|---|---|
| Router misclassification cascades | §3 | Full claim-sentence from a `>`-blockquote doctrine lead | **B1 heuristic**; keep as `*` emphasis |

**Coverage gaps:** chaining, routing, parallel sectioning, parallel voting, orchestrator–workers, evaluator–optimizer, hierarchical delegation §2·italic; cost/failure surface §2·not-bolded; isolation, shared context, result compression §2·italic; shared cache (read-once) §2·not-bolded; synchronous agents, ambient/async agents, deadline & cancellation propagation §2·italic; aggregation §2·heading; single point of intelligence failure §2·italic; conflict resolution, quorum/voting rules §2·not-bolded; duplicate-work elimination, partial-result policy §3·not-bolded; decomposition-and-aggregation contract §3·italic. → bold first definitional mention.

## Part 3 — Production Architecture

### 3.1 — The Deterministic Core & Agentic Overlay

**False / junk captured:**

| Term | § | Why it's false | Fix |
|---|---|---|---|
| Review standard | §6 | Exercise rubric label | `**`→`*` |

**Coverage gaps:** deterministic core, probabilistic overlay §2·not-bolded; intent §2·italic; ports and adapters §2·heading; typed intent schema, port, adapter, seam §2·not-bolded; idempotency key, exactly-once effects, saga §2·italic; compensating action §2·not-bolded; principal chain §2·italic; attribution §2·heading; boundary erosion, architectural fitness function §3·not-bolded; outbox pattern §4·in-table. → bold first definitional mention.

### 3.2 — State, Durable Execution & Long-Running Work

**False / junk captured:** None.

**Coverage gaps:** durable execution §2·heading; durable workflow engine, event-sourced log §2·not-bolded; decision log, effect log §2·italic; suspension §2·heading; signal, timer, escalation §2·italic; memoization §2·italic; state machine §2·not-bolded; mid-flight versioning §2·heading; zombie workflow §3·not-bolded; poison-pill event, dead-letter lane §4·in-table; reaper policy, clock discipline §3·not-bolded. → bold first definitional mention.

### 3.3 — Human-in-the-Loop as an Engineered System

**False / junk captured:** None.

**Coverage gaps:** risk-tiered autonomy matrix §2·heading; action class, blast radius, reversibility, oversight tier §2·italic; review ergonomics §2·heading; diff §2·italic; uncertainty surfacing §2·not-bolded; attention budgeting §2·heading; sampling-based review §2·italic; escalation design §2·heading; fallback approver chain §2·not-bolded; trust calibration §2·heading; rubber-stamp rate, catch rate on seeded errors, reviewer disagreement §2·italic; seeded-error canary, accountability gap, evidence-completeness requirement, HITL latency §3·not-bolded. → bold first definitional mention.

### 3.4 — Guardrails, Sandboxing & Blast-Radius Containment

**False / junk captured:**

| Term | § | Why it's false | Fix |
|---|---|---|---|
| send email | §6 | Exercise capability label (verb-phrase) | `**`→`*` |
| initiate a payment | §6 | Exercise capability label (verb-phrase) | `**`→`*` |

**Coverage gaps:** blast radius §2·heading; blast-radius analysis, containment §2·not-bolded; containment stack §2·heading; defense in depth §2·not-bolded; capability-scoped permissions §2·italic; least privilege §2·not-bolded; sandboxed execution §2·italic; egress control/allow-list §2·not-bolded; budgets, reversibility and preview §2·italic; dry-run §2·not-bolded; kill switches §2·italic; guardrail §2·not-bolded; pre-model / post-model / pre-effect guardrail §2·italic; effect seam §2·not-bolded; reversibility engineering §2·heading; soft delete/tombstone §2·not-bolded; false-positive fatigue, guardrail precision §2·not-bolded; atomic budget reservation §4·in-table. → bold first definitional mention.

### 3.5 — Security & Identity for Agentic Systems

**False / junk captured:**

| Term | § | Why it's false | Fix |
|---|---|---|---|
| private data | §2 | Only meaningful as a leg of the lethal trifecta | fold under `**lethal trifecta**`; else `**`→`*` |
| untrusted content | §2 | Only meaningful as a leg of the lethal trifecta | fold under `**lethal trifecta**`; else `**`→`*` |
| communicate externally | §2 | Verb-phrase; real term is the noun "exfiltration channel" | `**`→`*`; bold `**exfiltration channel**` |

**Coverage gaps:** prompt injection, direct injection, indirect injection §2·italic; lethal trifecta §2·heading; exfiltration channel, egress §2·not-bolded; dual-LLM / quarantined-reader pattern §2·italic; capability confinement (CaMeL), output minimization, egress allow-list §2·italic; super-agent service account, confused-deputy attack §2·not-bolded; workload identity, short-lived scoped credentials, human principal, OAuth on-behalf-of §2·italic; tool poisoning/rug-pull, memory poisoning, cross-agent/cross-MCP attacks §2·italic; unicode smuggling §2·not-bolded. → bold first definitional mention.

### 3.6 — Agentic Product Design, UX & Trust

**False / junk captured:** None.

**Coverage gaps:** calibrated trust §2·italic; overtrust, undertrust §2·not-bolded; plan-preview → approve → execute, streaming narration, interruptibility/mid-task steering, undo as a visible affordance §2·italic; expectation architecture §2·heading; explicit scope, graceful refusal, error messaging §2·italic; blame asymmetry §2·not-bolded; feedback flywheel §2·heading; intervention rate, delegation depth, trust-adjusted retention, recovery rate after first failure §2·italic; autonomy cliff, transparency backfire §4·in-table; legibility §7·italic. → bold first definitional mention.

## Part 4 — Evaluation & Operations

*(Note: every Part-4 chapter's captured set is dominated by §6 design-exercise deliverable labels and §1 failure-story numbers. All are `**`→`*` conversions.)*

### 4.1 — Evaluation Foundations

**False / junk captured:** None.

**Coverage gaps:** outcome metrics, process metrics, capability evals, regression suites §2·italic; pass@k, pass^k §2·already owned by 0.2 (dedupe) — no action; golden sets, mined production traces, synthetic data, stratification §2·italic; error analysis §2·not-bolded; minimum detectable effect §2·italic; bootstrap confidence interval §2·not-bolded; Simpson's paradox, Goodharting §3·italic. → bold first definitional mention.

### 4.2 — LLM-as-Judge & Grader Validation

**False / junk captured:**

| Term | § | Why it's false | Fix |
|---|---|---|---|
| agreement thresholds | §6 | Deliverable label | `**`→`*` |
| revocation criteria | §6 | Deliverable label | `**`→`*` |
| calibration set | §6 | Genuine but mis-anchored; real origin §2 | re-anchor bold to §2 |
| bias battery | §6 | Genuine but mis-anchored; real origin §2 | re-anchor bold to §2 |
| drift monitor | §6 | Genuine but mis-anchored; real origin §2 | re-anchor bold to §2 |

**Coverage gaps:** measurement instrument §2·italic/heading; rubric decomposition, pointwise / pairwise / chain-of-thought / reference-anchored grading §2·italic; position bias, verbosity bias, self-preference, sycophancy §2·italic; Cohen's kappa, Matthews correlation coefficient §2·italic; meta-evaluation, structural independence §2·italic. → bold first definitional mention.

### 4.3 — Observability, Tracing & Feedback Capture

**False / junk captured:**

| Term | § | Why it's false | Fix |
|---|---|---|---|
| Five | §1 | Spelled-out failure-story number | `**`→`*` |
| Zero | §1 | Spelled-out failure-story number | `**`→`*` |
| Four hours | §1 | Spelled-out failure-story duration | `**`→`*` |
| eight seconds | §1 | Spelled-out failure-story duration | `**`→`*` |
| span taxonomy | §6 | Deliverable label | `**`→`*` |
| capture-and-redaction policy | §6 | Deliverable label | `**`→`*` |
| cost-attribution view | §6 | Deliverable label | `**`→`*` |
| sampling plan | §6 | Deliverable label | `**`→`*` |

**Coverage gaps:** session, trace, span §2·italic; OpenTelemetry GenAI semantic conventions §2·italic; redaction policy, tiered retention §2·not-bolded; cost attribution, online evaluation, input drift, output-quality drift §2·italic; explicit / implicit feedback, abandonment §2·italic; cardinality explosion §3·italic. → bold first definitional mention.

### 4.4 — Reliability Engineering for Nondeterministic Systems

**False / junk captured:**

| Term | § | Why it's false | Fix |
|---|---|---|---|
| full outage | §1 | Failure-story outcome emphasis | `**`→`*` |
| five-figure token bill | §1 | Spelled-out failure-story cost | `**`→`*` |
| resilience policy | §6 | Deliverable label | `**`→`*` |
| grounded-answer quality SLO | §6 | Deliverable label | `**`→`*` |
| SLO set | §6 | Deliverable label | `**`→`*` |
| resilience-stack settings | §6 | Deliverable label | `**`→`*` |
| four-stage degradation ladder | §6 | Deliverable label | `**`→`*` |
| load-shedding plan | §6 | Deliverable label | `**`→`*` |

**Coverage gaps:** service-level objective §2·italic; error budget §2·not-bolded; resilience stack §2·heading; timeouts, retries w/ backoff+jitter, idempotency keys, circuit breakers, bulkheads §2·italic; fallback chains, quality-cliff awareness §2·italic; load shedding, admission control §2·italic; priority classes §2·not-bolded; budget-aware retries §3·italic. → bold first definitional mention.

### 4.5 — Cost & Latency Operations

**False / junk captured:** cost-reduction plan, ranked lever list, expected savings, quality risk, eval gate, governance — all §6 deliverable labels → `**`→`*`.

**Coverage gaps:** cost per resolved task §2·italic/heading; prompt caching, semantic caching, model cascades and routing, output-length discipline, batch processing §2·italic; time-to-first-token, streaming, perceived-latency design §2·italic; budget governance, anomaly detection on spend §2·italic; total cost of ownership §2·italic; uncertainty estimation, semantic cache poisoning §3·italic. → bold first definitional mention.

### 4.6 — Change Management & Release Engineering

**False / junk captured:** prompt + model upgrade, coupled release unit, shadow duration, canary slices, auto-rollback triggers, re-baselining step — §6 deliverable labels → `**`→`*`; gate ladder — genuine but mis-anchored, re-anchor bold to §2.

**Coverage gaps:** versioned quartet §2·heading; pinning policy, tool schemas §2·italic; regression suites in CI, shadow deployment, canary rollout, A/B testing §2·italic; horizon §2·italic; model migration, side-by-side eval protocol, baseline management, re-baselining protocol §2·italic; coupling the release, eval-gate erosion, gate latency §3·italic. → bold first definitional mention.

### 4.7 — Compliance, Audit & Governance

**False / junk captured:** audit-readiness specification, credit decisions, retention matrix, oversight evidence, regulator-facing narrative — §6 deliverable labels → `**`→`*`; provenance-bundle schema, tamper-evidence mechanism — genuine terms mis-anchored, re-anchor bold to §2 (`provenance bundle`, `tamper-evidence`).

**Coverage gaps:** auditability §2·italic/heading; EU AI Act §2·italic; human oversight §2·not-bolded; NIST AI RMF, ISO/IEC 42001 §2·italic; provenance bundle, tamper-evidence, hash chains, write-once-read-many storage §2·italic; process transparency, mechanistic reproducibility §2·italic; data governance, legal-hold tiers, pseudonymization §2·italic. → bold first definitional mention.

## Part 5 — Frontier & Platform

*(Chapters 5.1–5.7 capture ZERO terms — the 40-char `INLINE_BOLD_RE` ceiling plus all-italic §2 vocabulary. This part has the largest coverage debt.)*

### 5.1 — Multi-Agent Systems

**False / junk captured:** None.

**Coverage gaps:** consensus laundering §1·not-bolded; orchestrator-worker §2·not-bolded; parallelizable breadth, context-window partitioning, privilege separation §2·italic; independence assumption §2·heading; correlated-grader problem §2·not-bolded; message passing, shared blackboard §2·not-bolded; result compression §2·standalone-bold; credit-assignment problem, recursive delegation, global budget authority §2·not-bolded. → bold first definitional mention.

### 5.2 — Long-Horizon Agents & Context Engineering at Scale

**False / junk captured:** None.

**Coverage gaps:** context engineering §2·not-bolded; context rot §3·not-bolded; protected-fact register, decision journals, structured note-taking §2·italic; goal register §2·italic; instruction supersession §2·heading; precedence reconciliation §2·not-bolded; goal drift §2·not-bolded; drift detection, re-confirmation triggers §2·italic; compaction §2·not-bolded; just-in-time retrieval §2·not-bolded; idle-state hygiene §2·not-bolded; canary questions §3·not-bolded. → bold first definitional mention.

### 5.3 — Code Agents & Computer Use

**False / junk captured:** None.

**Coverage gaps:** reward hacking §1·not-bolded; verification loop §2·standalone-bold; capability scoping, deny-lists §2·not-bolded; hardened verifier design §2·italic; protected test sets, mutation testing §2·not-bolded; computer use §2·heading; screenshot-act loop §2·not-bolded; API-first, GUI-fallback §2·italic (comma triggers filter — rephrase); code search over preloading §2·heading; review-burden budgeting §2·not-bolded; specification gaming §3·not-bolded; ephemeral sandbox §2·not-bolded. → bold first definitional mention.

### 5.4 — Learning Loops & Self-Improvement

**False / junk captured:** None.

**Coverage gaps:** improvement ladder §2·heading; data flywheel §2·not-bolded; flywheel hygiene §2·heading; supervised fine-tuning, preference optimization, distillation, automated prompt optimization §2·not-bolded; label-quality gates, counterfactual capture, negative-example mining, human verification sampling §2·italic; holdout population §2·not-bolded; catastrophic forgetting, eval overfitting, data leakage §2·italic; lineage tracking §2·not-bolded; **kill criteria §6·not-bolded — should own this over 5.8 (see note)**. → bold first definitional mention.

> **Ownership drift:** `kill criteria` is genuinely introduced in **5.4 §6** but currently captured only by **5.8 §2** (5.4's mention isn't bolded). Bolding 5.4's first mention restores correct first-chapter ownership; 5.8 then defers via global dedupe.

### 5.5 — Reinforcement Learning for Agentic Systems

**False / junk captured:** None.

**Coverage gaps (densest chapter):** policy, environment, rollout, reward §2·italic; SFT, RLHF, RLAIF, RLVR §2·italic; PPO, GRPO §2·italic; agentic RL §2·heading; sparse-reward problem, process reward models, outcome reward models §2·italic; two-faced verifier §2·not-bolded; environments economy §2·quoted. → bold first definitional mention.

### 5.6 — The Agent Interoperability & Commerce Stack

**False / junk captured:** None.

**Coverage gaps:** mandate §2·italic; tool layer, agent layer, payment layer §2·italic; A2A §2·not-bolded; Agent Cards §2·quoted; behavioral attestation §2·italic; delegation chains §2·heading; counterparty evals §2·standalone-bold; protocol-tracking §2·not-bolded; reputation-and-attestation layer §2·not-bolded; non-repudiable §2·not-bolded. → bold first definitional mention.

### 5.7 — Economics, Organization & Strategy

**False / junk captured:** None.

**Coverage gaps:** capability half-life §2·italic; cheap-agent-expensive-babysitter trap, Jevons effects, outcome-metric gaming §2·italic; moat analysis §2·not-bolded; outcome pricing §2·italic; platform team, embedded agent engineers, eval owner §2·italic; Conway's law §2·heading; orphan agent §2·quoted; total cost of ownership §3·not-bolded; blast radius §2·italic; multi-provider posture §2·not-bolded. → bold first definitional mention.

### 5.8 — The Agent Platform: Fleet Architecture & Portfolio Governance

**False / junk captured:**

| Term | § | Why it's false | Fix |
|---|---|---|---|
| queryable in incident time | §2 | Predicate clause, not a noun-phrase | `**`→`*` |
| platform disposes | §3 | Verb phrase (rhetorical echo) | `**`→`*` |

*Retained (genuine): agent registry, paved road, Emergent coupling, Common-mode failure, Feedback loops, Resource contention. `kill criteria` defers to 5.4 once bolded there.*

**Coverage gaps:** shadow agents §4·in-table; orphan agent §2·not-bolded; control plane §2·heading; credential layer §2·>40-char bold; dependency edges §2·not-bolded; pairwise interaction paths §2·not-bolded; silent input drift §4·in-table; portfolio governance §2·heading; re-attestation §2·not-bolded; provider-version dispersion §3·not-bolded; quarterly portfolio review §2·not-bolded; Portfolio Goodhart §4·in-table. → bold first definitional mention.

---

## 5. Recommended fix strategy (Phase 4)

**Step 1 — Extractor bugs (code + tests).** Apply B1 (strip leading `>`/whitespace before the standalone-bold skip) and B2 (strip leading non-alphanumerics before the digit guard) in `src/content/parseUtils.ts`; add regression cases to `tests/parseUtils.test.ts`. Removes `Doctrine check`, `Memory can amplify sycophancy`, `Router misclassification cascades`, and the `≤12 …` capture.

**Step 2 — Remove false emphasis (content, `**`→`*`).** Convert §1 failure-story numbers and §6 design-exercise deliverable labels from bold to italic. Highest-leverage, lowest-risk: clears ~60 false positives (most of Part 4) while preserving visible emphasis. Never touch doctrine sentences or `> **Doctrine check.**` lines.

**Step 3 — Fill coverage gaps (content, bold definitional first mention).** Bold the first, definitional mention of each GAP term (convert `*italic*`→`**bold**`, or bold a not-bolded/heading/table first mention). Respect global dedupe: bold only the earliest chapter that defines a shared term (e.g. `blast radius` in 3.3 before 3.4/5.7; `kill criteria` in 5.4 before 5.8). Suggested order by leverage: Part 5 (zero-capture, densest) → Part 2 → Part 3 → Parts 0/1/4 cleanup.

Because Step 3 spans ~477 edits across all 32 files, it can be delivered in one pass or phased part-by-part — your call on batching.

## 6. Verification (Phase 5)

- `npx tsx scripts/dump-glossary.ts` — before/after diff of captured terms per chapter (expect false positives gone, gaps filled, dedupe honored).
- `npm test` — `tests/parseUtils.test.ts` (incl. new B1/B2 cases) + `tests/mastery.test.ts` pass.
- `npm run content:check` — content validator passes.
- `npm run lint` — Biome clean.
- Optional: `npm run dev` → open `/doctrine`, expand a few chapters' "Key terms", confirm gaps filled / junk gone and section links resolve.

---

### Approval checkpoint

Please confirm how you'd like to proceed:
1. **All three steps, full pass** (bugs + false-emphasis cleanup + all ~477 gap fills), or
2. **Steps 1–2 only** (extractor bugs + false-positive cleanup) as a first, low-risk PR, then gaps in a follow-up, or
3. **Phased by Part** for the gap fills.

No content or code is edited until you choose.
