import { beforeEach, describe, expect, it } from "vitest";
import { db } from "../src/db/db";
import { getAllTeachBack, getTeachBack, saveTeachBack } from "../src/db/teachBackRepo";

// fake-indexeddb (tests/setup.ts) backs the teachBack store; wipe between cases.
beforeEach(async () => {
  await Promise.all(db.tables.map((t) => t.clear()));
});

describe("teachBackRepo (E2)", () => {
  it("saves and reads a chapter attempt", async () => {
    await saveTeachBack({ chapterId: "ch-0-1", text: "doctrine from memory", selfScore: "close" });
    const row = await getTeachBack("ch-0-1");
    expect(row?.text).toBe("doctrine from memory");
    expect(row?.selfScore).toBe("close");
  });

  it("keeps one current attempt per chapter", async () => {
    await saveTeachBack({ chapterId: "ch-0-1", text: "first", selfScore: "shaky" });
    await saveTeachBack({ chapterId: "ch-0-1", text: "second", selfScore: "nailed" });
    const all = await getAllTeachBack();
    expect(all).toHaveLength(1);
    expect(all[0].text).toBe("second");
    expect(all[0].selfScore).toBe("nailed");
  });
});
