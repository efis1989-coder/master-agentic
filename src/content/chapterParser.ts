import type {
  Chapter,
  DesignCheck,
  DesignCheckItem,
  DesignExercise,
  DomainId,
  IncidentHook,
  SelfTestClaim,
  SrsPrompt,
} from "./types";
import {
  beforeHorizontalRule,
  deriveThemes,
  extractGlossaryTerms,
  fileSlug,
  findSection,
  isDomainId,
  parseMarkdownTable,
  splitSections,
  stripEmphasis,
  stripInlineEmphasis,
  stripQuotes,
} from "./parseUtils";
import { PART_NAMES } from "./partNames";

interface HeaderMeta {
  number: string; // "0.1"
  part: number;
  partName: string;
  chapterIndex: number;
  title: string;
  domain: DomainId;
  readingTimeMin: number;
  prerequisites: string[];
}

// Verdict words the answer key uses to mean "the claim is false" (Format B leads with these,
// e.g. "Incomplete.", "Dangerous as stated.", "Too narrow."). Anything containing "false"
// (incl. compounds like "false as stated" / "true-in-spirit-but-stated-as-false") is handled first.
const FALSE_FAMILY =
  /^(no\b|not\s|incorrect|wrong|incomplete|dangerous|mostly|too narrow|backwards|contradictory|partly|partial|two errors|this confuses|nonsense|misleading|overbroad|unsafe|conflates|confused)/;

/**
 * Map a self-test verdict token/phrase to a boolean key. The verdict describes whether the
 * *claim* is true or false; the full argued text is always shown on reveal, so a binary key
 * never loses nuance. `gradable` is false only when the verdict can't be confidently mapped.
 */
export function verdictToBoolean(verdict: string): { correct: boolean; gradable: boolean } {
  const v = verdict.trim().toLowerCase();
  // Any mention of "false" means the claim is (at least partly) false as stated.
  if (/false/.test(v)) return { correct: false, gradable: true };
  if (/^(true|correct|yes|accurate)\b/.test(v)) return { correct: true, gradable: true };
  if (FALSE_FAMILY.test(v)) return { correct: false, gradable: true };
  return { correct: false, gradable: false };
}

