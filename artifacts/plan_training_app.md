# Plan: "Production Agentic Systems" Training App

## Context

The folder now holds a complete, self-authored curriculum — **36 Markdown files, ~116k words**:
a master syllabus, a style spec, **30 chapters** (Parts 0–V), **3 capstones** (A/B/C),
and a **60-question mock certification exam** with answer key. You want a responsive
web app (desktop + mobile) that lets you consume this like a book, always resume
where you left off, and reinforce memory with quizzes, spaced repetition, an exercise
checklist, and notes/highlights — all progress stored on-device.

**The key discovery:** every chapter follows a *strict, uniform skeleton* (defined in
`manual-style-spec.md` and exemplified in `chapter-0-1-agentic-spectrum.md`), so the
interactive content **already exists in the source and is machine-parseable**:

- **§7 Self-test** — 5 claims to judge true/false + one-sentence justification, *with an
  argued answer key in italics* → becomes **auto-graded quizzes**.
- **§8 Spaced-review card** — 3 from-memory prompts → become **spaced-repetition cards**.
- **§6 Design exercise** — a whiteboard prompt + explicit *review standard* → becomes an
  **exercise checklist item** (you do it "aside," mark it done, optionally paste your answer).
- `certification-exam-blueprint.md` — 60 MCQs (A–D) grouped by six domains + an answer-key
  table + 3 design prompts with rubrics → becomes an **auto-scored Mock Exam mode**.

So **no hand-authoring of questions is required** — the app parses what you already wrote.

Decisions locked in: Markdown content · responsive website · on-device only · all four
interactive features (quizzes, spaced repetition, exercise checklist, notes/highlights).

## Learning Design Principles (why the features exist)

The app is designed around how expert adults build *durable, transferable* mastery, and
tuned to this learner (reads architecture, not code) and this content (failure-driven,
doctrine-anchored, spiral, certification-shaped):

- **Retrieval > re-reading** — every chapter ends in active recall (self-test §7, review §8),
  not passive highlighting.
- **Spacing & interleaving** — the SRS deck resurfaces cards over days and mixes chapters,
  matching the syllabus's deliberately *spiral* structure (evals/security/cost/state recur 3×).
- **Elaboration / self-explanation** — the "judge the claim *and justify*" format forces
  reasoning, not recognition.
- **Teaching-to-learn** — the content's own mastery bar is "teach it from a blank whiteboard";
  the app makes teach-back a first-class action, not an afterthought.
- **Metacognition & calibration** — track *why* you miss and *how sure* you were, because a
  decision-maker's failure mode is confident-wrong (the very thing Ch. 3.6 warns about).
- **Application over recall** — the mock exam and capstones test diagnosis of unseen
  traces/incidents, the real job.

These principles justify the enrichments below; each maps to content that already exists.

## Content Inventory & Mapping

| Source file(s) | Role in app | Interactive derivation |
|---|---|---|
| `chapter-X-Y-*.md` (30) | Book chapters, grouped into Parts 0–V | §7→quiz, §8→SRS cards, §6→exercise |
| `capstone-a/b/c-*.md` (3) | Part VI "Capstones" — worked designs/projects | Deliverables/rubric → exercise checklist |
| `certification-exam-blueprint.md` | Part VI "Mock Exam" mode | 60 MCQs auto-graded + 3 design prompts (self-rated) |
| `agentic-systems-master-syllabus.md` | "Course Overview / Map" (intro + dependency graph) | Read-only reference; no quiz |
| `manual-style-spec.md` | Appendix "About this curriculum" (optional, off by default) | None |

Ordering derives from the filename numbers (`chapter-<part>-<idx>`); Part/Domain/Reading-time
come from each file's line-3 metadata italic (`*Part … · Domain D# · Reading time ~NN min · …*`).

## Parsing Model (the heart of the build)

A content pipeline turns raw Markdown into a typed course model at build time:

1. **Load**: `import.meta.glob('/content/**/*.md', { query: '?raw', eager: true })`.
2. **Classify** by filename (chapter / capstone / exam / syllabus / spec).
3. **Chapter parser** splits on `## N.` headings into the 9 canonical sections; extracts:
   - **Quiz** from §7: the 5 numbered claims + the italic answer block. Parse each
     answer as `N-<verdict> — <justification>`; map verdict → True/False
     (`false-ish`/`false as stated` → False). Store `{claim, correct:boolean, rationale}`.
   - **SRS cards** from §8: each bullet is a recall prompt (open, self-graded).
   - **Exercise** from §6: prompt text + the `*Review standard:*` line.
   - **Doctrine (E9)**: the one bold doctrine sentence in §2 + the `> **Doctrine check.**`
     blockquote in §3 → collected into the golden-thread view.
   - **Incident hook (E1)**: §1 body + its closing "skipped question" sentence.
   - **Theme tags (E10)**: derived from the Domain field + keyword match (evals/security/cost/
     state) for spiral-thread filtering.
   - Metadata (part, domain, readingTime, prerequisites) from the header italic.
