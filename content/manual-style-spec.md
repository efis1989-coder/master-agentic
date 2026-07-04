# Manual Style Spec v1.0 — Voice Lock for Chapter Production

*Companion to `chapter-0-1-agentic-spectrum.md` (the reference implementation) and `agentic-systems-master-syllabus.md` (the spine). Any tool or session producing chapters must conform to both.*

## Reader

Efi: senior product leader, serial founder, MSc applied mathematics. Deep technical understanding; does not write production code. Reads architecture diagrams, decision tables, and traces fluently. Building expertise for high-stakes, regulated-domain agentic systems. Standing thesis to honor throughout: **deterministic engine + agentic overlay + humans as the immutable source of truth.**

## Voice rules

1. **Failure-story-first.** Every chapter opens with a concrete, numerically grounded production incident (fictional but realistic — never fabricate real-company claims). The concept is then derived as the incident's prevention.
2. **Professional terminology, defined on first use, then used without apology.** No dumbing down; no undefined jargon.
3. **Opinionated with visible reasoning.** State the doctrine position, then the tradeoff table. Never hedge into mush; never assert without the "because."
4. **Numbers make it real.** Worked cost/latency/accuracy examples with plausible magnitudes in every production-lens section. Cost per *resolved* task, segmented — never blended averages.
5. **Second person for the reader's decisions** ("you buy autonomy with verification"); third person for systems.
6. **No production code.** Mermaid diagrams, decision tables, schemas-in-prose, and trace narratives carry all technical weight. Pseudocode only if a control-flow idea cannot be drawn.
7. **Direct sentences. No filler, no cheerleading, no "in today's rapidly evolving landscape."**

## Mandatory chapter skeleton (numbering exactly as in Ch. 0.1)

1. **The failure story** — ~250–350 words, numbers included, ends by naming the skipped question
2. **The mental model** — first-principles derivation; subsections numbered 2.1, 2.2…; one boldfaced doctrine sentence per chapter
3. **Production lens** — operating costs, monitoring signals, on-call reality; includes one `> **Doctrine check.**` blockquote tying to the deterministic-core thesis
4. **Edge-case catalog** — table: # / Edge case / What it looks like / Detection / Mitigation. 4–6 rows, expert-level only
5. **Claude & MCP sidebar** — one paragraph mapping the neutral pattern to Claude's stack; always instruct verification against docs.claude.com; no pricing/limits from memory
6. **Design exercise** — one whiteboard-scale prompt with a stated *review standard*
7. **Self-test** — 5 claims to judge with one-sentence justification; compact argued answers in italics
8. **Spaced-review card** — 3 from-memory prompts
9. Closing italic line teasing the next chapter

Header block: chapter title, then italic line: *Part · Domain · Reading time · Prerequisites*.

## Formatting rules

- Mermaid for all diagrams; 1–3 per chapter; green→yellow→orange→red fills where a risk/predictability gradient exists
- Tables for tradeoffs and catalogs; prose for reasoning; bullets sparingly and never in the failure story
- Bold reserved for doctrine sentences and table/dimension names
- Target length 2,800–3,600 words per chapter; Part IV chapters may run to 4,000
- File naming: `chapter-X-Y-short-slug.md`

## Content guardrails

- Canon citations by name inline ("Anthropic's *Building Effective Agents*"), consistent with the syllabus Section 8 tier list
- Fast-moving facts (protocol versions, vendor mechanics, pricing) flagged with "verify at study time"; doctrine stated as durable
- Every chapter must answer: where is the deterministic core, what does verification cost, and what would make this design wrong
- Cross-references use chapter numbers (e.g., "Ch. 3.4") and must match syllabus v1.1 numbering (27 chapters; 3.6, 5.5, 5.6 exist; Economics is 5.7)

## QA checklist per chapter (run before accepting)

☐ Failure story has ≥3 concrete numbers  ☐ Doctrine sentence present and bold  ☐ Doctrine-check blockquote present  ☐ Edge-case table has detection *and* mitigation columns filled  ☐ Sidebar contains no memorized product specifics  ☐ Design exercise has a review standard  ☐ Self-test answers argue, not define  ☐ Word count in range  ☐ Cross-refs valid against syllabus v1.1
