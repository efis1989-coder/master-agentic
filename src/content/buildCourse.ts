import type { Capstone, Chapter, Course, Doc, Exam, Part } from "./types";
import { parseCapstone } from "./capstoneParser";
import { parseChapter } from "./chapterParser";
import { parseDoc } from "./docParser";
import { parseExam } from "./examParser";
import { fileSlug } from "./parseUtils";
import { PART_NAMES } from "./partNames";

export interface RawFile {
  path: string;
  raw: string;
}

type FileKind = "chapter" | "capstone" | "exam" | "syllabus" | "spec" | "unknown";

/** Classify a content file purely by its filename. */
export function classifyFile(path: string): FileKind {
  const slug = fileSlug(path);
  if (/^chapter-\d+-\d+/.test(slug)) return "chapter";
  if (/^capstone-[abc]\b/i.test(slug)) return "capstone";
  if (slug === "certification-exam-blueprint") return "exam";
  if (slug === "agentic-systems-master-syllabus") return "syllabus";
  if (slug === "manual-style-spec") return "spec";
  return "unknown";
}

/**
 * A term belongs to the first chapter (in canonical reading order) that introduces
 * it; drop it from every later chapter's glossary so the same term never appears
 * twice across the course.
 */
function dedupeGlossaryGlobally(chapters: Chapter[]): void {
  const seen = new Set<string>();
  for (const chapter of chapters) {
    chapter.glossary = chapter.glossary.filter((g) => {
      const key = g.term.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }
}

function groupIntoParts(chapters: Chapter[]): Part[] {
  const byPart = new Map<number, Chapter[]>();
  for (const ch of chapters) {
    const list = byPart.get(ch.part) ?? [];
    list.push(ch);
    byPart.set(ch.part, list);
  }
  return [...byPart.keys()]
    .sort((a, b) => a - b)
    .map((part) => ({
      part,
      name: PART_NAMES[part] ?? `Part ${part}`,
      chapters: (byPart.get(part) ?? []).sort((a, b) => a.chapterIndex - b.chapterIndex),
    }));
}

/** Assemble a typed Course from raw content files. Pure — no Vite/Node dependencies. */
export function buildCourse(files: RawFile[]): Course {
  const chapters: Chapter[] = [];
  const capstones: Capstone[] = [];
  let exam: Exam | null = null;
  let syllabus: Doc | null = null;
  let spec: Doc | null = null;

  for (const { path, raw } of files) {
    switch (classifyFile(path)) {
      case "chapter":
        chapters.push(parseChapter(raw, path));
        break;
      case "capstone":
        capstones.push(parseCapstone(raw, path));
        break;
      case "exam":
        exam = parseExam(raw);
        break;
      case "syllabus":
        syllabus = parseDoc(raw, path, "syllabus");
        break;
      case "spec":
        spec = parseDoc(raw, path, "spec");
        break;
      default:
        break;
    }
  }

  chapters.sort((a, b) => a.part - b.part || a.chapterIndex - b.chapterIndex);
  dedupeGlossaryGlobally(chapters);
  capstones.sort((a, b) => a.letter.localeCompare(b.letter));

  if (!exam) {
    throw new Error("Course is missing certification-exam-blueprint.md");
  }

  const byId = new Map<string, Chapter>(chapters.map((c) => [c.id, c]));

  return {
    chapters,
    parts: groupIntoParts(chapters),
    exam,
    capstones,
    syllabus,
    spec,
    byId,
  };
}
