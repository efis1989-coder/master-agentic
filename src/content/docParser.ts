import type { Doc } from "./types";
import { fileSlug } from "./parseUtils";

function titleFromBody(raw: string): string {
  const first = raw.split("\n")[0] ?? "";
  return first.replace(/^#\s*/, "").trim();
}

/** Parse the syllabus or style-spec markdown into a read-only Doc. */
export function parseDoc(raw: string, path: string, kind: Doc["kind"]): Doc {
  const slug = fileSlug(path);
  return {
    kind,
    id: kind,
    slug,
    title: titleFromBody(raw),
    bodyMarkdown: raw.trim(),
  };
}