function parseHeader(lines: string[], number: string): HeaderMeta {
  const titleLine = lines[0] ?? "";
  const title = titleLine.replace(/^#\s*Chapter\s+[\d.]+\s*[—-]\s*/i, "").trim();
  const metaLine = (lines[2] ?? "").trim();
  const meta = stripEmphasis(metaLine);
  const segments = meta.split("·").map((s) => s.trim());

  let part = 0;
  let partName = PART_NAMES[0] ?? "";
  let domain: DomainId = "D1";
  let readingTimeMin = 0;
  let prerequisites: string[] = [];

  for (const seg of segments) {
    const partMatch = /^Part\s+([0-9IVX]+)\s*[—-]\s*(.*)$/.exec(seg);
    if (partMatch) {
      part = romanOrIntToPart(partMatch[1] ?? "0");
      partName = (partMatch[2] ?? "").trim();
      continue;
    }
    const domainMatch = /Domain\s+(D\d)/.exec(seg);
    if (domainMatch && isDomainId(domainMatch[1] ?? "")) {
      domain = domainMatch[1] as DomainId;
      continue;
    }
    const timeMatch = /Reading time\s*~?\s*(\d+)/.exec(seg);
    if (timeMatch) {
      readingTimeMin = Number(timeMatch[1]);
      continue;
    }
    const prereqMatch = /Prerequisites:\s*(.*)$/.exec(seg);
    if (prereqMatch) {
      const raw = (prereqMatch[1] ?? "").trim();
      prerequisites = raw.toLowerCase() === "none" ? [] : raw.split(",").map((p) => p.trim());
    }
  }

  const [partStr, idxStr] = number.split(".");
  return {
    number,
    part: part || Number(partStr) || 0,
    partName,
    chapterIndex: Number(idxStr) || 0,
    title,
    domain,
    readingTimeMin,
    prerequisites,
  };
}

function romanOrIntToPart(token: string): number {
  const t = token.toUpperCase();
  const roman: Record<string, number> = { I: 1, II: 2, III: 3, IV: 4, V: 5, VI: 6 };
  if (t in roman) return roman[t] as number;
  const n = Number(t);
  return Number.isNaN(n) ? 0 : n;
}

/** Extract the chapter number ("0.1") from the filename slug "chapter-0-1-...". */
function numberFromSlug(slug: string): string {
  const m = /^chapter-(\d+)-(\d+)/.exec(slug);
  return m ? `${m[1]}.${m[2]}` : "0.0";
}

/**
 * Parse §7 self-test into 5 claims. Two source formats exist:
 *  - Format A (ch 0.1–2.5): 5 numbered claim lines + one "*(Answers …: 1-verdict — …; …)*" block.
 *  - Format B (ch 3.1–5.7): each numbered line is "*claim* — Verdict. justification".
 */
export function parseSelfTest(sectionMd: string, chapterId: string): SelfTestClaim[] {
  const body = beforeHorizontalRule(sectionMd);
  const answerBlockRe = /^\*\(.*?\b\d-(?:true|false|partial|partly)/im;
  if (answerBlockRe.test(body)) {
    return parseSelfTestFormatA(body, chapterId);
  }
  return parseSelfTestFormatB(body, chapterId);
}

function parseSelfTestFormatA(body: string, chapterId: string): SelfTestClaim[] {
  const answerLineRaw = body.split("\n").find((l) => /^\*\(.*\d-/.test(l.trim()));
  // Remove the answer key before collecting numbered claims. Otherwise
  // `collectNumberedItems` appends this trailing, non-numbered line onto the
  // last claim's text, leaking every argued answer into claim 5 before submit.
  const claimBody = answerLineRaw ? body.replace(answerLineRaw, "") : body;
  const claims = collectNumberedItems(claimBody).map((c) => stripQuotes(c.text));
  const answerLine = answerLineRaw?.trim();
  const answers = answerLine ? parseAnswerBlock(answerLine) : new Map<number, string>();

  return claims.slice(0, 5).map((claim, i) => {
    const index = i + 1;
    const answerText = answers.get(index) ?? "";
    const verdictToken = /^([a-z][a-z -]*?)\s+—/i.exec(answerText)?.[1] ?? answerText;
    const { correct, gradable } = verdictToBoolean(verdictToken);
    return {
      id: `${chapterId}/selftest/${index}`,
      index,
      claim,
      correct,
      answerText: answerText || claim,
      gradable: gradable && answerText.length > 0,
    };
  });
}

/** Parse "*(Answers …: 1-false — a; 2-true — b; …)*" → Map<index, "verdict — justification">. */
export function parseAnswerBlock(line: string): Map<number, string> {
  let inner = stripEmphasis(line).trim();
  if (inner.startsWith("(") && inner.endsWith(")")) inner = inner.slice(1, -1).trim();
  // Drop any lead-in prose up to the first "1-".
  const firstItem = inner.search(/\b1-/);
  if (firstItem > 0) inner = inner.slice(firstItem);

  const map = new Map<number, string>();
  // Split on "; N-" boundaries so justifications may contain their own punctuation.
  const parts = inner.split(/;\s*(?=\d-)/);
  for (const part of parts) {
    const m = /^(\d)-(.*)$/s.exec(part.trim());
    if (m) map.set(Number(m[1]), (m[2] ?? "").trim());
  }
  return map;
}

function parseSelfTestFormatB(body: string, chapterId: string): SelfTestClaim[] {
  const items = collectNumberedItems(body);
  return items.slice(0, 5).map((item, i) => {
    const index = i + 1;
    // "*claim text* — Verdict. justification"  (split on the italic close + em-dash)
    const split = /\*\s+—\s+/.exec(item.text);
    let claim = item.text;
    let answerText = "";
    if (split && split.index >= 0) {
      claim = stripQuotes(stripEmphasis(item.text.slice(0, split.index + 1)));
      claim = claim.replace(/^Claim:\s*/i, "").trim();
      answerText = item.text.slice(split.index + split[0].length).trim();
    } else {
      claim = stripQuotes(stripEmphasis(item.text));
    }
    const verdictWord = /^([A-Za-z][A-Za-z ]*?)[.,;]/.exec(answerText)?.[1] ?? answerText;
    const { correct } = verdictToBoolean(verdictWord);
    return {
      id: `${chapterId}/selftest/${index}`,
      index,
      claim,
      correct,
      answerText: answerText || claim,
      gradable: answerText.length > 0,
    };
  });
}

/** Collect "N. text" items (multi-line until the next number or blank-then-number). */
function collectNumberedItems(body: string): { n: number; text: string }[] {
  const lines = body.split("\n");
  const items: { n: number; text: string }[] = [];
  let current: { n: number; text: string } | null = null;
  const startRe = /^(\d+)\.\s+(.*)$/;
  for (const line of lines) {
    const m = startRe.exec(line);
    if (m) {
      if (current) items.push(current);
      current = { n: Number(m[1]), text: (m[2] ?? "").trim() };
    } else if (current && line.trim() && !line.startsWith("## ")) {
      current.text += ` ${line.trim()}`;
    } else if (current && !line.trim()) {
      // blank line ends nothing on its own; keep accumulating until next number
    }
  }
  if (current) items.push(current);
  return items;
}

/** §8 spaced-review bullets → open-recall prompts. */
export function parseSrsCards(sectionMd: string, chapterId: string): SrsPrompt[] {
  const body = beforeHorizontalRule(sectionMd);
  const bullets = body
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.startsWith("- "))
    .map((l) => l.slice(2).trim());
  return bullets.map((prompt, i) => ({
    id: `${chapterId}/srs/${i + 1}`,
    index: i + 1,
    prompt,
  }));
}

// §6 authored markers. Each is a label-only regex (no content capture) so a
// marker's block can be sliced by index from its label to the next marker.
type ExerciseMarker = "review" | "options" | "check" | "sample";
const EXERCISE_MARKERS: Record<ExerciseMarker, RegExp> = {
  review: /\*Review standard:\*/,
  options: /\*Options:\*/,
  check: /\*Check:\*/,
  sample: /\*Sample solution:\*/,
};

/**
 * Build a deterministic §6 dropdown check from an authored `*Options:*` list and
 * `*Check:*` table. Options are `·`-separated (falling back to `,`); the table is
 * `| Item | Answer | Why |` (Why optional). Returns null — falling back to the
 * current free-text exercise — unless both blocks are present, at least one item
 * parses, and every item's answer is one of the shared options (so a mis-authored
 * check never renders a dropdown the learner can't answer correctly).
 */
function buildDesignCheck(
  chapterId: string,
  optionsRaw: string | null,
  checkRaw: string | null,
): DesignCheck | null {
  if (!optionsRaw || !checkRaw) return null;
  const separator = optionsRaw.includes("·") ? "·" : ",";
  const options = optionsRaw
    .split(separator)
    .map((o) => stripEmphasis(o.trim()))
    .filter(Boolean);
  if (options.length === 0) return null;

  const items: DesignCheckItem[] = [];
  for (const cells of parseMarkdownTable(checkRaw)) {
    const label = stripEmphasis((cells[0] ?? "").trim());
    const correct = stripEmphasis((cells[1] ?? "").trim());
    const why = (cells[2] ?? "").trim();
    if (!label || !correct) continue;
    const index = items.length + 1;
    items.push({
      id: `${chapterId}/exercise/check/${index}`,
      index,
      label,
      correct,
      rationale: why || null,
    });
  }
  if (items.length === 0) return null;
  if (!items.every((it) => options.includes(it.correct))) return null;

  return { kind: "select", options, items };
}

/**
 * §6 design exercise → prompt + optional review standard, deterministic dropdown
 * check, and revealable sample solution. The prompt is everything before the
 * earliest authored marker (`*Review standard:*` / `*Options:*` / `*Check:*` /
 * `*Sample solution:*`); each marker's block runs to the next marker or end. When
 * no markers are authored this returns the same prompt-only shape as before.
 */
export function parseExercise(sectionMd: string, chapterId: string): DesignExercise {
  const body = beforeHorizontalRule(sectionMd);

  const found = (Object.entries(EXERCISE_MARKERS) as [ExerciseMarker, RegExp][])
    .map(([key, re]) => ({ key, index: re.exec(body)?.index ?? -1 }))
    .filter((m) => m.index >= 0)
    .sort((a, b) => a.index - b.index);

  const firstMarker = found[0]?.index ?? body.length;
  const prompt = body.slice(0, firstMarker).trim();

  const blockOf = (key: ExerciseMarker): string | null => {
    const pos = found.findIndex((m) => m.key === key);
    if (pos === -1) return null;
    const start = found[pos]?.index ?? 0;
    const end = found[pos + 1]?.index ?? body.length;
    return body.slice(start, end).replace(EXERCISE_MARKERS[key], "").trim();
  };

  const reviewStandard = blockOf("review");
  const check = buildDesignCheck(chapterId, blockOf("options"), blockOf("check"));
  const sampleSolution = blockOf("sample");

  return { id: `${chapterId}/exercise`, prompt, reviewStandard, check, sampleSolution };
}

/** E1 — §1 incident cold open + its closing "what got skipped?" question. */
function parseIncident(sectionMd: string): IncidentHook {
  const md = beforeHorizontalRule(sectionMd);
  const questions = md.match(/[^.!?]*\?/g) ?? [];
  const skippedQuestion = questions.length ? (questions[questions.length - 1] ?? "").trim() : null;
  return { markdown: md, skippedQuestion };
}

/**
 * E9 — the standalone bold doctrine sentence: the first line that is a *single*
 * `**…**` span (no internal emphasis) on its own line. Requiring the span to run
 * unbroken to the end of the line (`[^*]+` — no interior `*`) rejects a whole
 * paragraph that merely *starts* and *ends* with a bold span (e.g. a "**Term** —
 * …prose… **thesis.**" lead paragraph), so only the isolated thesis sentence is
 * captured.
 */
function parseDoctrine(body: string): string | null {
  const line = body
    .split("\n")
    .map((l) => l.trim())
    .find((l) => /^\*\*[^*]+\*\*$/.test(l) && !/Doctrine check/i.test(l));
  return line ? stripEmphasis(line) : null;
}

/** E9 — the "> **Doctrine check.** …" blockquote. */
function parseDoctrineCheck(body: string): string | null {
  const lines = body.split("\n");
  const idx = lines.findIndex((l) => /^>\s*\*\*Doctrine check\.?\*\*/i.test(l.trim()));
  if (idx === -1) return null;
  let text = "";
  for (let i = idx; i < lines.length; i++) {
    const l = lines[i]?.trim() ?? "";
    if (!l.startsWith(">")) break;
    text += (text ? " " : "") + l.replace(/^>\s?/, "").trim();
  }
  const withoutLabel = text.replace(/\*\*Doctrine check\.?\*\*/i, "").trim();
  // The check paragraph carries the author's inline emphasis (`*italic*`, the odd
  // `**bold**`); the Doctrine page renders it as plain text, so strip the markers.
  return stripInlineEmphasis(withoutLabel);
}

/** Parse a raw chapter markdown file into a Chapter. Pure: no Vite/Node deps. */
export function parseChapter(raw: string, path: string): Chapter {
  const slug = fileSlug(path);
  const number = numberFromSlug(slug);
  const id = `ch-${number.replace(".", "-")}`;
  const lines = raw.split("\n");
  const header = parseHeader(lines, number);

  // Body = everything after the metadata line (line index 2).
  const bodyMarkdown = lines.slice(3).join("\n").trim();
  const sections = splitSections(bodyMarkdown);

  const s1 = findSection(sections, 1);
  const s3 = findSection(sections, 3);
  const s6 = findSection(sections, 6);
  const s7 = findSection(sections, 7);
  const s8 = findSection(sections, 8);

  return {
    kind: "chapter",
    id,
    slug,
    part: header.part,
    partName: PART_NAMES[header.part] ?? header.partName,
    chapterIndex: header.chapterIndex,
    number,
    title: header.title,
    domain: header.domain,
    readingTimeMin: header.readingTimeMin,
    prerequisites: header.prerequisites,
    themes: deriveThemes(header.title, bodyMarkdown),
    sections,
    bodyMarkdown,
    incident: s1 ? parseIncident(s1.markdown) : null,
    doctrine: parseDoctrine(bodyMarkdown),
    doctrineCheck: s3 ? parseDoctrineCheck(s3.markdown) : parseDoctrineCheck(bodyMarkdown),
    selfTest: s7 ? parseSelfTest(s7.markdown, id) : [],
    srsCards: s8 ? parseSrsCards(s8.markdown, id) : [],
    exercise: s6 ? parseExercise(s6.markdown, id) : null,
    glossary: extractGlossaryTerms(sections),
  };
}
