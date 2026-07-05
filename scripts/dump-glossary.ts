/**
 * Scratch script — dump the auto-extracted "Key terms" (glossary) per chapter.
 * Reads content/*.md from disk (no Vite glob), builds the Course, and prints each
 * chapter's captured terms with their source section. Ground truth for the
 * key-terms coverage audit.
 *
 *   npx tsx scripts/dump-glossary.ts
 */
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { type RawFile, buildCourse } from "../src/content/buildCourse";

const contentDir = join(fileURLToPath(new URL(".", import.meta.url)), "..", "content");

const files: RawFile[] = readdirSync(contentDir)
  .filter((f) => f.endsWith(".md"))
  .map((f) => ({ path: `/content/${f}`, raw: readFileSync(join(contentDir, f), "utf8") }));

const course = buildCourse(files);

for (const chapter of course.chapters) {
  const terms = chapter.glossary;
  console.log(`\n## ${chapter.number} — ${chapter.title}  (${terms.length} terms)`);
  if (chapter.doctrine) console.log(`   doctrine: ${chapter.doctrine.slice(0, 80)}...`);
  for (const t of terms) {
    console.log(`   §${t.sectionN}  ${t.term}`);
  }
}

const total = course.chapters.reduce((n, c) => n + c.glossary.length, 0);
console.log(`\n=== ${course.chapters.length} chapters, ${total} total terms ===`);
