/**
 * Content skeleton guard — run via `pnpm content:check` (tsx, node).
 * Reads content/ from disk (no Vite glob), builds the Course through the same pure
 * parsers the app uses, and fails the build if any chapter drifts from the uniform
 * skeleton the app depends on. This protects every downstream feature from silent breakage.
 */
import { readFileSync, readdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { type RawFile, buildCourse } from "./buildCourse";

const here = dirname(fileURLToPath(import.meta.url));
const contentDir = resolve(here, "../../content");

const EXPECTED_CHAPTERS = 32;
const EXPECTED_EXAM_QUESTIONS = 60;
const EXPECTED_CAPSTONES = 3;
const SELF_TEST_CLAIMS = 5;

function loadFiles(): RawFile[] {
  return readdirSync(contentDir)
    .filter((f) => f.endsWith(".md"))
    .map((f) => ({ path: join(contentDir, f), raw: readFileSync(join(contentDir, f), "utf8") }));
}

function main(): void {
  const errors: string[] = [];
  const course = buildCourse(loadFiles());

  if (course.chapters.length !== EXPECTED_CHAPTERS) {
    errors.push(`Expected ${EXPECTED_CHAPTERS} chapters, found ${course.chapters.length}.`);
  }

  for (const ch of course.chapters) {
    if (ch.selfTest.length !== SELF_TEST_CLAIMS) {
      errors.push(`${ch.id}: expected ${SELF_TEST_CLAIMS} self-test claims, found ${ch.selfTest.length}.`);
    }
    const ungradable = ch.selfTest.filter((c) => !c.gradable);
    if (ungradable.length > 0) {
      errors.push(
        `${ch.id}: ${ungradable.length} self-test claim(s) have an unparseable verdict (${ungradable
          .map((c) => c.index)
          .join(", ")}).`,
      );
    }
    if (ch.srsCards.length < 1) {
      errors.push(`${ch.id}: §8 spaced-review card has no prompts.`);
    }
    if (!ch.exercise) {
      errors.push(`${ch.id}: §6 design exercise is missing.`);
    }
    if (!ch.doctrineCheck) {
      errors.push(`${ch.id}: no "Doctrine check" blockquote found (E9).`);
    }
  }

  if (course.exam.questions.length !== EXPECTED_EXAM_QUESTIONS) {
    errors.push(`Exam: expected ${EXPECTED_EXAM_QUESTIONS} questions, found ${course.exam.questions.length}.`);
  }
  const unkeyed = course.exam.questions.filter((q) => q.options.length !== 4);
  if (unkeyed.length > 0) {
    errors.push(`Exam: ${unkeyed.length} question(s) do not have exactly 4 options.`);
  }
  if (course.exam.designPrompts.length !== 3) {
    errors.push(`Exam: expected 3 design prompts, found ${course.exam.designPrompts.length}.`);
  }

  if (course.capstones.length !== EXPECTED_CAPSTONES) {
    errors.push(`Expected ${EXPECTED_CAPSTONES} capstones, found ${course.capstones.length}.`);
  }
  for (const cap of course.capstones) {
    if (cap.deliverables.length < 1) {
      errors.push(`${cap.id}: no deliverables parsed.`);
    }
  }

  if (errors.length > 0) {
    console.error(`\n✗ content:check failed with ${errors.length} issue(s):\n`);
    for (const e of errors) console.error(`  - ${e}`);
    console.error("");
    process.exit(1);
  }

  console.log(
    `✓ content:check passed — ${course.chapters.length} chapters, ${course.exam.questions.length} exam questions, ${course.capstones.length} capstones.`,
  );
}

main();
