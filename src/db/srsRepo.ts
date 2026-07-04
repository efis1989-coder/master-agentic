import { type SrsGrade, initialState, reschedule } from "../srs/sm2";
import { db } from "./db";
import type { SrsCardKind, SrsCardRow } from "./types";

/**
 * The spaced-repetition deck (SM-2 lite). Cards are keyed by their source item id
 * so enqueuing is idempotent — a §8 prompt or an auto-enqueued mistake is added
 * once and never reset while in flight. Due-ness is a `dueDate ≤ now` range scan;
 * a review reschedules via the pure {@link ../srs/sm2!reschedule} and stamps the
 * new due date. The `srsCards` table has no typed accessor on the Dexie subclass,
 * so it is reached generically here.
 */
const DAY_MS = 86_400_000;
const cards = () => db.table<SrsCardRow, string>("srsCards");

export async function enqueueCard(input: {
  cardId: string;
  kind: SrsCardKind;
  chapterId: string;
  front: string;
}): Promise<void> {
  const existing = await cards().get(input.cardId);
  if (existing) return; // idempotent — keep an in-progress card's schedule
  const now = Date.now();
  const s = initialState();
  await cards().add({
    id: input.cardId,
    cardId: input.cardId,
    kind: input.kind,
    chapterId: input.chapterId,
    front: input.front,
    ease: s.ease,
    intervalDays: s.intervalDays,
    reps: s.reps,
    lapses: s.lapses,
    dueDate: now,
    createdAt: now,
    lastReviewedAt: null,
  });
}

export function getDueCards(now: number = Date.now()): Promise<SrsCardRow[]> {
  return cards().where("dueDate").belowOrEqual(now).toArray();
}

export function countDue(now: number = Date.now()): Promise<number> {
  return cards().where("dueDate").belowOrEqual(now).count();
}

export function getAllCards(): Promise<SrsCardRow[]> {
  return cards().toArray();
}

export function getCardsForChapter(chapterId: string): Promise<SrsCardRow[]> {
  return cards().where("cardId").startsWith(`${chapterId}/`).toArray();
}

export async function reviewCard(
  cardId: string,
  grade: SrsGrade,
  now: number = Date.now(),
): Promise<void> {
  const row = await cards().get(cardId);
  if (!row) return;
  const next = reschedule(
    { ease: row.ease, intervalDays: row.intervalDays, reps: row.reps, lapses: row.lapses },
    grade,
  );
  await cards().update(cardId, {
    ease: next.ease,
    intervalDays: next.intervalDays,
    reps: next.reps,
    lapses: next.lapses,
    dueDate: now + next.intervalDays * DAY_MS,
    lastReviewedAt: now,
  });
}

export function removeCard(cardId: string): Promise<void> {
  return cards().delete(cardId);
}
