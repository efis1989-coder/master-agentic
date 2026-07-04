import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { course } from "../src/content";
import { db } from "../src/db/db";
import { SelfTestQuiz } from "../src/features/quiz/SelfTestQuiz";

// fake-indexeddb (tests/setup.ts) backs the attempt/mistake stores; wipe between cases.
beforeEach(async () => {
  await Promise.all(db.tables.map((t) => t.clear()));
});

const chapter = course.chapters.find((c) => c.selfTest.length === 5);
if (!chapter) throw new Error("fixture: expected a chapter with 5 self-test claims");

describe("SelfTestQuiz (§7, spoiler-gated)", () => {
  it("hides the argued answers until all claims are judged and submitted", async () => {
    render(
      <SelfTestQuiz
        chapterId={chapter.id}
        title={chapter.sections[6].title}
        claims={chapter.selfTest}
      />,
    );

    // Taking view: the radios exist but the answer key is not in the DOM yet.
    await screen.findByRole("button", { name: "Submit & reveal answers" });
    expect(screen.queryByText("Argued answer")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Retake self-test" })).not.toBeInTheDocument();

    // Judge every claim (10 radios = True/False per claim); pick the "True" of each pair.
    const radios = screen.getAllByRole("radio");
    for (let i = 0; i < radios.length; i += 2) {
      await userEvent.click(radios[i]);
    }
    await userEvent.click(screen.getByRole("button", { name: "Submit & reveal answers" }));

    // Completed view: score + one argued-answer disclosure per claim are now revealed.
    await screen.findByRole("button", { name: "Retake self-test" });
    expect(screen.getByText(new RegExp(`/ ${chapter.selfTest.length}`))).toBeInTheDocument();
    expect(screen.getAllByText("Argued answer")).toHaveLength(chapter.selfTest.length);
  });
});
