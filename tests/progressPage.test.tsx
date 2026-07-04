import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { db } from "../src/db/db";
import { recordProgress } from "../src/db/progressRepo";
import { ProgressPage } from "../src/features/progress/ProgressPage";

// fake-indexeddb (tests/setup.ts) backs Dexie; wipe between cases.
beforeEach(async () => {
  await Promise.all(db.tables.map((t) => t.clear()));
});

describe("ProgressPage", () => {
  it("renders the dashboard scaffold and all six domain meters", async () => {
    render(<ProgressPage />);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Progress");
    expect(await screen.findByText("By part")).toBeInTheDocument();
    expect(screen.getByText("By domain")).toBeInTheDocument();
    // All six certification domains are always shown, even before any reading.
    for (const d of ["D1", "D2", "D3", "D4", "D5", "D6"]) {
      expect(screen.getByText(new RegExp(`^${d} ·`))).toBeInTheDocument();
    }
  });

  it("reflects recorded reading in the overall meter", async () => {
    await recordProgress({ chapterId: "ch-0-1", scrollPct: 1, status: "read" });
    render(<ProgressPage />);
    // useLiveQuery resolves asynchronously; wait for the read chapter to register.
    expect(await screen.findByText(/chapters read/)).toBeInTheDocument();
  });
});
