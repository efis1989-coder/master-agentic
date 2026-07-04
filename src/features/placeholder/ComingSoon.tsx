/**
 * Placeholder for routes whose feature milestone has not landed yet. Keeps the
 * TOC links live (and deep-links valid) so navigation is testable before the
 * persistence, quiz, review, exercise, and exam milestones replace these bodies.
 */
export function ComingSoon({ title, note }: { title: string; note: string }): React.JSX.Element {
  return (
    <section style={{ maxWidth: "var(--maxw-reading)" }}>
      <h1>{title}</h1>
      <p style={{ color: "var(--color-muted)" }}>{note}</p>
    </section>
  );
}
