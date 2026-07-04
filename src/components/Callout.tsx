import { Children, type ReactElement, type ReactNode, cloneElement, isValidElement } from "react";

/**
 * GitHub-style callouts rendered from a marker blockquote, so no content or
 * parser changes are required: any `> [!NOTE]` / `[!TIP]` / `[!IMPORTANT]` /
 * `[!WARNING]` / `[!CAUTION]` blockquote is promoted to a tinted panel, and every
 * other blockquote keeps rendering as plain prose. Styling lives in global.css
 * (.callout*), driven by the --cl-* hue tokens.
 */

export type CalloutType = "note" | "tip" | "important" | "warning" | "caution";

const MARKER = /^\[!(note|tip|important|warning|caution)\]\s*/i;

const LABELS: Record<CalloutType, string> = {
  note: "Note",
  tip: "Tip",
  important: "Important",
  warning: "Warning",
  caution: "Caution",
};

// 16px line icons, inheriting the callout hue via currentColor.
const ICONS: Record<CalloutType, React.JSX.Element> = {
  note: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
      <path d="M8 1.5A6.5 6.5 0 1 0 8 14.5 6.5 6.5 0 0 0 8 1.5Zm.75 9.75h-1.5V7h1.5v4.25ZM8 5.75A.9.9 0 1 1 8 4a.9.9 0 0 1 0 1.75Z" />
    </svg>
  ),
  tip: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
      <path d="M8 1.5a4.5 4.5 0 0 0-2.75 8.06c.3.24.5.6.5.99v.2h4.5v-.2c0-.39.2-.75.5-.99A4.5 4.5 0 0 0 8 1.5ZM6.25 12.5v.5a1.75 1.75 0 0 0 3.5 0v-.5h-3.5Z" />
    </svg>
  ),
  important: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
      <path d="M2.5 2.5A1 1 0 0 1 3.5 1.5h9a1 1 0 0 1 1 1V10a1 1 0 0 1-1 1H6.31L3.7 13.55a.6.6 0 0 1-1.02-.43V2.5Zm6.25 5V4h-1.5v3.5h1.5Zm-1.5 1V10h1.5V8.5h-1.5Z" />
    </svg>
  ),
  warning: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
      <path d="M7.1 2.15a1 1 0 0 1 1.8 0l5.5 10.35a1 1 0 0 1-.9 1.5H2.5a1 1 0 0 1-.9-1.5L7.1 2.15ZM7.25 6v3.25h1.5V6h-1.5Zm0 4.25v1.5h1.5v-1.5h-1.5Z" />
    </svg>
  ),
  caution: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
      <path d="M8 1.5A6.5 6.5 0 1 0 8 14.5 6.5 6.5 0 0 0 8 1.5ZM7.25 4.5h1.5v4.25h-1.5V4.5Zm0 5.5h1.5v1.5h-1.5V10Z" />
    </svg>
  ),
};

/**
 * If `children` (a blockquote's rendered content) opens with a callout marker,
 * return the callout type and the body with the marker stripped; otherwise null.
 */
export function parseCallout(children: ReactNode): { type: CalloutType; body: ReactNode } | null {
  const items = Children.toArray(children);
  const firstIdx = items.findIndex((c) => isValidElement(c));
  if (firstIdx === -1) return null;

  const firstEl = items[firstIdx] as ReactElement<{ children?: ReactNode }>;
  const paraChildren = Children.toArray(firstEl.props.children);
  const lead = paraChildren[0];
  if (typeof lead !== "string") return null;

  const match = MARKER.exec(lead);
  if (!match) return null;

  const type = match[1].toLowerCase() as CalloutType;
  const rest = lead.slice(match[0].length);
  const firstParaChildren = rest ? [rest, ...paraChildren.slice(1)] : paraChildren.slice(1);

  const body: ReactNode[] = [];
  if (firstParaChildren.length > 0) {
    body.push(cloneElement(firstEl, { key: "callout-lead" }, ...firstParaChildren));
  }
  body.push(...items.slice(firstIdx + 1));

  return { type, body };
}

export function Callout({
  type,
  children,
}: {
  type: CalloutType;
  children: ReactNode;
}): React.JSX.Element {
  return (
    <div className={`callout callout-${type}`}>
      <div className="callout-title">
        <span className="callout-icon" aria-hidden="true">
          {ICONS[type]}
        </span>
        {LABELS[type]}
      </div>
      <div className="callout-body">{children}</div>
    </div>
  );
}