4. **Exam parser**: `**N.**` stems + `- A./B./C./D.` options; answer-key table
   `| Q | Ans | justification |` gives the correct letter. **Shuffle option order at
   render time** (the source key is uniformly "B" by design and tells you to randomize).
5. **Capstone parser (E11)**: extract the deliverables list + rubric rows from each
   `capstone-*.md` into a structured checklist model with per-deliverable notes.
6. **Validation script** (`pnpm content:check`): asserts all 30 chapters expose exactly
   5 self-test claims with parseable answers, a §8 with ≥1 card, and a §6; asserts the
   exam yields 60 keyed questions. Fails the build on drift — protects against a chapter
   that doesn't match the skeleton.

Stable IDs: slug from file path + section + item index (e.g., `ch-0-1/selftest/3`) so
progress survives content edits.

## Tech Stack (your golden path)

| Concern | Choice | Note |
|---|---|---|
| Build/dev | **Vite** | Static output for GitHub Pages |
| UI | **React 19 + TypeScript** (strict) | No `any` |
| Routing | **react-router (HashRouter)** | Deep links survive Pages refresh |
| Markdown | **react-markdown + remark-gfm + rehype-highlight** | Tables, code, callouts |
| Diagrams | **mermaid** | Chapters use Mermaid diagrams throughout |
| Storage | **Dexie (IndexedDB)** | Structured on-device stores |
| Styling | **CSS Modules + tokens** | Responsive: TOC sidebar → drawer on mobile |
| Lint/format | **Biome** · Tests: **Vitest + RTL** · PM: **pnpm** | Per golden path |
| Hosting | **GitHub Pages** via GitHub Actions | `git push` republishes content |

Non-golden-path deps (justified): `dexie`, `mermaid`, markdown/highlight plugins, and
(only if highlights ship in MVP) `web-highlighter`.

## Persistence Model (Dexie / IndexedDB, DB `agentic-training`)

- `progress` — `{ sectionId, status, scrollPct, updatedAt }` (per chapter/section read state)
- `appState` — `{ key:'lastLocation', route, sectionId, scrollPct }` (resume)
- `quizAttempts` — `{ id, itemId, chosen, correct, at }` (self-tests)
- `examSessions` — `{ id, startedAt, answers[], scoreByDomain, passed }` (mock exam runs)
- `srsCards` — `{ id, cardId, ease, intervalDays, dueDate, reps, lapses }` (SM-2 lite)
- `exercises` — `{ id, sourceId, kind:'design'|'capstone'|'examPrompt', done, answer, at }`
- `notes` — `{ id, sectionId, quote, prefix, suffix, note, color, at }`
- `teachBack` — `{ id, chapterId, text, selfScore, at }` (blank-whiteboard recall, §2 doctrine)
- `mistakes` — `{ id, sourceId, kind, whyMissed, at, resolved }` (error log → auto-feeds SRS)
- `confidence` — `{ attemptId, sure:boolean }` (calibration: how sure vs. actually right)

## Features

1. **Reader / book view** — Part→chapter TOC (drawer on mobile), header with Part·Domain·
   reading-time, Mermaid + syntax-highlighted rendering, prev/next, per-chapter progress bar.
   Marks a section done on scroll-to-end or via button.
2. **Resume** — debounced write of `lastLocation` on nav/scroll; "Continue where you left off"
   on home; auto-restore scroll position.
