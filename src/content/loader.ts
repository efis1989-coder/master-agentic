import type { Course } from "./types";
import { type RawFile, buildCourse } from "./buildCourse";

/**
 * Load every markdown file under /content at build time (Vite glob, eager + raw),
 * then assemble the typed Course. Runs once at module init; the result is a
 * frozen singleton the app imports directly.
 */
const modules = import.meta.glob("/content/**/*.md", {
  query: "?raw",
  import: "default",
  eager: true,
}) as Record<string, string>;

const files: RawFile[] = Object.entries(modules).map(([path, raw]) => ({ path, raw }));

export const course: Course = buildCourse(files);
