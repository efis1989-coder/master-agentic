/**
 * Highlight anchoring without a dependency. A highlight is stored as a *context
 * anchor* — the exact `quote` plus a little `prefix`/`suffix` on either side —
 * rather than a DOM path, so it survives reloads and small content edits and
 * disambiguates a phrase that appears more than once. Re-location works over the
 * section's flat `textContent`; painting wraps the matched run in `<mark>`
 * elements one text node at a time (so it can cross inline element boundaries),
 * which is safe because the rendered Markdown subtree is memoised and won't be
 * reconciled away underneath the imperatively-inserted marks.
 */

/** A note paintable onto the DOM: its anchor, id, and tint. */
export interface PaintableNote {
  id: string;
  quote: string;
  prefix: string;
  suffix: string;
  color: string;
}

export interface QuoteAnchor {
  quote: string;
  prefix: string;
  suffix: string;
}

/** Characters of surrounding context captured on each side of a selection. */
export const CONTEXT = 32;

/** Build a context anchor from character offsets into a flat text string. */
export function anchorFromOffsets(
  fullText: string,
  start: number,
  end: number,
  context = CONTEXT,
): QuoteAnchor {
  return {
    quote: fullText.slice(start, end),
    prefix: fullText.slice(Math.max(0, start - context), start),
    suffix: fullText.slice(end, end + context),
  };
}

function commonSuffixLen(a: string, b: string): number {
  let i = 0;
  while (i < a.length && i < b.length && a[a.length - 1 - i] === b[b.length - 1 - i]) i++;
  return i;
}

function commonPrefixLen(a: string, b: string): number {
  let i = 0;
  while (i < a.length && i < b.length && a[i] === b[i]) i++;
  return i;
}

/**
 * Find where an anchor's quote sits in `fullText`. Unique matches win outright;
 * when the quote repeats, the occurrence whose neighbouring text best matches the
 * stored prefix/suffix is chosen. Returns -1 when the quote is absent (an
 * orphaned highlight — the note is kept and listed, just not painted).
 */
export function findQuoteOffset(fullText: string, anchor: QuoteAnchor): number {
  const { quote, prefix, suffix } = anchor;
  if (!quote) return -1;

  const occurrences: number[] = [];
  for (let i = fullText.indexOf(quote); i !== -1; i = fullText.indexOf(quote, i + 1)) {
    occurrences.push(i);
  }
  if (occurrences.length === 0) return -1;
  if (occurrences.length === 1) return occurrences[0];

  let best = occurrences[0];
  let bestScore = -1;
  for (const idx of occurrences) {
    const before = fullText.slice(0, idx);
    const after = fullText.slice(idx + quote.length);
    const score = commonSuffixLen(before, prefix) + commonPrefixLen(after, suffix);
    if (score > bestScore) {
      bestScore = score;
      best = idx;
    }
  }
  return best;
}

function textNodesUnder(root: Node): Text[] {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const out: Text[] = [];
  for (let n = walker.nextNode(); n; n = walker.nextNode()) out.push(n as Text);
  return out;
}

/** Character offset of a range boundary within `root`, via the range's text length. */
function offsetOfPoint(root: HTMLElement, container: Node, offset: number): number {
  const r = document.createRange();
  r.setStart(root, 0);
  r.setEnd(container, offset);
  return r.toString().length;
}

/**
 * Describe the current selection as a context anchor, or null when there is no
 * usable selection inside `root` (collapsed, outside, or whitespace-only).
 */
export function describeSelection(root: HTMLElement): QuoteAnchor | null {
  const sel = window.getSelection();
  if (!sel || sel.isCollapsed || sel.rangeCount === 0) return null;
  const range = sel.getRangeAt(0);
  if (!root.contains(range.commonAncestorContainer)) return null;

  const start = offsetOfPoint(root, range.startContainer, range.startOffset);
  const end = offsetOfPoint(root, range.endContainer, range.endOffset);
  if (end <= start) return null;

  const anchor = anchorFromOffsets(root.textContent ?? "", start, end);
  return anchor.quote.trim() ? anchor : null;
}

/** Wrap the flat-text run [start, end) in per-text-node `<mark>` elements. */
function paintOffsets(
  root: HTMLElement,
  start: number,
  end: number,
  id: string,
  color: string,
): void {
  let acc = 0;
  // Snapshot first: surroundContents splits nodes, but textContent (and thus the
  // offset math) is invariant, and untouched text nodes keep their identity.
  for (const node of textNodesUnder(root)) {
    const nodeStart = acc;
    const nodeEnd = acc + node.data.length;
    acc = nodeEnd;
    const from = Math.max(start, nodeStart);
    const to = Math.min(end, nodeEnd);
    if (to <= from) continue;

    const sub = document.createRange();
    sub.setStart(node, from - nodeStart);
    sub.setEnd(node, to - nodeStart);
    const mark = document.createElement("mark");
    mark.className = "note-mark";
    mark.dataset.noteId = id;
    mark.dataset.noteColor = color;
    sub.surroundContents(mark);
  }
}

/** Paint one note onto `root`. Returns false if its quote can't be located. */
export function paintNote(root: HTMLElement, note: PaintableNote): boolean {
  const start = findQuoteOffset(root.textContent ?? "", note);
  if (start < 0) return false;
  paintOffsets(root, start, start + note.quote.length, note.id, note.color);
  return true;
}

/** Remove every note-mark, unwrapping its text back into the flow. */
export function clearHighlights(root: HTMLElement): void {
  for (const mark of Array.from(root.querySelectorAll("mark.note-mark"))) {
    const parent = mark.parentNode;
    if (!parent) continue;
    while (mark.firstChild) parent.insertBefore(mark.firstChild, mark);
    parent.removeChild(mark);
  }
  root.normalize();
}

/** Clear and repaint all notes — the single entry point the reader calls. */
export function repaintNotes(root: HTMLElement, notes: PaintableNote[]): void {
  clearHighlights(root);
  for (const note of notes) paintNote(root, note);
}
