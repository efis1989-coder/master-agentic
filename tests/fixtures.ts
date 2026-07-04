/**
 * Shared test fixture: load the real content/ folder from disk (node fs, same as the
 * content:check script) and expose the raw files + assembled Course. Keeping this in one
 * place means the parser tests exercise the actual curriculum, not hand-written stubs.
 */
import { readFileSync, readdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { type RawFile, buildCourse } from "../src/content/buildCourse";

const here = dirname(fileURLToPath(import.meta.url));
const contentDir = resolve(here, "../content");

export function loadRawFiles(): RawFile[] {
  return readdirSync(contentDir)
    .filter((f) => f.endsWith(".md"))
    .map((f) => ({ path: join(contentDir, f), raw: readFileSync(join(contentDir, f), "utf8") }));
}

export function loadFile(name: string): string {
  return readFileSync(join(contentDir, name), "utf8");
}

export const course = buildCourse(loadRawFiles());
