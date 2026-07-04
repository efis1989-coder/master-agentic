import { useCallback, useState } from "react";

/**
 * Chrome for a fenced code block: a header bar with the language label and a
 * Copy button, wrapping the already-highlighted <code> (passed as children) in a
 * <pre>. Mermaid fences are handled upstream in MarkdownRenderer and never reach
 * here. Presentation lives in global.css (.codeblock*), coordinating with the
 * shared `.markdown-body pre` rules.
 */
export function CodeBlock({
  lang,
  code,
  children,
}: {
  lang?: string;
  code: string;
  children: React.ReactNode;
}): React.JSX.Element {
  const [copied, setCopied] = useState(false);

  const onCopy = useCallback(() => {
    if (!navigator.clipboard) return;
    void navigator.clipboard.writeText(code).then(
      () => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      },
      () => {},
    );
  }, [code]);

  return (
    <div className="codeblock">
      <div className="codeblock-bar">
        <span className="codeblock-lang">{lang || "code"}</span>
        <button type="button" className="codeblock-copy" onClick={onCopy}>
          {copied ? "Copied ✓" : "Copy"}
        </button>
      </div>
      <pre>{children}</pre>
    </div>
  );
}
