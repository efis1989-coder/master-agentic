import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { course } from "../src/content";
import { ReaderPage } from "../src/features/reader/ReaderPage";

// Mermaid is lazily imported and heavy; stub it so the reader mounts fast and
// deterministically under jsdom (the real diagram render is exercised in the app).
vi.mock("mermaid", () => ({
  default: {
    initialize: vi.fn(),
    render: vi.fn().mockResolvedValue({ svg: "<svg aria-label='diagram' />" }),
  },
}));

function renderAt(chapterId: string) {
  return render(
    <MemoryRouter initialEntries={[`/read/${chapterId}`]}>
      <Routes>
        <Route path="/read/:chapterId" element={<ReaderPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("ReaderPage", () => {
  beforeAll(() => {
    // jsdom does not implement scrollTo; the reader calls it on mount.
    window.scrollTo = vi.fn();
  });

  it("renders a chapter's metadata header and title", () => {
    const first = course.chapters[0];
    renderAt(first.id);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(first.title);
    expect(screen.getByText(new RegExp(`Part ${first.part}`))).toBeInTheDocument();
  });

  it("shows the E1 incident cold open first and reveals the thread on demand", async () => {
    const withIncident = course.chapters.find((c) => c.incident);
    expect(withIncident).toBeDefined();
    if (!withIncident) return;

    renderAt(withIncident.id);
    expect(screen.getByLabelText("Incident cold open")).toBeInTheDocument();

    const button = screen.getByRole("button", { name: "Reveal the thread" });
    await userEvent.click(button);

    expect(screen.getByRole("button", { name: "Revealed" })).toBeInTheDocument();
    expect(screen.getByText(/derives the answer from first principles/)).toBeInTheDocument();
  });

  it("renders a not-found state for an unknown chapter id", () => {
    renderAt("ch-does-not-exist");
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Chapter not found");
  });
});
