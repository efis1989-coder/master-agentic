import { beforeEach, describe, expect, it } from "vitest";
import { db } from "../src/db/db";
import {
  countDue,
  enqueueCard,
  getCardsForChapter,
  getDueCards,
  removeCard,
  reviewCard,
} from "../src/db/srsRepo";

// fake-indexeddb (tests/setup.ts) backs the srsCards store; wipe between cases.
beforeEach(async () => {
  await Promise.all(db.tables.map((t) => t.clear()));
});

const DAY_MS = 86_400_000;

describe("srsRepo (SM-2 lite deck)", () => {
  it("enqueues a card due immediately and counts it as due", async () => {
    await enqueueCard({ cardId: "ch-0-1/srs/1", kind: "srs", chapterId: "ch-0-1", front: "Q" });
    expect(await countDue()).toBe(1);
    const due = await getDueCards();
    expect(due).toHaveLength(1);
    expect(due[0].reps).toBe(0);
    expect(due[0].lastReviewedAt).toBeNull();
  });

  it("is idempotent — re-enqueuing never resets an in-progress card", async () => {
    await enqueueCard({ cardId: "ch-0-1/srs/1", kind: "srs", chapterId: "ch-0-1", front: "Q" });
    await reviewCard("ch-0-1/srs/1", "good");
    // The card is now scheduled a day out; re-adding must not reset it to due-now.
    await enqueueCard({ cardId: "ch-0-1/srs/1", kind: "srs", chapterId: "ch-0-1", front: "Q" });
    expect(await countDue()).toBe(0);
    const all = await getCardsForChapter("ch-0-1");
    expect(all).toHaveLength(1);
    expect(all[0].reps).toBe(1);
  });

  it("schedules a good review a day out and stamps it reviewed", async () => {
    const now = 1_000_000_000_000;
    await enqueueCard({ cardId: "ch-0-1/srs/1", kind: "srs", chapterId: "ch-0-1", front: "Q" });
    await reviewCard("ch-0-1/srs/1", "good", now);
    expect(await countDue(now)).toBe(0); // no longer due at review time
    const [card] = await getCardsForChapter("ch-0-1");
    expect(card.dueDate).toBe(now + DAY_MS);
    expect(card.lastReviewedAt).toBe(now);
    expect(await countDue(now + DAY_MS)).toBe(1); // due again a day later
  });

  it("keeps a lapsed (again) card due now", async () => {
    const now = 1_000_000_000_000;
    await enqueueCard({ cardId: "ch-0-1/srs/1", kind: "srs", chapterId: "ch-0-1", front: "Q" });
    await reviewCard("ch-0-1/srs/1", "good", now); // out a day
    await reviewCard("ch-0-1/srs/1", "again", now); // forgot it
    const [card] = await getCardsForChapter("ch-0-1");
    expect(card.dueDate).toBe(now);
    expect(card.lapses).toBe(1);
    expect(card.reps).toBe(0);
    expect(await countDue(now)).toBe(1);
  });

  it("auto-enqueues a mistake card alongside §8 cards without id collision", async () => {
    await enqueueCard({
      cardId: "ch-0-1/srs/1",
      kind: "srs",
      chapterId: "ch-0-1",
      front: "prompt",
    });
    await enqueueCard({
      cardId: "ch-0-1/selftest/3",
      kind: "mistake",
      chapterId: "ch-0-1",
      front: "the missed claim",
    });
    const scoped = await getCardsForChapter("ch-0-1");
    expect(scoped).toHaveLength(2);
    expect(scoped.map((c) => c.kind).sort()).toEqual(["mistake", "srs"]);
  });

  it("scopes cards to a chapter by id prefix and removes them", async () => {
    await enqueueCard({ cardId: "ch-0-1/srs/1", kind: "srs", chapterId: "ch-0-1", front: "a" });
    await enqueueCard({ cardId: "ch-0-2/srs/1", kind: "srs", chapterId: "ch-0-2", front: "b" });
    expect(await getCardsForChapter("ch-0-1")).toHaveLength(1);
    await removeCard("ch-0-1/srs/1");
    expect(await getCardsForChapter("ch-0-1")).toHaveLength(0);
    expect(await countDue()).toBe(1);
  });
});
