import type {
  DesignPrompt,
  DomainFloor,
  DomainId,
  Exam,
  ExamOption,
  ExamQuestion,
  OptionLetter,
} from "./types";
import { DOMAIN_IDS, isDomainId, parseMarkdownTable } from "./parseUtils";

const OPTION_LETTERS: OptionLetter[] = ["A", "B", "C", "D"];
const PASS_OVERALL = 51;
const TOTAL_QUESTIONS = 60;

interface DomainRange {
  domain: DomainId;
  from: number;
  to: number;
}

/** Parse "## Domain D1 — … (Questions 1–6)" headers into number ranges. */
function parseDomainRanges(raw: string): DomainRange[] {
  const ranges: DomainRange[] = [];
  const re = /^##\s+Domain\s+(D\d)\b.*?\(Questions\s+(\d+)\s*[–-]\s*(\d+)\)/gim;
  let m: RegExpExecArray | null = re.exec(raw);
  while (m !== null) {
    const domain = m[1] ?? "";
    if (isDomainId(domain)) {
      ranges.push({ domain, from: Number(m[2]), to: Number(m[3]) });
    }
    m = re.exec(raw);
  }
  return ranges;
}

function domainForQuestion(n: number, ranges: DomainRange[]): DomainId {
  const hit = ranges.find((r) => n >= r.from && n <= r.to);
  return hit ? hit.domain : "D1";
}

/** Parse the answer-key table "| Q | Ans | justification |" → maps by question number. */
function parseAnswerKey(raw: string): {
  correct: Map<number, OptionLetter>;
  rationale: Map<number, string>;
} {
  const keyStart = raw.search(/^##\s+Answer key/im);
  const table = keyStart === -1 ? raw : raw.slice(keyStart);
  const rows = parseMarkdownTable(table);
  const correct = new Map<number, OptionLetter>();
  const rationale = new Map<number, string>();
  for (const cells of rows) {
    const q = Number(cells[0]);
    const ans = (cells[1] ?? "").trim().toUpperCase();
    if (!Number.isFinite(q)) continue;
    if ((OPTION_LETTERS as string[]).includes(ans)) {
      correct.set(q, ans as OptionLetter);
    }
    rationale.set(q, (cells[2] ?? "").trim());
  }
  return { correct, rationale };
}

/** Parse all "**N.** stem" + "- A./B./C./D." questions from the exam body. */
function parseQuestions(
  raw: string,
  ranges: DomainRange[],
  key: { correct: Map<number, OptionLetter>; rationale: Map<number, string> },
): ExamQuestion[] {
  // Stop before the design prompts / answer key so their prose isn't misread.
  const cut = raw.search(/^##\s+(Mini-design prompts|Answer key)/im);
  const body = cut === -1 ? raw : raw.slice(0, cut);
  const lines = body.split("\n");

  const questions: ExamQuestion[] = [];
  const stemRe = /^\*\*(\d+)\.\*\*\s*(.*)$/;
  const optionRe = /^-\s+([A-D])\.\s+(.*)$/;

  let current: { n: number; stem: string; options: ExamOption[] } | null = null;
  const flush = (): void => {
    if (!current) return;
    const n = current.n;
    questions.push({
      id: `exam/q${n}`,
      n,
      domain: domainForQuestion(n, ranges),
      stem: current.stem.trim(),
      options: current.options,
      correct: key.correct.get(n) ?? "B",
      rationale: key.rationale.get(n) ?? "",
    });
    current = null;
  };

  for (const line of lines) {
    const stemMatch = stemRe.exec(line.trim());
    if (stemMatch) {
      flush();
      current = { n: Number(stemMatch[1]), stem: stemMatch[2] ?? "", options: [] };
      continue;
    }
    const optMatch = optionRe.exec(line.trim());
    if (optMatch && current) {
      current.options.push({ letter: optMatch[1] as OptionLetter, text: (optMatch[2] ?? "").trim() });
      continue;
    }
    // Continuation of a stem (before its options begin).
    if (current && current.options.length === 0 && line.trim()) {
      current.stem += ` ${line.trim()}`;
    }
  }
  flush();
  return questions;
}

/** Parse "## Mini-design prompts" → "**Design Prompt N — Title.** prompt" + "*Rubric:* …". */
function parseDesignPrompts(raw: string): DesignPrompt[] {
  const start = raw.search(/^##\s+Mini-design prompts/im);
  if (start === -1) return [];
  const section = raw.slice(start);
  const end = section.search(/^##\s+Answer key/im);
  const body = end === -1 ? section : section.slice(0, end);

  const prompts: DesignPrompt[] = [];
  // Split on each "**Design Prompt N — Title.**" header, keeping the header via lookahead.
  const blocks = body.split(/(?=^\*\*Design Prompt\s+\d+)/im).filter((b) => /^\*\*Design Prompt/i.test(b.trim()));
  const headerRe = /^\*\*Design Prompt\s+(\d+)\s*[—-]\s*(.*?)\.\*\*\s*/i;
  for (const block of blocks) {
    const header = headerRe.exec(block.trim());
    if (!header) continue;
    const n = Number(header[1]);
    const title = (header[2] ?? "").trim();
    const rest = block.trim().slice(header[0].length);
    const rubricMatch = /\*Rubric:\*\s*([\s\S]*)/i.exec(rest);
    const prompt = (rubricMatch ? rest.slice(0, rubricMatch.index) : rest).trim();
    const rubric = rubricMatch ? (rubricMatch[1] ?? "").trim() : "";
    prompts.push({ id: `exam/design/${n}`, n, title, prompt, rubric });
  }
  return prompts;
}

/** Per-domain pass floors (70% of the domain's question count, rounded up). */
function computeDomainFloors(questions: ExamQuestion[]): DomainFloor[] {
  return DOMAIN_IDS.map((domain) => {
    const count = questions.filter((q) => q.domain === domain).length;
    return { domain, count, floor: Math.ceil(count * 0.7) };
  }).filter((f) => f.count > 0);
}

/** Parse the certification-exam-blueprint.md into a structured, auto-scorable Exam. */
export function parseExam(raw: string): Exam {
  const ranges = parseDomainRanges(raw);
  const key = parseAnswerKey(raw);
  const questions = parseQuestions(raw, ranges, key);
  const designPrompts = parseDesignPrompts(raw);
  const domainFloors = computeDomainFloors(questions);
  return {
    kind: "exam",
    questions,
    designPrompts,
    domainFloors,
    passOverall: PASS_OVERALL,
    totalQuestions: TOTAL_QUESTIONS,
  };
}