3. **Quizzes (§7 self-tests)** — judge each claim True/False; on submit, reveal the argued
   answer (spoiler-gated so you don't read ahead); attempts stored; wrong ones can be sent to
   the SRS deck.
4. **Spaced repetition (§8 cards)** — `/review` shows due cards (open recall); self-grade
   Again/Hard/Good/Easy → SM-2 lite reschedules. Nav badge shows # due today.
5. **Exercise checklist (§6 + capstones + exam design prompts)** — inline under each chapter and
   a global `/exercises` board; check off, optionally paste your written answer; capstone
   deliverables shown as sub-checklists against their rubric.
6. **Mock Exam mode** — `/exam`: 60 MCQs with shuffled options, timer optional; auto-scores
   overall + per-domain against the real pass bar (≥51/60, no domain below floor); shows the
   answer key + per-question rationale after submit; 3 design prompts captured + self-rated to
   rubric; history of attempts.
7. **Notes & highlights** — select text → highlight + optional note; `/notes` lists all with
   jump-to-source. (See Risks re: anchoring.)
8. **Progress dashboard** — `/progress`: overall % read, per-Part bars, self-test accuracy,
   latest exam score with domain breakdown, SRS due/known counts, exercises & capstones completed.

## Enrichments (the edtech layer — simple, effective, fun)

Each maps to content that **already exists**; none requires hand-authoring or a backend.

**Tier 1 — recommended core (ship in MVP):**

- **E1. Diagnose-the-incident cold open.** Every chapter's §1 is a numbered production
  failure. Show it *first* as an interactive hook — "what got skipped here?" free-text guess —
  then reveal the chapter derives the answer. Turns the book's own device into a pull-through.
- **E2. Teach-back recall.** Per chapter, one prompt: *"Explain this chapter's doctrine from a
  blank whiteboard."* Type/speak it, then reveal the §2 doctrine sentence to self-score. Directly
  matches the content's stated mastery bar; stored in `teachBack`.
- **E3. Mistake Journal.** On any wrong self-test/exam answer, one-line *"why I missed it"* (the
  content explicitly instructs keeping this log). Auto-creates an SRS card and a `/mistakes` review
  list — closes the loop between error and re-practice.
- **E4. Confidence calibration.** Each quiz/exam answer asks "sure?" (one tap). Dashboard plots
  sure-and-wrong vs. unsure-and-right — surfaces *confident-wrong*, the decision-maker failure
  mode Ch. 3.6 warns about. This is the single highest-leverage metacognition add.
- **E5. Domain-mastery dashboard mirroring the cert blueprint.** Six domain meters (D1–D6) with the
  *real* pass floors drawn as thresholds, fed by self-test + exam performance; plus tasteful
  streak/milestone badges (chapters read, cards known, capstones done). Makes "am I exam-ready?"
  answerable at a glance.
- **E6. Concept-map navigation.** Render the syllabus's Mermaid **dependency graph** as a clickable
  map, each node tinted by progress (unread→read→quizzed→mastered). A second way to navigate the
  spiral besides the linear TOC.
- **E7. Reading polish.** Cmd-K client-side full-text search, auto-linkified `Ch. X.Y`
  cross-references, in-chapter mini-TOC, dark mode, keyboard nav (`j/k`, `/`). Cheap, high daily value.
- **E8. Progress backup.** One-click export/import of all IndexedDB stores to a JSON file — the
  safety net for an on-device-only app (browser data can be cleared). Non-negotiable for trust.

**Tier 2 — committed (build target per your choice; sequenced after Tier 1):**

- **E9. Doctrine "golden thread."** Collector view of every bold doctrine sentence + `Doctrine
  check` blockquote across all 30 chapters — the spine on one page for pre-exam review.
- **E10. Spiral theme threads.** Filter the map/TOC by recurring theme (evals · security · cost ·
  state) to study a concept across its 3 spiral passes.
- **E11. Capstone workspace.** Parse each capstone's deliverables + rubric into a structured
  checklist with a notes pane per deliverable (beyond the flat exercise checklist).

**Tier 3 — deferred backlog (breaks pure on-device; needs your key — NOT in this build):**

- **E12. Socratic "Oral Defense" tutor.** Capstone C is an adversarial oral defense. A *client-side*
  chat using **your own** Claude API key (stored locally, never bundled) could role-play the
  examiner against the rubric. Documented only; left as a future opt-in so the app stays 100%
  on-device with no AI-call surface in this release.

## Project Structure

```
Master agentic systems on prod/            # project root
├─ content/                                # the 36 .md moved here (single source of truth)
│  ├─ chapter-0-1-agentic-spectrum.md … chapter-5-7-*.md
│  ├─ capstone-a/b/c-*.md
│  ├─ certification-exam-blueprint.md
│  ├─ agentic-systems-master-syllabus.md
│  └─ manual-style-spec.md
├─ src/
│  ├─ content/        # loader.ts, chapterParser.ts, examParser.ts, types.ts, validate.ts
│  ├─ db/             # dexie schema + typed repositories
│  ├─ srs/            # sm2.ts (pure, unit-tested)
│  ├─ features/       # reader/ quiz/ srs/ exercises/ exam/ notes/ progress/
│  │                  # + teachback/ mistakes/ conceptmap/ search/ backup/
│  ├─ components/     # Layout, TOC, MarkdownRenderer, Mermaid, ProgressBar, Spoiler
│  │                  # + CmdK, DomainMeter, ConfidenceToggle, IncidentHook
│  ├─ hooks/          # useResume, useSectionProgress
│  ├─ routes.tsx  App.tsx  main.tsx
├─ tests/             # Vitest (parsers, sm2, repositories, components)
├─ .github/workflows/deploy.yml            # build + deploy to GitHub Pages
├─ index.html vite.config.ts biome.json package.json tsconfig.json
```

**Decision (confirmed):** move the 36 `.md` into `content/` (documented, one-time) so the app
root stays clean and `content/` is unambiguously the source of truth. Done as the first
scaffold step via `git mv` so history is preserved.

## Build & Hosting

- `vite build` → static `dist/`; GitHub Actions deploys to GitHub Pages on push to `main`.
- `HashRouter` + correct `base`; content bundled at build, so pushing edited Markdown
  republishes the course automatically.

## Milestones (suggested build order)

1. Scaffold (Vite+React+TS, Biome, Vitest, pnpm) + move content to `content/`.
2. **Content pipeline + validation script** (chapter & exam parsers, types) — heavily unit-tested.
3. Reader + TOC + responsive layout + Mermaid/highlight rendering + **E1 incident cold open**.
4. Persistence layer (Dexie) + resume/scroll restore + **E8 export/import backup**.
5. Progress tracking + dashboard + **E5 domain meters** with real pass floors.
6. Quizzes (§7) with spoiler-gated answers + **E4 confidence tap** + **E3 Mistake Journal**.
7. Spaced repetition (SM-2 lite, pure + tested) + `/review` (mistakes auto-enqueue).
8. Exercise checklist (§6 + capstones) + **E2 teach-back recall**.
9. Mock Exam mode (auto-scoring + domain floors + design prompts).
10. **E6 concept-map nav** + **E7 reading polish** (Cmd-K search, linkified cross-refs, dark mode, keys).
11. Notes & highlights.
12. **Tier 2 committed:** E9 doctrine golden-thread collector · E10 spiral theme threads (map/TOC
    filter) · E11 structured capstone workspace (parsed deliverables + rubric + per-item notes).
13. Polish + GitHub Pages deploy workflow. (E12 AI tutor stays deferred backlog — not built.)

## Verification

- `pnpm test`: parser tests (feed all 30 chapters + the exam through parsers; assert 5 claims/
  chapter with T/F keys, §8 cards present, 60 keyed exam Qs); `sm2.ts` scheduling math;
  Dexie repos via `fake-indexeddb`; quiz grading; exam scoring incl. domain-floor logic.
- Component tests (RTL): reader renders a chapter incl. a Mermaid block; self-test reveals the
  argued answer only after submit; exam scores a known answer set correctly.
- `pnpm content:check` passes on the real folder (guards skeleton drift).
- Manual E2E (desktop + mobile viewport): open app → read Ch. 0.1 → take its self-test →
  close/reopen (resume works) → do a review card → tick a design exercise → run 5 exam questions
  and see domain scoring → add a note → confirm dashboard totals update.
- `pnpm build` succeeds; deployed Pages site loads, deep-links and refresh work.

## Risks / Open Decisions

- **Self-test answer parsing variance**: most answer blocks follow `N-verdict — reason;` but a
  few phrasings differ (`false-ish`, `false as stated`). Parser maps these to False and, if it
  can't confidently split, falls back to showing the full answer block as an ungraded reveal.
  The validation script surfaces any chapter that doesn't parse cleanly.
- **Highlight anchoring** is the hardest feature (re-locating highlights after reloads). MVP:
  quote+prefix/suffix anchoring via `web-highlighter`; fallback = section-level notes without
  inline color. Can defer highlights to the last milestone without blocking notes.
- **Content edits vs. progress IDs**: renaming files or reordering §-items can orphan progress;
  mitigated by path+section+index slugs, documented.

## Framework conventions (on execution)

Copy this plan to `./artifacts/plan_training_app.md`, track work via `bd`, build on a branch
(never `main`) per your `CLAUDE.md`.
```
