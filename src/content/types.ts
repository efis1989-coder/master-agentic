// The typed course model. Every parser produces these; every feature consumes them.
// Stable IDs are path + section + index (e.g. "ch-0-1/selftest/3") so on-device
// progress survives content edits as long as the item's position is stable.

export type DomainId = "D1" | "D2" | "D3" | "D4" | "D5" | "D6";

export type ThemeTag = "evals" | "security" | "cost" | "state";

export type OptionLetter = "A" | "B" | "C" | "D";

/** One §7 self-test claim: judge True/False, then read the argued answer. */
export interface SelfTestClaim {
  id: string;
  index: number;
  /** The claim to judge (a quote, often a deliberately wrong statement). */
  claim: string;
  /** Binary key used for scoring the tick. */
  correct: boolean;
  /** The full argued answer, always revealed after submit (never lost to binary). */
  answerText: string;
  /** False when the verdict could not be confidently mapped to True/False. */
  gradable: boolean;
}

/** One §8 spaced-review prompt: open recall, self-graded. */
export interface SrsPrompt {
  id: string;
  index: number;
  prompt: string;
}

/** One row of a deterministic §6 "select the right option" check: a labeled item + its key. */
export interface DesignCheckItem {
  id: string; // `${chapterId}/exercise/check/${index}`
  index: number;
  /** The item being judged, e.g. a task brief to place on the spectrum. */
  label: string;
  /** The correct option; always equals one of the parent DesignCheck.options. */
  correct: string;
  /** One-line "why", revealed after submit (never lost to the binary tick). */
  rationale: string | null;
}

/** A deterministic, auto-checkable §6 task: pick the right option for each item. */
export interface DesignCheck {
  kind: "select"; // room for "order" | "matching" later
  /** Shared dropdown options offered for every item. */
  options: string[];
  items: DesignCheckItem[];
}

/** The §6 design exercise: a whiteboard prompt + (sometimes) an explicit review standard. */
export interface DesignExercise {
  id: string;
  prompt: string;
  reviewStandard: string | null;
  /** Deterministic dropdown check, when the exercise has one right option per item. */
  check: DesignCheck | null;
  /** Revealable "book solution" for the open portion, self-compared by the learner. */
  sampleSolution: string | null;
}

export interface ChapterSection {
  n: number;
  title: string;
  markdown: string;
}

/** A key term introduced inline in chapter prose, linking back to its source section. */
export interface GlossaryTerm {
  term: string;
  sectionN: number;
}

/** E1 — the §1 production-failure cold open. */
export interface IncidentHook {
  markdown: string;
  /** The closing "what got skipped?" question, if the section ends on one. */
  skippedQuestion: string | null;
}

export interface Chapter {
  kind: "chapter";
  id: string; // "ch-0-1"
  slug: string; // "chapter-0-1-agentic-spectrum"
  part: number; // 0..5
  partName: string; // "Orientation & Philosophy"
  chapterIndex: number; // 1, 2, ...
  number: string; // "0.1"
  title: string;
  domain: DomainId;
  readingTimeMin: number;
  prerequisites: string[]; // ["Ch. 0.1"]
  themes: ThemeTag[]; // E10 spiral threads
  sections: ChapterSection[];
  bodyMarkdown: string; // everything after the metadata line
  incident: IncidentHook | null; // E1
  doctrine: string | null; // E9 — bold doctrine sentence (§2)
  doctrineCheck: string | null; // E9 — "> Doctrine check." blockquote (§3)
  selfTest: SelfTestClaim[]; // §7
  srsCards: SrsPrompt[]; // §8
  exercise: DesignExercise | null; // §6
  glossary: GlossaryTerm[]; // key terms introduced inline, deduped globally in buildCourse
}

export interface ExamOption {
  letter: OptionLetter;
  text: string;
}

export interface ExamQuestion {
  id: string; // "exam/q1"
  n: number;
  domain: DomainId;
  stem: string;
  options: ExamOption[];
  correct: OptionLetter;
  rationale: string;
}

export interface DesignPrompt {
  id: string; // "exam/design/1"
  n: number;
  title: string;
  prompt: string;
  rubric: string;
}

export interface DomainFloor {
  domain: DomainId;
  count: number; // questions in this domain
  floor: number; // min correct to pass the domain (70%)
}

export interface Exam {
  kind: "exam";
  questions: ExamQuestion[];
  designPrompts: DesignPrompt[];
  domainFloors: DomainFloor[];
  passOverall: number; // 51
  totalQuestions: number; // 60
}

export interface CapstoneDeliverable {
  id: string;
  index: number;
  title: string;
}

export interface RubricRow {
  criterion: string;
  standard: string;
}

export interface Capstone {
  kind: "capstone";
  id: string; // "capstone-a"
  slug: string;
  letter: "A" | "B" | "C";
  title: string;
  bodyMarkdown: string;
  deliverables: CapstoneDeliverable[];
  rubric: RubricRow[];
}

export interface Doc {
  kind: "syllabus" | "spec";
  id: string;
  slug: string;
  title: string;
  bodyMarkdown: string;
}

export interface Part {
  part: number;
  name: string;
  chapters: Chapter[];
}

export interface Course {
  chapters: Chapter[];
  parts: Part[];
  exam: Exam;
  capstones: Capstone[];
  syllabus: Doc | null;
  spec: Doc | null;
  byId: Map<string, Chapter>;
}

export const DOMAIN_NAMES: Record<DomainId, string> = {
  D1: "LLM & Agent Fundamentals",
  D2: "Agentic Building Blocks",
  D3: "Systems Architecture",
  D4: "Production Operations",
  D5: "Security, Governance & Compliance",
  D6: "Advanced & Frontier",
};

export const THEME_NAMES: Record<ThemeTag, string> = {
  evals: "Evaluation",
  security: "Security",
  cost: "Cost & Latency",
  state: "State & Memory",
};
