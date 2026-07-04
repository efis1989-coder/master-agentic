import { db } from "./db";
import type { AppStateRow } from "./types";

const LAST_LOCATION = "lastLocation";

/**
 * Persists "where you left off". A single row keyed `lastLocation` records the
 * current route, chapter, and scroll fraction; the home screen and reader read
 * it back to offer resume and restore scroll.
 */
export async function saveLastLocation(input: {
  route: string;
  chapterId: string | null;
  scrollPct: number;
}): Promise<void> {
  const row: AppStateRow = {
    key: LAST_LOCATION,
    route: input.route,
    chapterId: input.chapterId,
    scrollPct: input.scrollPct,
    updatedAt: Date.now(),
  };
  await db.appState.put(row);
}

export function getLastLocation(): Promise<AppStateRow | undefined> {
  return db.appState.get(LAST_LOCATION);
}
